# Catasto app: istruzioni per completare la Fase 3 (3.5–3.9)

Documento di passaggio per riprendere il lavoro con Claude o DeepSeek (o a mano). Leggi anche `PIANO_REVISIONE_CATASTO.md` (sezione Fase 3), che descrive gli obiettivi; qui ci sono stato attuale, regole e modo di verificare.

## Stato al 2026-11-03
Branch `PH-release-v2.0`, ultimo commit `49990185c8`, pushato. Fatti 3.1–3.4:

| Punto | Esito |
|---|---|
| 3.1 HTML | W3C a zero errori, azioni con `data-action` e delega, niente `onclick`/`style` inline |
| 3.2 Dipendenze | MapLibre GL 6.16.0 (solo ES module, import map con SRI), PMTiles 4.5.0, icone SVG in `icons.svg` (Font Awesome tolto), interact.js e html2canvas tolti |
| 3.3 Caricamento | jsPDF e Turf caricati al primo PDF (`loadLib` in `pdf.js`, script con SRI) |
| 3.4 Moduli | `js/main.js` (avvio), `state.js`, `ui.js`, `layers.js`, `search.js`, `card.js`, `pdf.js` (caricato con `import()`) |

Restano: **3.5 ricerca con indice fogli, 3.6 PDF A4 fuori schermo, 3.7 stato nell'URL, 3.8 una sola copia dell'app, 3.9 pulizia finale della pagina**.

## Struttura del codice
- `catasto-app.html`: pagina (sorgente di verità). Gira in iframe dentro palermohub: **GA e banner cookie li gestisce il contenitore, non rimetterli**.
- `js/state.js`: oggetto `state` condiviso (`map`, `isMobile`, `currentParticella`, `civiciIndex`, ...), `layerStates`, `layerMapping`, `DATA_CATASTO` (data catasto unica), `BASE_STYLES`.
- `js/main.js`: tabella `ACTIONS` (nome azione → funzione), `createMap()`, caricamento a eventi.
- `js/ui.js`: tema, pannelli, minimappa satellite, galleria, accessibilità, `esc`, `iconSvg`, `setIcon`.
- `js/layers.js`: sorgenti e layer, interruttori, `setupMapInteractions`.
- `js/card.js`: scheda particella, quotazioni OMI, `onMapClick`.
- `js/search.js`: ricerca foglio/particella e via/civico, `initSearch`.
- `js/pdf.js`: generazione PDF. Si importa solo al clic.
- Un nuovo pulsante nell'HTML = `data-action="nome"` + voce in `ACTIONS` di `main.js`. Niente `onclick`.
- Niente `window.map`: si usa `state.map`. Con `?debug` nell'indirizzo `window.map` esiste, solo per le prove da console.

## Regole
- Rispondere e commentare in italiano. Un commit per punto, messaggi in stile `tipo(catasto): ...`.
- **Non toccare dati/PMTiles/CSV.** Il file `civici_index.json` si può leggere, non modificare a mano.
- File con fine riga CRLF: le modifiche con Python in modalità testo li preservano; non convertirli.
- Mantenere il W3C a zero errori e Lighthouse accessibilità a 100 (oggi 100).
- Versioni delle librerie fisse + SRI. Se cambi un file da CDN, ricalcola l'hash: `curl -sL URL | openssl dgst -sha384 -binary | openssl base64 -A`.
- Dopo 3.5 e 3.6 aggiornare i testi: nella **Guida** ("Cercare", "Scheda PDF"), nella tab **Tecnica** ("Ricerca e PMTiles", "Stampa PDF") e nel testo di `#search-info-text` (in `search.js`, `switchSearchMode`) che oggi dicono "la ricerca opera sull'area visibile" e "PDF solo in orizzontale". Dopo 3.7 aggiornare "Condividere".
- Fermarsi e chiedere conferma a fine di ogni punto se cambia comportamento visibile; non pushare senza richiesta. Prima del push: `git pull --rebase origin PH-release-v2.0` (il remoto riceve commit automatici di dati).

## 3.5 Ricerca per foglio e particella
Problema: `searchParticella()` in `search.js` usa `querySourceFeatures` sulle tessere già caricate; fuori vista dà errore.

1. Generare `pmtiles/fogli_index.json`: per ogni foglio, bbox e centroide. Va prodotto dal dato sorgente delle particelle (QGIS o script); i PMTiles sono in `https://palermohub.github.io/PRG2004/particelle/particelle.pmtiles`, layer `particelle`, campi `Foglio` e `Paricella` (sì, con il refuso nel dato: non correggerlo). Se non hai il dato sorgente, chiedi all'utente di esportare l'elenco o di eseguire lo script in QGIS. Formato suggerito: `{"134": {"bbox":[w,s,e,n]}, ...}`.
2. Flusso: leggi l'indice → `map.fitBounds(bbox)` → attendi `map.once('idle')` → cerca la particella con `querySourceFeatures` (filtro su `Foglio` e `Paricella`) → evidenzia (`highlighted-polygon`) e apri la scheda come oggi.
3. Schema già usato per i civici: `loadCiviciIndex` in `search.js`. Il file va caricato in modo lazy (solo quando si apre la ricerca); stesso discorso per `civici_index.json` (4,3 MB oggi caricato all'avvio, da spostare a richiesta).
4. Sostituire i `keypress` dei campi con un `<form>` e l'evento `submit` (in HTML: `<form id="form-foglio">`, pulsante `type="submit"`; togliere `data-action="searchParticella"` e relativo `enter()` in `initSearch`).
5. Messaggi: "Particella non trovata nel foglio 12" (se il foglio esiste), "Foglio 99 non trovato" (se no).

Prova: cerca foglio 134 particella 1 da una vista lontana (zoom 12 su altra zona): la mappa deve volare e la scheda aprirsi con "F. 134 · P. 1".

## 3.6 PDF in qualsiasi orientamento
Problema: `generatePDF()` in `pdf.js` cattura `state.map.getCanvas()` e su telefono in verticale rifiuta (alert).

1. Creare una seconda mappa MapLibre fuori schermo (`position: fixed; left: -9999px`), dimensione A4 fissa (es. 1123×794 px), con `canvasContextAttributes: { preserveDrawingBuffer: true }`, stesse sorgenti/layer rilevanti (particelle, zto, vincoli, base), centrata sulla particella. Attendere `idle`, leggere il canvas, comporre il PDF con jsPDF, distruggere la mappa (`map.remove()`).
2. Così non serve più disattivare/riattivare `mousemove`/`touchstart` sulla mappa principale né aggiungere layer temporanei a quella visibile: rimuovere quel codice e la chiamata a `setupMapInteractions()` in `pdf.js`.
3. Togliere il controllo `isMobile && isPortrait` e l'avviso "ruota il dispositivo" da codice, Guida e Tecnica.
4. Valutare JPEG (qualità ~0,85) al posto di PNG: il PDF oggi pesa circa 3,4 MB.
5. Mantenere: disclaimer, `DATA_CATASTO`, calcolo aree con Turf (`loadLib('turf')`), nome file `particella_<foglio>_<particella>.pdf`.
6. Oggi `queryRenderedFeatures` per i dati urbanistici usa la mappa visibile: va rifatto sulla mappa fuori schermo o con una query a coordinate.

Prova: PDF a 390×844 (verticale) e a 1440×900; deve avere mappa, dati e disclaimer.

## 3.7 Stato nell'URL
- `hash: true` di MapLibre tiene già `#zoom/lat/lng`. Estendere con parametri: `#17.2/38.116/13.361&l=prg,part&p=F12P345`.
- Attenzione: MapLibre gestisce l'hash da solo e potrebbe sovrascrivere parametri aggiuntivi. Soluzione sicura: tenere `hash: true` solo per la posizione e mettere livelli e particella nella **query string** (`?l=...&p=...`) con `history.replaceState`, oppure disattivare `hash` e gestirlo a mano in `state.js` (decidere e documentare).
- All'apertura: leggere i parametri, ripristinare `layerStates` e pulsanti (usare `toggleLayer`) e la particella (con l'indice di 3.5).
- Compatibilità: gli indirizzi attuali `#zoom/lat/lng` devono continuare a funzionare. Nota: `?theme=dark|light` già esiste (`ui.js`).

Prova: aprire un link con livelli e particella → stato ripristinato.

## 3.8 Una sola copia dell'app
- `pmtiles/catasto-omi-valore/catasto-app.html` (+ `js/catasto_script.js`, `css/`) è una copia divergente e ha il suo JS. La sorgente di verità è `pmtiles/catasto-app.html`.
- Strada: una sola app con la variante OMI come configurazione (`?variante=omi` o un oggetto `config` con elenco livelli e pmtiles). Poi cancellare la copia e lasciare un reindirizzamento. Chiedere all'utente quale funzione della copia OMI va conservata prima di cancellare.
- Cancellare `css/catasto_old.css` e `js/catasto_script_old.js` solo se non referenziati (`grep -rn`).
- `pmtiles/catasto-app-api.html` non è tracciato in git e carica `js/catasto_script.js` (che non esiste più): è rotto, non referenziato; chiedere se eliminarlo.

## 3.9 Pulizia finale
- `og:title` e `twitter:title` oggi sono già specifici ("Catasto e PRG di Palermo: ..."): ricontrollare.
- Verificare che `catasto.jpg` (og:image) esista e abbia dimensioni adatte (1200×630).
- Aggiungere `<noscript>` con un messaggio.
- Eventuale `<link rel="canonical">`: già presente.

## Come verificare
1. Server statico dalla radice del repo (usare una porta libera, per esempio 8766): `python -m http.server 8766 --bind 127.0.0.1`. Pagina: `http://127.0.0.1:8766/pmtiles/catasto-app.html?debug`.
2. Chrome headless con profilo **nuovo ad ogni prova** (la cache vecchia falsa i test): `chrome.exe --headless=new --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader --user-data-dir=<cartella-nuova> --remote-debugging-port=<porta>` e uno script Node 24 con `WebSocket` nativo e CDP (`Runtime.evaluate`, `Network.*`). Tracciare `encodedDataLength` per il peso trasferito. Con `?debug` si controllano `map` e il DOM; per simulare un clic sulla mappa: `map.fire('click', {point: map.project(map.getCenter()), lngLat: map.getCenter(), originalEvent: {}})` a zoom 17.
3. Per intercettare il PDF: sostituire `URL.createObjectURL` e registrare i Blob con `type === 'application/pdf'`.
4. Validatore: POST della pagina a `https://validator.w3.org/nu/?out=json` (`curl --data-binary @catasto-app.html -H "Content-Type: text/html; charset=utf-8"`). Il jar locale con Java 8 è troppo vecchio per le import map.
5. Lint: copiare i moduli in una cartella con ESLint 9 e regola `no-undef` (`globals.browser` + `pmtiles`, `turf`). Trova gli identificatori non importati dopo uno spostamento.
6. Lighthouse: `npx lighthouse@12 <url> --only-categories=accessibility` con `CHROME_PATH` impostato (accessibilità deve restare 100).
7. Peso prima/dopo: JavaScript al primo disegno oggi ≈ 359 KB + worker MapLibre ≈ 147 KB gz; il server locale non comprime.

## Decisioni aperte (chiedere all'utente)
- **MapLibre 6 o 5.x?** La 6 è solo ES module: SRI solo sul file principale (import map, browser recenti), worker da blob senza SRI, e pesa più della 3.3 (~435 KB gz contro 198). La 5.x ha ancora UMD. Oggi è in produzione la 6.16.
- Quale funzione della copia OMI conservare (3.8).
- Eliminare `catasto-app-api.html` (untracked)?
- Spostare `civici_index.json` (4,3 MB) a caricamento lazy.

## Prompt pronto da incollare
> Riprendi la revisione di `pmtiles/catasto-app.html` (branch PH-release-v2.0). Leggi `pmtiles/ISTRUZIONI_FASE3_RESTANTE.md` e `pmtiles/PIANO_REVISIONE_CATASTO.md` (Fase 3). Sono fatti 3.1–3.4. Procedi con 3.5, poi fermati e riassumi; non pushare senza il mio ok. Rispondi in italiano, un commit per punto, verifica con Chrome headless e W3C come descritto nelle istruzioni.
