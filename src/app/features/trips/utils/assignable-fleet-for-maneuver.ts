import {
  equipmentTypeDisplayLabel,
  fleetUnitConvoyTableLabel,
  isPlanaEquipment,
  isPortacontenedorEquipment,
  unitConvoyOperationCodeFromHitched,
} from '@app/features/fleet/utils/unit-hitched-equipment';
import { normalizeTripContainerType } from '@shared/catalogs/trip-container-type-options';
import {
  equipmentAssignedToUnit,
  sortEquipmentByHitchPosition,
} from '@shared/utils/fleet/equipment-hitch-position';
import { formatEquipmentOperationalId } from '@shared/utils/fleet/fleet-id-builders';
import { formatUnitTrailerOperationalId } from '@shared/utils/fleet/unit-label';
import {
  Equipment,
  Trip,
  TripContainerType,
  TripOperationType,
  TripStatus,
  Unit,
} from '@shared/models/logistics.models';
import { resourceIdKey, resourceIdsEqual } from '@shared/utils/resource-id';
import { isFleetResourceActive } from '@shared/utils/fleet-resource-active';
import { resolveContainerSlotConfigKey } from '@shared/utils/fleet/equipment-container-slot-options.util';
import { unitCanHitchEquipment } from '@shared/utils/fleet/equipment-hitch-assignment';

const ACTIVE_MANEUVER_STATUSES: TripStatus[] = ['scheduled', 'in_transit'];

const PICKABLE_UNIT_STATUSES = new Set([
  'available',
  'scheduled',
  'in_use',
]);

export type ManeuverAssignableUnitRow = {
  unit: Unit;
  displayLabel: string;
  operationType: TripOperationType;
  hitchedEquipment: Equipment[];
  equipmentIds: string[];
};

/** Equipos enganchados activos de una unidad (catálogo embebido en listado de unidades). */
export function unitHitchedEquipment(unit: Unit): Equipment[] {
  const nested = unit.hitchedEquipment ?? [];
  return sortEquipmentByHitchPosition(nested.filter((e) => isFleetResourceActive(e)));
}

/** Equipos enganchados con metadatos completos (catálogo de equipos + fallback embebido en unidad). */
export function resolveUnitHitchedEquipment(
  unit: Unit | undefined,
  equipmentCatalog: readonly Equipment[],
): Equipment[] {
  if (!unit) {
    return [];
  }
  const fromCatalog = equipmentAssignedToUnit(equipmentCatalog, unit.id).filter((e) =>
    isFleetResourceActive(e),
  );
  if (fromCatalog.length > 0) {
    return fromCatalog;
  }
  return unitHitchedEquipment(unit);
}

/** Código operativo del convoy enganchado a la unidad (`sencillo`, `full`, `plana`, …). */
export function unitManeuverOperationCode(unit: Unit): string {
  return unitConvoyOperationCodeFromHitched(unitHitchedEquipment(unit));
}

/** La unidad debe coincidir con la configuración elegida en el formulario. */
export function unitMatchesManeuverOperationCode(
  unit: Unit,
  maneuverOperationCode: string,
): boolean {
  const unitCode = unitManeuverOperationCode(unit).trim().toLowerCase();
  const maneuverCode = maneuverOperationCode.trim().toLowerCase();
  if (!unitCode || !maneuverCode) {
    return false;
  }
  return unitCode === maneuverCode;
}

/**
 * Unidades motrices con carga integrada (sin remolque): rabón, pipa o volteo.
 * No arrastran contenedor ISO.
 */
export function isSelfContainedCargoUnit(unit: Pick<Unit, 'transportType'>): boolean {
  return !unitCanHitchEquipment(unit);
}

/** Chasis, portacontenedor o plana: convoy para mover contenedor. */
export function isIsoContainerOrPlanaEquipment(e: Equipment): boolean {
  return isPortacontenedorEquipment(e) || isPlanaEquipment(e);
}

const ISO_SLOT_KEYS_BY_CONTAINER: Readonly<
  Record<Exclude<TripContainerType, 'na'>, readonly string[]>
> = {
  '20dc': [
    'iso_20',
    'iso_20_20',
    'iso_20_40',
    'iso_20_45',
    'iso_20_40_45',
    'fixed',
    'gooseneck',
  ],
  '20hc': [
    'iso_20',
    'iso_20_20',
    'iso_20_40',
    'iso_20_45',
    'iso_20_40_45',
    'fixed',
    'gooseneck',
  ],
  '40dc': ['iso_40', 'iso_20_40', 'iso_20_40_45', 'fixed', 'gooseneck'],
  '40hc': ['iso_40', 'iso_20_40', 'iso_20_40_45', 'fixed', 'gooseneck'],
  '45hc': ['iso_45', 'iso_20_45', 'iso_20_40_45', 'gooseneck'],
};

function equipmentCarriesTripContainer(
  equipment: Equipment,
  containerType: Exclude<TripContainerType, 'na'>,
): boolean {
  if (isPlanaEquipment(equipment)) {
    return true;
  }
  if (!isPortacontenedorEquipment(equipment)) {
    return false;
  }
  const slot = resolveContainerSlotConfigKey(
    equipment.fleetMeta?.equipmentContainerSlotConfig,
  );
  if (!slot || slot === 'na') {
    return true;
  }
  return ISO_SLOT_KEYS_BY_CONTAINER[containerType].includes(slot);
}

export type ManeuverUnitAssignmentFilter = {
  operationCode: string;
  containerType: TripContainerType | string;
};

/**
 * Compatibilidad unidad ↔ maniobra:
 * - Contenedor «No aplica»: rabón, volteo y pipa; oculta tracto con chasis, plana o portacontenedor.
 * - Contenedor ISO: solo tracto con chasis, plana o portacontenedor compatible, y la configuración del convoy.
 */
export function unitMatchesManeuverAssignment(
  unit: Unit,
  filter: ManeuverUnitAssignmentFilter,
): boolean {
  const containerType = normalizeTripContainerType(filter.containerType);
  const hitched = unitHitchedEquipment(unit);
  const selfContained = isSelfContainedCargoUnit(unit);

  if (containerType === 'na') {
    if (selfContained) {
      return true;
    }
    if (hitched.length === 0) {
      return false;
    }
    if (hitched.some(isIsoContainerOrPlanaEquipment)) {
      return false;
    }
    return unitMatchesManeuverOperationCode(unit, filter.operationCode);
  }

  if (selfContained || hitched.length === 0) {
    return false;
  }
  if (!hitched.some((e) => equipmentCarriesTripContainer(e, containerType))) {
    return false;
  }
  return unitMatchesManeuverOperationCode(unit, filter.operationCode);
}

export function busyUnitIdsFromTrips(trips: readonly Trip[]): Set<string> {
  const busy = new Set<string>();
  for (const t of trips) {
    if (ACTIVE_MANEUVER_STATUSES.includes(t.status)) {
      busy.add(t.unitId);
    }
  }
  return busy;
}

export function buildManeuverAssignableUnitRows(
  units: readonly Unit[],
  trips: readonly Trip[],
): ManeuverAssignableUnitRow[] {
  const busy = busyUnitIdsFromTrips(trips);
  return units
    .filter(
      (u) =>
        isFleetResourceActive(u) &&
        PICKABLE_UNIT_STATUSES.has(u.status) &&
        !busy.has(u.id),
    )
    .map((unit) => {
      const hitched = unitHitchedEquipment(unit);
      const configLabel = fleetUnitConvoyTableLabel(hitched.length, unit.transportType);
      return {
        unit,
        displayLabel: `${formatUnitTrailerOperationalId(unit)} - ${configLabel}`,
        operationType: unitConvoyOperationCodeFromHitched(hitched) as TripOperationType,
        hitchedEquipment: hitched,
        equipmentIds: hitched.map((e) => e.id),
      };
    })
    .filter(
      (row) =>
        row.hitchedEquipment.length > 0 || isSelfContainedCargoUnit(row.unit),
    )
    .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));
}

export function formatManeuverEquipmentLabel(e: Equipment): string {
  const operationalId = formatEquipmentOperationalId(e).trim();
  const typeLabel = equipmentTypeDisplayLabel(e);
  const hasType = typeLabel !== '—';
  if (hasType && operationalId) {
    return `${typeLabel} - ${operationalId}`;
  }
  if (operationalId) {
    return operationalId;
  }
  if (hasType) {
    return typeLabel;
  }
  const year = (e.trailerYear ?? '').trim();
  const plate = (e.plate ?? '').trim();
  const parts = [year, plate].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' - ');
  }
  return formatEquipmentOperationalId(e);
}

export function equipmentPickableForUnit(
  equipment: readonly Equipment[],
  unitId: string,
): Equipment[] {
  const id = resourceIdKey(unitId);
  if (!id) {
    return [];
  }
  return equipment
    .filter((e) => resourceIdsEqual(e.unitId, id))
    .sort((a, b) => formatManeuverEquipmentLabel(a).localeCompare(formatManeuverEquipmentLabel(b)));
}
