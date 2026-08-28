import type { Expense } from '@shared/models/logistics.models';
import {
  buildInsurancePaymentSchedule,
  compactInsurancePaymentSchedule,
  insurancePaymentCompliance,
  insuranceSchedulePeriodCount,
  isAnnualInsuranceCadence,
  showInsurancePaymentSchedule,
} from './fleet-insurance-schedule.util';
import { coverageNextPaymentLabel } from './fleet-ledger-coverage-schedule.util';

const monthlyMeta = {
  insuranceContractDate: '2026-01-15',
  insurancePaymentCadence: 'Mensual',
  insuranceCost: 8500,
};

function expense(
  ymd: string,
  id = '1',
  options?: { installment?: number; paid?: boolean },
): Expense {
  const installment = options?.installment;
  const period =
    installment != null
      ? `(Mensualidad ${installment}/12)`
      : `(${monthlyMeta.insurancePaymentCadence})`;
  return {
    id,
    tripId: '',
    category: 'AXA',
    amount: 8500,
    currency: 'MXN',
    incurredAt: `${ymd}T12:00:00.000Z`,
    kind: 'insurance',
    description: `Pago de póliza · POL-1 ${period}`,
    insuranceTarget: 'unit',
    relatedUnitId: '7',
    paidAt: options?.paid === false ? null : `${ymd}T18:00:00.000Z`,
  };
}

describe('fleet-insurance-schedule.util', () => {
  it('returns 12 monthly and 4 quarterly periods', () => {
    expect(insuranceSchedulePeriodCount('Mensual')).toBe(12);
    expect(insuranceSchedulePeriodCount('monthly')).toBe(12);
    expect(insuranceSchedulePeriodCount('Trimestral')).toBe(4);
    expect(insuranceSchedulePeriodCount('quarterly')).toBe(4);
    expect(insuranceSchedulePeriodCount('Anual')).toBe(0);
    expect(isAnnualInsuranceCadence('Anual')).toBe(true);
    expect(showInsurancePaymentSchedule('Mensual')).toBe(true);
    expect(showInsurancePaymentSchedule('Anual')).toBe(false);
  });

  it('lists ledger installments instead of inventing empty cycles', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: monthlyMeta,
      expenses: [],
      today: new Date(2026, 4, 20),
    });
    expect(rows.length).toBe(0);
  });

  it('marks paid and unpaid from ledger paidAt', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: monthlyMeta,
      expenses: [
        expense('2026-01-15', 'e1', { installment: 1 }),
        expense('2026-02-15', 'e2', { installment: 2 }),
        expense('2026-05-15', 'e5', { installment: 5, paid: false }),
      ],
      today: new Date(2026, 4, 10),
    });

    expect(rows.map((row) => row.status)).toEqual(['paid', 'paid', 'due']);
    expect(rows[2]?.canConfirm).toBe(true);
    expect(rows[2]?.expenseId).toBe('e5');
  });

  it('enables confirm only on the first unpaid due or overdue ledger row', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: monthlyMeta,
      expenses: [
        expense('2026-01-15', 'e1', { installment: 1 }),
        expense('2026-06-15', 'e6', { installment: 6, paid: false }),
        expense('2026-07-15', 'e7', { installment: 7, paid: false }),
      ],
      today: new Date(2026, 5, 20),
    });

    const confirmable = rows.filter((row) => row.canConfirm);
    expect(confirmable.length).toBe(1);
    expect(confirmable[0]?.dueDate).toBe('2026-06-15');
    expect(confirmable[0]?.status).toBe('overdue');
  });

  it('compacts to paid rows plus the next unpaid ledger installment', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: {
        ...monthlyMeta,
        insuranceContractDate: '2026-06-01',
      },
      expenses: [
        expense('2026-06-01', 'e1', { installment: 1 }),
        expense('2026-07-01', 'e2', { installment: 2, paid: false }),
        expense('2026-08-01', 'e3', { installment: 3, paid: false }),
      ],
      today: new Date(2026, 5, 25),
    });

    const compact = compactInsurancePaymentSchedule(rows);
    expect(compact.map((row) => row.label)).toEqual(['Mes 1', 'Mes 2', 'Mes 3']);
    expect(compact[1]?.status).toBe('due');
    expect(compact[2]?.status).toBe('future');
  });

  it('shows only the last paid cycles when every ledger row is paid', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: monthlyMeta,
      expenses: Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return expense(`2026-${month}-15`, `e${i + 1}`, { installment: i + 1 });
      }),
      today: new Date(2026, 11, 20),
    });

    const compact = compactInsurancePaymentSchedule(rows);
    expect(compact.map((row) => row.label)).toEqual(['Mes 10', 'Mes 11', 'Mes 12']);
    expect(compact.every((row) => row.status === 'paid')).toBe(true);
  });

  it('does not invent overdue compliance when the ledger has no insurance rows', () => {
    const compliance = insurancePaymentCompliance(
      {
        insurancePolicyNumber: 'POL-1',
        insuranceContractDate: '2026-06-12',
        insurancePaymentCadence: 'Mensual',
        insuranceCost: 8500,
      },
      { expenses: [], today: new Date(2026, 6, 6) },
    );
    expect(compliance).toBeNull();
  });

  it('reports soon compliance from the first unpaid ledger due', () => {
    const compliance = insurancePaymentCompliance(
      {
        insurancePolicyNumber: 'POL-1',
        insuranceContractDate: '2026-06-01',
        insurancePaymentCadence: 'Mensual',
        insuranceCost: 8500,
      },
      {
        expenses: [
          expense('2026-06-01', 'e1', { installment: 1 }),
          expense('2026-07-01', 'e2', { installment: 2, paid: false }),
        ],
        today: new Date(2026, 5, 25),
      },
    );
    expect(compliance?.bucket).toBe('soon');
    expect(compliance?.daysUntil).toBe(6);
  });

  it('uses the first unpaid ledger cycle as the next payment date', () => {
    const rows = buildInsurancePaymentSchedule({
      meta: monthlyMeta,
      expenses: [
        expense('2026-01-24', '1', { installment: 1, paid: true }),
        expense('2026-02-24', '2', { installment: 2, paid: true }),
        expense('2026-03-24', '3', { installment: 3, paid: true }),
        expense('2026-04-24', '4', { installment: 4, paid: true }),
        expense('2026-05-24', '5', { installment: 5, paid: true }),
        expense('2026-06-24', '6', { installment: 6, paid: true }),
        expense('2026-07-24', '7', { installment: 7, paid: true }),
        expense('2026-08-24', '8', { installment: 8, paid: true }),
        expense('2026-09-24', '9', { installment: 9, paid: false }),
      ],
      today: new Date(2026, 7, 28),
    });
    expect(coverageNextPaymentLabel(rows, (iso) => iso, '—')).toBe('2026-09-24');
  });

  it('keeps insurance current when paid cycles cover today and next due is later', () => {
    const compliance = insurancePaymentCompliance(
      {
        insurancePolicyNumber: '0005323322',
        insuranceContractDate: '2026-01-24',
        insuranceLastPaymentDate: '2026-01-24',
        insurancePaymentCadence: 'Mensual',
        insuranceCost: 6824.41,
      },
      {
        expenses: [
          expense('2026-01-24', '1', { installment: 1, paid: true }),
          expense('2026-02-24', '2', { installment: 2, paid: true }),
          expense('2026-03-24', '3', { installment: 3, paid: true }),
          expense('2026-04-24', '4', { installment: 4, paid: true }),
          expense('2026-05-24', '5', { installment: 5, paid: true }),
          expense('2026-06-24', '6', { installment: 6, paid: true }),
          expense('2026-07-24', '7', { installment: 7, paid: true }),
          expense('2026-08-24', '8', { installment: 8, paid: true }),
          expense('2026-09-24', '9', { installment: 9, paid: false }),
        ],
        today: new Date(2026, 7, 28),
      },
    );
    expect(compliance?.bucket).toBe('ok');
    expect(compliance?.daysUntil).toBe(27);
  });
});
