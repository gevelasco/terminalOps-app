import type { ExpenseCalendarItem } from '@services/api/expenses';
import { expenseRubroLabelForExpense } from '@features/expenses/utils/expense-rubro.util';

/** Rubro para la tabla del calendario: misma regla que el drawer, no el label crudo de API. */
export function calendarItemRubroLabel(item: ExpenseCalendarItem): string {
  if (item.expense) {
    return expenseRubroLabelForExpense(item.expense);
  }
  return item.rubroLabel?.trim() || '—';
}
