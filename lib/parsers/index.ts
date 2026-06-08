import { extractPdfLines, type PdfLine } from './pdf-extract';
import type { NewTransaction } from '../schema';

export type BankType = 'novobanco' | 'millennium' | 'unknown';

function detectBankFromText(text: string): BankType {
  if (text.includes('PT50 0007 0011') || /BESCPTPL/i.test(text) || /novobanco/i.test(text)) {
    return 'novobanco';
  }
  if (text.includes('PT50 0033 0000') || /BCOMPTPL/i.test(text) || /millenniumbcp/i.test(text)) {
    return 'millennium';
  }
  return 'unknown';
}

// Parse NovoBanco using already-extracted lines (avoids double PDF extraction)
async function parseNovoBancoLines(lines: PdfLine[], importBatch: string): Promise<NewTransaction[]> {
  const { parseNovoBancoFromLines } = await import('./novobanco');
  return parseNovoBancoFromLines(lines, importBatch);
}

async function parseMillenniumLines(lines: PdfLine[], importBatch: string): Promise<NewTransaction[]> {
  const { parseMillenniumFromLines } = await import('./millennium');
  return parseMillenniumFromLines(lines, importBatch);
}

export async function parseTransactions(
  buffer: Buffer,
  importBatch: string = ''
): Promise<{ transactions: NewTransaction[]; bank: BankType; owner: string }> {
  // Extract lines once with pdfjs-dist (handles custom-encoded fonts)
  const lines = await extractPdfLines(buffer);
  const fullText = lines.map((l) => l.text).join(' ');

  const bank = detectBankFromText(fullText);

  if (bank === 'novobanco') {
    const transactions = await parseNovoBancoLines(lines, importBatch);
    return { transactions, bank, owner: 'Rodrigo' };
  }

  if (bank === 'millennium') {
    const transactions = await parseMillenniumLines(lines, importBatch);
    return { transactions, bank, owner: 'Mariana' };
  }

  return { transactions: [], bank: 'unknown', owner: '' };
}
