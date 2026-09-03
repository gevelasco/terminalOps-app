import { destinationPrefillFromClient } from './trips-new-drawer-route-prefill';
import type { Client } from '@shared/models/client.models';

describe('destinationPrefillFromClient', () => {
  it('returns null when the client has no valid deliveries', () => {
    const client: Client = { id: '1', name: 'Acme' };
    expect(destinationPrefillFromClient(client)).toBeNull();
  });

  it('auto-fills when there is exactly one valid delivery', () => {
    const client: Client = {
      id: '1',
      name: 'Acme',
      deliveries: [
        {
          postalCode: '77560',
          locality: 'Centro',
          cityMunicipality: 'Cancún, Quintana Roo',
          latitude: 21.1,
          longitude: -86.8,
        },
      ],
    };
    expect(destinationPrefillFromClient(client)).toEqual(
      jasmine.objectContaining({ postalCode: '77560', locality: 'Centro' }),
    );
  });

  it('does not auto-fill when there are multiple valid deliveries', () => {
    const client: Client = {
      id: '1',
      name: 'Agencia',
      deliveries: [
        { postalCode: '77560', locality: 'Centro' },
        { postalCode: '44100', locality: 'Americana' },
      ],
    };
    expect(destinationPrefillFromClient(client)).toBeNull();
  });
});
