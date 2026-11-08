#!/usr/bin/env python3
"""Statistiche sulla struttura fondiaria -> pmtiles/analisi_particelle.json

DA RIESEGUIRE OGNI VOLTA CHE SI AGGIORNANO LE PARTICELLE (come fogli_index.json).

Non c'e' il geojsonl sorgente: le particelle si ricostruiscono dai tile z18 (massimo zoom,
senza semplificazione). Ogni particella e' spezzata sui bordi dei tile e i frammenti si
sovrappongono (buffer): si uniscono per `fid` prima di misurare, senza mai sommare i frammenti.

Dipende anche da PRG2004/particelle/prg.pmtiles (layer zto, va, vl) per le sezioni "Zonizzazione PRG" e
"Vincoli": ripetere lo script anche quando cambia il PRG.

Uso:  python build_analisi_particelle.py [particelle.pmtiles] [analisi_particelle.json] [prg.pmtiles]
Richiede: pmtiles, mapbox-vector-tile, shapely>=2, pyproj, numpy.
"""
import gzip, json, math, os, re, sys, time
from collections import defaultdict
import numpy as np
import shapely
from shapely import STRtree
import mapbox_vector_tile
from pmtiles.reader import Reader, MmapSource, all_tiles
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union

SRC = sys.argv[1] if len(sys.argv) > 1 else r"D:\GitHub - Clone\SiciliaHub\PRG2004\particelle\particelle.pmtiles"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "analisi_particelle.json")
PRG = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(SRC), "prg.pmtiles")
SOGLIA_PCT = 5      # % della particella: sotto, l'appartenenza a una zona/vincolo e' scarto di bordo PRG 1:5000 / catasto
SOGLIA_MQ = 10      # m2 minimi di sovrapposizione
N_CAVALLO = 40      # lunghezza elenco particelle a cavallo
DATA_CATASTO = "Settembre 2026"   # allineare a DATA_CATASTO in js/state.js
AREA_MIN_IRREGOLARI = 30          # m2: sotto, la forma non e' significativa (micro-particelle)
HEX_LATO = 250                    # m, lato dell'esagono
ORIGINE = 20037508.342789244      # meta' del lato del mondo in EPSG:3857

to_utm = Transformer.from_crs(3857, 32633, always_xy=True).transform
to_wgs = Transformer.from_crs(32633, 4326, always_xy=True).transform

f = open(SRC, "rb")
r = Reader(MmapSource(f))
zmax = r.header()["max_zoom"]
frag = defaultdict(list)    # fid -> frammenti (EPSG:3857)
nome = {}                   # fid -> (foglio, particella)
t0 = time.time(); n_tile = 0
for (z, x, y), data in all_tiles(r.get_bytes):
    if z != zmax:
        continue
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    lay = mapbox_vector_tile.decode(data, y_coord_down=True).get("particelle")
    if not lay:
        continue
    ext = lay.get("extent", 4096)
    size = 2 * ORIGINE / 2 ** z                 # lato tile in metri (3857)
    x0, y0 = -ORIGINE + x * size, ORIGINE - y * size
    k = size / ext
    for ft in lay["features"]:
        p = ft["properties"]
        fid = p.get("fid")
        g = shape(ft["geometry"])
        if g.is_empty:
            continue
        g = transform(lambda xs, ys, z=None: (x0 + np.asarray(xs) * k, y0 - np.asarray(ys) * k), g)
        frag[fid].append(g)
        nome[fid] = (str(p.get("Foglio")), str(p.get("Paricella")))
    n_tile += 1
print(f"{n_tile} tile z{zmax}, {len(frag)} particelle uniche, {time.time()-t0:.0f}s")

n_esclusi = 0
rows = []   # (foglio, particella, area m2, perimetro m, x utm, y utm)
geo = []    # geometrie UTM, stesso ordine di rows
for fid, parts in frag.items():
    g = unary_union(parts) if len(parts) > 1 else parts[0]
    g = transform(to_utm, g)
    if g.is_empty or g.area <= 0:
        continue
    if not nome[fid][1].isdigit():   # STRADAnnn, ACQUE...: sedimi pubblici, non lotti
        n_esclusi += 1
        continue
    pt = g.representative_point()
    rows.append((*nome[fid], g.area, g.length, pt.x, pt.y))
    geo.append(g)
print(f"{len(rows)} particelle misurate, {n_esclusi} sedimi (strade/acque) esclusi")

fogli = np.array([int(r_[0]) if r_[0].isdigit() else 0 for r_ in rows])
area = np.array([r_[2] for r_ in rows]); perim = np.array([r_[3] for r_ in rows])
X = np.array([r_[4] for r_ in rows]); Y = np.array([r_[5] for r_ in rows])
compatt = 4 * math.pi * area / perim ** 2          # Polsby-Popper: 1 = cerchio

# 1. distribuzione superfici: istogramma in classi log10 (10^0 .. 10^6 m2, 4 classi per decade)
edges = np.logspace(0, 6, 24 + 1)
hist = np.histogram(area, bins=edges)[0].tolist()

def q(a, p):
    return round(float(np.percentile(a, p)), 1)

# 2. per foglio: n, ettari, particelle/ha, quantili area (boxplot), compattezza mediana
per_foglio = []
for fg in sorted(set(fogli.tolist())):
    m = fogli == fg
    a = area[m]
    per_foglio.append({
        "f": fg, "n": int(m.sum()), "ha": round(float(a.sum()) / 1e4, 2),
        "dens": round(float(m.sum()) / (a.sum() / 1e4), 2),
        "q": [q(a, 5), q(a, 25), q(a, 50), q(a, 75), q(a, 95)],
        "c": round(float(np.median(compatt[m])), 3),
    })

# 3. griglia esagonale (flat-top) in UTM: particelle assegnate dal punto interno
s = HEX_LATO
w, h = 1.5 * s, math.sqrt(3) * s
def hex_di(px, py):
    # coordinate assiali per esagoni flat-top, poi arrotondamento cubico
    qf = (2 / 3 * px) / s
    rf = (-1 / 3 * px + math.sqrt(3) / 3 * py) / s
    xf, zf = qf, rf; yf = -xf - zf
    rx, ry, rz = round(xf), round(yf), round(zf)
    dx, dy, dz = abs(rx - xf), abs(ry - yf), abs(rz - zf)
    if dx > dy and dx > dz: rx = -ry - rz
    elif dy > dz: ry = -rx - rz
    else: rz = -rx - ry
    return rx, rz
celle = defaultdict(lambda: [0, 0.0])
for px, py, a in zip(X, Y, area):
    c = celle[hex_di(px, py)]; c[0] += 1; c[1] += a
hexes = []
for (qq, rr), (n, a) in celle.items():
    cx, cy = s * 1.5 * qq, s * math.sqrt(3) * (rr + qq / 2)
    lon, lat = to_wgs(cx, cy)
    # n/ha: denominatore = superficie particellata nella cella (le celle di bordo/mare non sembrano rade)
    hexes.append([round(lon, 5), round(lat, 5), n, round(a / 1e4, 2)])

# 4. forma: lotti irregolari (area minima per scartare le micro-particelle)
ok = area >= AREA_MIN_IRREGOLARI
idx = np.where(ok)[0]
peggiori = idx[np.argsort(compatt[idx])[:40]]
irregolari = [{"f": rows[i][0], "p": rows[i][1], "a": round(float(area[i]), 1),
               "c": round(float(compatt[i]), 3), "pa": round(float(perim[i] / area[i]), 3)} for i in peggiori]
cls_c = [0.2, 0.4, 0.6, 0.8]
hist_c = np.histogram(compatt, bins=[0, *cls_c, 1.0001])[0].tolist()
hist_c_edges = [0, *cls_c, 1]

# ======================= PRG: zonizzazione e vincoli =======================
geo = shapely.make_valid(np.array(geo, dtype=object))
parea = np.array([g.area for g in geo])

def leggi_prg(path):
    """layer -> [(proprieta', geometria UTM)]: z17 e' lo zoom massimo, frammenti uniti per fid."""
    rd = Reader(MmapSource(open(path, "rb")))
    zm = rd.header()["max_zoom"]
    fr = {l: defaultdict(list) for l in ("zto", "va", "vl")}
    pr = {}
    for (z, x, y), d in all_tiles(rd.get_bytes):
        if z != zm:
            continue
        if d[:2] == b"\x1f\x8b":
            d = gzip.decompress(d)
        t = mapbox_vector_tile.decode(d, y_coord_down=True)
        size = 2 * ORIGINE / 2 ** z
        x0, y0 = -ORIGINE + x * size, ORIGINE - y * size
        for ln in fr:
            lay = t.get(ln)
            if not lay:
                continue
            k = size / lay.get("extent", 4096)
            for ft in lay["features"]:
                g = shape(ft["geometry"])
                if g.is_empty:
                    continue
                g = transform(lambda xs, ys, z=None: (x0 + np.asarray(xs) * k, y0 - np.asarray(ys) * k), g)
                fr[ln][ft["properties"]["fid"]].append(shapely.make_valid(g))
                pr[(ln, ft["properties"]["fid"])] = ft["properties"]
    return {ln: [(pr[(ln, fid)], transform(to_utm, unary_union(p))) for fid, p in fr[ln].items()] for ln in fr}

t0 = time.time()
prg = leggi_prg(PRG)
print(f"PRG: {len(prg['zto'])} zto, {len(prg['va'])} va, {len(prg['vl'])} vl, {time.time()-t0:.0f}s")

# ---- ZTO: codice -> gruppo. L'ordine di GRUPPI e' la priorita' dove le zone si sovrappongono: la superficie
# va a UN solo gruppo (prima verde e attrezzature specifiche, poi A-E, per ultimo il verde storico sovrapposto ad A1/F4).
GRUPPI = [
    ("V", "V · Verde e sport"), ("F", "F · Attrezzature urbane"), ("IC", "IC · Interesse comune"), ("S", "S · Istruzione di base"),
    ("A", "A · Centro storico"), ("B", "B · Completamento"), ("C", "C · Espansione"), ("D", "D · Produttive"), ("E", "E · Agricole"),
    ("P", "Parcheggi"), ("ST", "Sede stradale"), ("FC", "Fascia costiera"), ("X", "Altre"), ("VS", "Verde storico")]
REGOLE = [(r"VS", "VS"), (r"V.*", "V"), (r"F\d.*", "F"), (r"IC\d.*|CM", "IC"), (r"S\d.*", "S"), (r"A\d?", "A"), (r"B.*", "B"),
          (r"C[ab]?", "C"), (r"D\d", "D"), (r"E\d?", "E"), (r"Parcheggi", "P"), (r"Sede_stradale", "ST"),
          (r"Fascia_costiera", "FC"), (r"IDC", "X")]
def gruppo(c):
    for rx, g in REGOLE:
        if re.fullmatch(rx, c):
            return g
    raise ValueError("codice ZTO non classificato: " + c)
FIX = {"Attivit?? estrattiva": "Attività estrattiva"}   # etichetta corrotta nel sorgente del PRG

cod_geo = defaultdict(list); cod_desc = defaultdict(lambda: defaultdict(int))
for pr_, g in prg["zto"]:
    c = (pr_.get("ZTO") or "").strip()
    if not c:
        continue
    cod_geo[c].append(g); cod_desc[c][(pr_.get("DESCRIZION") or "").strip()] += 1
ordine = {k: i for i, (k, _) in enumerate(GRUPPI)}
codici = sorted(cod_geo, key=lambda c: (ordine[gruppo(c)], c))
lordo = {c: shapely.make_valid(unary_union(cod_geo[c])) for c in codici}
preso = shapely.Polygon(); netto = {}
for c in codici:
    netto[c] = shapely.make_valid(lordo[c].difference(preso))
    preso = unary_union([preso, lordo[c]])
tot_union = preso.area
assert abs(sum(g.area for g in netto.values()) - tot_union) < 5000, "partizione ZTO incoerente"
print(f"ZTO: lordo {sum(g.area for g in lordo.values())/1e4:.0f} ha, netto {tot_union/1e4:.0f} ha, {len(codici)} codici")

zparts, zcod = [], []       # poligoni elementari della partizione e indice del loro codice
for i, c in enumerate(codici):
    for part in shapely.get_parts(netto[c]):
        if part.geom_type == "Polygon" and part.area > 0.5:
            zparts.append(part); zcod.append(i)
zparts = np.array(zparts, dtype=object)
ztree = STRtree(zparts)
pi, zi = ztree.query(geo, predicate="intersects")
inter = shapely.area(shapely.intersection(geo[pi], zparts[zi]))
share_cod = defaultdict(lambda: defaultdict(float))     # particella -> codice -> mq
for a, z, m in zip(pi, zi, inter):
    share_cod[a][codici[zcod[z]]] += m
print(f"{len(share_cod)} particelle toccano il PRG, {time.time()-t0:.0f}s")

def membro(mq, a):
    return mq >= SOGLIA_MQ and mq >= a * SOGLIA_PCT / 100
for pct in (2, 5, 10):   # per tarare la soglia: quante particelle risultano a cavallo
    n_ = 0
    for i, d in share_cod.items():
        gg = defaultdict(float)
        for c, m in d.items(): gg[gruppo(c)] += m
        if sum(1 for m in gg.values() if m >= SOGLIA_MQ and m >= parea[i] * pct / 100) >= 2: n_ += 1
    print(f"  a cavallo con soglia {pct}%: {n_}")

g_netto = defaultdict(float)
for c in codici: g_netto[gruppo(c)] += netto[c].area
g_n = defaultdict(int); g_mq = defaultdict(float); c_n = defaultdict(int)
mat = defaultdict(lambda: defaultdict(int))
nz = defaultdict(int); cavallo = []; fuori = 0; mq_prg = 0.0
for i in range(len(geo)):
    d = share_cod.get(i)
    if not d:
        fuori += 1; continue
    gg = defaultdict(float)
    for c, m in d.items():
        gg[gruppo(c)] += m
        if membro(m, parea[i]): c_n[c] += 1
    mq_prg += sum(d.values())
    for g_, m in gg.items(): g_mq[g_] += m
    ms = [g_ for g_, m in gg.items() if membro(m, parea[i])]
    for g_ in ms: g_n[g_] += 1
    for a in ms:
        for b in ms: mat[a][b] += 1
    nz[min(len(ms), 3)] += 1
    if len(ms) >= 2:
        minore = sorted((gg[g_] for g_ in ms), reverse=True)[1]
        parti = sorted(d.items(), key=lambda kv: -kv[1])
        cavallo.append((minore, i, [[c, round(100 * m / parea[i], 1)] for c, m in parti if membro(m, parea[i])]))
cavallo.sort(reverse=True)
for g_ in g_netto:   # le particelle escludono strade e acque, quindi i mq in zona non superano l'area netta
    assert g_mq[g_] <= g_netto[g_] * 1.01 + 100, (g_, g_mq[g_], g_netto[g_])
print("PRG ha netti / particelle:", {g_: (round(g_netto[g_] / 1e4), g_n[g_]) for g_, _ in GRUPPI if g_ in g_netto}, "| senza zona:", fuori, "| a cavallo:", len(cavallo))

# ---- Vincoli areali (VA): la sovrapposizione e' il dato, nessuna partizione
CAT = [("pae", "Paesaggistici"), ("amb", "Ambientali"), ("idr", "Idrogeologici"), ("arc", "Archeologici e storici"), ("inf", "Rispetto e infrastrutture")]
CAT_TIPO = {
    "pae": ["Vincolo paesaggistico L. 1497", "Vincolo paesaggistico L. 431", "Fascia battigia"],
    "amb": ["Siti di Importanza Comunitaria", "Zona A - Riserva", "Zona B - Preriserva", "Zona B1 - Preriserva", "Area Demanio Montepellegrino",
            "Aree boscate artificiali", "Aree boscate naturali", "Fascia di rispetto aree boscate artificiali", "Fascia di rispetto Aree boscate naturali"],
    "idr": ["Aree Rischio Idraulico e frana", "Aree interdette", "Aree inondazioni", "Aree ristagni acqua", "Aree falde acquifere", "Fascia di rispetto corsi d’acqua", "Fasce di rispetto faglie e sovrascorrimenti"],
    "arc": ["Aree di interesse archeologico", "Aree Qanat", "Aree Cave Storiche", "Immobili Vincoli Legge 1089/39 - Ville", "Immobili Vincoli Legge 1089/39 - Cimiteri", "Immobili Vincoli Legge 1089/39 - Quanat"],
    "inf": ["Fascia di rispetto ferrovia", "Area aeroportuale", "Fascia di rispetto cimiteriale e depuratori", "Aree cave attive di coltivazione", "Attivit?? estrattiva", "Pozzi idrici non potabili"],
}
tipo_cat = {t: k for k, ts in CAT_TIPO.items() for t in ts}
tg = defaultdict(list)
for pr_, g in prg["va"]:
    t = (pr_.get("tipo") or "").strip()
    assert t in tipo_cat, "tipo vincolo non classificato: " + t
    tg[t].append(g)
tipi = sorted(tg)
tipo_geo = {t: shapely.make_valid(unary_union(tg[t])) for t in tipi}
vparts, vtipo = [], []
for i, t in enumerate(tipi):
    for part in shapely.get_parts(tipo_geo[t]):
        if part.geom_type == "Polygon" and part.area > 0.5:
            vparts.append(part); vtipo.append(i)
vparts = np.array(vparts, dtype=object)
pi, vi = STRtree(vparts).query(geo, predicate="intersects")
inter = shapely.area(shapely.intersection(geo[pi], vparts[vi]))
vmq = defaultdict(lambda: defaultdict(float))
for a, v, m in zip(pi, vi, inter):
    vmq[a][tipi[vtipo[v]]] += m
t_n = defaultdict(int); t_mq = defaultdict(float); c_vn = defaultdict(int); c_vmq = defaultdict(float)
nvinc = defaultdict(int); piu_vincolate = []; n_vinc = 0
for i, d in vmq.items():
    ts = [t for t, m in d.items() if membro(m, parea[i])]
    for t, m in d.items(): t_mq[t] += m
    for t in ts: t_n[t] += 1
    cs = {tipo_cat[t] for t in ts}
    for k in cs:
        c_vn[k] += 1
        c_vmq[k] += min(sum(m for t, m in d.items() if tipo_cat[t] == k), parea[i])
    if ts:
        n_vinc += 1; nvinc[min(len(ts), 5)] += 1
        piu_vincolate.append((len(ts), float(parea[i]), i, [FIX.get(t, t) for t in ts]))
nvinc[0] = len(geo) - n_vinc
piu_vincolate.sort(reverse=True)
cat_geo = {k: unary_union([tipo_geo[t] for t in CAT_TIPO[k] if t in tipo_geo]) for k, _ in CAT}
print("vincoli: particelle con almeno un vincolo", n_vinc, "/", len(geo), f"{time.time()-t0:.0f}s")

# ---- Vincoli lineari (VL): particelle attraversate
lg = defaultdict(list)
for pr_, g in prg["vl"]:
    lg[(pr_.get("TIPO") or "").strip()].append(g)
ptree = STRtree(geo); vl = []
for t, gs in sorted(lg.items()):
    u = unary_union(gs)
    vl.append({"t": FIX.get(t, t), "km": round(u.length / 1000, 1), "n": len(set(ptree.query(u, predicate="intersects").tolist()))})

attivi = [k for k, _ in GRUPPI if g_n[k] > 0]
PRG_OUT = {
    "soglia_pct": SOGLIA_PCT, "soglia_mq": SOGLIA_MQ, "ha_lordo": round(sum(g.area for g in lordo.values()) / 1e4, 1),
    "ha_netto": round(tot_union / 1e4, 1), "senza_zona": fuori, "mq_in_zona": round(mq_prg),
    "gruppi": [{"k": k, "l": l, "ha": round(g_netto[k] / 1e4, 1), "n": g_n[k], "mq": round(g_mq[k])} for k, l in GRUPPI if g_netto[k] > 0],
    "codici": [{"c": c, "g": gruppo(c), "d": max(cod_desc[c], key=cod_desc[c].get) or c, "ha": round(netto[c].area / 1e4, 2), "n": c_n[c]}
               for c in codici if netto[c].area > 0],
    "matrice": {"k": attivi, "m": [[mat[a][b] for b in attivi] for a in attivi]},
    "n_zone": [nz[1], nz[2], nz[3]], "n_cavallo": len(cavallo),
    "cavallo": [{"f": rows[i][0], "p": rows[i][1], "a": round(float(parea[i]), 1), "m": round(float(mn), 1), "z": z_}
                for mn, i, z_ in cavallo[:N_CAVALLO]],
}
VINC_OUT = {
    "n": n_vinc, "ha_unione": round(unary_union(list(tipo_geo.values())).area / 1e4, 1),
    "cat": [{"k": k, "l": l, "ha": round(cat_geo[k].area / 1e4, 1), "n": c_vn[k], "mq": round(c_vmq[k])} for k, l in CAT],
    "tipi": sorted(({"t": FIX.get(t, t), "k": tipo_cat[t], "ha": round(tipo_geo[t].area / 1e4, 1), "n": t_n[t], "mq": round(t_mq[t])} for t in tipi),
                   key=lambda r: -r["ha"]),
    "n_vincoli": [nvinc[i] for i in range(6)],
    "piu_vincolate": [{"f": rows[i][0], "p": rows[i][1], "a": round(a, 1), "nv": nv, "t": ts} for nv, a, i, ts in piu_vincolate[:20]],
    "linee": vl,
}

out = {
    "data_catasto": DATA_CATASTO, "n": len(rows), "ha": round(float(area.sum()) / 1e4, 1),
    "esclusi": n_esclusi, "area_min_irregolari": AREA_MIN_IRREGOLARI, "hex_lato": HEX_LATO,
    "mediana": q(area, 50), "p90": q(area, 90), "compatt_mediana": round(float(np.median(compatt)), 3),
    "hist": {"edges": [round(float(e), 1) for e in edges], "n": hist},
    "hist_compatt": {"edges": hist_c_edges, "n": hist_c},
    "fogli": per_foglio, "hex": hexes, "irregolari": irregolari,
    "prg": PRG_OUT, "vincoli": VINC_OUT,
}
with open(OUT, "w", encoding="utf-8") as fo:
    json.dump(out, fo, ensure_ascii=False, separators=(",", ":"))
print("scritto", os.path.abspath(OUT), os.path.getsize(OUT) // 1024, "KB")
