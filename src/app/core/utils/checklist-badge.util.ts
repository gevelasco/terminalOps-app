export function normalizeOpenChecklistCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.floor(n);
}

/** Hasta hidratar la lista, el badge usa el conteo del login; después, las tareas en memoria. */
export function checklistBadgeCount(
  listHydrated: boolean,
  pendingInList: number,
  loginOpenCount: number,
): number {
  return listHydrated ? pendingInList : loginOpenCount;
}
