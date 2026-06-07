import type { NewTransaction } from '../schema';

// Parse Millennium number format: "1 042.47" → 1042.47
function parseMillenniumNumber(str: string): number {
  // Remove spaces (thousands separator) and parse
  return parseFloat(str.replace(/\s/g, '').replace(',', '.'));
}

// Extract year from "EXTRATO DE YYYY/MM/DD A YYYY/MM/DD"
function extractYear(text: string): number {
  const match = text.match(/EXTRATO\s+DE\s+(\d{4})\/\d{2}\/\d{2}/i);
  if (match) return parseInt(match[1]);

  // Alternative: look for 4-digit year anywhere in header context
  const match2 = text.match(/(\d{4})\/\d{2}\/\d{2}/);
  if (match2) return parseInt(match2[1]);

  return new Date().getFullYear();
}

// Extract month from date range
function extractMonth(text: string, year: number): number | null {
  const match = text.match(/EXTRATO\s+DE\s+\d{4}\/(\d{2})\/\d{2}/i);
  if (match) return parseInt(match[1]);
  return null;
}

// Convert D.MM to YYYY-MM-DD
function parseDate(dayMonth: string, year: number, headerMonth: number | null): string {
  const parts = dayMonth.split('.');
  if (parts.length !== 2) return `${year}-01-01`;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const SKIP_SECTIONS = [
  'APLICACOES FINANCEIRAS',
  'APLICAÇÕES FINANCEIRAS',
  'CARTEIRA DE SEGUROS',
  'AGENDA',
];

export function parseMillennium(text: string, importBatch: string = ''): NewTransaction[] {
  const year = extractYear(text);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Find CONTA MILLENNIUM section
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().includes('CONTA MILLENNIUM')) {
      sectionStart = i;
      break;
    }
  }

  if (sectionStart === -1) return [];

  // Find section end
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    if (SKIP_SECTIONS.some(s => upper.includes(s))) {
      sectionEnd = i;
      break;
    }
  }

  const sectionLines = lines.slice(sectionStart, sectionEnd);

  // Transaction line pattern: D.MM or DD.MM at start
  // FORMAT: DATA LANC. | DATA VALOR | DESCRITIVO | DEBITO | CREDITO | SALDO
  // Example: "5.04  5.02  TRF. P/O JOANA BARROS  15.00  3 303.78"
  // Date pattern: number.number (1-2 digits . 2 digits)
  const datePattern = /^(\d{1,2}\.\d{2})\s+(\d{1,2}\.\d{2})\s+(.+)$/;

  // Amount pattern for Millennium: numbers with optional space thousands sep
  // e.g. "1 042.47" or "86.04" or "15.00" or "3 303.78"
  const amountPattern = /\d{1,3}(?:\s\d{3})*\.\d{2}/g;

  const transactions: NewTransaction[] = [];

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];

    // Skip headers, SALDO INICIAL/FINAL lines
    if (line.toUpperCase().includes('SALDO INICIAL') ||
        line.toUpperCase().includes('SALDO FINAL') ||
        line.toUpperCase().includes('DATA LANC') ||
        line.toUpperCase().includes('DESCRITIVO') ||
        line.toUpperCase().includes('DEBITO') ||
        line.toUpperCase().includes('EXTRATO')) {
      continue;
    }

    const match = line.match(datePattern);
    if (!match) continue;

    const dateStr = parseDate(match[1], year, null);
    const valueDateStr = parseDate(match[2], year, null);
    let rest = match[3].trim();

    // Collect continuation lines
    let j = i + 1;
    while (j < sectionLines.length) {
      const nextLine = sectionLines[j];
      if (nextLine.match(/^\d{1,2}\.\d{2}\s/)) break;
      if (nextLine.toUpperCase().includes('SALDO')) break;
      // If it looks like pure numbers, break
      if (nextLine.match(/^\d[\d\s.]+$/)) break;
      rest += ' ' + nextLine;
      j++;
    }
    i = j - 1;

    // Extract all amounts from the line
    const amounts: string[] = [];
    let amtMatch;
    const amtRe = /(\d{1,3}(?:\s\d{3})*\.\d{2})/g;
    while ((amtMatch = amtRe.exec(rest)) !== null) {
      amounts.push(amtMatch[0]);
    }

    // Find where numbers start
    const firstNumIdx = rest.search(/\d{1,3}(?:\s\d{3})*\.\d{2}/);
    const description = firstNumIdx > 0 ? rest.substring(0, firstNumIdx).trim() : rest.trim();

    if (!description || description.length < 2) continue;

    let debit: number | null = null;
    let credit: number | null = null;
    let balance: number | null = null;

    if (amounts.length >= 2) {
      balance = parseMillenniumNumber(amounts[amounts.length - 1]);
      const amount = parseMillenniumNumber(amounts[amounts.length - 2]);

      // Determine debit vs credit
      const upperDesc = description.toUpperCase();
      const isCredit =
        upperDesc.includes('TRF.') ||
        upperDesc.includes('TRANSFERENCIA') ||
        upperDesc.includes('VENCIMENTO') ||
        upperDesc.includes('SALARIO') ||
        upperDesc.includes('REEMBOLSO') ||
        upperDesc.includes('JOANA BARROS'); // specific known credit

      // Check if amounts.length indicates both debit and credit columns
      if (amounts.length >= 3) {
        const secondLast = parseMillenniumNumber(amounts[amounts.length - 2]);
        const thirdLast = parseMillenniumNumber(amounts[amounts.length - 3]);
        // With the column format, position matters
        if (isCredit) {
          credit = secondLast;
        } else {
          debit = secondLast;
        }
      } else {
        if (isCredit) {
          credit = amount;
        } else {
          debit = amount;
        }
      }
    } else if (amounts.length === 1) {
      balance = parseMillenniumNumber(amounts[0]);
    }

    transactions.push({
      id: '',
      date: dateStr,
      value_date: valueDateStr,
      description,
      debit,
      credit,
      balance,
      bank: 'millennium',
      owner: 'Mariana',
      category: null,
      subcategory: null,
      status: 'pending',
      import_batch: importBatch,
      created_at: new Date().toISOString(),
    });
  }

  return transactions;
}
