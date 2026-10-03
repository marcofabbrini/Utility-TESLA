import { db } from './db.js';
import { loadManual, pageImage, searchManual, titleForPage } from './manual.js';
const defaultProfile = {
    ownerName: '', phone: '', email: '', address: '', vehicleName: 'La mia Model 3', vin: '', plate: '', deliveryDate: '', odometer: '', color: '', notes: '',
    insurer: '', policyNumber: '', policyExpiry: '', roadside: ''
};
const state = {
    manual: null,
    profile: loadProfile(),
    docs: [], photos: [], services: [],
    installPrompt: null,
    objectUrls: []
};
const app = document.querySelector('#app');
function loadProfile() {
    try {
        const raw = localStorage.getItem('m3-owner-profile');
        return raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile };
    }
    catch {
        return { ...defaultProfile };
    }
}
function saveProfile(profile) {
    state.profile = profile;
    localStorage.setItem('m3-owner-profile', JSON.stringify(profile));
}
function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function fmtDate(value) {
    if (!value)
        return '—';
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.valueOf()) ? esc(value) : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
function fmtMoney(value) {
    if (value == null || Number.isNaN(value))
        return '—';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}
function fmtSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
function daysTo(value) {
    if (!value)
        return null;
    const d = new Date(`${value}T23:59:59`);
    if (Number.isNaN(d.valueOf()))
        return null;
    return Math.ceil((d.valueOf() - Date.now()) / 86400000);
}
function id() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function icon(name, size = 22) {
    const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    const p = {
        home: '<path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
        book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v18a2 2 0 0 1 2-2h2.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
        car: '<path d="M5 17h14l1-5-2-4H6l-2 4 1 5Z"/><path d="M7 8 8.5 5h7L17 8M4 12h16M7 17v2M17 17v2"/>',
        file: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M9 13h6M9 17h5"/>',
        wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.3 2.3-3-3Z"/>',
        image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        chevronLeft: '<path d="m15 18-6-6 6-6"/>',
        chevronRight: '<path d="m9 18 6-6-6-6"/>',
        upload: '<path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
        download: '<path d="M12 4v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
        trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        shield: '<path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
        alert: '<path d="M12 3 2.8 20h18.4Z"/><path d="M12 9v4M12 17h.01"/>',
        spark: '<path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2ZM19 15l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6Z"/>',
        lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    };
    return `<svg ${attrs}>${p[name] ?? p.info}</svg>`;
}
function route() {
    const raw = (location.hash || '#/').slice(1);
    const [path, query = ''] = raw.split('?');
    return { path: path || '/', params: new URLSearchParams(query) };
}
function link(path) { return `#${path}`; }
function navItem(path, label, iconName) {
    const active = route().path === path;
    return `<a class="nav-item ${active ? 'active' : ''}" href="${link(path)}">${icon(iconName, 20)}<span>${label}</span></a>`;
}
function shell(content) {
    return `
  <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div>
  <header class="topbar">
    <a class="brand" href="#/" aria-label="Model 3 Owner Hub home">
      <span class="brand-mark">M3</span><span><strong>Owner Hub</strong><small>companion personale</small></span>
    </a>
    <nav class="desktop-nav">
      ${navItem('/', 'Home', 'home')}${navItem('/manual', 'Manuale', 'book')}${navItem('/garage', 'La mia auto', 'car')}${navItem('/documents', 'Documenti', 'file')}${navItem('/service', 'Tagliandi', 'wrench')}
    </nav>
    <div class="top-actions">
      <button class="icon-btn" id="install-app" title="Installa app">${icon('download', 20)}</button>
      <a class="icon-btn" href="#/settings" title="Impostazioni">${icon('settings', 20)}</a>
    </div>
  </header>
  <main>${content}</main>
  <nav class="mobile-nav">
    ${navItem('/', 'Home', 'home')}${navItem('/manual', 'Manuale', 'book')}${navItem('/garage', 'Auto', 'car')}${navItem('/documents', 'File', 'file')}${navItem('/service', 'Tagliandi', 'wrench')}
  </nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-root"></div>`;
}
function homePage() {
    const expiry = daysTo(state.profile.policyExpiry);
    const lastService = state.services[0];
    const profileReady = Boolean(state.profile.ownerName || state.profile.vin || state.profile.plate);
    return `
  <section class="hero section-pad">
    <div class="hero-copy reveal">
      <div class="eyebrow"><span class="pulse-dot"></span> Model 3 2024+ · manuale 2026.32</div>
      <h1>Tutto della tua Model 3.<br><span class="gradient-text">In un unico spazio.</span></h1>
      <p class="lead">Manuale visuale ricercabile, documenti personali, assicurazione, foto e storico manutenzione in una web app installabile.</p>
      <div class="hero-actions">
        <a class="btn primary" href="#/manual">${icon('search', 19)} Cerca nel manuale</a>
        <a class="btn" href="#/garage">${icon('car', 19)} Configura la mia auto</a>
      </div>
      <div class="trust-row"><span>${icon('lock', 16)} Dati personali salvati solo nel browser</span><span>${icon('download', 16)} PWA installabile</span></div>
    </div>
    <div class="hero-visual reveal" aria-label="Anteprima Model 3 dal manuale">
      <div class="glow-orb"></div>
      <div class="hero-card">
        <div class="hero-card-top"><span>MODEL 3</span><span class="status-pill">2024+</span></div>
        <img src="./assets/model3-hero.png" alt="Model 3, immagine tratta dal manuale fornito"/>
        <div class="hero-card-bottom"><span>Owner Hub</span><span>EU · 2026.32</span></div>
      </div>
    </div>
  </section>

  <section class="section-pad compact">
    <div class="section-head reveal"><div><span class="kicker">Accesso rapido</span><h2>Quello che serve, senza cercare per minuti.</h2></div></div>
    <div class="quick-grid">
      ${quickCard('/manual?page=203', 'Ricarica', 'Istruzioni, stato di carica e buone pratiche.', '⚡', 'accent-blue')}
      ${quickCard('/manual?page=217', 'Manutenzione', 'Intervalli, pneumatici e controlli.', '◌', 'accent-green')}
      ${quickCard('/manual?page=255', 'Emergenza', 'Assistenza, autonomia esaurita e procedure.', '!', 'accent-red')}
      ${quickCard('/manual?page=24', 'Chiavi e accesso', 'Telefono, chiave a scheda e portiere.', '⌁', 'accent-violet')}
    </div>
  </section>

  <section class="section-pad compact two-col-home">
    <div class="panel reveal">
      <div class="panel-head"><div><span class="kicker">La mia auto</span><h2>${esc(state.profile.vehicleName || 'La mia Model 3')}</h2></div><a href="#/garage" class="text-link">Modifica →</a></div>
      ${profileReady ? `
      <div class="stat-grid">
        <div class="stat"><span>Targa</span><strong>${esc(state.profile.plate || '—')}</strong></div>
        <div class="stat"><span>Odometro</span><strong>${state.profile.odometer ? `${esc(state.profile.odometer)} km` : '—'}</strong></div>
        <div class="stat"><span>Documenti</span><strong>${state.docs.length}</strong></div>
        <div class="stat"><span>Tagliandi</span><strong>${state.services.length}</strong></div>
      </div>
      <div class="status-strip ${expiry != null && expiry < 30 ? 'warn' : ''}">${icon('shield', 18)}<span>Assicurazione: <b>${state.profile.insurer ? esc(state.profile.insurer) : 'da configurare'}</b>${state.profile.policyExpiry ? ` · scadenza ${fmtDate(state.profile.policyExpiry)}` : ''}</span></div>
      ` : `<div class="empty-mini"><p>Aggiungi i dati del proprietario, VIN, targa e assicurazione per trasformare l’app nel tuo archivio personale.</p><a class="btn small" href="#/garage">Configura ora</a></div>`}
    </div>
    <div class="panel reveal">
      <div class="panel-head"><div><span class="kicker">Ultimo intervento</span><h2>Storico manutenzione</h2></div><a href="#/service" class="text-link">Apri →</a></div>
      ${lastService ? `<div class="service-mini"><div class="timeline-dot"></div><div><strong>${esc(lastService.title)}</strong><p>${fmtDate(lastService.date)} · ${lastService.odometer ? `${lastService.odometer.toLocaleString('it-IT')} km` : 'km non indicati'}</p><small>${esc(lastService.workshop || 'Officina non indicata')}</small></div></div>` : `<div class="empty-mini"><p>Nessun intervento registrato. Puoi creare uno storico completo di tagliandi, riparazioni e pneumatici.</p><a class="btn small" href="#/service">Aggiungi intervento</a></div>`}
    </div>
  </section>

  <section class="section-pad">
    <div class="section-head reveal"><div><span class="kicker">Dal manuale originale</span><h2>Esplora la vettura in modo visuale.</h2></div><a href="#/manual" class="text-link">Vedi tutto il manuale →</a></div>
    <div class="visual-grid">
      ${visualCard('./assets/exterior.jpg', 'Esterni', 'Sensori, presa di ricarica, bagagliai e telecamera.', 5)}
      ${visualCard('./assets/interior.jpg', 'Abitacolo', 'Comandi, display, climatizzazione e console.', 6)}
      ${visualCard('./assets/touchscreen.jpg', 'Touchscreen', 'Interfaccia, scorciatoie, stato veicolo e controlli.', 8)}
    </div>
  </section>

  <section class="section-pad disclaimer reveal">
    ${icon('info', 20)}
    <p><strong>Companion personale non ufficiale.</strong> Le pagine del manuale sono riprodotte dal PDF fornito. Per le informazioni specifiche della tua vettura e per eventuali aggiornamenti, verifica sempre anche il manuale sul touchscreen del veicolo.</p>
  </section>`;
}
function quickCard(href, title, text, mark, cls) {
    return `<a href="#${href}" class="quick-card reveal ${cls}"><div class="quick-icon">${mark}</div><div><strong>${esc(title)}</strong><p>${esc(text)}</p></div><span class="arrow">→</span></a>`;
}
function visualCard(src, title, text, page) {
    return `<a class="visual-card reveal" href="#/manual?page=${page}"><div class="visual-media"><img src="${src}" alt="${esc(title)} dal manuale" loading="lazy"><div class="visual-shine"></div></div><div class="visual-copy"><span>Pagina PDF ${page}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div></a>`;
}
function manualPage(params) {
    if (!state.manual)
        return loadingPage('Caricamento manuale…');
    const data = state.manual;
    const page = Math.max(1, Math.min(data.meta.pageCount, Number(params.get('page') || 1) || 1));
    const q = params.get('q')?.trim() || '';
    const results = q ? searchManual(data, q) : [];
    const currentText = data.pages.find(p => p.page === page)?.text || '';
    const title = titleForPage(data, page);
    const sidebar = q ? `
    <div class="manual-side-head"><span class="kicker">Risultati</span><b>${results.length} pagine</b></div>
    <div class="search-results">${results.length ? results.map(r => `
      <a class="search-result ${r.page === page ? 'selected' : ''}" href="#/manual?page=${r.page}&q=${encodeURIComponent(q)}">
        <span class="page-chip">${r.page}</span><div><strong>${esc(r.title)}</strong><small>${esc(r.path)}</small><p>${highlight(r.snippet, q)}</p></div>
      </a>`).join('') : `<div class="empty-mini"><p>Nessun risultato. Prova con termini più generici.</p></div>`}</div>` : `
    <div class="manual-side-head"><span class="kicker">Indice</span><b>${data.outline.length} capitoli</b></div>
    <div class="chapter-list">${data.outline.map((n, i) => `
      <details ${page >= n.page && page < (data.outline[i + 1]?.page ?? 9999) ? 'open' : ''}>
        <summary><a href="#/manual?page=${n.page}">${esc(n.title)}</a><span>${n.page}</span></summary>
        ${n.children.length ? `<div class="chapter-children">${n.children.slice(0, 18).map(c => `<a href="#/manual?page=${c.page}" class="${page === c.page ? 'selected' : ''}"><span>${esc(c.title)}</span><small>${c.page}</small></a>`).join('')}${n.children.length > 18 ? `<a href="#/manual?page=${n.page}"><span>Vedi sezione completa</span><small>→</small></a>` : ''}</div>` : ''}
      </details>`).join('')}</div>`;
    return `
  <section class="manual-shell">
    <div class="manual-toolbar">
      <form id="manual-search-form" class="manual-search" autocomplete="off">
        ${icon('search', 19)}<input name="q" value="${esc(q)}" placeholder="Cerca: ricarica, pneumatici, Autopark…" aria-label="Cerca nel manuale"><button type="submit">Cerca</button>
      </form>
      <a class="btn ghost compact-btn" href="./manual/Owners_Manual.pdf#page=${page}" target="_blank" rel="noopener">PDF ${icon('external', 16)}</a>
    </div>
    <div class="manual-grid">
      <aside class="manual-sidebar">${sidebar}</aside>
      <section class="manual-reader">
        <div class="reader-head">
          <div><span class="kicker">Pagina ${page} / ${data.meta.pageCount}</span><h1>${esc(title)}</h1></div>
          <div class="reader-controls">
            <a class="icon-btn ${page <= 1 ? 'disabled' : ''}" href="#/manual?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}" title="Pagina precedente">${icon('chevronLeft', 20)}</a>
            <form id="page-jump-form" class="page-jump"><input name="page" type="number" min="1" max="${data.meta.pageCount}" value="${page}" aria-label="Numero pagina"><span>/ ${data.meta.pageCount}</span></form>
            <a class="icon-btn ${page >= data.meta.pageCount ? 'disabled' : ''}" href="#/manual?page=${Math.min(data.meta.pageCount, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}" title="Pagina successiva">${icon('chevronRight', 20)}</a>
          </div>
        </div>
        <div class="reader-options">
          <label>Zoom <select id="manual-zoom"><option value="0.85">85%</option><option value="1" selected>100%</option><option value="1.2">120%</option><option value="1.5">150%</option></select></label>
          <button class="text-btn" id="toggle-text">Mostra testo accessibile</button>
        </div>
        <div class="page-stage" id="page-stage" style="--page-zoom:1">
          <img class="manual-page-img" src="${pageImage(page)}" alt="Pagina ${page} del manuale Model 3" decoding="async">
        </div>
        <div id="page-text" class="page-text" hidden><h3>Testo della pagina</h3><p>${esc(currentText).replace(/\n/g, '<br>')}</p></div>
        <div class="reader-foot">
          <a class="btn small" href="#/manual?page=${Math.max(1, page - 1)}">${icon('chevronLeft', 17)} Precedente</a>
          <span>${page}</span>
          <a class="btn small" href="#/manual?page=${Math.min(data.meta.pageCount, page + 1)}">Successiva ${icon('chevronRight', 17)}</a>
        </div>
      </section>
    </div>
  </section>`;
}
function highlight(text, q) {
    const safe = esc(text);
    const tokens = q.split(/\s+/).filter(t => t.length > 1).slice(0, 6).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!tokens.length)
        return safe;
    try {
        return safe.replace(new RegExp(`(${tokens.join('|')})`, 'gi'), '<mark>$1</mark>');
    }
    catch {
        return safe;
    }
}
function garagePage() {
    const p = state.profile;
    return `
  <section class="page-head section-pad compact"><div><span class="kicker">Profilo personale</span><h1>La mia auto</h1><p>Proprietario, vettura e assicurazione. I dati restano nel browser di questo dispositivo.</p></div><div class="head-badge">${icon('lock', 18)} Locale</div></section>
  <section class="section-pad compact">
    <div class="garage-shortcuts reveal">
      <a href="#/documents">${icon('file', 19)}<span><b>Documenti</b><small>${state.docs.length} file</small></span><i>→</i></a>
      <a href="#/photos">${icon('image', 19)}<span><b>Foto</b><small>${state.photos.length} immagini</small></span><i>→</i></a>
      <a href="#/service">${icon('wrench', 19)}<span><b>Tagliandi</b><small>${state.services.length} interventi</small></span><i>→</i></a>
    </div>
    <form id="profile-form" class="form-stack">
      <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('car')}</div><div><h2>Veicolo</h2><p>Dati identificativi e informazioni utili.</p></div></div>
        <div class="field-grid">
          ${field('vehicleName', 'Nome auto', p.vehicleName, 'Es. Aurora')}
          ${field('plate', 'Targa', p.plate, 'AB123CD')}
          ${field('vin', 'VIN', p.vin, '17 caratteri')}
          ${field('color', 'Colore', p.color, 'Es. Pearl White')}
          ${field('deliveryDate', 'Data consegna', p.deliveryDate, '', 'date')}
          ${field('odometer', 'Odometro attuale (km)', p.odometer, '25000', 'number')}
        </div>
        ${textarea('notes', 'Note veicolo', p.notes, 'Accessori, pneumatici, configurazione…')}
      </div>
      <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('file')}</div><div><h2>Proprietario</h2><p>Contatti e dati da avere a portata di mano.</p></div></div>
        <div class="field-grid">${field('ownerName', 'Nome e cognome', p.ownerName, '')}${field('phone', 'Telefono', p.phone, '+39 …', 'tel')}${field('email', 'Email', p.email, 'nome@email.it', 'email')}${field('address', 'Indirizzo', p.address, '')}</div>
      </div>
      <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('shield')}</div><div><h2>Assicurazione</h2><p>Polizza, scadenza e assistenza stradale.</p></div></div>
        <div class="field-grid">${field('insurer', 'Compagnia', p.insurer, '')}${field('policyNumber', 'Numero polizza', p.policyNumber, '')}${field('policyExpiry', 'Scadenza', p.policyExpiry, '', 'date')}${field('roadside', 'Assistenza / numero utile', p.roadside, '')}</div>
      </div>
      <div class="sticky-save"><button class="btn primary" type="submit">Salva profilo</button><span>Salvataggio locale automatico su questo browser.</span></div>
    </form>
  </section>`;
}
function field(name, label, value, placeholder = '', type = 'text') {
    return `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
}
function textarea(name, label, value, placeholder = '') {
    return `<label class="field full"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="4" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
}
function documentsPage() {
    return `
  <section class="page-head section-pad compact"><div><span class="kicker">Archivio</span><h1>Documenti</h1><p>Libretto, assicurazione, fatture, garanzia e qualsiasi file relativo alla vettura.</p></div><button class="btn primary" id="open-doc-form">${icon('plus', 18)} Aggiungi</button></section>
  <section class="section-pad compact">
    <div id="doc-upload-panel" class="upload-panel reveal">
      <form id="doc-form">
        <label class="drop-zone" for="doc-files">${icon('upload', 28)}<strong>Seleziona uno o più documenti</strong><span>PDF, immagini o altri file. Vengono salvati localmente.</span><input id="doc-files" name="files" type="file" multiple required></label>
        <div class="field-grid three">
          <label class="field"><span>Categoria</span><select name="category">${['Assicurazione', 'Libretto', 'Manutenzione', 'Acquisto', 'Garanzia', 'Altro'].map(x => `<option>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Scadenza (opzionale)</span><input name="expiry" type="date"></label>
          <label class="field"><span>Nota</span><input name="note" placeholder="Es. rinnovo 2027"></label>
        </div>
        <button class="btn primary" type="submit">Salva documenti</button>
      </form>
    </div>
    <div class="list-head"><h2>${state.docs.length} documenti</h2><div class="filter-pills"><button class="pill active" data-doc-filter="Tutti">Tutti</button>${['Assicurazione', 'Libretto', 'Manutenzione', 'Garanzia'].map(x => `<button class="pill" data-doc-filter="${x}">${x}</button>`).join('')}</div></div>
    <div id="document-list" class="document-list">${state.docs.length ? state.docs.map(documentRow).join('') : emptyState('file', 'Nessun documento', 'Carica il primo documento della vettura: rimarrà disponibile anche senza connessione.')}</div>
  </section>`;
}
function documentRow(d) {
    const left = daysTo(d.expiry);
    const expiryClass = left != null && left < 0 ? 'expired' : left != null && left <= 30 ? 'soon' : '';
    return `<article class="doc-row reveal" data-category="${esc(d.category)}">
    <div class="doc-icon">${icon(d.mime.startsWith('image/') ? 'image' : 'file', 22)}</div>
    <div class="doc-main"><strong>${esc(d.name)}</strong><span>${esc(d.category)} · ${fmtSize(d.size)}${d.note ? ` · ${esc(d.note)}` : ''}</span></div>
    <div class="doc-expiry ${expiryClass}">${d.expiry ? `<small>Scadenza</small><b>${fmtDate(d.expiry)}</b>` : '<small>Nessuna scadenza</small>'}</div>
    <div class="row-actions"><button class="icon-btn" data-download-doc="${d.id}" title="Apri/scarica">${icon('download', 18)}</button><button class="icon-btn danger" data-delete-doc="${d.id}" title="Elimina">${icon('trash', 18)}</button></div>
  </article>`;
}
function servicePage() {
    const total = state.services.reduce((s, e) => s + (e.cost || 0), 0);
    return `
  <section class="page-head section-pad compact"><div><span class="kicker">Cronologia</span><h1>Tagliandi e manutenzione</h1><p>Registra interventi, chilometraggio, officina, costi e allegati.</p></div><button class="btn primary" id="toggle-service-form">${icon('plus', 18)} Nuovo intervento</button></section>
  <section class="section-pad compact">
    <div class="mini-kpis reveal"><div><span>Interventi</span><strong>${state.services.length}</strong></div><div><span>Ultimo km</span><strong>${state.services[0]?.odometer ? state.services[0].odometer.toLocaleString('it-IT') : '—'}</strong></div><div><span>Costi registrati</span><strong>${fmtMoney(total)}</strong></div></div>
    <div id="service-form-panel" class="form-card reveal collapsed">
      <form id="service-form">
        <div class="field-grid three">${serviceField('date', 'Data', '', 'date', true)}${serviceField('odometer', 'Chilometraggio', '', 'number', true)}${serviceField('title', 'Intervento', '', 'text', true, 'Es. sostituzione filtro abitacolo')}${serviceField('workshop', 'Officina', '', 'text', false)}${serviceField('cost', 'Costo (€)', '', 'number', false)}<label class="field"><span>Allegato</span><input name="attachment" type="file"></label></div>
        <label class="field full"><span>Note</span><textarea name="note" rows="3" placeholder="Lavori eseguiti, ricambi, prossima scadenza…"></textarea></label>
        <button class="btn primary" type="submit">Aggiungi allo storico</button>
      </form>
    </div>
    <div class="timeline">${state.services.length ? state.services.map(serviceRow).join('') : emptyState('wrench', 'Storico vuoto', 'Aggiungi il primo tagliando o intervento per creare la cronologia della vettura.')}</div>
  </section>`;
}
function serviceField(name, label, value, type = 'text', required = false, placeholder = '') {
    return `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${name === 'cost' ? 'step="0.01"' : ''}></label>`;
}
function serviceRow(s) {
    return `<article class="timeline-item reveal"><div class="timeline-marker"></div><div class="timeline-date"><b>${fmtDate(s.date)}</b><span>${s.odometer ? `${s.odometer.toLocaleString('it-IT')} km` : ''}</span></div><div class="timeline-card"><div class="panel-head"><div><h3>${esc(s.title)}</h3><p>${esc(s.workshop || 'Officina non indicata')}</p></div><b>${fmtMoney(s.cost)}</b></div>${s.note ? `<p>${esc(s.note)}</p>` : ''}${s.attachmentName ? `<button class="attachment" data-download-service="${s.id}">${icon('file', 16)} ${esc(s.attachmentName)}</button>` : ''}<button class="text-btn danger-text" data-delete-service="${s.id}">Elimina</button></div></article>`;
}
function photosPage() {
    state.objectUrls.forEach(URL.revokeObjectURL);
    state.objectUrls = [];
    const cards = state.photos.map(p => {
        const url = URL.createObjectURL(p.blob);
        state.objectUrls.push(url);
        return `<figure class="photo-card reveal"><button class="photo-open" data-photo-url="${esc(url)}" data-photo-name="${esc(p.name)}"><img src="${url}" alt="${esc(p.name)}" loading="lazy"></button><figcaption><span>${esc(p.name)}</span><button class="icon-btn danger" data-delete-photo="${p.id}" title="Elimina">${icon('trash', 17)}</button></figcaption></figure>`;
    }).join('');
    return `<section class="page-head section-pad compact"><div><span class="kicker">Gallery</span><h1>Foto della vettura</h1><p>Conserva foto di carrozzeria, pneumatici, accessori, danni o lavori eseguiti.</p></div><label class="btn primary" for="photo-input">${icon('plus', 18)} Aggiungi foto<input id="photo-input" type="file" accept="image/*" multiple hidden></label></section><section class="section-pad compact"><div class="photo-grid">${cards || emptyState('image', 'Nessuna foto', 'Aggiungi le tue prime immagini. Le foto rimangono archiviate nel browser del dispositivo.')}</div></section>`;
}
function settingsPage() {
    return `<section class="page-head section-pad compact"><div><span class="kicker">Sistema</span><h1>Impostazioni</h1><p>Installazione, modalità offline, backup e privacy.</p></div></section>
  <section class="section-pad compact settings-grid">
    <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('download')}</div><div><h2>Installa la web app</h2><p>Aggiungila alla schermata Home per usarla come un’app.</p></div></div><button class="btn primary" id="install-app-settings">Installa / istruzioni</button><p class="fineprint">L’installazione richiede HTTPS oppure localhost. Su iPhone/iPad usa Safari → Condividi → “Aggiungi a Home”.</p></div>
    <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('book')}</div><div><h2>Manuale offline</h2><p>Scarica in cache tutte le 345 pagine illustrate per consultarle senza rete.</p></div></div><div class="offline-actions"><button class="btn" id="cache-manual">Scarica manuale offline</button><button class="text-btn danger-text" id="clear-manual-cache">Rimuovi cache</button></div><div id="offline-progress" class="progress-wrap" hidden><div class="progress-track"><span></span></div><small>Preparazione…</small></div></div>
    <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('shield')}</div><div><h2>Backup dei tuoi dati</h2><p>Esporta o importa profilo, documenti, foto e storico manutenzione.</p></div></div><div class="button-row"><button class="btn" id="export-backup">${icon('download', 17)} Esporta backup</button><label class="btn" for="import-backup">${icon('upload', 17)} Importa<input id="import-backup" type="file" accept="application/json,.json" hidden></label></div><p class="fineprint">Il backup può includere file personali. Conservalo in un luogo sicuro.</p></div>
    <div class="form-card reveal danger-zone"><div class="form-card-head"><div class="form-icon">${icon('trash')}</div><div><h2>Elimina dati locali</h2><p>Rimuove profilo, documenti, foto e tagliandi da questo browser.</p></div></div><button class="btn danger-btn" id="wipe-data">Elimina tutti i miei dati</button></div>
    <div class="form-card reveal"><div class="form-card-head"><div class="form-icon">${icon('info')}</div><div><h2>Informazioni</h2><p>Owner Hub è un companion personale non ufficiale. Il manuale integrato è quello fornito dall’utente: Model 3 2024+, software 2026.32, Europe.</p></div></div><a class="btn" href="./manual/Owners_Manual.pdf" target="_blank" rel="noopener">Apri PDF originale ${icon('external', 16)}</a></div>
  </section>`;
}
function emptyState(iconName, title, text) {
    return `<div class="empty-state"><div class="empty-icon">${icon(iconName, 30)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
}
function loadingPage(text) { return `<div class="loading-page"><div class="spinner"></div><p>${esc(text)}</p></div>`; }
function render() {
    state.objectUrls.forEach(URL.revokeObjectURL);
    state.objectUrls = [];
    const r = route();
    let body = '';
    if (r.path === '/')
        body = homePage();
    else if (r.path === '/manual')
        body = manualPage(r.params);
    else if (r.path === '/garage')
        body = garagePage();
    else if (r.path === '/documents')
        body = documentsPage();
    else if (r.path === '/service')
        body = servicePage();
    else if (r.path === '/photos')
        body = photosPage();
    else if (r.path === '/settings')
        body = settingsPage();
    else
        body = `<section class="section-pad"><h1>Pagina non trovata</h1><a class="btn" href="#/">Torna alla home</a></section>`;
    app.innerHTML = shell(body);
    bindCommon();
    bindRoute(r.path);
    requestAnimationFrame(setupReveal);
    scrollTo({ top: 0, behavior: 'instant' });
}
function bindCommon() {
    document.querySelector('#install-app')?.addEventListener('click', installApp);
    document.querySelector('#install-app-settings')?.addEventListener('click', installApp);
    const hero = document.querySelector('.hero-visual');
    if (hero) {
        hero.addEventListener('pointermove', e => {
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - .5, y = (e.clientY - rect.top) / rect.height - .5;
            hero.style.setProperty('--ry', `${x * 10}deg`);
            hero.style.setProperty('--rx', `${-y * 8}deg`);
        });
        hero.addEventListener('pointerleave', () => { hero.style.setProperty('--ry', '0deg'); hero.style.setProperty('--rx', '0deg'); });
    }
}
function bindRoute(path) {
    if (path === '/manual')
        bindManual();
    if (path === '/garage')
        bindProfile();
    if (path === '/documents')
        bindDocuments();
    if (path === '/service')
        bindService();
    if (path === '/photos')
        bindPhotos();
    if (path === '/settings')
        bindSettings();
}
function bindManual() {
    document.querySelector('#manual-search-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const q = String(fd.get('q') || '').trim();
        location.hash = q ? `#/manual?q=${encodeURIComponent(q)}` : '#/manual';
    });
    document.querySelector('#page-jump-form')?.addEventListener('submit', e => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); location.hash = `#/manual?page=${fd.get('page')}`; });
    const jump = document.querySelector('#page-jump-form input');
    jump?.addEventListener('change', () => { location.hash = `#/manual?page=${jump.value}`; });
    const zoom = document.querySelector('#manual-zoom');
    zoom?.addEventListener('change', () => document.querySelector('#page-stage')?.style.setProperty('--page-zoom', zoom.value));
    document.querySelector('#toggle-text')?.addEventListener('click', e => { const el = document.querySelector('#page-text'); if (!el)
        return; el.hidden = !el.hidden; e.currentTarget.textContent = el.hidden ? 'Mostra testo accessibile' : 'Nascondi testo'; });
}
function bindProfile() {
    document.querySelector('#profile-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const next = { ...defaultProfile };
        Object.keys(next).forEach(k => next[k] = String(fd.get(k) || ''));
        saveProfile(next);
        toast('Profilo salvato su questo dispositivo.');
        render();
    });
}
function bindDocuments() {
    document.querySelector('#doc-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const input = form.querySelector('#doc-files');
        const files = [...(input?.files || [])];
        if (!files.length)
            return;
        const category = String(fd.get('category') || 'Altro'), expiry = String(fd.get('expiry') || ''), note = String(fd.get('note') || '');
        for (const f of files)
            await db.addDocument({ id: id(), name: f.name, mime: f.type || 'application/octet-stream', size: f.size, category, expiry, note, createdAt: new Date().toISOString(), blob: f });
        state.docs = await db.listDocuments();
        toast(`${files.length} documento${files.length > 1 ? 'i' : ''} salvato${files.length > 1 ? 'i' : ''}.`);
        render();
    });
    document.querySelectorAll('[data-doc-filter]').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('[data-doc-filter]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.docFilter;
        document.querySelectorAll('.doc-row').forEach(row => row.hidden = f !== 'Tutti' && row.dataset.category !== f);
    }));
    document.querySelectorAll('[data-download-doc]').forEach(btn => btn.addEventListener('click', () => downloadDocument(btn.dataset.downloadDoc)));
    document.querySelectorAll('[data-delete-doc]').forEach(btn => btn.addEventListener('click', async () => { if (!confirm('Eliminare questo documento?'))
        return; await db.deleteDocument(btn.dataset.deleteDoc); state.docs = await db.listDocuments(); render(); }));
}
async function downloadDocument(idValue) { const d = state.docs.find(x => x.id === idValue); if (!d)
    return; const url = URL.createObjectURL(d.blob); const a = document.createElement('a'); a.href = url; a.download = d.name; a.target = '_blank'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
function bindService() {
    document.querySelector('#toggle-service-form')?.addEventListener('click', () => document.querySelector('#service-form-panel')?.classList.toggle('collapsed'));
    document.querySelector('#service-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const attachment = fd.get('attachment');
        const entry = { id: id(), date: String(fd.get('date') || ''), odometer: Number(fd.get('odometer') || 0), title: String(fd.get('title') || ''), workshop: String(fd.get('workshop') || ''), cost: fd.get('cost') ? Number(fd.get('cost')) : null, note: String(fd.get('note') || ''), createdAt: new Date().toISOString() };
        if (attachment && attachment.size) {
            entry.attachmentName = attachment.name;
            entry.attachmentMime = attachment.type;
            entry.attachmentBlob = attachment;
        }
        await db.addService(entry);
        state.services = await db.listServices();
        toast('Intervento aggiunto allo storico.');
        render();
    });
    document.querySelectorAll('[data-delete-service]').forEach(btn => btn.addEventListener('click', async () => { if (!confirm('Eliminare questo intervento?'))
        return; await db.deleteService(btn.dataset.deleteService); state.services = await db.listServices(); render(); }));
    document.querySelectorAll('[data-download-service]').forEach(btn => btn.addEventListener('click', () => { const s = state.services.find(x => x.id === btn.dataset.downloadService); if (!s?.attachmentBlob)
        return; const u = URL.createObjectURL(s.attachmentBlob); const a = document.createElement('a'); a.href = u; a.download = s.attachmentName || 'allegato'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); }));
}
function bindPhotos() {
    document.querySelector('#photo-input')?.addEventListener('change', async (e) => { const input = e.currentTarget; const files = [...(input.files || [])]; for (const f of files) {
        if (!f.type.startsWith('image/'))
            continue;
        await db.addPhoto({ id: id(), name: f.name, mime: f.type, createdAt: new Date().toISOString(), blob: f });
    } state.photos = await db.listPhotos(); toast(`${files.length} foto aggiunte.`); render(); });
    document.querySelectorAll('[data-delete-photo]').forEach(btn => btn.addEventListener('click', async () => { if (!confirm('Eliminare questa foto?'))
        return; await db.deletePhoto(btn.dataset.deletePhoto); state.photos = await db.listPhotos(); render(); }));
    document.querySelectorAll('.photo-open').forEach(btn => btn.addEventListener('click', () => showPhoto(btn.dataset.photoUrl, btn.dataset.photoName || 'Foto')));
}
function bindSettings() {
    document.querySelector('#cache-manual')?.addEventListener('click', cacheManualOffline);
    document.querySelector('#clear-manual-cache')?.addEventListener('click', async () => { await caches.delete('model3-manual-pages-v1'); toast('Cache del manuale rimossa.'); });
    document.querySelector('#export-backup')?.addEventListener('click', exportBackup);
    document.querySelector('#import-backup')?.addEventListener('change', async (e) => { const input = e.currentTarget; const f = input.files?.[0]; if (f)
        await importBackup(f); });
    document.querySelector('#wipe-data')?.addEventListener('click', async () => { if (!confirm('Eliminare definitivamente tutti i dati personali salvati in questa web app?'))
        return; await db.clearAll(); localStorage.removeItem('m3-owner-profile'); state.profile = { ...defaultProfile }; state.docs = []; state.photos = []; state.services = []; toast('Dati locali eliminati.'); render(); });
}
function setupReveal() {
    const els = [...document.querySelectorAll('.reveal')];
    if (!('IntersectionObserver' in window)) {
        els.forEach(x => x.classList.add('visible'));
        return;
    }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
    } }), { threshold: .08 });
    els.forEach(x => io.observe(x));
}
function toast(message) { const el = document.querySelector('#toast'); if (!el)
    return; el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
async function installApp() {
    if (state.installPrompt) {
        await state.installPrompt.prompt();
        await state.installPrompt.userChoice;
        state.installPrompt = null;
        return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    showModal('Installa Owner Hub', isiOS ? `<p>Su iPhone/iPad:</p><ol><li>Apri questa pagina in <b>Safari</b>.</li><li>Tocca <b>Condividi</b>.</li><li>Scegli <b>Aggiungi a Home</b>.</li></ol>` : `<p>Apri il menu del browser e scegli <b>Installa app</b> o <b>Aggiungi alla schermata Home</b>. Se l’opzione non compare, assicurati di usare HTTPS o localhost.</p>`);
}
function showModal(title, body) { const root = document.querySelector('#modal-root'); if (!root)
    return; root.innerHTML = `<div class="modal-backdrop"><div class="modal"><button class="modal-close" aria-label="Chiudi">×</button><h2>${esc(title)}</h2>${body}</div></div>`; root.querySelector('.modal-close')?.addEventListener('click', () => root.innerHTML = ''); root.querySelector('.modal-backdrop')?.addEventListener('click', e => { if (e.target === e.currentTarget)
    root.innerHTML = ''; }); }
function showPhoto(url, name) { showModal(name, `<img class="modal-photo" src="${esc(url)}" alt="${esc(name)}">`); }
async function cacheManualOffline() {
    const wrap = document.querySelector('#offline-progress'), bar = wrap?.querySelector('.progress-track span'), label = wrap?.querySelector('small');
    if (!wrap || !bar || !label)
        return;
    if (!('caches' in window)) {
        toast('Cache offline non supportata da questo browser.');
        return;
    }
    wrap.hidden = false;
    const cache = await caches.open('model3-manual-pages-v1');
    const total = state.manual?.meta.pageCount || 345;
    for (let i = 1; i <= total; i++) {
        const url = pageImage(i);
        try {
            const req = new Request(url);
            const hit = await cache.match(req);
            if (!hit) {
                const res = await fetch(req);
                if (res.ok)
                    await cache.put(req, res.clone());
            }
        }
        catch { }
        if (i % 3 === 0 || i === total) {
            bar.style.width = `${(i / total) * 100}%`;
            label.textContent = `${i} / ${total} pagine`;
            await new Promise(r => setTimeout(r, 0));
        }
    }
    toast('Manuale disponibile offline.');
    label.textContent = 'Download offline completato.';
}
function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(blob); }); }
function dataUrlToBlob(dataUrl) { const [head, data] = dataUrl.split(','); const mime = /data:([^;]+)/.exec(head)?.[1] || 'application/octet-stream'; const bin = atob(data); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)
    bytes[i] = bin.charCodeAt(i); return new Blob([bytes], { type: mime }); }
async function exportBackup() {
    toast('Preparazione backup…');
    const documents = [];
    for (const d of state.docs)
        documents.push({ ...d, blob: await blobToDataUrl(d.blob) });
    const photos = [];
    for (const p of state.photos)
        photos.push({ ...p, blob: await blobToDataUrl(p.blob) });
    const services = [];
    for (const s of state.services)
        services.push({ ...s, attachmentBlob: s.attachmentBlob ? await blobToDataUrl(s.attachmentBlob) : undefined });
    const payload = { version: 1, exportedAt: new Date().toISOString(), profile: state.profile, documents, photos, services };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model3-owner-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Backup esportato.');
}
async function importBackup(file) {
    try {
        const payload = JSON.parse(await file.text());
        if (payload.version !== 1)
            throw new Error('Versione backup non compatibile');
        if (!confirm('Importare questo backup e sostituire i dati locali attuali?'))
            return;
        await db.clearAll();
        saveProfile({ ...defaultProfile, ...payload.profile });
        for (const d of payload.documents || [])
            await db.addDocument({ ...d, blob: dataUrlToBlob(d.blob) });
        for (const p of payload.photos || [])
            await db.addPhoto({ ...p, blob: dataUrlToBlob(p.blob) });
        for (const s of payload.services || [])
            await db.addService({ ...s, attachmentBlob: s.attachmentBlob ? dataUrlToBlob(s.attachmentBlob) : undefined });
        [state.docs, state.photos, state.services] = await Promise.all([db.listDocuments(), db.listPhotos(), db.listServices()]);
        toast('Backup importato.');
        render();
    }
    catch (err) {
        console.error(err);
        toast('Backup non valido o danneggiato.');
    }
}
async function init() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.installPrompt = e; });
    window.addEventListener('hashchange', render);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
    }
    app.innerHTML = shell(loadingPage('Preparazione Owner Hub…'));
    try {
        [state.manual, state.docs, state.photos, state.services] = await Promise.all([loadManual(), db.listDocuments(), db.listPhotos(), db.listServices()]);
    }
    catch (err) {
        console.error(err);
    }
    render();
}
init();
//# sourceMappingURL=app.js.map