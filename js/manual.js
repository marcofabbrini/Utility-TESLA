let manualPromise = null;
export function loadManual() {
    if (!manualPromise) {
        manualPromise = fetch('./manual/manual-data.json').then(r => {
            if (!r.ok)
                throw new Error('Impossibile caricare l’indice del manuale.');
            return r.json();
        });
    }
    return manualPromise;
}
export function pageImage(page) {
    const p = Math.max(1, Math.min(345, Math.round(page)));
    return `./manual/pages/page-${String(p).padStart(3, '0')}.jpg`;
}
function fold(value) {
    return value.toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function excerpt(text, query) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean)
        return 'Pagina illustrata del manuale.';
    const f = fold(clean);
    const tokens = fold(query).split(/\s+/).filter(Boolean);
    let pos = -1;
    for (const t of tokens) {
        const i = f.indexOf(t);
        if (i >= 0 && (pos < 0 || i < pos))
            pos = i;
    }
    if (pos < 0)
        pos = 0;
    const start = Math.max(0, pos - 115);
    const end = Math.min(clean.length, pos + 260);
    return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}
export function searchManual(data, query, limit = 24) {
    const q = fold(query.trim());
    if (!q)
        return [];
    const tokens = q.split(/\s+/).filter(t => t.length > 1);
    if (!tokens.length)
        return [];
    const bookmarkByPage = new Map();
    for (const b of data.bookmarks) {
        if (!bookmarkByPage.has(b.page) || b.depth > (bookmarkByPage.get(b.page)?.depth ?? -1))
            bookmarkByPage.set(b.page, b);
    }
    const results = [];
    for (const p of data.pages) {
        const body = fold(p.text);
        let score = 0;
        let matched = 0;
        for (const token of tokens) {
            let count = 0;
            let from = 0;
            while (count < 8) {
                const i = body.indexOf(token, from);
                if (i < 0)
                    break;
                count++;
                from = i + token.length;
            }
            if (count)
                matched++;
            score += count * 2;
        }
        const b = bookmarkByPage.get(p.page);
        const heading = fold(b?.path ?? '');
        for (const token of tokens)
            if (heading.includes(token))
                score += 12;
        if (matched === tokens.length)
            score += 10;
        if (!score)
            continue;
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
export function titleForPage(data, page) {
    let best;
    for (const b of data.bookmarks) {
        if (b.page <= page && (!best || b.page > best.page || (b.page === best.page && b.depth > best.depth)))
            best = b;
    }
    return best?.title ?? `Pagina ${page}`;
}
//# sourceMappingURL=manual.js.map