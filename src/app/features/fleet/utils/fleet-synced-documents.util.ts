import type {
  FleetDocumentKind,
  FleetStoredDocument,
} from '@shared/models/logistics.models';

export type SyncedFleetDocuments = {
  kind: FleetDocumentKind;
  kept: readonly FleetStoredDocument[];
  uploaded: readonly FleetStoredDocument[];
};

type FleetMetaWithDocuments = {
  fleetDocuments?: FleetStoredDocument[];
};

/**
 * The PATCH (and sometimes the GET right after multipart upload) omits the
 * newly stored files. Rebuild `fleetDocuments` from the edit session so the
 * drawer list updates without a full page reload.
 */
export function applySyncedFleetDocuments<
  T extends { fleetMeta?: FleetMetaWithDocuments },
>(saved: T, previous: T | null | undefined, synced: SyncedFleetDocuments): T {
  return {
    ...saved,
    fleetMeta: {
      ...(previous?.fleetMeta ?? {}),
      ...(saved.fleetMeta ?? {}),
      fleetDocuments: mergeSyncedFleetDocuments(
        saved.fleetMeta?.fleetDocuments,
        previous?.fleetMeta?.fleetDocuments,
        synced,
      ),
    },
  };
}

export function mergeSyncedFleetDocuments(
  savedDocs: readonly FleetStoredDocument[] | undefined,
  previousDocs: readonly FleetStoredDocument[] | undefined,
  synced: SyncedFleetDocuments,
): FleetStoredDocument[] {
  const otherKinds = unionDocumentsById(
    [...(previousDocs ?? []), ...(savedDocs ?? [])].filter(
      (doc) => doc.documentKind !== synced.kind,
    ),
  );
  const kindDocs = unionDocumentsById(
    [...synced.kept, ...synced.uploaded]
      .filter(
        (doc) =>
          Number.isFinite(doc.id) &&
          doc.id > 0 &&
          (doc.documentKind === synced.kind || !doc.documentKind),
      )
      .map((doc) => ({ ...doc, documentKind: synced.kind })),
  );
  return [...otherKinds, ...kindDocs];
}

function unionDocumentsById(
  docs: readonly FleetStoredDocument[],
): FleetStoredDocument[] {
  const byId = new Map<number, FleetStoredDocument>();
  for (const doc of docs) {
    if (!Number.isFinite(doc.id) || doc.id <= 0) {
      continue;
    }
    byId.set(doc.id, doc);
  }
  return [...byId.values()];
}
