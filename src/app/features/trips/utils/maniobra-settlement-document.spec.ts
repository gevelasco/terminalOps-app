import {
  buildManiobraSettlementDocument,
  escapeSettlementHtml,
  settlementDocumentFileTitle,
  settlementDocumentSheetMark,
} from './maniobra-settlement-document';

const generatedAt = new Date(2026, 7, 19, 12, 0, 0);

describe('maniobra-settlement-document', () => {
  it('builds a file title safe for the print dialog', () => {
    expect(settlementDocumentFileTitle('CHI-0006', generatedAt)).toBe(
      'Liquidacion_CHI-0006_20260819',
    );
    expect(settlementDocumentSheetMark('CN-0007', generatedAt)).toBe(
      'Liquidacion CN-0007 19/08/2026',
    );
  });

  it('escapes HTML in free-text fields', () => {
    expect(escapeSettlementHtml('<script>x</script>')).toBe(
      '&lt;script&gt;x&lt;/script&gt;',
    );
  });

  it('renders maneuver details, economics and expenses for audit filing', () => {
    const doc = buildManiobraSettlementDocument({
      companyName: 'Acme Logistics',
      companyTagline: 'Transporte de contenedores',
      companyLogoDataUrl: null,
      generatedAt,
      generatedBy: 'Ana Torres',
      maneuverCode: 'CHI-0006',
      statusLabel: 'Completada',
      completedAtLabel: '23/07/26, 6:05 a.m.',
      identification: [{ label: 'Cliente', value: 'Chinoin <test>' }],
      route: [{ label: 'Origen', value: 'Manzanillo' }],
      cargo: [{ label: 'Contenedor', value: '40 HC' }],
      assignmentOperator: [
        { label: 'Operador', value: 'Juan Pérez' },
        { label: 'No. de licencia', value: 'SLP0017953' },
        { label: 'Vencimiento de licencia', value: '15 de enero de 2028' },
      ],
      assignment: [{ label: 'Unidad', value: 'HYU-2021-81-AA-9K' }],
      billing: [{ label: 'Método de pago', value: 'Transferencia' }],
      charged: 30_000,
      spent: 12_189,
      margin: 17_811,
      marginPct: 59,
      paymentStatusLabel: 'Pagada',
      expenses: [
        {
          label: 'Diesel',
          detail: 'Diesel 200 L — maniobra CHI-0006',
          incurredAtLabel: '25/06/26, 11:07 a.m.',
          amount: 5_989,
        },
      ],
    });

    expect(doc.fileTitle).toBe('Liquidacion_CHI-0006_20260819');
    expect(doc.html).not.toContain('Liquidación de maniobra');
    expect(doc.html).not.toContain('Expediente de auditoría');
    expect(doc.html).not.toContain('Emitido:');
    expect(doc.html).not.toContain('Liquidacion_CHI-0006');
    expect(doc.html).toContain('Completada:');
    expect(doc.html).toContain('23/07/26, 6:05 a.m.');
    expect(doc.html).toContain('CHI-0006');
    expect(doc.html).toContain('Acme Logistics');
    expect(doc.html).toContain('Chinoin &lt;test&gt;');
    expect(doc.html).not.toContain('Chinoin <test>');
    expect(doc.html).toContain('Se cobró');
    expect(doc.html).toContain('Se gastó');
    expect(doc.html).toContain('Utilidad');
    expect(doc.html).toContain('Margen');
    expect(doc.html).toContain('Juan Pérez');
    expect(doc.html).toContain('fields--3');
    expect(doc.html).toContain('SLP0017953');
    expect(doc.html).toContain('sheet--economics');
    expect(doc.html).toContain('sheet-foot');
    expect(doc.html).toContain('Liquidacion CHI-0006 19/08/2026');
    expect(doc.html).toContain('@page { size: A4; margin: 0; }');
    expect(doc.html).not.toContain('Firmas para archivo físico');
    expect(doc.html).not.toContain('Documento generado');
    expect(doc.html).not.toContain('Ana Torres');
    expect(doc.html).not.toContain('Elaboró');
  });
});
