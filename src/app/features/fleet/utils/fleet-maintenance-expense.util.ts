import { FLEET_MAINTENANCE_TYPE_OPTIONS } from '@shared/catalogs/fleet-form-options';
import type { ExpenseWritePayload } from '@core/services/api/expenses';
import type { ExpenseKind, ExpenseMaintenanceTarget } from '@shared/models/logistics.models';

export const FLEET_MAINTENANCE_LEDGER_ERROR =
  'El mantenimiento se guardó, pero no se pudo registrar el gasto en el ledger.';

export type FleetMaintenanceExpenseInput = {
  date: string;
  cost: number;
  typeValue?: string;
  typeLabel?: string;
  notes?: string;
  paymentMethod?: string;
  unitId?: string;
  equipmentId?: string;
};

function catalogTypeLabel(typeValue: string | undefined): string | undefined {
  const value = typeValue?.trim();
  if (!value) {
    return undefined;
  }
  return FLEET_MAINTENANCE_TYPE_OPTIONS.find((o) => o.value === value)?.label;
}

function catalogTypeValue(typeLabel: string | undefined): string | undefined {
  const label = typeLabel?.trim();
  if (!label) {
    return undefined;
  }
  return FLEET_MAINTENANCE_TYPE_OPTIONS.find((o) => o.label === label)?.value;
}

/**
 * Gasto real (ya ocurrido) a partir de un servicio registrado en Flota.
 * No programa ciclos futuros: `incurredAt` y `paidAt` son la fecha del servicio.
 */
export function buildFleetMaintenanceExpensePayload(
  input: FleetMaintenanceExpenseInput,
): ExpenseWritePayload | null {
  const date = input.date.trim();
  if (!date || !Number.isFinite(input.cost) || input.cost <= 0) {
    return null;
  }
  const unitId = input.unitId?.trim() || undefined;
  const equipmentId = input.equipmentId?.trim() || undefined;
  if (Boolean(unitId) === Boolean(equipmentId)) {
    return null;
  }

  const typeLabel =
    input.typeLabel?.trim() || catalogTypeLabel(input.typeValue) || 'Mantenimiento';
  const typeValue = input.typeValue?.trim() || catalogTypeValue(typeLabel) || '';
  const kind: ExpenseKind =
    typeValue === 'cambio_llantas' && unitId ? 'tires' : 'maintenance';
  const maintenanceTarget: ExpenseMaintenanceTarget = unitId ? 'unit' : 'equipment';

  return {
    tripId: '',
    category: typeLabel,
    amount: input.cost,
    currency: 'MXN',
    incurredAt: date,
    kind,
    description: input.notes?.trim() || undefined,
    paymentMethod: input.paymentMethod?.trim() || undefined,
    relatedUnitId: unitId,
    relatedEquipmentId: equipmentId,
    maintenanceTarget,
    paidAt: date,
  };
}
