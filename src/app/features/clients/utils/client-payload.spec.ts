import { buildClientApiWriteBody } from './client-payload';
import type { Client } from '@shared/models/client.models';

describe('buildClientApiWriteBody deliveries', () => {
  it('sends deliveries array and legacy singular first item', () => {
    const client: Client = {
      id: '1',
      name: 'Agencia',
      deliveries: [
        {
          postalCode: '77560',
          locality: 'Centro',
          cityMunicipality: 'Cancún, Quintana Roo',
          destinationRateId: 'rate-1',
        },
        {
          postalCode: '44100',
          locality: 'Americana',
          cityMunicipality: 'Guadalajara, Jalisco',
        },
      ],
    };
    const body = buildClientApiWriteBody(client);
    expect(body['deliveries']).toEqual([
      {
        postalCode: '77560',
        locality: 'Centro',
        cityMunicipality: 'Cancún, Quintana Roo',
      },
      {
        postalCode: '44100',
        locality: 'Americana',
        cityMunicipality: 'Guadalajara, Jalisco',
      },
    ]);
    expect(body['delivery']).toEqual({
      postalCode: '77560',
      locality: 'Centro',
      cityMunicipality: 'Cancún, Quintana Roo',
    });
  });

  it('falls back to legacy singular delivery', () => {
    const client: Client = {
      id: '1',
      name: 'Acme',
      delivery: { postalCode: '44100', locality: 'Americana' },
    };
    const body = buildClientApiWriteBody(client);
    expect(body['deliveries']).toEqual([{ postalCode: '44100', locality: 'Americana' }]);
    expect(body['delivery']).toEqual({ postalCode: '44100', locality: 'Americana' });
  });
});
