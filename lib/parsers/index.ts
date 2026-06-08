import { parseNovoBancoPdf } from './novobanco';
import { parseMillenniumPdf } from './millennium';
import type { NewTransaction } from '../schema';

export type BankType = 'novobanco' | 'millennium' | 'unknown';

export function detectBank(pdfText: string): BankType {
  if (pdfText.includes('PT50 0007 0011')) return 'novobanco';
  if (pdfText.includes('PT50 0033 0000')) return 'millennium';
  if (/novo\s*banco|BESCPTPL/i.test(pdfText)) return 'novobanco';
  if (/millennium|BCOMPTPL/i.test(pdfText)) return 'millennium';
  return 'unknown';
}

export async function parseTransactions(
  buffer: Buffer,
  importBatch: string = ''
): Promise<{ transactions: NewTransaction[]; bank: BankType; owner: string }> {
  // Detect bank from a quick text scan using pdf-parse (fast, just for detection)
  // We use a lightweight regex on the raw buffer for IBAN detection
  const rawText = buffer.toString('latin1');
  const bank = detectBank(rawText);

  if (bank === 'novobanco') {
    const transactions = await parseNovoBancoPdf(buffer, importBatch);
    return { transactions, bank, owner: 'Rodrigo' };
  }

  if (bank === 'millennium') {
    const transactions = await parseMillenniumPdf(buffer, importBatch);
    return { transactions, bank, owner: 'Mariana' };
  }

  return { transactions: [], bank: 'unknown', owner: '' };
}
