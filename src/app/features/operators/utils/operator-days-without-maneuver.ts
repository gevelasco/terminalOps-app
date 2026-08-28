import type { OperatorOperationalStatus } from '@shared/models/logistics.models';

const MS_PER_DAY = 86_400_000;
const OPERATIONAL_TZ = 'America/Mexico_City';

function operationalDayIndex(epochMs: number, timeZone = OPERATIONAL_TZ): number {
  const key = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochMs));
  const [y, m, d] = key.split('-').map((v) => parseInt(v, 10));
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

function daysSinceYmd(ymd: string, now = new Date()): number {
  const anchorMs = new Date(`${ymd}T12:00:00`).getTime();
  if (!Number.isFinite(anchorMs)) {
    return 0;
  }
  const endDay = operationalDayIndex(anchorMs);
  const nowDay = operationalDayIndex(now.getTime());
  return Math.max(0, nowDay - endDay);
}

function operatorIsOnActiveTrip(status: OperatorOperationalStatus | undefined): boolean {
  return status === 'in_use' || status === 'scheduled';
}

/**
 * Días calendario (MX) desde el fin de la última maniobra completada.
 * En curso / programada: 0. Sin historial: 0 (no usa fecha de ingreso).
 */
export function operatorDaysWithoutManeuver(
  lastManeuverOccurredOn: string | undefined,
  operatorStatus?: OperatorOperationalStatus,
  now = new Date(),
): number {
  if (operatorIsOnActiveTrip(operatorStatus)) {
    return 0;
  }
  const anchor = lastManeuverOccurredOn?.trim() || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) {
    return 0;
  }
  return daysSinceYmd(anchor, now);
}
