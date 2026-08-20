import { resolveExpenseRelationFields } from './expenses-form.util';

describe('resolveExpenseRelationFields', () => {
  it('keeps unit and operator when saving a general gasto linked to a trip', () => {
    const result = resolveExpenseRelationFields('other', {
      tripId: 'trip-1',
      relatedUnitId: 'u-1',
      relatedEquipmentId: '',
      relatedOperatorId: 'op-1',
      verificationScope: 'phys_mech',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.fields.tripId).toBe('trip-1');
    expect(result.fields.relatedUnitId).toBe('u-1');
    expect(result.fields.relatedOperatorId).toBe('op-1');
  });

  it('still requires unit xor equipment for maintenance', () => {
    const both = resolveExpenseRelationFields('maintenance', {
      tripId: '',
      relatedUnitId: 'u-1',
      relatedEquipmentId: 'eq-1',
      relatedOperatorId: '',
      verificationScope: 'phys_mech',
    });
    expect(both.ok).toBe(false);
  });
});
