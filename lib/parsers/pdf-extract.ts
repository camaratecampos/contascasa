export interface PdfItem {
  x: number;
  y: number;
  pageNum: number;
  str: string;
}

export interface PdfLine {
  y: number;
  pageNum: number;
  items: PdfItem[];
  text: string;
}

export async function extractPdfLines(buffer: Buffer): Promise<PdfLine[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const allLines: PdfLine[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const byY = new Map<number, PdfItem[]>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const raw of content.items as any[]) {
      if (!raw.str?.trim()) continue;
      const localY = Math.round(raw.transform[5] * 2) / 2;
      const x = Math.round(raw.transform[4]);
      const item: PdfItem = { x, y: localY, pageNum: p, str: raw.str };
      if (!byY.has(localY)) byY.set(localY, []);
      byY.get(localY)!.push(item);
    }

    // Sort y descending (top of page first)
    const ys = Array.from(byY.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const items = byY.get(y)!.sort((a, b) => a.x - b.x);
      const text = items.map((i) => i.str).join(' ');
      allLines.push({ y, pageNum: p, items, text });
    }
  }

  return allLines;
}
