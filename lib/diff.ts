export interface DiffLine { t: " " | "+" | "-"; s: string; a?: number; b?: number }

/** Line diff (LCS). Returns null when the files are too large to diff in the browser view. */
export function lineDiff(oldText: string, newText: string, maxLines = 3000): DiffLine[] | null {
  const a = oldText.split("\n"), b = newText.split("\n");
  if (a.length > maxLines || b.length > maxLines || a.length * b.length > 4_000_000) return null;
  const n = a.length, m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: " ", s: a[i], a: i + 1, b: j + 1 }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: "-", s: a[i], a: i + 1 }); i++; }
    else { out.push({ t: "+", s: b[j], b: j + 1 }); j++; }
  }
  while (i < n) { out.push({ t: "-", s: a[i], a: i + 1 }); i++; }
  while (j < m) { out.push({ t: "+", s: b[j], b: j + 1 }); j++; }
  return out;
}

/** Keep changed lines plus `ctx` lines of context; gaps become a single "…" marker line. */
export function hunks(lines: DiffLine[], ctx = 3): (DiffLine | null)[] {
  const keep = new Set<number>();
  lines.forEach((l, i) => { if (l.t !== " ") for (let k = i - ctx; k <= i + ctx; k++) keep.add(k); });
  const out: (DiffLine | null)[] = [];
  let gap = false;
  lines.forEach((l, i) => {
    if (keep.has(i)) { out.push(l); gap = false; } else if (!gap) { out.push(null); gap = true; }
  });
  return out;
}
