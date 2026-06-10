import { describe, it, expect } from 'vitest';
import { isDuplicate, similarity, filterDuplicates } from '../lib/duplicate';
import type { NewTransaction } from '../lib/schema';

function makeTx(overrides: Partial<NewTransaction> = {}): NewTransaction {
  return {
    id: '',
    date: '2026-01-15',
    value_date: '2026-01-15',
    description: 'COMPRA CONTINENTE MODELO',
    debit: 45.30,
    credit: null,
    balance: null,
    bank: 'novobanco',
    owner: 'Rodrigo',
    category: null,
    subcategory: null,
    status: 'pending',
    import_batch: 'batch1',
    created_at: '',
    ...overrides,
  };
}

describe('similarity', () => {
  it('returns 1 for identical strings', () => {
    expect(similarity('abc', 'abc')).toBe(1);
  });

  it('returns < 1 for different strings', () => {
    expect(similarity('abc', 'xyz')).toBeLessThan(1);
  });

  it('is case-insensitive', () => {
    expect(similarity('ABC', 'abc')).toBe(1);
  });
});

describe('isDuplicate', () => {
  it('detects exact match as duplicate', () => {
    const a = makeTx();
    const b = makeTx();
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('different date is not a duplicate', () => {
    const a = makeTx({ date: '2026-01-15' });
    const b = makeTx({ date: '2026-01-16' });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('different amount is not a duplicate', () => {
    const a = makeTx({ debit: 45.30 });
    const b = makeTx({ debit: 45.31 });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('very similar description is still a duplicate', () => {
    const a = makeTx({ description: 'COMPRA CONTINENTE MODELO LX' });
    const b = makeTx({ description: 'COMPRA CONTINENTE MODELO LX ' });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('clearly different description on same date+amount is not a duplicate', () => {
    const a = makeTx({ description: 'COMPRA CONTINENTE MODELO' });
    const b = makeTx({ description: 'TRANSFERENCIA RECEBIDA XYZ' });
    expect(isDuplicate(a, b)).toBe(false);
  });
});

describe('filterDuplicates', () => {
  it('removes exact duplicates against existing', () => {
    const existing = [makeTx()];
    const incoming = [makeTx()];
    const { unique, duplicateCount } = filterDuplicates(incoming, existing);
    expect(unique).toHaveLength(0);
    expect(duplicateCount).toBe(1);
  });

  it('keeps non-duplicate incoming transactions', () => {
    const existing = [makeTx({ date: '2026-01-10', description: 'OTHER' })];
    const incoming = [makeTx()];
    const { unique, duplicateCount } = filterDuplicates(incoming, existing);
    expect(unique).toHaveLength(1);
    expect(duplicateCount).toBe(0);
  });

  it('deduplicates within the incoming batch itself', () => {
    const existing: NewTransaction[] = [];
    const incoming = [makeTx(), makeTx()];
    const { unique, duplicateCount } = filterDuplicates(incoming, existing);
    expect(unique).toHaveLength(1);
    expect(duplicateCount).toBe(1);
  });
});
