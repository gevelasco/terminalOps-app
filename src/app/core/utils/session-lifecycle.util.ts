export const SESSION_IDLE_MS = 45 * 60 * 1000;
export const ACCESS_REFRESH_SKEW_MS = 3 * 60 * 1000;
export const SESSION_TICK_MS = 30_000;
export const SESSION_TAB_HANDOFF_MS = 120;
export const LAST_ACTIVITY_STORAGE_KEY = 'terminalops.lastActivity';
export const SESSION_TAB_CHANNEL = 'terminalops.auth';

type JwtExpPayload = {
  exp?: number;
};

export function readJwtExpMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as JwtExpPayload;
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function shouldRefreshAccessToken(
  token: string | null | undefined,
  now = Date.now(),
  skewMs = ACCESS_REFRESH_SKEW_MS,
): boolean {
  if (!token) {
    return false;
  }
  const expMs = readJwtExpMs(token);
  if (expMs == null) {
    return false;
  }
  return expMs - now <= skewMs;
}

export function isIdlePastLimit(
  lastActivityAt: number,
  now = Date.now(),
  idleMs = SESSION_IDLE_MS,
): boolean {
  return now - lastActivityAt >= idleMs;
}

export function readSharedLastActivity(now = Date.now()): number {
  if (typeof localStorage === 'undefined') {
    return now;
  }
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : now;
  } catch {
    return now;
  }
}

export function writeSharedLastActivity(at = Date.now()): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(at));
  } catch {
    /* private mode */
  }
}
