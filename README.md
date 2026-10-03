# Model 3 Owner Hub

Web app/PWA personale in tema chiaro, progettata a partire dal manuale Model 3 2024+ fornito dall'utente (software 2026.32, Europe).

## Cosa include

- Manuale completo in 345 pagine illustrate, con indice ricavato dai segnalibri PDF e ricerca testuale locale.
- Viewer mobile-first con pagina precedente/successiva, salto pagina, zoom e testo accessibile.
- PDF originale incluso come riferimento.
- Area **La mia auto**: proprietario, VIN, targa, data consegna, odometro, colore, note, assicurazione e assistenza stradale.
- Archivio **Documenti** con file, categorie, scadenze e note.
- **Foto** della vettura in galleria.
- **Storico tagliandi/manutenzione** con km, officina, costo, note e allegato.
- Backup/import dei dati personali in JSON.
- PWA installabile su telefono e desktop.
- Download opzionale di tutte le pagine del manuale per uso offline.
- Animazioni, glow, glass UI e card con effetto 3D; supporto `prefers-reduced-motion`.

## Privacy

I dati personali caricati nell'area privata vengono salvati nel browser tramite IndexedDB/localStorage. In questa versione non vengono inviati a un server e non vengono sincronizzati automaticamente tra dispositivi.

> Importante: se cancelli i dati del browser puoi perdere l'archivio locale. Usa periodicamente **Impostazioni → Esporta backup**.

## Avvio rapido

La cartella è già compilata e pronta per essere servita da un web server statico.

### Con Python

```bash
python -m http.server 8080
```

Poi apri `http://localhost:8080`.

### Con Node

```bash
npx serve .
```

### Deploy

Puoi pubblicare l'intera cartella su qualsiasi hosting statico HTTPS (Netlify, Vercel static, Cloudflare Pages, GitHub Pages configurato alla root del progetto, server personale, ecc.). La PWA può essere installata solo da HTTPS o da localhost.

## Installazione sul telefono

- **iPhone/iPad**: apri il sito in Safari → Condividi → **Aggiungi a Home**.
- **Android/Chrome**: usa il pulsante Installa nell'app oppure il menu del browser → **Installa app / Aggiungi alla schermata Home**.

## Sviluppo

Il codice sorgente è in `src/` ed è scritto in TypeScript senza framework runtime e senza dipendenze esterne lato client. Usa API web moderne: ES modules, Web Animations/CSS, View-ready responsive layout, IndexedDB, Cache API e Service Worker.

Per ricompilare:

```bash
npm install
npm run build
```

I file JavaScript compilati vengono generati in `js/`.

## Struttura

- `index.html` – shell dell'app
- `styles.css` – UI, responsive, glow e 3D
- `src/` – sorgente TypeScript
- `js/` – build JavaScript pronta all'uso
- `manual/manual-data.json` – indice + testo ricercabile delle 345 pagine
- `manual/pages/` – rendering delle pagine del manuale
- `manual/Owners_Manual.pdf` – PDF originale
- `service-worker.js` – cache PWA/offline
- `manifest.webmanifest` – installazione PWA
- `assets/` – icone e visual derivati dal manuale

## Nota

Questa è una companion app personale non ufficiale e non affiliata a Tesla. Le informazioni specifiche del veicolo e le note di rilascio sul touchscreen possono avere precedenza rispetto a una copia statica del manuale.
