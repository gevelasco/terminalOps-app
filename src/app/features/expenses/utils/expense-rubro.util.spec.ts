import type { Expense } from '@shared/models/logistics.models';
import {
  expenseRubroFromExpense,
  resolveExpenseConceptFromExpense,
} from './expense-rubro.util';

function expense(partial: Partial<Expense>): Expense {
  return {
    id: '1',
    tripId: '',
    category: '',
    amount: 10,
    currency: 'MXN',
    incurredAt: '2026-08-19',
    kind: 'other',
    ...partial,
  };
}

describe('expenseRubroFromExpense', () => {
  it('maps a general gasto (kind other + custom concept) to rubro gasto', () => {
    expect(
      expenseRubroFromExpense(
        expense({ kind: 'other', category: 'Papelería' }),
      ),
    ).toBe('gasto');
  });

  it('maps the explicit Otro concept to rubro otro', () => {
    expect(
      expenseRubroFromExpense(expense({ kind: 'other', category: 'Otro' })),
    ).toBe('otro');
  });

  it('keeps fuel linked to a trip as rubro maniobra', () => {
    expect(
      expenseRubroFromExpense(
        expense({ kind: 'fuel', category: 'Diésel / combustible', tripId: '9' }),
      ),
    ).toBe('maniobra');
  });
});

describe('resolveExpenseConceptFromExpense', () => {
  it('resolves a saved general gasto to the gasto custom concept', () => {
    expect(
      resolveExpenseConceptFromExpense(
        expense({ kind: 'other', category: 'Limpieza' }),
      ),
    ).toEqual({ rubro: 'gasto', conceptId: 'gasto_custom' });
  });

  it('resolves category Otro to the otro catalog concept', () => {
    expect(
      resolveExpenseConceptFromExpense(
        expense({ kind: 'other', category: 'Otro' }),
      ),
    ).toEqual({ rubro: 'otro', conceptId: 'other' });
  });
});
