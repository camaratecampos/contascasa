// Synthetic PdfLine fixture that mimics a real NovoBanco statement extract.
// x/y positions match the column layout expected by parseNovoBancoFromLines:
//   dates     x ≈ 10–80
//   desc      x ≈ 100–300
//   debit     x ≈ 351–415
//   credit    x ≈ 415–490
//   balance   x ≈ 490+

import type { PdfLine } from '../../lib/parsers/pdf-extract';

function line(y: number, pageNum: number, items: { x: number; str: string }[]): PdfLine {
  return {
    y,
    pageNum,
    items: items.map(i => ({ ...i, y, pageNum })),
    text: items.map(i => i.str).join(' '),
  };
}

export const novoBancoLines: PdfLine[] = [
  // Section header
  line(800, 1, [{ x: 10, str: 'CONTA 360°' }, { x: 80, str: '-' }, { x: 100, str: 'DO' }]),
  // Column header row — used to calibrate thresholds
  line(760, 1, [
    { x: 10, str: 'Data' },
    { x: 100, str: 'Descrição' },
    { x: 355, str: 'Débito' },
    { x: 420, str: 'Crédito' },
    { x: 492, str: 'Saldo' },
  ]),
  // SALDO ANTERIOR — should be skipped
  line(740, 1, [
    { x: 10, str: '01.01.26' },
    { x: 67, str: '01.01.26' },
    { x: 100, str: 'SALDO ANTERIOR' },
    { x: 492, str: '1.234,56' },
  ]),
  // Transaction 1: debit — Supermercado Continente
  line(720, 1, [
    { x: 10, str: '03.01.26' },
    { x: 67, str: '03.01.26' },
    { x: 100, str: 'COMPRA CONTINENTE MODELO' },
    { x: 360, str: '45,30' },
    { x: 492, str: '1.189,26' },
  ]),
  // Transaction 2: credit — Salary
  line(700, 1, [
    { x: 10, str: '05.01.26' },
    { x: 67, str: '05.01.26' },
    { x: 100, str: 'TRANSFERENCIA RECEBIDA EMPRESA XYZ' },
    { x: 425, str: '2.500,00' },
    { x: 492, str: '3.689,26' },
  ]),
  // Transaction 3: debit with multi-line description
  line(680, 1, [
    { x: 10, str: '10.01.26' },
    { x: 67, str: '11.01.26' },
    { x: 100, str: 'MB WAY PAGAMENTO' },
    { x: 360, str: '12,50' },
    { x: 492, str: '3.676,76' },
  ]),
  // Continuation line for transaction 3
  line(668, 1, [
    { x: 109, str: 'RESTAURANTE LISBOA' },
  ]),
  // Transaction 4: debit — should survive the Micro Poupança noise filter
  line(650, 1, [
    { x: 10, str: '15.01.26' },
    { x: 67, str: '15.01.26' },
    { x: 100, str: 'COMPRA FARMACIA SAUDE' },
    { x: 360, str: '8,75' },
    { x: 492, str: '3.668,01' },
  ]),
  // Section end marker
  line(600, 1, [{ x: 10, str: 'CONTA 360° POUPANÇA' }]),
];
