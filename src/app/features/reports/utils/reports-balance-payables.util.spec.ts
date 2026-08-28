import { buildReportsPayableTable } from './reports-balance-payables.util';

describe('buildReportsPayableTable', () => {
  it('totals unpaid ledger rows from the balance payload', () => {
    const table = buildReportsPayableTable([
      {
        description: 'Seguro 10 ago',
        amount: 10000,
        beneficiary: 'Qualitas',
        installmentLabel: '1/12',
        dueDate: '2026-08-10',
        status: 'overdue',
      },
      {
        description: 'GPS 30 ago',
        amount: 450,
        beneficiary: null,
        installmentLabel: '1/1',
        dueDate: '2026-08-30',
        status: 'pending',
      },
    ]);

    expect(table.rows.length).toBe(2);
    expect(table.totals).toEqual({ amount: 10450, count: 2 });
  });
});
