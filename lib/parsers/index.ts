import { parseNovoBancoRobust } from './novobanco';
import { parseMillennium } from './millennium';
import type { NewTransaction } from '../schema';

export type BankType = 'novobanco' | 'millennium' | 'unknown';

export function detectBank(text: string): BankType {
  if (text.includes('PT50 0007 0011')) return 'novobanco';
  if (text.includes('PT50 0033 0000')) return 'millennium';
  // Fallback: check for bank name mentions
  if (text.toLowerCase().includes('novo banco') || text.toLowerCase().includes('novobanco')) return 'novobanco';
  if (text.toLowerCase().includes('millennium') || text.toLowerCase().includes('millenniumbcp')) return 'millennium';
  return 'unknown';
}

export function parseTransactions(text: string, importBatch: string = ''): {
  transactions: NewTransaction[];
  bank: BankType;
  owner: string;
} {
  const bank = detectBank(text);

  if (bank === 'novobanco') {
    const transactions = parseNovoBancoRobust(text, importBatch);
    return { transactions, bank, owner: 'Rodrigo' };
  }

  if (bank === 'millennium') {
    const transactions = parseMillennium(text, importBatch);
    return { transactions, bank, owner: 'Mariana' };
  }

  return { transactions: [], bank: 'unknown', owner: '' };
}
