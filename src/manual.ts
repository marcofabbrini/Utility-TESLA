export interface ManualBookmark {
  title: string;
  page: number;
  path: string;
  depth: number;
}

export interface ManualNode {
  title: string;
  page: number;
  children: ManualNode[];
}

export interface ManualPage {
  page: number;
  text: string;
}

export interface ManualData {
  meta: {
    title: string;
    softwareVersion: string;
    region: string;
    pageCount: number;
    source: string;
  };
  outline: ManualNode[];
  bookmarks: ManualBookmark[];
  pages: ManualPage[];
}

export interface SearchResult {
  page: number;
  title: string;
  path: string;
  snippet: string;
  score: number;
}

let manualPromise: Promise<ManualData> | null = null;

export function loadManual(): Promise<ManualData> {
  if (!manualPromise) {
    manualPromise = fetch('./manual/manual-data.json').then(r => {
      if (!r.ok) throw new Error('Impossibile caricare l’indice del manuale.');
      return r.json();
    });
  }
  return manualPromise;
}

export function pageImage(page: number): string {
  const p = Math.max(1, Math.min(345, Math.round(page)));
  return `./manual/pages/page-${String(p).padStart(3, '0')}.jpg`;
}

function fold(value: string): string {
  return value.toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function excerpt(text: string, query: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Pagina illustrata del manuale.';
  const f = fold(clean);
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  let pos = -1;
  for (const t of tokens) {
    const i = f.indexOf(t);
    if (i >= 0 && (pos < 0 || i < pos)) pos = i;
  }
  if (pos < 0) pos = 0;
  const start = Math.max(0, pos - 115);
  const end = Math.min(clean.length, pos + 260);
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}

export function searchManual(data: ManualData, query: string, limit = 24): SearchResult[] {
  const q = fold(query.trim());
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(t => t.length > 1);
  if (!tokens.length) return [];

  const bookmarkByPage = new Map<number, ManualBookmark>();
  for (const b of data.bookmarks) {
    if (!bookmarkByPage.has(b.page) || b.depth > (bookmarkByPage.get(b.page)?.depth ?? -1)) bookmarkByPage.set(b.page, b);
  }

  const results: SearchResult[] = [];
  for (const p of data.pages) {
    const body = fold(p.text);
    let score = 0;
    let matched = 0;
    for (const token of tokens) {
      let count = 0;
      let from = 0;
      while (count < 8) {
        const i = body.indexOf(token, from);
        if (i < 0) break;
        count++;
        from = i + token.length;
      }
      if (count) matched++;
      score += count * 2;
    }
    const b = bookmarkByPage.get(p.page);
    const heading = fold(b?.path ?? '');
    for (const token of tokens) if (heading.includes(token)) score += 12;
    if (matched === tokens.length) score += 10;
    if (!score) continue;
    results.push({
      page: p.page,
      title: b?.title ?? `Pagina ${p.page}`,
      path: b?.path ?? 'Manuale d’uso',
      snippet: excerpt(p.text, query),
      score,
    });
  }
  return results.sort((a, b) => b.score - a.score || a.page - b.page).slice(0, limit);
}

export function titleForPage(data: ManualData, page: number): string {
  let best: ManualBookmark | undefined;
  for (const b of data.bookmarks) {
    if (b.page <= page && (!best || b.page > best.page || (b.page === best.page && b.depth > best.depth))) best = b;
  }
  return best?.title ?? `Pagina ${page}`;
}
