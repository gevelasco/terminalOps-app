import type { Expense } from '@shared/models/logistics.models';
import {
  GPS_PAYMENT_CONFIRM_WINDOW_DAYS,
  cadenceToMonths,
  gpsFleetMetaIsActive,
  type FleetGpsPaymentMeta,
} from './fleet-gps-payment.util';
import {
  compactInsurancePaymentSchedule,
  insuranceScheduleStatusLabel,
  type InsuranceScheduleRow,
  type InsuranceScheduleRowStatus,
} from './fleet-insurance-schedule.util';
import {
  buildLedgerCoverageSchedule,
  coverageComplianceFromSchedule,
} from './fleet-ledger-coverage-schedule.util';

export type GpsScheduleRow = InsuranceScheduleRow;
export type GpsScheduleRowStatus = InsuranceScheduleRowStatus;

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

export function gpsSchedulePeriodCount(cadence: string | undefined): number {
  const months = cadenceToMonths(cadence);
  if (months === 1) {
    return 12;
  }
  if (months === 3) {
    return 4;
  }
  return 0;
}

export function isAnnualGpsCadence(cadence: string | undefined): boolean {
  return cadenceToMonths(cadence) === 12;
}

export function showGpsPaymentSchedule(meta: FleetGpsPaymentMeta | undefined): boolean {
  return gpsFleetMetaIsActive(meta) && gpsSchedulePeriodCount(meta?.gpsPaymentCadence) > 0;
}

export function gpsServiceYearBounds(
  meta: FleetGpsPaymentMeta | undefined,
  today: Date = new Date(),
): { from: string; to: string } | null {
  const contract = meta?.gpsContractDate?.trim();
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

export function buildGpsPaymentSchedule(params: {
  meta: FleetGpsPaymentMeta | undefined;
  expenses: readonly Expense[];
  today?: Date;
}): GpsScheduleRow[] {
  if (!showGpsPaymentSchedule(params.meta)) {
    return [];
  }
  return buildLedgerCoverageSchedule({
    expenses: params.expenses,
    isMatch: (expense) => expense.kind === 'gps',
    cadenceMonths: cadenceToMonths(params.meta?.gpsPaymentCadence),
    confirmWindowDays: GPS_PAYMENT_CONFIRM_WINDOW_DAYS,
    today: params.today,
  });
}

export const compactGpsPaymentSchedule = compactInsurancePaymentSchedule;
export const gpsScheduleStatusLabel = insuranceScheduleStatusLabel;

export type GpsPaymentCompliance = {
  bucket: 'ok' | 'soon' | 'due';
  daysUntil: number | null;
};

/** Misma regla que seguro: el primer ciclo impago define vencido vs por pagar. */
export function gpsPaymentCompliance(
  meta: FleetGpsPaymentMeta | undefined,
  options?: { expenses?: readonly Expense[]; today?: Date },
): GpsPaymentCompliance | null {
  if (!showGpsPaymentSchedule(meta)) {
    return null;
  }
  const contract = meta?.gpsContractDate?.trim();
  if (!contract) {
    return null;
  }

  const rows = buildGpsPaymentSchedule({
    meta,
    expenses: options?.expenses ?? [],
    today: options?.today,
  });
  return coverageComplianceFromSchedule(rows, options?.today);
}
