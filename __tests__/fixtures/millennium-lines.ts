// Synthetic PdfLine fixture for Millennium BCP statement.
// Column layout expected by parseMillenniumFromLines:
//   dates (2)  x < 110  format M.DD (month first!)
//   desc       x ≈ 114+, no dates
//   debit      x ∈ [250, 400)
//   credit     x ∈ [400, 510)
//   balance    x ≥ 510 (may be split into 2 items)

import type { PdfLine } from '../../lib/parsers/pdf-extract';

function line(y: number, pageNum: number, items: { x: number; str: string }[]): PdfLine {
  return {
    y,
    pageNum,
    items: items.map(i => ({ ...i, y, pageNum })),
    text: items.map(i => i.str).join(' '),
  };
}

export const millenniumLines: PdfLine[] = [
  // Year header
  line(800, 1, [{ x: 10, str: 'EXTRATO DE 2026/01/01 A 2026/01/31' }]),
  // Section header
  line(780, 1, [{ x: 10, str: 'CONTA MILLENNIUM' }]),
  // Column header
  line(760, 1, [
    { x: 10, str: 'DATA LANC.' },
    { x: 114, str: 'DESCRITIVO' },
    { x: 310, str: 'DEBITO' },
    { x: 420, str: 'CREDITO' },
    { x: 520, str: 'SALDO' },
  ]),
  // SALDO INICIAL — should be skipped
  line(740, 1, [
    { x: 57, str: '1.01' },
    { x: 87, str: '1.01' },
    { x: 114, str: 'SALDO INICIAL' },
    { x: 510, str: '500' },
    { x: 540, str: '00' },
  ]),
  // Transaction 1: description line then data line
  // Description (y=720) comes ABOVE data line (y=719)
  line(720, 1, [
    { x: 114, str: 'COMPRA PINGO DOCE ALMADA' },
  ]),
  line(719, 1, [
    { x: 57, str: '3.15' },   // March 15
    { x: 87, str: '3.15' },
    { x: 310, str: '67.80' }, // debit
    { x: 510, str: '432' },   // balance (split)
    { x: 550, str: '20' },
  ]),
  // Transaction 2: credit (salary)
  line(700, 1, [
    { x: 114, str: 'ORDENADO EMPRESA ABC' },
  ]),
  line(699, 1, [
    { x: 57, str: '3.25' },
    { x: 87, str: '3.25' },
    { x: 420, str: '2000.00' }, // credit
    { x: 510, str: '2' },       // balance split: 2 + 432.20
    { x: 550, str: '432.20' },
  ]),
  // Transaction 3: debit with large amount (thousands separator space)
  line(680, 1, [
    { x: 114, str: 'TRF SEPA RENDA APARTAMENTO' },
  ]),
  line(679, 1, [
    { x: 57, str: '3.28' },
    { x: 87, str: '3.30' },    // different value date
    { x: 310, str: '1' },      // debit split: 1 + 100.00 = 1100.00
    { x: 340, str: '100.00' },
    { x: 510, str: '1' },
    { x: 550, str: '332.20' },
  ]),
  // Section end
  line(600, 1, [{ x: 10, str: 'APLICACOES FINANCEIRAS' }]),
];
