import { buildFleetMaintenanceExpensePayload } from './fleet-maintenance-expense.util';

describe('buildFleetMaintenanceExpensePayload', () => {
  it('builds a paid maintenance expense for a unit service', () => {
    const payload = buildFleetMaintenanceExpensePayload({
      date: '2026-03-13',
      cost: 3500,
      typeValue: 'servicio_completo',
      notes: 'Cambio de aceite',
      paymentMethod: 'transfer',
      unitId: 'u-1',
    });

    expect(payload).toEqual({
      tripId: '',
      category: 'Servicio completo',
      amount: 3500,
      currency: 'MXN',
      incurredAt: '2026-03-13',
      kind: 'maintenance',
      description: 'Cambio de aceite',
      paymentMethod: 'transfer',
      relatedUnitId: 'u-1',
      relatedEquipmentId: undefined,
      maintenanceTarget: 'unit',
      paidAt: '2026-03-13',
    });
  });

  it('builds an equipment expense without scheduling a next cycle', () => {
    const payload = buildFleetMaintenanceExpensePayload({
      date: '2026-04-01',
      cost: 1200,
      typeLabel: 'Medio servicio',
      equipmentId: 'eq-9',
    });

    expect(payload?.kind).toBe('maintenance');
    expect(payload?.relatedEquipmentId).toBe('eq-9');
    expect(payload?.relatedUnitId).toBeUndefined();
    expect(payload?.maintenanceTarget).toBe('equipment');
    expect(payload?.paidAt).toBe('2026-04-01');
  });

  it('uses tires kind for a unit tire change', () => {
    const payload = buildFleetMaintenanceExpensePayload({
      date: '2026-05-01',
      cost: 8000,
      typeValue: 'cambio_llantas',
      unitId: 'u-2',
    });

    expect(payload?.kind).toBe('tires');
    expect(payload?.category).toBe('Cambio de llantas');
  });

  it('keeps equipment tire changes as maintenance (tires require a unit)', () => {
    const payload = buildFleetMaintenanceExpensePayload({
      date: '2026-05-01',
      cost: 8000,
      typeValue: 'cambio_llantas',
      equipmentId: 'eq-2',
    });

    expect(payload?.kind).toBe('maintenance');
    expect(payload?.category).toBe('Cambio de llantas');
  });

  it('returns null without a real cost, date, or exclusive target', () => {
    expect(
      buildFleetMaintenanceExpensePayload({
        date: '2026-03-13',
        cost: 0,
        unitId: 'u-1',
      }),
    ).toBeNull();
    expect(
      buildFleetMaintenanceExpensePayload({
        date: '',
        cost: 100,
        unitId: 'u-1',
      }),
    ).toBeNull();
    expect(
      buildFleetMaintenanceExpensePayload({
        date: '2026-03-13',
        cost: 100,
      }),
    ).toBeNull();
    expect(
      buildFleetMaintenanceExpensePayload({
        date: '2026-03-13',
        cost: 100,
        unitId: 'u-1',
        equipmentId: 'eq-1',
      }),
    ).toBeNull();
  });
});
