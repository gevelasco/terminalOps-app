import {
  fleetModelTwoYearExemptionEndYmd,
  isWithinFleetModelTwoYearExemption,
} from './fleet-verification-exemption.util';

describe('fleet-verification-exemption.util', () => {
  it('ends exemption on 1 Jan of model year + 2', () => {
    expect(fleetModelTwoYearExemptionEndYmd('2026')).toBe('2028-01-01');
  });

  it('is exempt until the day before the end date', () => {
    expect(isWithinFleetModelTwoYearExemption('2026', new Date(2026, 7, 28))).toBe(
      true,
    );
    expect(isWithinFleetModelTwoYearExemption('2024', new Date(2026, 7, 28))).toBe(
      false,
    );
  });
});
