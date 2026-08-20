import type { ExpenseKind, Trip } from '@shared/models/logistics.models';
import {
  isExpenseEquipmentOnlyKind,
  isExpenseOperatorKind,
  isExpenseTiresKind,
  isExpenseUnitOnlyAssetKind,
} from '@features/expenses/utils/expenses-form.util';

export type ExpenseTripRelationIds = {
  relatedUnitId: string;
  relatedEquipmentId: string;
  relatedOperatorId: string;
};

/** Campos derivados de la maniobra; `undefined` = no tocar ese campo. */
export type ExpenseTripDerivedRelations = {
  relatedUnitId?: string;
  relatedEquipmentId?: string;
  relatedOperatorId?: string;
};

export function tripRelationIds(trip: Pick<
  Trip,
  'unitId' | 'operatorId' | 'equipmentIds'
>): ExpenseTripRelationIds {
  return {
    relatedUnitId: trip.unitId?.trim() ?? '',
    relatedOperatorId: trip.operatorId?.trim() ?? '',
    relatedEquipmentId: trip.equipmentIds?.[0]?.trim() ?? '',
  };
}

/**
 * Qué vínculos de flota copiar desde la maniobra según el `kind`.
 * En mantenimiento/seguro (XOR unidad/equipo) se prefiere la unidad.
 */
export function expenseRelationsFromTrip(
  kind: ExpenseKind,
  trip: Pick<Trip, 'unitId' | 'operatorId' | 'equipmentIds'>,
): ExpenseTripDerivedRelations {
  const { relatedUnitId, relatedOperatorId, relatedEquipmentId } =
    tripRelationIds(trip);

  if (isExpenseEquipmentOnlyKind(kind)) {
    return { relatedEquipmentId };
  }
  if (
    isExpenseUnitOnlyAssetKind(kind) ||
    kind === 'gps' ||
    kind === 'verification' ||
    isExpenseTiresKind(kind)
  ) {
    return { relatedUnitId };
  }
  if (kind === 'maintenance' || kind === 'insurance') {
    if (relatedUnitId) {
      return { relatedUnitId, relatedEquipmentId: '' };
    }
    return { relatedEquipmentId };
  }
  if (isExpenseOperatorKind(kind)) {
    return {
      relatedOperatorId,
      relatedUnitId,
      relatedEquipmentId,
    };
  }
  return {
    relatedUnitId,
    relatedOperatorId,
    relatedEquipmentId,
  };
}

export function mergeTripExpenseRelations(
  current: ExpenseTripRelationIds,
  derived: ExpenseTripDerivedRelations,
  mode: 'fill-empty' | 'overwrite',
): ExpenseTripRelationIds {
  const next: ExpenseTripRelationIds = { ...current };
  (['relatedUnitId', 'relatedEquipmentId', 'relatedOperatorId'] as const).forEach(
    (key) => {
      const incoming = derived[key];
      if (incoming === undefined) {
        return;
      }
      if (mode === 'overwrite' || !next[key].trim()) {
        next[key] = incoming;
      }
    },
  );
  return next;
}

export function tripUnitDisplayLabel(
  trip: Pick<Trip, 'unitOperationalCode' | 'unitId'> | null | undefined,
): string {
  if (!trip) {
    return '';
  }
  return trip.unitOperationalCode?.trim() || trip.unitId?.trim() || '';
}

export function tripOperatorDisplayLabel(
  trip: Pick<Trip, 'operatorName' | 'operatorId'> | null | undefined,
): string {
  if (!trip) {
    return '';
  }
  return trip.operatorName?.trim() || trip.operatorId?.trim() || '';
}

export function tripEquipmentDisplayLabel(
  trip: Pick<Trip, 'equipment' | 'equipmentIds'> | null | undefined,
): string {
  if (!trip) {
    return '';
  }
  return trip.equipment?.[0]?.trim() || trip.equipmentIds?.[0]?.trim() || '';
}
