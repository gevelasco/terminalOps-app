import { signal } from '@angular/core';
import { beginInFlight } from './in-flight-guard';

describe('beginInFlight', () => {
  it('sets the flag and allows the first call', () => {
    const flag = signal(false);
    expect(beginInFlight(flag)).toBe(true);
    expect(flag()).toBe(true);
  });

  it('rejects a second call while the flag is true', () => {
    const flag = signal(false);
    expect(beginInFlight(flag)).toBe(true);
    expect(beginInFlight(flag)).toBe(false);
    expect(flag()).toBe(true);
  });
});
