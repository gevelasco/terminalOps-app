export const SESSION_IDLE_MS = 45 * 60 * 1000;
export const ACCESS_REFRESH_SKEW_MS = 3 * 60 * 1000;
export const SESSION_TICK_MS = 30_000;

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
