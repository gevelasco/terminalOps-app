import {
  emptyDeliveryOriginalStorageKey,
  readEmptyDeliveryOriginalAt,
  rememberEmptyDeliveryOriginalAt,
  resolveEmptyDeliveryOriginalAt,
} from './empty-delivery-original.util';

describe('empty-delivery-original.util', () => {
  const tripId = 'trip-1';

  beforeEach(() => {
    localStorage.removeItem(emptyDeliveryOriginalStorageKey(tripId));
  });

  it('siembra la primera fecha y no la pisa en actualizaciones', () => {
    rememberEmptyDeliveryOriginalAt(tripId, '2026-08-20T02:00:00.000Z');
    rememberEmptyDeliveryOriginalAt(tripId, '2026-08-20T03:00:00.000Z');

    expect(readEmptyDeliveryOriginalAt(tripId)).toBe('2026-08-20T02:00:00.000Z');
  });

  it('al reabrir, conserva la original aunque la vigente haya cambiado', () => {
    rememberEmptyDeliveryOriginalAt(tripId, '2026-08-20T02:00:00.000Z');

    expect(
      resolveEmptyDeliveryOriginalAt(tripId, '2026-08-20T03:50:00.000Z'),
    ).toBe('2026-08-20T02:00:00.000Z');
  });

  it('siembra la vigente la primera vez que se ve una entrega', () => {
    expect(
      resolveEmptyDeliveryOriginalAt(tripId, '2026-08-20T02:00:00.000Z'),
    ).toBe('2026-08-20T02:00:00.000Z');
    expect(readEmptyDeliveryOriginalAt(tripId)).toBe('2026-08-20T02:00:00.000Z');
  });
});
