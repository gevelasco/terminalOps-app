/** Strip system-owned operational `status` from fleet API write payloads (A6). */
export function withoutFleetOperationalStatus<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, 'status'> {
  const { status: _ignored, ...rest } = payload;
  return rest as Omit<T, 'status'>;
}

/** Keys de lectura / legacy que no deben ir en POST/PATCH de fleetMeta. */
const FLEET_META_WRITE_OMIT = [
  'fleetDocuments',
  'documentMaintenanceNames',
  'documentVerificationNames',
  'documentPolicyNames',
  'documentOwnershipNames',
  /** Ignorados en escritura en el API (intervalo/alertas se calculan en vivo). */
  'maintenanceAlertByKm',
  'maintenanceNextDateOverride',
  'maintenanceKmInterval',
  'maintenanceTripKmAtLastService',
  'maintenanceKmRemaining',
] as const;

/**
 * Quita campos de solo lectura / UI / deprecated del `fleetMeta` antes de POST/PATCH
 * (`forbidNonWhitelisted` en el API; docs van por multipart).
 */
export function sanitizeFleetMetaForWrite<T extends Record<string, unknown>>(
  meta: T | undefined,
): T | undefined {
  if (!meta) {
    return undefined;
  }
  const next: Record<string, unknown> = { ...meta };
  for (const key of FLEET_META_WRITE_OMIT) {
    delete next[key];
  }
  if (Array.isArray(next['maintenanceEntries'])) {
    next['maintenanceEntries'] = (
      next['maintenanceEntries'] as Record<string, unknown>[]
    ).map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return entry;
      }
      const { status: _status, ...entryRest } = entry;
      return entryRest;
    });
  }
  return next as T;
}
