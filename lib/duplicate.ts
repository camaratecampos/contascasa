import type { NewTransaction } from './schema';

// Simple string similarity using Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}

export function isDuplicate(
  a: Pick<NewTransaction, 'date' | 'debit' | 'credit' | 'description'>,
  b: Pick<NewTransaction, 'date' | 'debit' | 'credit' | 'description'>
): boolean {
  if (a.date !== b.date) return false;

  const aAmount = a.debit ?? a.credit ?? 0;
  const bAmount = b.debit ?? b.credit ?? 0;
  if (Math.abs(aAmount - bAmount) >= 0.01) return false;

  return similarity(a.description, b.description) > 0.8;
}

export function filterDuplicates(
  incoming: NewTransaction[],
  existing: Pick<NewTransaction, 'date' | 'debit' | 'credit' | 'description'>[]
): { unique: NewTransaction[]; duplicateCount: number } {
  const unique: NewTransaction[] = [];
  let duplicateCount = 0;

  for (const tx of incoming) {
    const isDup =
      existing.some((e) => isDuplicate(tx, e)) ||
      unique.some((u) => isDuplicate(tx, u));

    if (isDup) {
      duplicateCount++;
    } else {
      unique.push(tx);
    }
  }

  return { unique, duplicateCount };
}
