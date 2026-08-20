export const EMPTY_DELIVERY_ORIGINAL_STORAGE_PREFIX = 'to.emptyDelivery.original.';

export function emptyDeliveryOriginalStorageKey(tripId: string): string {
  return `${EMPTY_DELIVERY_ORIGINAL_STORAGE_PREFIX}${tripId.trim()}`;
}

export function readEmptyDeliveryOriginalAt(tripId: string): string | null {
  const id = tripId.trim();
  if (!id || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(emptyDeliveryOriginalStorageKey(id))?.trim() || null;
  } catch {
    return null;
  }
}

/** Persiste la primera fecha conocida; no pisa una original ya guardada. */
export function rememberEmptyDeliveryOriginalAt(tripId: string, iso: string): void {
  const id = tripId.trim();
  const value = iso.trim();
  if (!id || !value || typeof localStorage === 'undefined') {
    return;
  }
  if (readEmptyDeliveryOriginalAt(id)) {
    return;
  }
  try {
    localStorage.setItem(emptyDeliveryOriginalStorageKey(id), value);
  } catch {
    /* quota / private mode */
  }
}

/**
 * Original para el timeline: la primera fecha persistida localmente, o la vigente si aún no hay.
 * Si hay fecha vigente y no hay original, la siembra para no perderla al actualizar.
 */
export function resolveEmptyDeliveryOriginalAt(
  tripId: string,
  currentAt: string | null | undefined,
): string | null {
  const current = currentAt?.trim() || null;
  const stored = readEmptyDeliveryOriginalAt(tripId);
  if (current && !stored) {
    rememberEmptyDeliveryOriginalAt(tripId, current);
    return current;
  }
  return stored || current;
}
