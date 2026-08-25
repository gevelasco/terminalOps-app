import {
  LAST_ACTIVITY_STORAGE_KEY,
  isIdlePastLimit,
  readJwtExpMs,
  readSharedLastActivity,
  shouldRefreshAccessToken,
  writeSharedLastActivity,
} from './session-lifecycle.util';

describe('session-lifecycle.util', () => {
  const expIn = (msFromNow: number): string => {
    const exp = Math.floor((Date.now() + msFromNow) / 1000);
    const payload = btoa(JSON.stringify({ exp }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `aaa.${payload}.sig`;
  };

  it('reads exp from a JWT payload', () => {
    const token = expIn(60_000);
    const expMs = readJwtExpMs(token);
    expect(expMs).toBeGreaterThan(Date.now());
  });

  it('refreshes when the access token is inside the skew window', () => {
    expect(shouldRefreshAccessToken(expIn(2 * 60 * 1000))).toBe(true);
    expect(shouldRefreshAccessToken(expIn(20 * 60 * 1000))).toBe(false);
    expect(shouldRefreshAccessToken(null)).toBe(false);
  });

  it('flags idle after 45 minutes without activity', () => {
    const now = Date.now();
    expect(isIdlePastLimit(now - 10 * 60 * 1000, now)).toBe(false);
    expect(isIdlePastLimit(now - 45 * 60 * 1000, now)).toBe(true);
  });

  it('shares last activity across tabs via localStorage', () => {
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    writeSharedLastActivity(1_700_000_000_000);
    expect(readSharedLastActivity()).toBe(1_700_000_000_000);
  });
});
