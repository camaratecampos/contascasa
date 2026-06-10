import { describe, it, expect } from 'vitest';
import { parseNovoBancoFromLines } from '../../lib/parsers/novobanco';
import { novoBancoLines } from '../fixtures/novobanco-lines';

const BATCH = 'test-batch';

describe('parseNovoBancoFromLines', () => {
  it('returns the correct number of transactions', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    // 4 transactions (SALDO ANTERIOR skipped)
    expect(txs).toHaveLength(4);
  });

  it('parses a debit transaction correctly', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    const tx = txs[0];
    expect(tx.date).toBe('2026-01-03');
    expect(tx.debit).toBeCloseTo(45.30);
    expect(tx.credit).toBeNull();
    expect(tx.description).toContain('CONTINENTE');
    expect(tx.bank).toBe('novobanco');
    expect(tx.owner).toBe('Rodrigo');
  });

  it('parses a credit transaction correctly', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    const tx = txs[1];
    expect(tx.date).toBe('2026-01-05');
    expect(tx.credit).toBeCloseTo(2500.00);
    expect(tx.debit).toBeNull();
  });

  it('appends continuation lines to description', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    const tx = txs[2]; // MB WAY with continuation "RESTAURANTE LISBOA"
    expect(tx.description).toContain('MB WAY');
    expect(tx.description).toContain('RESTAURANTE LISBOA');
  });

  it('uses the second date as value_date when different', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    const tx = txs[2]; // 10.01.26 / 11.01.26
    expect(tx.date).toBe('2026-01-10');
    expect(tx.value_date).toBe('2026-01-11');
  });

  it('skips SALDO ANTERIOR', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    const hasSaldoAnterior = txs.some(tx => /saldo anterior/i.test(tx.description));
    expect(hasSaldoAnterior).toBe(false);
  });

  it('stops at section-end marker', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    // No transaction after the POUPANÇA line
    expect(txs).toHaveLength(4);
  });

  it('sets import_batch on all transactions', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    expect(txs.every(tx => tx.import_batch === BATCH)).toBe(true);
  });

  it('sets status pending on all transactions', async () => {
    const txs = await parseNovoBancoFromLines(novoBancoLines, BATCH);
    expect(txs.every(tx => tx.status === 'pending')).toBe(true);
  });
});
