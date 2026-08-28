import type { ReportsBalancePayableItem } from '@shared/models/api/api-reports-balance.model';

export type PayableItemStatus = ReportsBalancePayableItem['status'];
export type ReportsPayableRow = ReportsBalancePayableItem;

export interface ReportsPayableTotals {
  amount: number;
  count: number;
}

export function buildReportsPayableTable(
  items: readonly ReportsBalancePayableItem[],
): { rows: ReportsPayableRow[]; totals: ReportsPayableTotals } {
  const rows = [...items];
  const totals: ReportsPayableTotals = {
    amount: rows.reduce((sum, row) => sum + row.amount, 0),
    count: rows.length,
  };
  return { rows, totals };
}
