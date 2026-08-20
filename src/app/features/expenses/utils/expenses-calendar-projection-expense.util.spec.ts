import type { ExpenseCalendarItem } from '@services/api/expenses';
import type { Expense } from '@shared/models/logistics.models';
import { calendarItemRubroLabel } from './expenses-calendar-projection-expense.util';

describe('calendarItemRubroLabel', () => {
  it('maps an actual general gasto to Gasto even if the API sent Otro', () => {
    const expense: Expense = {
      id: '1',
      tripId: '',
      category: 'Papelería',
      amount: 100,
      currency: 'MXN',
      incurredAt: '2026-08-19',
      kind: 'other',
    };
    const item: ExpenseCalendarItem = {
      entryType: 'actual',
      sortDate: '2026-08-19',
      id: '1',
      rubroLabel: 'Otro',
      conceptLabel: 'Papelería',
      amount: 100,
      currency: 'MXN',
      dateYmd: '2026-08-19',
      statusLabel: 'Registrado',
      expense,
    };
    expect(calendarItemRubroLabel(item)).toBe('Gasto');
  });

  it('keeps Otro when the concept is explicitly Otro', () => {
    const expense: Expense = {
      id: '2',
      tripId: '',
      category: 'Otro',
      amount: 50,
      currency: 'MXN',
      incurredAt: '2026-08-19',
      kind: 'other',
    };
    const item: ExpenseCalendarItem = {
      entryType: 'actual',
      sortDate: '2026-08-19',
      id: '2',
      rubroLabel: 'Otro',
      conceptLabel: 'Otro',
      amount: 50,
      currency: 'MXN',
      dateYmd: '2026-08-19',
      statusLabel: 'Registrado',
      expense,
    };
    expect(calendarItemRubroLabel(item)).toBe('Otro');
  });
});
