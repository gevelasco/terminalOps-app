import type { Expense } from '@shared/models/logistics.models';
import {
  INSURANCE_PAYMENT_CONFIRM_WINDOW_DAYS,
  cadenceToMonths,
  type FleetInsurancePaymentMeta,
} from './fleet-insurance-payment.util';
import {
  buildLedgerCoverageSchedule,
  coverageComplianceFromSchedule,
  type LedgerCoverageScheduleRow,
  type LedgerCoverageScheduleRowStatus,
} from './fleet-ledger-coverage-schedule.util';

export type InsuranceScheduleRowStatus = LedgerCoverageScheduleRowStatus;
export type InsuranceScheduleRow = LedgerCoverageScheduleRow;

function parseYmd(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) {
    return null;
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfToday(today: Date): Date {
  const d = new Date(today.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/** Filas del calendario anual: 12 mensual, 4 trimestral, 0 anual/semanal. */
export function insuranceSchedulePeriodCount(cadence: string | undefined): number {
  const months = cadenceToMonths(cadence);
  if (months === 1) {
    return 12;
  }
  if (months === 3) {
    return 4;
  }
  return 0;
}

export function isAnnualInsuranceCadence(cadence: string | undefined): boolean {
  const months = cadenceToMonths(cadence);
  return months === 12;
}

export function showInsurancePaymentSchedule(cadence: string | undefined): boolean {
  return insuranceSchedulePeriodCount(cadence) > 0;
}

export function insurancePolicyYearBounds(
  meta: FleetInsurancePaymentMeta | undefined,
  today: Date = new Date(),
): { from: string; to: string } | null {
  const contract = meta?.insuranceContractDate?.trim();
  if (!contract) {
    return null;
  }
  const contractDate = parseYmd(contract);
  if (!contractDate) {
    return null;
  }
  const yearStart = policyYearStart(contractDate, today);
  const yearEnd = addMonths(yearStart, 12);
  yearEnd.setDate(yearEnd.getDate() - 1);
  return { from: formatYmd(yearStart), to: formatYmd(yearEnd) };
}

function policyYearStart(contractDate: Date, today: Date): Date {
  const anchor = startOfToday(today);
  const elapsed = monthsBetween(contractDate, anchor);
  const yearIndex = Math.max(0, Math.floor(elapsed / 12));
  return addMonths(contractDate, yearIndex * 12);
}

export function buildInsurancePaymentSchedule(params: {
  meta: FleetInsurancePaymentMeta | undefined;
  expenses: readonly Expense[];
  today?: Date;
}): InsuranceScheduleRow[] {
  if (!showInsurancePaymentSchedule(params.meta?.insurancePaymentCadence)) {
    return [];
  }
  return buildLedgerCoverageSchedule({
    expenses: params.expenses,
    isMatch: (expense) => expense.kind === 'insurance',
    cadenceMonths: cadenceToMonths(params.meta?.insurancePaymentCadence),
    confirmWindowDays: INSURANCE_PAYMENT_CONFIRM_WINDOW_DAYS,
    today: params.today,
  });
}

/** Vista compacta: pagados + próximo ciclo; un pendiente extra solo si el ciclo actual está por pagar o vencido. */
export function compactInsurancePaymentSchedule(
  rows: readonly InsuranceScheduleRow[],
): InsuranceScheduleRow[] {
  if (rows.length === 0) {
    return [];
  }

  const nextUnpaidIndex = rows.findIndex((row) => row.status !== 'paid');
  if (nextUnpaidIndex < 0) {
    const tail = Math.min(3, rows.length);
    return rows.slice(rows.length - tail);
  }

  const nextUnpaid = rows[nextUnpaidIndex]!;
  const includeTrailingPreview =
    nextUnpaid.status === 'due' || nextUnpaid.status === 'overdue';
  const lastVisibleIndex = includeTrailingPreview
    ? Math.min(rows.length - 1, nextUnpaidIndex + 1)
    : nextUnpaidIndex;

  return rows.slice(0, lastVisibleIndex + 1);
}

export function insuranceScheduleStatusLabel(status: InsuranceScheduleRowStatus): string {
  switch (status) {
    case 'paid':
      return 'Pagado';
    case 'due':
      return 'Por pagar';
    case 'overdue':
      return 'Vencido';
    default:
      return 'Pendiente';
  }
}

export type InsurancePaymentCompliance = {
  bucket: 'ok' | 'soon' | 'due';
  daysUntil: number | null;
};

/**
 * Estado de cumplimiento según el calendario anual (mensual/trimestral).
 * Prioriza el primer ciclo impago: vencido si algún ciclo anterior no está pagado.
 */
export function insurancePaymentCompliance(
  meta: FleetInsurancePaymentMeta | undefined,
  options?: { expenses?: readonly Expense[]; today?: Date },
): InsurancePaymentCompliance | null {
  if (!showInsurancePaymentSchedule(meta?.insurancePaymentCadence)) {
    return null;
  }
  const contract = meta?.insuranceContractDate?.trim();
  const policy = meta?.insurancePolicyNumber?.trim();
  if (!contract && !policy) {
    return null;
  }

  const rows = buildInsurancePaymentSchedule({
    meta,
    expenses: options?.expenses ?? [],
    today: options?.today,
  });
  return coverageComplianceFromSchedule(rows, options?.today);
}
