# Appunti: etichette particelle duplicate

## Problema
Nella mappa catastale compaiono più etichette `F. xxx - P. yyy` per la stessa particella.

**Causa:** il layer `particelle-labels` era un `symbol` sul poligono. MapLibre piazza un'etichetta per ogni pezzo di poligono dentro un tile. Una particella che attraversa il bordo di più tile viene tagliata e ogni pezzo riceve la sua etichetta. Il centro del pezzo, inoltre, non coincide con il centro della particella.

## Soluzione
Il pmtiles contiene un secondo layer `particelle_label`, con **un punto per particella**. Il punto è calcolato con `representative_point()` di shapely, quindi sta sempre dentro il poligono anche se concavo. Le etichette usano quel layer.

- Script: `pmtiles/tools/build_particelle_tiles.py`
- Client: `pmtiles/js/layers.js`, layer `particelle-labels` con `source-layer: "particelle_label"`

## Da rifare a ogni aggiornamento delle particelle
Rigenerare il pmtiles con lo script, **non** con tippecanoe a mano. Senza il layer `particelle_label` le etichette spariscono.

```
python pmtiles/tools/build_particelle_tiles.py particelle.geojsonl particelle.pmtiles
```

Requisiti: `shapely` e `tippecanoe` (su Windows viene lanciato via WSL).

Poi pubblicare il pmtiles in `SiciliaHub/PRG2004/particelle/`, servito da `palermohub.github.io/PRG2004/particelle/`.

## Ordine di pubblicazione
1. Pubblicare il nuovo pmtiles.
2. Poi fare push di `layers.js`.

Se `layers.js` va online prima, le etichette spariscono finché il pmtiles non è aggiornato.

## Note
- Build originale (dai metadata del pmtiles): `tippecanoe -Z 12 -z 18 -l particelle --force -o particelle.pmtiles particelle.geojsonl`, tippecanoe v2.82.
- Campi: `Foglio`, `Paricella` (il refuso è nel dato, non correggerlo), `fid`.
- I punti hanno `minzoom: 15`, come il `minzoom` del layer di stile.
- `particelle.geojsonl` non è in nessun repo: va tenuto dal sorgente (export QGIS/GML).
- Da verificare: `catasto-app.html` (se carica `layers.js`) e `js/gb_maps_compresso.js`, che usa `particelle_0125.pmtiles`, vecchio e senza il layer.
