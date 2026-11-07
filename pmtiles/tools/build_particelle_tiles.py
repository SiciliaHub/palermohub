#!/usr/bin/env python3
"""Rigenera particelle.pmtiles con 2 layer: `particelle` (poligoni) e
`particelle_label` (1 punto interno per particella, usato per le etichette).

DA RIESEGUIRE OGNI VOLTA CHE SI AGGIORNANO LE PARTICELLE: senza il layer
`particelle_label` la mappa mostra etichette doppie (poligoni tagliati dai tile).

Uso:  python build_particelle_tiles.py particelle.geojsonl particelle.pmtiles
Richiede: shapely, tippecanoe (su Windows viene lanciato via WSL).
"""
import json, os, shutil, subprocess, sys
from shapely.geometry import shape, mapping

src, out = sys.argv[1], sys.argv[2]
lbl = src + ".label.geojsonl"

n = 0
with open(src, encoding="utf-8") as f, open(lbl, "w", encoding="utf-8") as o:
    for line in f:
        if not line.strip():
            continue
        ft = json.loads(line)
        g = shape(ft["geometry"])
        if g.is_empty:
            continue
        # ponytail: punto interno al poligono (non il centroide: nei poligoni concavi puo' cadere fuori)
        pt = g.representative_point()
        p = ft.get("properties", {})
        o.write(json.dumps({
            "type": "Feature",
            "properties": {"Foglio": p.get("Foglio"), "Paricella": p.get("Paricella")},
            "geometry": mapping(pt),
            "tippecanoe": {"minzoom": 15},  # le etichette compaiono da zoom 15 (vedi layers.js)
        }, ensure_ascii=False) + "\n")
        n += 1
print(f"{n} punti etichetta")

def wslpath(p):  # C:\a\b -> /mnt/c/a/b
    p = os.path.abspath(p).replace("\\", "/")
    return "/mnt/" + p[0].lower() + p[2:]

wsl = shutil.which("tippecanoe") is None  # Windows: usa WSL
conv = wslpath if wsl else (lambda p: p)
cmd = ["tippecanoe", "-Z", "12", "-z", "18", "--force", "-o", conv(out),
       "-L", f"particelle:{conv(src)}", "-L", f"particelle_label:{conv(lbl)}"]
subprocess.run((["wsl"] if wsl else []) + cmd, check=True)
