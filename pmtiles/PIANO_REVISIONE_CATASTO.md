# Piano di revisione di `catasto-app.html`

Obiettivo: portare l'app a un'interfaccia chiara, accessibile e a un codice mantenibile, senza toccare i dati né il formato PMTiles.

Riferimenti visivi: canvas "Revisione Catasto App" (tavola Critica e piano, proposta desktop, proposta mobile): https://claude.ai/artifact/FiFfL395hQmaTNoAhhUoK9

File coinvolti: `pmtiles/catasto-app.html`, `pmtiles/css/catasto.css`, `pmtiles/js/catasto_script.js`.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Correzioni rapide | Fatta, da commitare |
| 2 | Nuova interfaccia | Fatta (2.1–2.8); Lighthouse Accessibilità 100 |
| 3 | Struttura del codice | Da fare |

### Fase 1, già applicata
- Zoom di sistema sbloccato (`user-scalable=no` tolto).
- Font minimo 12px.
- `<head>` riordinato, `canonical` e `og:url` corretti.
- Refusi sistemati.
- `role`, `tabindex`, `aria-label` sui controlli non-button; `aria-pressed` sui livelli; Esc chiude i pannelli; focus visibile; `prefers-reduced-motion`.
- Google Analytics solo dopo consenso (banner `#consent-banner`).
- Tile Google sostituite con Esri World Imagery; livello rinominato "Foto aerea".

## Decisioni da prendere prima di iniziare

1. **Sorgente della foto aerea.** Esri World Imagery ha condizioni d'uso proprie per l'uso pubblico. Alternative: ortofoto Regione Sicilia o AGEA. L'URL è in due punti di `js/catasto_script.js` (cerca `arcgisonline`).
2. **Contatore.** Tenere Google Analytics con consenso, o passare a uno senza cookie. Se si cambia, il banner consenso si può togliere.
3. **Copia OMI.** `pmtiles/catasto-omi-valore/catasto-app.html` (445 righe) diverge dall'app principale (490). Decidere quale è la sorgente di verità prima della Fase 3.
4. **Contesto Impeccable.** Creare `PRODUCT.md` e `DESIGN.md` nella radice con `$impeccable init` e `$impeccable document`. Il design di riferimento è la "tavola catastale" descritta sotto.

## Fase 2. Nuova interfaccia

Modalità: Operate (si lavora, non si legge). Precisione prima dell'espressione.

### 2.1 Token CSS e scala `z-index`
In `css/catasto.css`, sostituire le variabili di `:root` (righe 9–28) con:

```css
:root {
  --paper: #F3F4F1;      /* fondo */
  --panel: #FFFFFF;      /* superfici sopra la mappa */
  --ink: #15191C;        /* testo, 17:1 */
  --ink-2: #4A535B;      /* testo secondario, 7,9:1 */
  --line: #D9DDD8;       /* filetti */
  --line-strong: #C9CEC8;
  --accent: #FF9900;     /* selezione e azione primaria, testo #1A1100 */
  --accent-ink: #1A1100;
  --accent-text: #9A5400;/* link e icone attive su bianco, 5,8:1 */
  --radius-ctl: 8px;
  --radius-panel: 12px;
  --z-map: 0; --z-ctl: 10; --z-panel: 20; --z-card: 30; --z-overlay: 40; --z-toast: 50;
}
```

- Sostituire i quindici `z-index` (da 1 a 99999) con queste sei variabili.
- Togliere i 41 `!important` uno alla volta: dove serve battere una regola di MapLibre, alzare la specificità del selettore.
- Una sola elevazione: filetto da 1px, ombra solo sui pannelli che coprono la mappa.
- Togliere gradienti, `backdrop-filter: blur(20px)` e raggi da 16/24px.

### 2.2 Font
- Plex Sans 400/500/600 per l'interfaccia, Plex Mono 500 per foglio, particella e superfici (con `font-variant-numeric: tabular-nums`). Al posto di Poppins in 8 pesi.
- Self-hosted in `pmtiles/fonts/` (woff2, `font-display: swap`).

### 2.3 Layout desktop (da 900px in su)
- **Pannello sinistro** 360px, tab Livelli / Cerca / Informazioni (vedi tavola desktop).
- **Controlli mappa** in pila a destra in basso: + / −, vista iniziale, schermo intero.
- **Scheda** in alto a destra, 340px, chiudibile.
- **Badge zoom** e attribuzioni in basso a sinistra.
- Eliminare: barra comandi in alto, `.zoom-bar` con slider 12–18, `.search-tab`, `#sidepanel-tab` e cassetto inferiore, logo flottante (il logo va nel piede del pannello).

### 2.4 Layout mobile (sotto 900px)
- Barra di ricerca in alto (campo unico con "foglio e particella, o via e civico").
- Barra inferiore a 4 voci: Livelli, Cerca, Scheda, Info, con etichette di testo sempre visibili.
- Livelli, Cerca e Info come pannelli a scorrimento dal basso (stati: chiuso, metà, pieno), non come modali a tutto schermo.
- Scheda particella come pannello a scorrimento dal basso con maniglia.
- Bersagli di tocco minimi 44px.

### 2.5 Pannello Livelli con legenda integrata
- Per ogni livello: campione del colore reale in mappa, nome, interruttore con `aria-pressed`.
- Gruppi con intestazione: Urbanistica, Catasto e valori, Sfondo.
- Lo sfondo è un gruppo di tre opzioni mutuamente esclusive: Mappa, Foto aerea, Carta tecnica 2k.
- La legenda del PRG (oggi `legenda.svg` nel tab Legenda) si apre da un link sotto la riga Zonizzazione.
- Mostrare un avviso accanto ai livelli con `minzoom` non raggiunto (oggi i livelli spariscono senza spiegazione).
- Icone monocromatiche, stesso tratto, SVG inline (poche; niente Font Awesome intero).

### 2.6 Scheda particella
- Intestazione `F. 12 · P. 345` in Plex Mono 22px.
- Elenco etichetta/valore (superficie, zona PRG, vincoli, zona OMI, civico) con `<dl>`.
- Azioni: "Scarica scheda PDF" (arancio, testo scuro), "Visura su SISTER" (secondario).
- Nel JS, `buildInfoCard` e `buildOMIPopup` (righe 1337 e 1353 circa) costruiscono l'HTML con stringhe: riscriverle sul nuovo markup e passare ogni valore per una funzione `esc()` prima dell'inserimento.

### 2.7 Pagina Informazioni al posto dei sette tab
- Sezioni: Guida, Fonti e licenze, Crediti. Accordion con `<details>`.
- Spostare in una pagina a parte (`pmtiles/informazioni-tecniche.html`) i contenuti dei tab Strumenti, Ricerca, PDF, Video: parlano di PMTiles e strumenti, non servono a chi cerca una particella.
- Accorciare il disclaimer e i testi lunghi; tenere i link alle fonti e le licenze CC-BY 4.0.
- Eliminare il popup novità (`#news-popup-overlay`, `initNewsPopup`). Al suo posto, un'etichetta "Nuovo" accanto ai livelli recenti, ricordata in `localStorage`.

### 2.8 Tema scuro
- Variante dei token in `@media (prefers-color-scheme: dark)`, con `:root[data-theme="light"|"dark"]` se si vuole un interruttore.
- Verificare i contrasti dei campioni di colore dei livelli su sfondo scuro.

### Verifica della Fase 2
- Schermate a 1440×900, 1024×768, 390×844 e 320×568, tema chiaro e scuro.
- Solo tastiera: Tab attraversa ricerca, livelli, scheda, controlli mappa; Esc chiude ogni pannello; il focus torna al pulsante che ha aperto il pannello.
- Zoom del browser al 200%: nessun testo tagliato.
- Contrasto 4,5:1 sul testo, 3:1 sui bordi dei controlli.
- Lighthouse Accessibilità ≥ 95.

## Fase 3. Struttura del codice

### 3.1 HTML valido e pulito
- Validare con il checker W3C: zero errori.
- Spostare tutto lo stile inline (14 `style="…"`) in `css/catasto.css`.
- Sostituire i 32 `onclick` inline con `addEventListener`, per delega di evento sui contenitori.
- `<head>` finale: meta, `canonical`, stylesheet, script con `defer`.

### 3.2 Dipendenze
- Aggiornare MapLibre GL (oggi 3.3.0) e PMTiles (oggi 2.4.0) all'ultima versione stabile; leggere il changelog di entrambe per le modifiche rotte (API del protocollo `pmtiles`, `addProtocol`).
- Fissare versioni esatte: `@turf/turf@6.5.0`, `interactjs` con versione. Aggiungere `integrity` (SRI) e `crossorigin="anonymous"` ai file da CDN.
- Togliere Font Awesome 6.0.0 dopo la migrazione a SVG inline.
- Valutare se `interact.js` serve ancora: il nuovo pannello non è ridimensionabile.

### 3.3 Caricamento
- `jsPDF`, `html2canvas`, `Turf` con `import()` al primo clic su "Scheda PDF" o al primo calcolo di aree.
- Tutto il resto con `defer`.
- Obiettivo: dimezzare il JavaScript scaricato prima del primo disegno della mappa.

### 3.4 JavaScript in moduli ES
Dividere `js/catasto_script.js` (2.049 righe, `window.map` e funzioni globali) in:

```
js/
  main.js          avvio, creazione mappa, stato
  layers.js        sorgenti, layer, interruttori, legenda
  search.js        ricerca foglio/particella e via/civico
  card.js          scheda particella (buildInfoCard, buildOMIPopup)
  pdf.js           generazione PDF (caricato a richiesta)
  ui.js            pannelli, a11y, tastiera, tema
  state.js         stato condiviso (layerStates, layerMapping) e hash URL
```

- Niente `window.map` globale: passare l'istanza ai moduli.
- Sostituire i `setTimeout` di sequenza (loader, popup) con eventi: `map.once('load')`, `map.once('idle')`, `transitionend`.
- Il loader si nasconde su `idle`, non dopo un tempo fisso.

### 3.5 Ricerca per foglio e particella
Oggi `searchParticella()` cerca con `queryRenderedFeatures`: se la tessera non è caricata, errore.

- Produrre un indice `data/fogli_index.json`: per ogni foglio, riquadro (bbox) e centroide. Generarlo da QGIS o da uno script sul dato sorgente delle particelle.
- Flusso: leggere l'indice, `map.fitBounds` sul foglio, attendere `idle`, poi cercare la particella tra le feature renderizzate e evidenziarla.
- Stesso schema già usato per i civici (`loadCiviciIndex`). Mantenere il suggerimento sul nome via.
- Sostituire i `keypress` sugli input con un `<form>` e `submit`.
- Messaggio d'errore: "Particella non trovata nel foglio 12" invece di chiedere di spostare la mappa.

### 3.6 PDF in qualsiasi orientamento
Oggi `generatePDF()` cattura la mappa a schermo con html2canvas, quindi su mobile serve il landscape.

- Creare una seconda mappa MapLibre fuori schermo (`position: fixed; left: -9999px`) di dimensione fissa A4 (per esempio 1123×794 px a 96 dpi), con `preserveDrawingBuffer: true`.
- Centrarla sulla particella, attendere `idle`, leggere il canvas e comporre il PDF con jsPDF.
- Togliere dall'interfaccia e dalla guida l'avviso "ruota il dispositivo".

### 3.7 Stato nell'URL
- L'hash di MapLibre (`hash: true`) tiene già posizione e zoom.
- Aggiungere i livelli attivi e la particella selezionata, per esempio `#17.2/38.116/13.361&l=prg,part&p=F12P345`.
- All'apertura, leggere i parametri e ripristinare livelli e selezione.

### 3.8 Una sola copia dell'app
- Se si decide di unificare: una sola `catasto-app.html`, con la variante OMI come configurazione (`?variante=omi` o un oggetto `config` per elenco livelli e pmtiles).
- Cancellare la copia in `catasto-omi-valore/` e lasciare un reindirizzamento.
- Cancellare `css/catasto_old.css` se non referenziato.

### 3.9 Ripulire `catasto-app.html`
- Correggere `og:title` e `twitter:title` ("Palermo Hub – Contenitore di mappe…") con un titolo specifico per questa pagina.
- Verificare che `og:image` (`catasto.jpg`) esista.
- Aggiungere `<noscript>` con un messaggio.

### Verifica della Fase 3
- `node --check` e un linter (ESLint) senza errori sui moduli.
- Peso trasferito al primo caricamento prima e dopo (pannello Rete di Chrome).
- PDF generato a 390×844 in verticale e a 1440×900.
- Ricerca di una particella lontana dall'area visibile: la mappa vola al foglio e la evidenzia.
- Apertura di un link con livelli e particella nell'hash: stato ripristinato.

## Ordine consigliato
1. Commit della Fase 1 e decisioni 1–4.
2. Fase 2.1–2.2 (token e font), poi 2.3–2.6 (layout e scheda), poi 2.7–2.8.
3. Fase 3.1–3.3 (HTML, dipendenze, caricamento).
4. Fase 3.4 (moduli) prima di 3.5–3.7, che toccano ricerca, PDF e URL.
5. Fase 3.8–3.9 alla fine.

Ogni punto è rilasciabile da solo. Dopo ogni fase, ripetere la critica con `$impeccable critique pmtiles/catasto-app.html` e confrontare il punteggio con il 20/40 di partenza.

## Fuori programma
- Modifiche ai dati (PMTiles, CSV, metadati).
- Cambio di libreria cartografica.
- Pagine collegate (`index_prg.html` e altre): stessa revisione, ma in un secondo momento.
