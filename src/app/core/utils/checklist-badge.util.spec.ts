import {
  checklistBadgeCount,
  normalizeOpenChecklistCount,
} from './checklist-badge.util';

describe('normalizeOpenChecklistCount', () => {
  it('returns 0 for invalid values', () => {
    expect(normalizeOpenChecklistCount(undefined)).toBe(0);
    expect(normalizeOpenChecklistCount(-2)).toBe(0);
    expect(normalizeOpenChecklistCount('nope')).toBe(0);
  });

  it('floors a positive count', () => {
    expect(normalizeOpenChecklistCount(3.9)).toBe(3);
  });
});

describe('checklistBadgeCount', () => {
  it('uses the login hint until the personal list is loaded', () => {
    expect(checklistBadgeCount(false, 0, 4)).toBe(4);
  });

  it('uses in-memory pending tasks after the list is loaded', () => {
    expect(checklistBadgeCount(true, 1, 4)).toBe(1);
    expect(checklistBadgeCount(true, 0, 4)).toBe(0);
  });
});
