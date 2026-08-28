import type { Equipment, Unit } from '@shared/models/logistics.models';
import {
  tripAssignedUnitId,
  tripEquipmentDisplayAt,
  tripEquipmentPlateAt,
  tripUnitDisplayCode,
} from './trip-display-labels';

function equipment(partial: Partial<Equipment> & Pick<Equipment, 'id'>): Equipment {
  return {
    name: 'Alias equipo',
    serialNumber: 'SN-1',
    lastServiceDate: '',
    unitId: '1',
    ...partial,
  } as Equipment;
}

function unit(partial: Partial<Unit> & Pick<Unit, 'id'>): Unit {
  return {
    plate: '81-AA-9K',
    trailerBrandAbbr: 'HYU',
    trailerYear: '2021',
    ...partial,
  } as Unit;
}

describe('tripEquipmentDisplayAt', () => {
  it('builds MARCA-AÑO-PLACA from catalog instead of alias or id', () => {
    expect(
      tripEquipmentDisplayAt(
        {
          equipment: ['Alias equipo'],
          equipmentIds: ['3'],
        },
        0,
        [
          equipment({
            id: '3',
            trailerBrandAbbr: 'PET',
            trailerYear: '2017',
            plate: 'REM-01',
          }),
        ],
      ),
    ).toBe('PET-2017-REM-01');
  });

  it('falls back to equipment label when catalog is unavailable', () => {
    expect(
      tripEquipmentDisplayAt(
        {
          equipment: ['PET-2017-REM-01'],
          equipmentIds: ['3'],
        },
        0,
      ),
    ).toBe('PET-2017-REM-01');
  });

  it('falls back to equipment id when label is missing', () => {
    expect(
      tripEquipmentDisplayAt(
        {
          equipment: [],
          equipmentIds: ['3'],
        },
        0,
      ),
    ).toBe('3');
  });
});

describe('tripEquipmentPlateAt', () => {
  it('returns the plate from the trip payload without a catalog', () => {
    expect(
      tripEquipmentPlateAt({ equipmentIds: ['3'], equipmentPlates: ['REM-01'] }, 0),
    ).toBe('REM-01');
  });

  it('returns the plate from the catalog', () => {
    expect(
      tripEquipmentPlateAt(
        { equipmentIds: ['3'] },
        0,
        [
          equipment({
            id: '3',
            plate: 'REM-01',
          }),
        ],
      ),
    ).toBe('REM-01');
  });

  it('returns dash when the catalog has no plate', () => {
    expect(tripEquipmentPlateAt({ equipmentIds: ['3'] }, 0, [equipment({ id: '3' })])).toBe(
      '—',
    );
  });
});

describe('tripUnitDisplayCode', () => {
  it('uses the operational code from the trip', () => {
    expect(
      tripUnitDisplayCode({ unitOperationalCode: 'HYU-2021-81-AA-9K', unitId: '8' }),
    ).toBe('HYU-2021-81-AA-9K');
  });

  it('formats the live unit instead of Sin unidad', () => {
    expect(
      tripUnitDisplayCode({ unitId: '8' }, undefined, unit({ id: '8' })),
    ).toBe('HYU-2021-81-AA-9K');
  });

  it('looks up the catalog when the operational code is missing', () => {
    expect(
      tripUnitDisplayCode({ unitId: '8' }, [unit({ id: '8' })]),
    ).toBe('HYU-2021-81-AA-9K');
  });

  it('keeps the unit id instead of Sin unidad when the catalog is missing', () => {
    expect(tripUnitDisplayCode({ unitId: '8' })).toBe('8');
  });

  it('returns dash when the trip has no unit', () => {
    expect(tripUnitDisplayCode({ unitId: '' })).toBe('—');
  });
});

describe('tripAssignedUnitId', () => {
  it('prefers the trip unit id', () => {
    expect(
      tripAssignedUnitId(
        { unitId: '8', equipmentIds: ['3'] },
        [equipment({ id: '3', unitId: '99' })],
      ),
    ).toBe('8');
  });

  it('falls back to the equipment hitch when the trip unit id is empty', () => {
    expect(
      tripAssignedUnitId(
        { unitId: '', equipmentIds: ['3'] },
        [equipment({ id: '3', unitId: '8' })],
      ),
    ).toBe('8');
  });
});

