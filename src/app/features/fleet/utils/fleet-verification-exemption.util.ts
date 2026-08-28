/** Fin de la exención de 2 años: 1 ene del año modelo + 2 años (`2026` → `2028-01-01`). */
export function fleetModelTwoYearExemptionEndYmd(
  trailerYear: string | number | null | undefined,
): string | null {
  const modelYear = Number.parseInt(String(trailerYear ?? '').trim(), 10);
  if (!Number.isFinite(modelYear) || modelYear < 1950 || modelYear > 2100) {
    return null;
  }
  return `${modelYear + 2}-01-01`;
}

export function fleetModelTwoYearExemptionEnd(
  trailerYear: string | number | null | undefined,
): Date | null {
  const ymd = fleetModelTwoYearExemptionEndYmd(trailerYear);
  if (!ymd) {
    return null;
  }
  const [y, m, d] = ymd.split('-').map((part) => Number(part));
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isWithinFleetModelTwoYearExemption(
  trailerYear: string | number | null | undefined,
  refNow = new Date(),
): boolean {
  const end = fleetModelTwoYearExemptionEnd(trailerYear);
  if (!end) {
    return false;
  }
  return startOfDay(refNow).getTime() < startOfDay(end).getTime();
}
