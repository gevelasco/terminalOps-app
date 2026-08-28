import { operatorDaysWithoutManeuver } from './operator-days-without-maneuver';

describe('operatorDaysWithoutManeuver', () => {
  it('is 0 while the operator is on an active trip', () => {
    expect(
      operatorDaysWithoutManeuver('2026-08-01', 'in_use', new Date('2026-08-20T12:00:00Z')),
    ).toBe(0);
    expect(
      operatorDaysWithoutManeuver(
        '2026-08-01',
        'scheduled',
        new Date('2026-08-20T12:00:00Z'),
      ),
    ).toBe(0);
  });

  it('is 0 without a completed maneuver date', () => {
    expect(operatorDaysWithoutManeuver(undefined, 'available')).toBe(0);
    expect(operatorDaysWithoutManeuver('', 'available')).toBe(0);
  });

  it('does not fall back to hire date', () => {
    expect(operatorDaysWithoutManeuver(undefined, 'available')).toBe(0);
  });

  it('counts calendar days from the last completed maneuver', () => {
    expect(
      operatorDaysWithoutManeuver(
        '2026-08-20',
        'available',
        new Date('2026-08-21T18:00:00.000Z'),
      ),
    ).toBe(1);
  });
});
