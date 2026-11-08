#!/usr/bin/env python3
"""Rigenera particelle.pmtiles con 2 layer: `particelle` (poligoni) e
`particelle_label` (1 punto interno per particella, usato per le etichette).

DA RIESEGUIRE OGNI VOLTA CHE SI AGGIORNANO LE PARTICELLE: senza il layer
`particelle_label` la mappa mostra etichette doppie (poligoni tagliati dai tile).

Uso:  python build_particelle_tiles.py particelle.gpkg|.geojson|.geojsonl particelle.pmtiles [--no-writeback]
Con un GPKG scrive/aggiorna anche il campo sup_mq (m2) nella tabella, cosi il dato resta alla fonte.
Richiede: shapely, tippecanoe (su Windows viene lanciato via WSL).
"""
import json, os, shutil, sqlite3, subprocess, sys
import shapely.wkb
from shapely.geometry import shape, mapping
from pyproj import Geod

GEOD = Geod(ellps="WGS84")  # area geodetica, geometria INTERA (non tagliata dai tile)

src, out = sys.argv[1], sys.argv[2]
writeback = "--no-writeback" not in sys.argv
lbl = src + ".label.geojsonl"
poly = src + ".sup.geojsonl"  # poligoni con sup_mq precalcolato

def read_features(path):
    """Genera (fid, Foglio, Paricella, geometria shapely) da GPKG (WGS84) o geojson/geojsonl."""
    if path.lower().endswith(".gpkg"):
        con = sqlite3.connect(path)
        tab, gcol = con.execute("SELECT table_name, column_name FROM gpkg_geometry_columns").fetchone()
        cols = {r[1].lower(): r[1] for r in con.execute(f'PRAGMA table_info("{tab}")')}
        fo, pa = cols["foglio"], cols.get("paricella") or cols["particella"]  # il plugin scrive "particella"
        for fid, f_, p_, blob in con.execute(f'SELECT fid, "{fo}", "{pa}", "{gcol}" FROM "{tab}"'):
            if blob is None:
                continue
            env = (0, 32, 48, 48, 64)[(blob[3] >> 1) & 7]  # header GPKG: 8 byte + busta
            yield fid, f_, p_, shapely.wkb.loads(bytes(blob[8 + env:]))
        con.close()
    else:  # una feature per riga, con o senza virgola finale
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip().rstrip(",")
                if not line.startswith('{"type":"Feature"') and not line.startswith('{ "type": "Feature"'):
                    continue
                ft = json.loads(line)
                p_ = ft["properties"]
                yield p_.get("fid"), p_.get("Foglio"), p_.get("Paricella"), shape(ft["geometry"])

n = 0
sup = []  # (sup_mq, fid) per il riporto nel GPKG
with open(lbl, "w", encoding="utf-8") as o, open(poly, "w", encoding="utf-8") as op:
    for fid, fg, pc, g in read_features(src):
        if g.is_empty:
            continue
        # sup_mq: area geodetica sulla geometria INTERA; letta dalla scheda (card.js)
        mq = round(abs(GEOD.geometry_area_perimeter(g)[0]), 1)
        sup.append((mq, fid))
        op.write(json.dumps({"type": "Feature", "properties": {"Foglio": fg, "Paricella": pc, "sup_mq": mq},
                             "geometry": mapping(g)}, ensure_ascii=False) + "\n")
        # ponytail: punto interno al poligono (non il centroide: nei poligoni concavi puo' cadere fuori)
        o.write(json.dumps({
            "type": "Feature",
            "properties": {"Foglio": fg, "Paricella": pc},
            "geometry": mapping(g.representative_point()),
            "tippecanoe": {"minzoom": 15},  # le etichette compaiono da zoom 15 (vedi layers.js)
        }, ensure_ascii=False) + "\n")
        n += 1
print(f"{n} punti etichetta")

if writeback and src.lower().endswith(".gpkg"):
    con = sqlite3.connect(src)
    tab = con.execute("SELECT table_name FROM gpkg_geometry_columns").fetchone()[0]
    if "sup_mq" not in [r[1] for r in con.execute(f'PRAGMA table_info("{tab}")')]:
        con.execute(f'ALTER TABLE "{tab}" ADD COLUMN sup_mq REAL')
    con.executemany(f'UPDATE "{tab}" SET sup_mq=? WHERE fid=?', sup)
    con.commit(); con.close()
    print(f"sup_mq scritto in {tab}")

def wslpath(p):  # C:\a\b -> /mnt/c/a/b
    p = os.path.abspath(p).replace("\\", "/")
    return "/mnt/" + p[0].lower() + p[2:]

wsl = shutil.which("tippecanoe") is None  # Windows: usa WSL
conv = wslpath if wsl else (lambda p: p)
cmd = ["tippecanoe", "-Z", "12", "-z", "18", "--force", "-o", conv(out),
       "-L", f"particelle:{conv(poly)}", "-L", f"particelle_label:{conv(lbl)}"]
subprocess.run((["wsl"] if wsl else []) + cmd, check=True)
