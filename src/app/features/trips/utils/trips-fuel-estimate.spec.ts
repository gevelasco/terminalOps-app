import { buildFuelEstimateRequest } from './trips-fuel-estimate';

describe('buildFuelEstimateRequest', () => {
  const coords = { lat: 19.4, lon: -99.1 };

  it('arma la petición en cuanto hay km de ida, aunque el peso esté vacío', () => {
    const req = buildFuelEstimateRequest({
      distanceKm: 714,
      operationType: 'sencillo',
      loadType: 'vacio',
      containerType: 'na',
      approximateWeightTons: '',
      originCoords: coords,
      destinationCoords: coords,
    });

    expect(req).not.toBeNull();
    expect(req?.distanceKm).toBe(714);
    expect(req?.approximateWeightTons).toBe(0);
  });

  it('no arma petición sin km de ida', () => {
    expect(
      buildFuelEstimateRequest({
        distanceKm: null,
        operationType: 'sencillo',
        loadType: 'vacio',
        containerType: 'na',
        approximateWeightTons: '18',
        originCoords: coords,
        destinationCoords: coords,
      }),
    ).toBeNull();
  });
});
