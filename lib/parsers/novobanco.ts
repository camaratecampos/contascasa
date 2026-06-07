import type { NewTransaction } from '../schema';

// Parse European number format: 1.234,56 → 1234.56
function parseEuropeanNumber(str: string): number {
  // Remove dots (thousands separators) and replace comma with dot
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Extract year from statement header
function extractYear(text: string): number {
  // Try "Extrato Integrado nº X/YYYY"
  const match1 = text.match(/Extrato Integrado\s+n[ºo°]\s*\d+\/(\d{4})/i);
  if (match1) return parseInt(match1[1]);

  // Try "de DD.MM.YYYY a DD.MM.YYYY"
  const match2 = text.match(/de \d{2}\.\d{2}\.(\d{4})/i);
  if (match2) return parseInt(match2[1]);

  // Try 2-digit year pattern in dates: DD.MM.YY
  const match3 = text.match(/\d{2}\.\d{2}\.(\d{2})/);
  if (match3) {
    const y = parseInt(match3[1]);
    return y + 2000;
  }

  return new Date().getFullYear();
}

// Convert DD.MM.YY to YYYY-MM-DD
function parseDate(d: string, m: string, y: string): string {
  const year = parseInt(y) + 2000;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const SKIP_SECTIONS = [
  'CT PP HABITACAO',
  'CONTA 360° POUPANCA',
  'CONTA MICRO POUPANCA',
  'AVISOS DE LANÇAMENTO',
  'AVISOS DE LANCAMENTO',
  'CRÉDITO HABITAÇÃO',
  'CREDITO HABITACAO',
  'OUTRO CRÉDITO',
  'OUTRO CREDITO',
  'DETALHE DO PATRIMÓNIO',
  'DETALHE DO PATRIMONIO',
];

export function parseNovoBanco(text: string, bank: string = 'novobanco', owner: string = 'Rodrigo', importBatch: string = ''): NewTransaction[] {
  const year = extractYear(text);
  const lines = text.split('\n');

  // Find the CONTA 360° - DO section
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('CONTA 360°') && lines[i].includes('DO')) {
      sectionStart = i;
      break;
    }
  }

  if (sectionStart === -1) {
    // Try alternative
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/CONTA 360/i) && !lines[i].includes('POUPANCA') && !lines[i].includes('MICRO')) {
        sectionStart = i;
        break;
      }
    }
  }

  if (sectionStart === -1) return [];

  // Find section end (next major section header)
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    if (SKIP_SECTIONS.some(s => line.includes(s))) {
      sectionEnd = i;
      break;
    }
  }

  const sectionLines = lines.slice(sectionStart, sectionEnd);

  // Date pattern: DD.MM.YY
  const datePattern = /^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})\.(\d{2})\s+(.*)/;

  const transactions: NewTransaction[] = [];
  let i = 0;

  while (i < sectionLines.length) {
    const line = sectionLines[i];
    const match = line.match(datePattern);

    if (match) {
      const dateStr = parseDate(match[1], match[2], match[3]);
      const valueDateStr = parseDate(match[4], match[5], match[6]);
      let rest = match[7].trim();

      // Check for wrapped description lines
      let j = i + 1;
      while (j < sectionLines.length) {
        const nextLine = sectionLines[j].trim();
        // If next line starts with a date pattern, stop
        if (nextLine.match(/^\d{2}\.\d{2}\.\d{2}/)) break;
        // If next line looks like amounts only or is empty, stop
        if (!nextLine || nextLine.match(/^[\d.,\s]+$/)) {
          // Check if it's a balance/amount continuation
          break;
        }
        // Otherwise it might be a description continuation
        // But we need to be careful: amounts are at the end of the line
        rest = rest + ' ' + nextLine;
        j++;
      }
      i = j;

      // Parse the rest: description + optional debit + optional credit + balance
      // Numbers can look like: 1.234,56 or 19,00
      // The last number is balance, before that is debit or credit
      const numPattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
      const numbers: string[] = [];
      let descriptionEnd = rest.length;

      // Find all numbers
      let numMatch;
      const numMatches: Array<{ index: number; value: string }> = [];
      while ((numMatch = numPattern.exec(rest)) !== null) {
        numMatches.push({ index: numMatch.index, value: numMatch[0] });
      }

      let debit: number | null = null;
      let credit: number | null = null;
      let balance: number | null = null;
      let description = rest;

      if (numMatches.length >= 2) {
        // Last is balance
        balance = parseEuropeanNumber(numMatches[numMatches.length - 1].value);
        // Second to last is debit or credit
        const amountStr = numMatches[numMatches.length - 2].value;
        const amount = parseEuropeanNumber(amountStr);

        // Description is everything before the first number
        descriptionEnd = numMatches[0].index;
        description = rest.substring(0, descriptionEnd).trim();

        // Determine if debit or credit based on context
        // Check if there's a sign or if we can infer from position
        // NovoBanco format: Débito | Crédito | Saldo
        // If only 2 numbers: we have amount + balance
        // If 3 numbers: debit + credit + balance (but usually one is blank)

        if (numMatches.length === 2) {
          // Need to determine from context - check if balance went up or down
          // Can't determine without previous balance, so use description/context
          // By default treat as debit (expense)
          debit = amount;
        } else if (numMatches.length >= 3) {
          // Could be debit + blank credit + balance or blank debit + credit + balance
          // The two amounts before balance are at positions length-3 and length-2
          const firstAmount = parseEuropeanNumber(numMatches[numMatches.length - 3].value);
          const secondAmount = parseEuropeanNumber(numMatches[numMatches.length - 2].value);
          // We need to figure out which column each belongs to
          // Check positional context in original line
          debit = firstAmount;
          credit = null;
          // Actually with the text parsing, it's hard to distinguish columns
          // Use balance change: if balance went up, it's credit
        }
      } else if (numMatches.length === 1) {
        balance = parseEuropeanNumber(numMatches[0].value);
        description = rest.substring(0, numMatches[0].index).trim();
      }

      // Skip noise transactions
      if (description.toLowerCase().includes('micro poupança arredond') ||
          description.toLowerCase().includes('micro poupanca arredond')) {
        continue;
      }

      // Skip if no meaningful description
      if (!description || description.length < 2) continue;

      transactions.push({
        id: '',
        date: dateStr,
        value_date: valueDateStr,
        description: description.trim(),
        debit,
        credit,
        balance,
        bank,
        owner,
        category: null,
        subcategory: null,
        status: 'pending',
        import_batch: importBatch,
        created_at: new Date().toISOString(),
      });
    } else {
      i++;
    }
  }

  return transactions;
}

// More robust parser that handles the actual PDF text layout
export function parseNovoBancoRobust(text: string, importBatch: string = ''): NewTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const year = extractYear(text);

  // Find CONTA 360° - DO section
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].includes('CONTA 360°') || lines[i].includes('CONTA 360')) &&
        (lines[i].includes('DO') || lines[i+1]?.includes('DO'))) {
      sectionStart = i;
      break;
    }
  }

  if (sectionStart === -1) return [];

  // Find section end
  let sectionEnd = lines.length;
  for (let i = sectionStart + 5; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    if (SKIP_SECTIONS.some(s => upper.includes(s.toUpperCase()))) {
      sectionEnd = i;
      break;
    }
    // Also stop at SALDO FINAL or summary lines
    if (upper.includes('TOTAL MOVIMENTO') || upper.includes('SALDO FINAL')) {
      // Don't stop here, these are within the section
    }
  }

  const sectionLines = lines.slice(sectionStart, sectionEnd);

  // Pattern: line starts with DD.MM.YY DD.MM.YY
  const txPattern = /^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})\.(\d{2})\s+(.+)$/;
  const numPattern = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

  const transactions: NewTransaction[] = [];

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];
    const match = line.match(txPattern);

    if (!match) continue;

    const day1 = match[1], mon1 = match[2], yr1 = match[3];
    const day2 = match[4], mon2 = match[5], yr2 = match[6];
    const rest = match[7];

    const dateStr = parseDate(day1, mon1, yr1);
    const valueDateStr = parseDate(day2, mon2, yr2);

    // Collect description + numbers
    let fullRest = rest;

    // Check continuation lines
    let j = i + 1;
    while (j < sectionLines.length) {
      const nextLine = sectionLines[j];
      if (nextLine.match(/^\d{2}\.\d{2}\.\d{2}/)) break;
      // If the line has numbers that look like amounts with European format
      const hasDate = nextLine.match(/^\d{2}\.\d{2}\.\d{2}/);
      if (hasDate) break;
      // Append if it looks like a description continuation (not just numbers)
      if (!nextLine.match(/^[\d.,\s]+$/) && !nextLine.match(/^SALDO/i) && !nextLine.match(/^TOTAL/i)) {
        fullRest += ' ' + nextLine;
        j++;
      } else {
        break;
      }
    }
    i = j - 1;

    // Extract numbers from the full rest
    const allNums: string[] = [];
    let numMatch;
    const numRe = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
    while ((numMatch = numRe.exec(fullRest)) !== null) {
      allNums.push(numMatch[0]);
    }

    // Find where numbers start in the string
    const firstNumIdx = fullRest.search(/\d{1,3}(?:\.\d{3})*,\d{2}/);
    const description = firstNumIdx > 0 ? fullRest.substring(0, firstNumIdx).trim() : fullRest.trim();

    // Skip noise
    if (description.toLowerCase().includes('micro poupança') ||
        description.toLowerCase().includes('micro poupanca')) {
      continue;
    }

    if (!description || description.length < 3) continue;

    let debit: number | null = null;
    let credit: number | null = null;
    let balance: number | null = null;

    if (allNums.length >= 2) {
      balance = parseEuropeanNumber(allNums[allNums.length - 1]);
      const amount = parseEuropeanNumber(allNums[allNums.length - 2]);

      // Determine debit vs credit: if we have 3+ numbers, the structure is
      // possibly: debit credit balance OR just amount balance
      // We'll use a heuristic: check if "TRF CRED" or credit indicators in description
      const isCredit = description.toUpperCase().includes('TRF CRED') ||
                       description.toUpperCase().includes('TRANSFERENCIA A FAVOR') ||
                       description.toUpperCase().includes('VENCIMENTO') ||
                       description.toUpperCase().includes('HIKMA') ||
                       description.toUpperCase().includes('SALARIO') ||
                       description.toUpperCase().includes('REEMBOLSO');

      if (allNums.length >= 3) {
        // Could have both debit and credit columns
        // Try to figure out by position or use the two non-balance amounts
        const secondLast = parseEuropeanNumber(allNums[allNums.length - 2]);
        const thirdLast = parseEuropeanNumber(allNums[allNums.length - 3]);

        // Heuristic: one of them is 0-ish or the transaction amount
        // Use description to determine
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
    } else if (allNums.length === 1) {
      balance = parseEuropeanNumber(allNums[0]);
    }

    transactions.push({
      id: '',
      date: dateStr,
      value_date: valueDateStr,
      description,
      debit,
      credit,
      balance,
      bank: 'novobanco',
      owner: 'Rodrigo',
      category: null,
      subcategory: null,
      status: 'pending',
      import_batch: importBatch,
      created_at: new Date().toISOString(),
    });
  }

  return transactions;
}
