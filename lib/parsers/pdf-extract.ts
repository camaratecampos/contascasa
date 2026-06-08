// Polyfill browser APIs required by pdfjs-dist in Node.js environments
function applyPolyfills() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      constructor(init?: string | number[]) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init as number[];
          this.m11 = init[0]; this.m12 = init[1];
          this.m21 = init[2]; this.m22 = init[3];
          this.m41 = init[4]; this.m42 = init[5];
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformPoint(p: any) { return p; }
    };
  }
  if (typeof globalThis.Path2D === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Path2D = class Path2D {};
  }
  if (typeof globalThis.ImageData === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ImageData = class ImageData {
      constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
    };
  }
}

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
  applyPolyfills();

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
