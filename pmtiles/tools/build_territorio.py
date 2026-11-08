#!/usr/bin/env python3
"""Crea territorio.json (WGS84) con circoscrizioni, quartieri e UPL di Palermo.
Uso: python build_territorio.py <cartella con geo_circoscrizioni/quartieri/upl.geojson> territorio.json
Sorgente: palermo_popolazione/dati (EPSG:32632)."""
import json, sys, os
from pyproj import Transformer
from shapely.geometry import shape, mapping
from shapely import set_precision

src, out = sys.argv[1], sys.argv[2]
tr = Transformer.from_crs(32632, 4326, always_xy=True)
feats = []
for liv, nome in (('circ', 'circoscrizioni'), ('quart', 'quartieri'), ('upl', 'upl')):
    for f in json.load(open(os.path.join(src, f'geo_{nome}.geojson'), encoding='utf-8'))['features']:
        g = shape(f['geometry'])
        from shapely.ops import transform
        g = transform(tr.transform, g.simplify(2, preserve_topology=True))  # 2 m
        g = set_precision(g, 0.00001)
        p = {k: (v.replace('Pieà', 'Pietà') if isinstance(v, str) else v) for k, v in f['properties'].items()}
        b = [round(x, 5) for x in g.bounds]
        feats.append({'type': 'Feature', 'geometry': mapping(g), 'properties': {
            'liv': liv, 'circ': p['Circoscrizione'], 'quart': p.get('Quartiere'), 'upl': p.get('UPL'),
            'area': round(p['Area']), 'bbox': b}})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(out, 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print(len(feats), os.path.getsize(out))
