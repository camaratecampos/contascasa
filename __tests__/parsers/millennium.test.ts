import { describe, it, expect } from 'vitest';
import { parseMillenniumFromLines } from '../../lib/parsers/millennium';
import { millenniumLines } from '../fixtures/millennium-lines';

const BATCH = 'test-batch';

describe('parseMillenniumFromLines', () => {
  it('returns the correct number of transactions', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    // 3 transactions (SALDO INICIAL skipped)
    expect(txs).toHaveLength(3);
  });

  it('extracts year from EXTRATO header', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    expect(txs.every(tx => tx.date.startsWith('2026'))).toBe(true);
  });

  it('parses date in M.DD format (month-first)', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const tx = txs[0]; // "3.15" → March 15
    expect(tx.date).toBe('2026-03-15');
  });

  it('uses different value_date when present', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const tx = txs[2]; // data line has 3.28 / 3.30
    expect(tx.date).toBe('2026-03-28');
    expect(tx.value_date).toBe('2026-03-30');
  });

  it('parses a debit transaction correctly', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const tx = txs[0]; // PINGO DOCE, debit 67.80
    expect(tx.debit).toBeCloseTo(67.80);
    expect(tx.credit).toBeNull();
    expect(tx.description).toContain('PINGO DOCE');
    expect(tx.bank).toBe('millennium');
    expect(tx.owner).toBe('Mariana');
  });

  it('parses a credit transaction correctly', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const tx = txs[1]; // ORDENADO, credit 2000.00
    expect(tx.credit).toBeCloseTo(2000.00);
    expect(tx.debit).toBeNull();
    expect(tx.description).toContain('ORDENADO');
  });

  it('joins split amount tokens (e.g. "1" + "100.00" = 1100)', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const tx = txs[2]; // TRF RENDA: "1" + "100.00" → 1100.00
    expect(tx.debit).toBeCloseTo(1100.00);
  });

  it('skips SALDO INICIAL lines', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    const hasSaldo = txs.some(tx => /saldo/i.test(tx.description));
    expect(hasSaldo).toBe(false);
  });

  it('stops at APLICACOES FINANCEIRAS section', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    expect(txs).toHaveLength(3);
  });

  it('sets import_batch on all transactions', async () => {
    const txs = await parseMillenniumFromLines(millenniumLines, BATCH);
    expect(txs.every(tx => tx.import_batch === BATCH)).toBe(true);
  });
});
