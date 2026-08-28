import type { Expense } from '@shared/models/logistics.models';
import { expenseIncurredDateInput } from '@features/expenses/utils/expenses-form.util';

export type LedgerCoverageScheduleRowStatus = 'paid' | 'future' | 'due' | 'overdue';

export type LedgerCoverageScheduleRow = {
  index: number;
  label: string;
  dueDate: string;
  status: LedgerCoverageScheduleRowStatus;
  expenseId?: string;
  paidDate?: string;
  paidAmount?: number;
  canConfirm: boolean;
};

function parseYmd(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) {
    return null;
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfToday(today: Date): Date {
  const d = new Date(today.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function scheduleLabel(index: number, cadenceMonths: number): string {
  if (cadenceMonths === 1) {
    return `Mes ${index}`;
  }
  if (cadenceMonths === 3) {
    return `T${index}`;
  }
  return `Pago ${index}`;
}

function installmentIndex(description: string | undefined, fallback: number): number {
  const match = /\((?:.*?)(\d+)\s*\/\s*\d+\)/.exec(description ?? '');
  if (!match) {
    return fallback;
  }
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function expensePaidYmd(e: Expense): string {
  if (e.paidAt) {
    return expenseIncurredDateInput(e.paidAt);
  }
  return expenseIncurredDateInput(e.incurredAt);
}

function rowStatus(
  dueDate: string,
  paid: boolean,
  today: Date,
  confirmWindowDays: number,
): LedgerCoverageScheduleRowStatus {
  if (paid) {
    return 'paid';
  }
  const due = parseYmd(dueDate);
  if (!due) {
    return 'future';
  }
  if (due.getTime() < today.getTime()) {
    return 'overdue';
  }
  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);
  return daysUntil <= confirmWindowDays ? 'due' : 'future';
}

/**
 * Calendario de cuotas desde el ledger. No inventa ciclos:
 * si no hay gasto, no hay fila.
 */
export function buildLedgerCoverageSchedule(params: {
  expenses: readonly Expense[];
  isMatch: (expense: Expense) => boolean;
  cadenceMonths: number;
  confirmWindowDays: number;
  today?: Date;
}): LedgerCoverageScheduleRow[] {
  const today = startOfToday(params.today ?? new Date());
  const matched = params.expenses.filter(params.isMatch);
  const sorted = [...matched].sort((a, b) => {
    const aDue = expenseIncurredDateInput(a.incurredAt);
    const bDue = expenseIncurredDateInput(b.incurredAt);
    return aDue.localeCompare(bDue) || String(a.id).localeCompare(String(b.id));
  });

  const rows: LedgerCoverageScheduleRow[] = sorted.map((expense, i) => {
    const dueDate = expenseIncurredDateInput(expense.incurredAt);
    const paid = expense.paidAt != null && String(expense.paidAt).trim() !== '';
    const index = installmentIndex(expense.description, i + 1);
    return {
      index,
      label: scheduleLabel(index, params.cadenceMonths),
      dueDate,
      status: rowStatus(dueDate, paid, today, params.confirmWindowDays),
      expenseId: expense.id,
      paidDate: paid ? expensePaidYmd(expense) : undefined,
      paidAmount: paid ? expense.amount : undefined,
      canConfirm: false,
    };
  });

  const nextUnpaid = rows.find(
    (row) => row.status === 'overdue' || row.status === 'due',
  );
  if (nextUnpaid) {
    nextUnpaid.canConfirm = true;
  }

  return rows;
}

/** Primera cuota aún no pagada. Si todas están pagadas, no hay próximo. */
export function nextUnpaidCoverageDueYmd(
  rows: readonly LedgerCoverageScheduleRow[],
): string | null {
  return rows.find((row) => row.status !== 'paid')?.dueDate ?? null;
}

export function coverageNextPaymentLabel(
  rows: readonly LedgerCoverageScheduleRow[],
  formatYmd: (iso: string) => string,
  fallback: string,
): string {
  const due = nextUnpaidCoverageDueYmd(rows);
  if (due) {
    return formatYmd(due);
  }
  if (rows.length > 0) {
    return 'Al corriente';
  }
  return fallback;
}

export function coverageComplianceFromSchedule(
  rows: readonly LedgerCoverageScheduleRow[],
  today: Date = new Date(),
): { bucket: 'ok' | 'soon' | 'due'; daysUntil: number | null } | null {
  if (rows.length === 0) {
    return null;
  }
  const nextUnpaid = rows.find((row) => row.status !== 'paid');
  if (!nextUnpaid) {
    return { bucket: 'ok', daysUntil: null };
  }
  const due = parseYmd(nextUnpaid.dueDate);
  const start = startOfToday(today);
  const daysUntil = due
    ? Math.round((due.getTime() - start.getTime()) / 86400000)
    : null;
  if (nextUnpaid.status === 'overdue') {
    return { bucket: 'due', daysUntil };
  }
  if (nextUnpaid.status === 'due') {
    return { bucket: 'soon', daysUntil };
  }
  return { bucket: 'ok', daysUntil };
}
