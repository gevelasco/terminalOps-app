import {
  applySyncedFleetDocuments,
  mergeSyncedFleetDocuments,
} from './fleet-synced-documents.util';

describe('fleet-synced-documents.util', () => {
  const policy = { id: 1, fileName: 'poliza.pdf', documentKind: 'policy' };
  const kept = { id: 2, fileName: 'factura.pdf', documentKind: 'ownership' };
  const uploaded = { id: 9, fileName: 'Documento de CAAT.pdf', documentKind: 'ownership' };

  it('keeps other kinds and replaces the synced kind with kept + uploaded', () => {
    expect(
      mergeSyncedFleetDocuments(
        [policy, kept],
        [policy],
        { kind: 'ownership', kept: [kept], uploaded: [uploaded] },
      ),
    ).toEqual([policy, kept, uploaded]);
  });

  it('still shows the uploaded file when the PATCH/GET payload omitted it', () => {
    expect(
      mergeSyncedFleetDocuments([], [policy], {
        kind: 'ownership',
        kept: [],
        uploaded: [uploaded],
      }),
    ).toEqual([policy, uploaded]);
  });

  it('drops ownership files that were removed in the edit session', () => {
    const removed = { id: 3, fileName: 'viejo.pdf', documentKind: 'ownership' };
    expect(
      mergeSyncedFleetDocuments([policy, removed], [policy, removed], {
        kind: 'ownership',
        kept: [],
        uploaded: [uploaded],
      }),
    ).toEqual([policy, uploaded]);
  });

  it('applies the merge onto the saved resource fleetMeta', () => {
    const next = applySyncedFleetDocuments(
      { id: 'u1', fleetMeta: { trailerTenureMode: 'owned' as const } },
      { id: 'u1', fleetMeta: { fleetDocuments: [policy] } },
      { kind: 'ownership', kept: [], uploaded: [uploaded] },
    );
    expect(next.fleetMeta?.trailerTenureMode).toBe('owned');
    expect(next.fleetMeta?.fleetDocuments).toEqual([policy, uploaded]);
  });
});
