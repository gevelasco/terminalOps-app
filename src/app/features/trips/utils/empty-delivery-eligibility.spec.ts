import { canRegisterTripEmptyDelivery } from './empty-delivery-eligibility';

describe('empty-delivery-eligibility', () => {
  const nowMs = Date.parse('2026-08-19T23:00:00.000Z');

  it('allows first-time empty delivery on in-transit trips without a container', () => {
    expect(
      canRegisterTripEmptyDelivery({ status: 'in_transit' }, true, nowMs),
    ).toBe(true);
  });

  it('allows first-time empty delivery on completed trips inside the follow-up window', () => {
    expect(
      canRegisterTripEmptyDelivery(
        { status: 'completed', completedAt: '2026-08-18T12:00:00.000Z' },
        true,
        nowMs,
      ),
    ).toBe(true);
  });

  it('does not require empty delivery on scheduled trips', () => {
    expect(
      canRegisterTripEmptyDelivery({ status: 'scheduled' }, true, nowMs),
    ).toBe(false);
  });

  it('stays optional: write access is still required', () => {
    expect(
      canRegisterTripEmptyDelivery({ status: 'in_transit' }, false, nowMs),
    ).toBe(false);
  });

  it('keeps completed trips locked after the follow-up window', () => {
    expect(
      canRegisterTripEmptyDelivery(
        { status: 'completed', completedAt: '2026-08-01T12:00:00.000Z' },
        true,
        nowMs,
      ),
    ).toBe(false);
  });
});
