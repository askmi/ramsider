"""Derive reference-sized surfaces without stretching corners or arrow geometry.

Only the straight middle of each supplied SVG is extended/shortened. The original
height, corner radii, strokes, gradients and arrow paths remain unchanged; the
browser scales the resulting complete surface uniformly to the reference bounds.
"""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ET.register_namespace('', 'http://www.w3.org/2000/svg')
NS = {'svg': 'http://www.w3.org/2000/svg'}
mapping = json.loads((ROOT / 'lib/button-map.json').read_text())
localized = json.loads((ROOT / 'lib/button-localized-widths.json').read_text())

for locale in ['en', *localized]:
    for name, spec in mapping.items():
        if spec['kind'] != 'pill':
            continue
        source = ROOT / 'design/assets/RAMSIDER_Buttons' / spec['theme'] / 'Without_Text' / (spec['asset'] + '.svg')
        svg = ET.parse(source).getroot()
        outer, inner = svg.findall('svg:rect', NS)
        height = float(outer.attrib['height'])
        source_width = spec['w'] if locale == 'en' else localized[locale][name]['w']
        width = height * source_width / spec['h']
        delta = width - float(outer.attrib['width'])
        outer.set('width', str(width))
        inner.set('width', str(width - 5))
        for arrow in svg.findall('svg:path', NS):
            arrow.set('transform', f'translate({delta} 0)')
        # Retain one unit around the visible body so the border is not clipped.
        svg.set('viewBox', f'9 9 {width + 2} {height + 2}')
        svg.set('width', str(width + 2))
        svg.set('height', str(height + 2))
        target_dir = ROOT / 'public/buttons' / ('' if locale == 'en' else locale)
        target = target_dir / (name + '.svg')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(ET.tostring(svg, encoding='unicode') + '\n')
