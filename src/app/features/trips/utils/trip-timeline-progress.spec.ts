import {
  buildTripTimelineProgress,
  isTripTimelineStepReached,
  tripTimelineStepsFromSchedule,
} from './trip-timeline-progress';

describe('trip-timeline-progress', () => {
  const createdAt = '2026-08-18T21:22:00.000Z';
  const loadDate = '2026-08-18T06:00:00.000Z';
  const departure = '2026-08-19T21:21:00.000Z';
  const arrival = '2026-08-20T21:21:00.000Z';
  const completion = '2026-08-21T21:21:00.000Z';

  const steps = tripTimelineStepsFromSchedule({
    createdAt,
    loadDate,
    hasLoadStep: true,
    departureIso: departure,
    arrivalIso: arrival,
    completionIso: completion,
    showEmptyDelivery: false,
    emptyDeliveryIso: null,
  });

  it('treats a timestamp as reached when it is not in the future', () => {
    expect(isTripTimelineStepReached(departure, Date.parse(departure))).toBe(true);
    expect(isTripTimelineStepReached(departure, Date.parse(departure) - 1)).toBe(false);
    expect(isTripTimelineStepReached('', Date.parse(departure))).toBe(false);
  });

  it('marks Programada as current just after creation when Carga is still ahead', () => {
    const pendingLoad = tripTimelineStepsFromSchedule({
      createdAt,
      loadDate: '2026-08-19T06:00:00.000Z',
      hasLoadStep: true,
      departureIso: departure,
      arrivalIso: arrival,
      completionIso: completion,
      showEmptyDelivery: false,
      emptyDeliveryIso: null,
    });
    const progress = buildTripTimelineProgress(pendingLoad, Date.parse(createdAt) + 1);
    expect(progress.current).toBe('programmed');
    expect([...progress.reached]).toEqual(['programmed']);
  });

  it('keeps the marker on Carga until Salida', () => {
    const progress = buildTripTimelineProgress(steps, Date.parse('2026-08-19T12:00:00.000Z'));
    expect(progress.current).toBe('load');
    expect(progress.reached.has('programmed')).toBe(true);
    expect(progress.reached.has('load')).toBe(true);
    expect(progress.reached.has('departure')).toBe(false);
  });

  it('moves the marker to Salida after that date and before Cita cliente', () => {
    const progress = buildTripTimelineProgress(steps, Date.parse('2026-08-19T22:59:00.000Z'));
    expect(progress.current).toBe('departure');
    expect(progress.reached.has('arrival')).toBe(false);
    expect(progress.reached.has('completion')).toBe(false);
  });

  it('advances to Cita cliente and then Llegada origen', () => {
    expect(buildTripTimelineProgress(steps, Date.parse('2026-08-20T22:00:00.000Z')).current).toBe(
      'arrival',
    );
    expect(buildTripTimelineProgress(steps, Date.parse('2026-08-21T22:00:00.000Z')).current).toBe(
      'completion',
    );
  });

  it('skips Carga when the step is not shown', () => {
    const withoutLoad = tripTimelineStepsFromSchedule({
      createdAt,
      loadDate: null,
      hasLoadStep: false,
      departureIso: departure,
      arrivalIso: arrival,
      completionIso: completion,
      showEmptyDelivery: false,
      emptyDeliveryIso: null,
    });
    const progress = buildTripTimelineProgress(
      withoutLoad,
      Date.parse('2026-08-19T12:00:00.000Z'),
    );
    expect(progress.current).toBe('programmed');
    expect(progress.reached.has('load')).toBe(false);
  });

  it('uses Entrega de vacío as current when that date has passed', () => {
    const emptyAt = '2026-08-22T21:50:00.000Z';
    const withEmpty = tripTimelineStepsFromSchedule({
      createdAt,
      loadDate,
      hasLoadStep: true,
      departureIso: departure,
      arrivalIso: arrival,
      completionIso: completion,
      showEmptyDelivery: true,
      emptyDeliveryIso: emptyAt,
    });
    expect(buildTripTimelineProgress(withEmpty, Date.parse('2026-08-22T12:00:00.000Z')).current).toBe(
      'completion',
    );
    expect(buildTripTimelineProgress(withEmpty, Date.parse('2026-08-22T22:00:00.000Z')).current).toBe(
      'empty_delivery',
    );
  });
});
