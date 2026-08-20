import {
  expenseRelationsFromTrip,
  mergeTripExpenseRelations,
} from './expense-trip-relations.util';

const trip = {
  unitId: 'u-1',
  operatorId: 'op-1',
  equipmentIds: ['eq-1', 'eq-2'],
};

describe('expenseRelationsFromTrip', () => {
  it('copies unit, operator and equipment for a general gasto', () => {
    expect(expenseRelationsFromTrip('other', trip)).toEqual({
      relatedUnitId: 'u-1',
      relatedOperatorId: 'op-1',
      relatedEquipmentId: 'eq-1',
    });
  });

  it('prefers unit and clears equipment for maintenance', () => {
    expect(expenseRelationsFromTrip('maintenance', trip)).toEqual({
      relatedUnitId: 'u-1',
      relatedEquipmentId: '',
    });
  });

  it('copies only the unit for GPS', () => {
    expect(expenseRelationsFromTrip('gps', trip)).toEqual({
      relatedUnitId: 'u-1',
    });
  });
});

describe('mergeTripExpenseRelations', () => {
  it('fills empty fields without overwriting existing ones', () => {
    expect(
      mergeTripExpenseRelations(
        { relatedUnitId: 'kept', relatedEquipmentId: '', relatedOperatorId: '' },
        {
          relatedUnitId: 'u-1',
          relatedOperatorId: 'op-1',
          relatedEquipmentId: 'eq-1',
        },
        'fill-empty',
      ),
    ).toEqual({
      relatedUnitId: 'kept',
      relatedEquipmentId: 'eq-1',
      relatedOperatorId: 'op-1',
    });
  });

  it('overwrites all derived fields when the linked trip changes', () => {
    expect(
      mergeTripExpenseRelations(
        {
          relatedUnitId: 'old-u',
          relatedEquipmentId: 'old-eq',
          relatedOperatorId: 'old-op',
        },
        {
          relatedUnitId: 'u-1',
          relatedOperatorId: 'op-1',
          relatedEquipmentId: 'eq-1',
        },
        'overwrite',
      ),
    ).toEqual({
      relatedUnitId: 'u-1',
      relatedEquipmentId: 'eq-1',
      relatedOperatorId: 'op-1',
    });
  });
});
