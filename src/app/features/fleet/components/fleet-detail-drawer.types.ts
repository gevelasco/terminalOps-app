import type {
  FleetDocumentKind,
  FleetStoredDocument,
} from '@shared/models/logistics.models';

export type FleetDetailDrawerTab = 'ficha' | 'mant' | 'cob';

export type FleetPersistOptions = {
  onSuccess?: () => void;
  /** Usa la respuesta del PATCH y evita GET de lista (p. ej. confirmar pago de póliza). */
  skipListRefresh?: boolean;
  /** Evita overview + listados de flota; el drawer ya tiene el recurso actualizado. */
  skipFleetRefresh?: boolean;
  /**
   * Tras el PATCH, recarga el detalle (GET by id) para hidratar `fleetDocuments`.
   * El listado y a veces el PATCH no incluyen documentos subidos por multipart.
   */
  refreshDetail?: boolean;
  /**
   * Documentos del multipart de esta sección. Se mezclan en el recurso local
   * porque PATCH/GET inmediato suele omitir el archivo recién subido.
   */
  syncedDocuments?: {
    kind: FleetDocumentKind;
    kept: readonly FleetStoredDocument[];
    uploaded: readonly FleetStoredDocument[];
  };
};

export type FleetDetailDrawerStatusBanner = {
  label: string;
  sub?: string;
  mod: string;
};
