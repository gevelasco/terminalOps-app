import type { ExpenseCalendarItem } from '@core/services/api/expenses';
import type { Expense } from '@shared/models/logistics.models';
import { buildDashboardUpcomingPayments } from './dashboard-upcoming-payments.util';

function actualItem(
  partial: Partial<ExpenseCalendarItem> & {
    dateYmd: string;
    expense: Expense;
  },
): ExpenseCalendarItem {
  return {
    entryType: 'actual',
    sortDate: partial.dateYmd,
    id: partial.id ?? String(partial.expense.id),
    rubroLabel: partial.rubroLabel ?? 'Seguros',
    conceptLabel: partial.conceptLabel ?? partial.expense.category,
    amount: partial.amount ?? partial.expense.amount,
    currency: partial.currency ?? 'MXN',
    dateYmd: partial.dateYmd,
    statusLabel: partial.statusLabel ?? 'Pendiente',
    expense: partial.expense,
  };
}

describe('buildDashboardUpcomingPayments', () => {
  const range = {
    today: '2026-07-07',
    to: '2026-07-31',
    fetchFrom: '2025-07-07',
  };

  it('keeps unpaid ledger insurance and skips paid or out-of-range rows', () => {
    const items: ExpenseCalendarItem[] = [
      actualItem({
        id: 'ins-1',
        dateYmd: '2026-07-15',
        amount: 5000,
        expense: {
          id: 'ins-1',
          tripId: '',
          category: 'Póliza',
          amount: 5000,
          currency: 'MXN',
          incurredAt: '2026-07-15',
          kind: 'insurance',
          paidAt: null,
          relatedUnitLabel: 'T-101',
        },
      }),
      actualItem({
        id: 'op-paid',
        dateYmd: '2026-07-20',
        amount: 2000,
        expense: {
          id: 'op-paid',
          tripId: '1',
          category: 'Pago a operador',
          amount: 2000,
          currency: 'MXN',
          incurredAt: '2026-07-20',
          kind: 'operator_payment',
          paidAt: '2026-07-20T18:00:00.000Z',
        },
      }),
    ];

    const rows = buildDashboardUpcomingPayments(items, range);

    expect(rows.length).toBe(1);
    expect(rows[0]?.displayLabel).toBe('Seguro - T-101');
    expect(rows[0]?.dueYmd).toBe('2026-07-15');
    expect(rows[0]?.overdue).toBe(false);
  });

  it('formats gps, insurance equipment and operator labels from ledger rows', () => {
    const items: ExpenseCalendarItem[] = [
      actualItem({
        id: 'gps-1',
        dateYmd: '2026-07-10',
        expense: {
          id: 'gps-1',
          tripId: '',
          category: 'GPS',
          amount: 500,
          currency: 'MXN',
          incurredAt: '2026-07-10',
          kind: 'gps',
          relatedUnitLabel: 'T-202',
        },
      }),
      actualItem({
        id: 'ins-eq',
        dateYmd: '2026-07-12',
        expense: {
          id: 'ins-eq',
          tripId: '',
          category: 'Póliza',
          amount: 3000,
          currency: 'MXN',
          incurredAt: '2026-07-12',
          kind: 'insurance',
          relatedEquipmentLabel: 'EQ-05',
        },
      }),
      actualItem({
        id: 'op-1',
        dateYmd: '2026-07-14',
        expense: {
          id: 'op-1',
          tripId: '1',
          category: 'Pago a operador',
          amount: 2000,
          currency: 'MXN',
          incurredAt: '2026-07-14',
          kind: 'operator_payment',
          relatedOperatorLabel: 'Juan Pérez',
        },
      }),
    ];

    const rows = buildDashboardUpcomingPayments(items, range);

    expect(rows.map((row) => row.displayLabel)).toEqual([
      'GPS - T-202',
      'Seguro - EQ-05',
      'Pago - Juan Pérez',
    ]);
  });

  it('includes overdue unpaid ledger payments before today', () => {
    const items: ExpenseCalendarItem[] = [
      actualItem({
        id: 'gps-overdue',
        dateYmd: '2026-07-01',
        amount: 800,
        expense: {
          id: 'gps-overdue',
          tripId: '',
          category: 'Servicio GPS',
          amount: 800,
          currency: 'MXN',
          incurredAt: '2026-07-01',
          kind: 'gps',
          relatedUnitLabel: 'T-88',
        },
      }),
    ];

    const rows = buildDashboardUpcomingPayments(items, range);

    expect(rows.length).toBe(1);
    expect(rows[0]?.displayLabel).toBe('GPS - T-88');
    expect(rows[0]?.overdue).toBe(true);
    expect(rows[0]?.dueLabel).toContain('Vencido');
  });

  it('excludes unpaid payments after end of month', () => {
    const items: ExpenseCalendarItem[] = [
      actualItem({
        id: 'ins-future',
        dateYmd: '2026-08-05',
        expense: {
          id: 'ins-future',
          tripId: '',
          category: 'Póliza',
          amount: 5000,
          currency: 'MXN',
          incurredAt: '2026-08-05',
          kind: 'insurance',
          relatedUnitLabel: 'T-101',
        },
      }),
    ];

    const rows = buildDashboardUpcomingPayments(items, range);

    expect(rows.length).toBe(0);
  });
});
