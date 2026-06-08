import { extractPdfLines, type PdfLine } from './pdf-extract';
import type { NewTransaction } from '../schema';

// Millennium amounts use period as decimal: "1 042.47" or "86.04"
// Saldo is split into two items: "3" + "303.78" → 3303.78
function parseMillenniumAmount(parts: string[]): number {
  // Join all parts, remove spaces, parse as float
  const joined = parts.join('').replace(/\s/g, '');
  return parseFloat(joined);
}

// Millennium format: M.DD (e.g. "5.04" = May 4th, "12.31" = Dec 31st)
function formatDate(monthDay: string, year: number): string {
  const [m, d] = monthDay.split('.');
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function extractYear(lines: PdfLine[]): number {
  for (const line of lines) {
    // "EXTRATO DE YYYY/MM/DD A YYYY/MM/DD"
    const m = line.text.match(/EXTRATO\s+DE\s+(\d{4})\/\d{2}\/\d{2}/i);
    if (m) return parseInt(m[1]);
    const m2 = line.text.match(/N\.\s+(\d{4})\/(\d{3})/);
    if (m2) return parseInt(m2[1]);
  }
  return new Date().getFullYear();
}

// x-column thresholds for Millennium:
// DEBITO: x in [290, 400)
// CREDITO: x in [400, 510)
// SALDO: x >= 510
const DEBIT_MAX_X = 400;
const CREDIT_MAX_X = 510;

function parseMillenniumDataLine(items: PdfLine['items']): {
  date1: string;
  date2: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
} | null {
  // Data line: two dates at x≈57 and x≈87, then amounts
  const dateItems = items.filter((i) => i.x < 110 && /^\d{1,2}\.\d{2}$/.test(i.str.trim()));
  if (dateItems.length < 2) return null;

  const date1 = dateItems[0].str.trim();
  const date2 = dateItems[1].str.trim();

  // Numeric items (not dates)
  const numItems = items.filter(
    (i) => i.x >= 250 && /^[\d.]+$/.test(i.str.trim().replace(/\s/g, ''))
  );

  const debitParts: string[] = [];
  const creditParts: string[] = [];
  const balanceParts: string[] = [];

  for (const item of numItems) {
    if (item.x < DEBIT_MAX_X) {
      debitParts.push(item.str.trim());
    } else if (item.x < CREDIT_MAX_X) {
      creditParts.push(item.str.trim());
    } else {
      balanceParts.push(item.str.trim());
    }
  }

  const debit = debitParts.length > 0 ? parseMillenniumAmount(debitParts) : null;
  const credit = creditParts.length > 0 ? parseMillenniumAmount(creditParts) : null;
  const balance = balanceParts.length > 0 ? parseMillenniumAmount(balanceParts) : null;

  // Must have at least balance
  if (balance === null && debit === null && credit === null) return null;

  return { date1, date2, debit, credit, balance };
}

const STOP_SECTIONS = [
  /APLICAC[OÕ]ES\s+FINANCEIRAS/i,
  /CARTEIRA\s+DE\s+SEGUROS/i,
  /DEPOSITOS\s+A\s+PRAZO/i,
  /RESUMO\s+DO\s+EXTRATO/i,
];

export async function parseMillenniumPdf(buffer: Buffer, importBatch: string): Promise<NewTransaction[]> {
  const lines = await extractPdfLines(buffer);
  const year = extractYear(lines);
  const transactions: NewTransaction[] = [];

  let inSection = false;

  // In Millennium, the description line (y=N) comes just above its data line (y=N-0.5 or N-1)
  // We pair them by adjacency: description line has items starting at x≈114,
  // data line has date items at x≈57.
  // Strategy: collect all lines in the section, then pair them.

  const sectionLines: PdfLine[] = [];

  for (const line of lines) {
    if (!inSection) {
      if (/CONTA\s+MILLENNIUM/i.test(line.text)) {
        inSection = true;
      }
      continue;
    }

    if (STOP_SECTIONS.some((p) => p.test(line.text))) {
      inSection = false;
      break;
    }

    sectionLines.push(line);
  }

  // Process section lines: pair each description line with its data line
  // A "data line" has two date items at x < 110
  // A "description line" has items starting at x ≈ 114 without dates at x < 110

  // Build index: for each data line, find the description line just above it
  // (same page, y slightly higher = larger y value since y decreases top to bottom?
  //  Actually in pdfjs, y increases from bottom of page. So top of page has higher y.)
  // Description line y > data line y by ~0.5–1 unit, both on same page.

  // Group lines by page
  const pageGroups = new Map<number, PdfLine[]>();
  for (const line of sectionLines) {
    if (!pageGroups.has(line.pageNum)) pageGroups.set(line.pageNum, []);
    pageGroups.get(line.pageNum)!.push(line);
  }

  for (const [, pgLines] of [...pageGroups.entries()].sort((a, b) => a[0] - b[0])) {
    // Sort by y descending (top of page first = higher y values first in pdfjs)
    pgLines.sort((a, b) => b.y - a.y);

    for (let i = 0; i < pgLines.length; i++) {
      const line = pgLines[i];

      // Skip section headers, totals, SALDO lines
      if (
        /SALDO\s+(INICIAL|FINAL)/i.test(line.text) ||
        /DATA\s+LANC/i.test(line.text) ||
        /DESCRITIVO/i.test(line.text) ||
        /MOEDA:\s+EUR/i.test(line.text) ||
        /EXTRATO\s+DE/i.test(line.text) ||
        /^N\.\s+\d+/i.test(line.text.trim()) ||
        /^CONTA\s+MILLENNIUM/i.test(line.text.trim())
      ) {
        continue;
      }

      // Check if this is a data line (has 2 dates at x < 110)
      const dateItems = line.items.filter(
        (i) => i.x < 110 && /^\d{1,2}\.\d{2}$/.test(i.str.trim())
      );

      if (dateItems.length >= 2) {
        // This is a data line — find description line just above it
        // The description line should be the previous non-data line on this page
        // with items starting at x ≈ 114
        let description = '';
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prevLine = pgLines[j];
          // Description line: items start at x ≥ 100, no dates at x < 110
          const prevDateItems = prevLine.items.filter(
            (pi) => pi.x < 110 && /^\d{1,2}\.\d{2}$/.test(pi.str.trim())
          );
          if (prevDateItems.length === 0) {
            const prevText = prevLine.items
              .filter((pi) => pi.x >= 100 && !/^\d+$/.test(pi.str.trim()))
              .map((pi) => pi.str)
              .join(' ')
              .trim();
            if (
              prevText.length > 2 &&
              !/(SALDO|DATA|DEBITO|CREDITO|MOEDA|EXTRATO|CONTA)/i.test(prevText)
            ) {
              description = prevText;
              break;
            }
          }
        }

        if (!description || description.length < 2) continue;

        const parsed = parseMillenniumDataLine(line.items);
        if (!parsed) continue;

        transactions.push({
          id: '',
          date: formatDate(parsed.date1, year),
          value_date: formatDate(parsed.date2, year),
          description: description.replace(/\s+/g, ' ').trim(),
          debit: parsed.debit,
          credit: parsed.credit,
          balance: parsed.balance,
          bank: 'millennium',
          owner: 'Mariana',
          category: null,
          subcategory: null,
          status: 'pending',
          import_batch: importBatch,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return transactions;
}
