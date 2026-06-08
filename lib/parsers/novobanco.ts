import type { PdfLine } from './pdf-extract';
import type { NewTransaction } from '../schema';

function parseEuropeanNumber(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function isEuropeanNumber(str: string): boolean {
  return /^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(str.trim());
}

function formatDate(dd: string, mm: string, yy: string): string {
  const year = 2000 + parseInt(yy);
  return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

const STOP_SECTIONS = [
  /CT\s+PP\s+HABITAC/i,
  /CONTA\s+360[°]?\s+POUPAN/i,
  /CONTA\s+MICRO\s+POURAN/i,
  /CONTA\s+MICRO\s+POUPAN/i,
  /AVISOS\s+DE\s+LAN/i,
  /CRÉDITO\s+HABITAÇ/i,
  /CREDITO\s+HABITAC/i,
  /OUTRO\s+CRÉDIT/i,
  /DETALHE\s+DO\s+PATRIM/i,
  /DEPÓSITOS\s+À\s+ORDEM/i,
  /DEPÓSITOS\s+POUPANÇA/i,
  /FUNDOS\s+DE\s+INVEST/i,
  /SEGUROS/i,
];

// Check if line text is transaction noise to skip
function isNoise(text: string): boolean {
  return /micro\s+poupan/i.test(text);
}

// Parse amounts from a NovoBanco transaction line using x-position columns:
//   debit  → x in [debitX - margin, midpoint)
//   credit → x in [midpoint, balanceX - margin)
//   balance → x >= balanceX - margin
// Returns { debit, credit, balance, description }
function parseAmountsFromLine(
  items: PdfLine['items'],
  debitCreditMid: number,
  balanceX: number
): { debit: number | null; credit: number | null; balance: number | null; description: string } {
  // Separate description items (x < debitStartX ≈ 300) from amount items
  const descItems: string[] = [];
  const debitParts: string[] = [];
  const creditParts: string[] = [];
  const balanceParts: string[] = [];

  // Skip the two date items at the beginning (x < 100)
  let dateCount = 0;
  for (const item of items) {
    if (dateCount < 2 && item.x < 100 && /^\d{2}\.\d{2}\.\d{2}$/.test(item.str.trim())) {
      dateCount++;
      continue;
    }
    if (item.x < 300) {
      // Description or sidebar text — only include if not pure sidebar noise
      if (item.x >= 100) descItems.push(item.str);
    } else if (isEuropeanNumber(item.str)) {
      if (item.x < debitCreditMid) {
        debitParts.push(item.str);
      } else if (item.x < balanceX) {
        creditParts.push(item.str);
      } else {
        balanceParts.push(item.str);
      }
    } else {
      // Non-number item in the amount area — part of description
      if (item.x < 300) descItems.push(item.str);
    }
  }

  const debit = debitParts.length > 0 ? parseEuropeanNumber(debitParts[debitParts.length - 1]) : null;
  const credit = creditParts.length > 0 ? parseEuropeanNumber(creditParts[creditParts.length - 1]) : null;
  const balance = balanceParts.length > 0 ? parseEuropeanNumber(balanceParts[balanceParts.length - 1]) : null;
  const description = descItems.join(' ').trim();

  return { debit, credit, balance, description };
}

export async function parseNovoBancoFromLines(lines: PdfLine[], importBatch: string): Promise<NewTransaction[]> {
  const transactions: NewTransaction[] = [];

  let inSection = false;
  // Default column thresholds (calibrated from observed x positions in sample PDFs)
  // Débito header ≈ x 351–381, Crédito header ≈ x 419–448, Saldo ≈ x 477–507
  let debitCreditMid = 415;
  let balanceX = 490;

  // We process line by line; when we find a transaction line we may append continuation
  let pendingTx: {
    date: string;
    valueDate: string;
    descLines: string[];
    debit: number | null;
    credit: number | null;
    balance: number | null;
  } | null = null;

  function flushPending() {
    if (!pendingTx) return;
    const desc = pendingTx.descLines.join(' ').replace(/\s+/g, ' ').trim();
    if (desc.length >= 2 && !isNoise(desc)) {
      transactions.push({
        id: '',
        date: pendingTx.date,
        value_date: pendingTx.valueDate,
        description: desc,
        debit: pendingTx.debit,
        credit: pendingTx.credit,
        balance: pendingTx.balance,
        bank: 'novobanco',
        owner: 'Rodrigo',
        category: null,
        subcategory: null,
        status: 'pending',
        import_batch: importBatch,
        created_at: new Date().toISOString(),
      });
    }
    pendingTx = null;
  }

  for (const line of lines) {
    const { text, items } = line;

    // Detect CONTA 360° - DO section start
    if (!inSection) {
      if (
        (text.includes('CONTA 360°') || text.includes('CONTA 360')) &&
        text.includes('DO') &&
        !text.includes('POUPAN') &&
        !text.includes('MICRO')
      ) {
        inSection = true;
      }
      continue;
    }

    // Detect section end
    if (STOP_SECTIONS.some((p) => p.test(text))) {
      flushPending();
      inSection = false;
      continue;
    }

    // Calibrate column thresholds from the header row
    if (/Débit/i.test(text) && /Crédit/i.test(text)) {
      const debitItem = items.find((i) => /Débit/i.test(i.str));
      const creditItem = items.find((i) => /Crédit/i.test(i.str));
      const saldoItem = items.find((i) => /Saldo/i.test(i.str));
      if (debitItem && creditItem) {
        debitCreditMid = (debitItem.x + creditItem.x) / 2;
      }
      if (saldoItem) {
        balanceX = saldoItem.x - 10;
      }
      continue;
    }

    // Skip non-transaction lines (headers, totals, blank pages)
    if (/^(SALDO|TOTAL|EXTRATO|CONTA 360|Data|Valor|CONTA MILLENNIUM)/i.test(text.trim())) {
      flushPending();
      continue;
    }

    // Skip SALDO ANTERIOR line (not a real transaction)
    if (/SALDO\s+ANTERIOR/i.test(text)) {
      continue;
    }

    // Detect a new transaction line: first item x < 50 and matches DD.MM.YY
    const firstItem = items[0];
    const txDateMatch = firstItem?.str.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})$/);

    if (txDateMatch && firstItem.x < 50) {
      // Find second date item (x ≈ 67)
      const secondDateItem = items.find(
        (i) => i !== firstItem && i.x < 100 && /^\d{2}\.\d{2}\.\d{2}$/.test(i.str.trim())
      );
      const dateMatch2 = secondDateItem?.str.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})$/);

      flushPending();

      const date = formatDate(txDateMatch[1], txDateMatch[2], txDateMatch[3]);
      const valueDate = dateMatch2
        ? formatDate(dateMatch2[1], dateMatch2[2], dateMatch2[3])
        : date;

      // Parse amounts
      const { debit, credit, balance, description } = parseAmountsFromLine(
        items,
        debitCreditMid,
        balanceX
      );

      // Skip noise immediately
      if (isNoise(description)) continue;

      pendingTx = {
        date,
        valueDate,
        descLines: description ? [description] : [],
        debit,
        credit,
        balance,
      };
    } else if (pendingTx) {
      // Continuation line: items start at x ≈ 109 with no date prefix
      // Filter out sidebar watermark text (very small x or very large x)
      const contText = items
        .filter((i) => i.x >= 100 && i.x < 350 && !isEuropeanNumber(i.str))
        .map((i) => i.str)
        .join(' ')
        .trim();
      if (contText) {
        pendingTx.descLines.push(contText);
      }
    }
  }

  flushPending();
  return transactions;
}
