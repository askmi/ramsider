#!/usr/bin/env python3
"""Export the mapped story tiles directly from the tagged Photoshop master."""
from pathlib import Path
from io import BytesIO
import argparse, base64, hashlib, importlib.util, json, tempfile
from PIL import Image, ImageCms, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
plan = json.loads((ROOT / 'docs/evidence/loading-flow/feed-seam-map.json').read_text())
spec = importlib.util.spec_from_file_location('art_converter', ROOT / 'tools/convert-art-webp.py')
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)
parser = argparse.ArgumentParser()
parser.add_argument('--only', nargs='+', help='Rebuild only named mapped crops and preserve all other assets/previews.')
args = parser.parse_args()
selected = [tile for tile in plan['segments'] if not args.only or tile['file'] in args.only]
if args.only and set(args.only) != {tile['file'] for tile in selected}:
    parser.error('--only must contain mapped tile names')
source_path = ROOT / plan['source']
manifest_path = ROOT / 'lib/media-previews.json'
manifest = json.loads(manifest_path.read_text())
active = {'/art/' + tile['file'] + '.webp' for tile in plan['segments']}
for key in list(manifest):
    if key.startswith('/art/story-v') and key not in active:
        manifest.pop(key)
for name in [*(f'{i:02}' for i in range(9)), '09-10', '11']:
    manifest.pop(f'/art/{name}.webp', None)
with Image.open(source_path) as source, tempfile.TemporaryDirectory() as tmp:
    assert source.size == (941, 32127) and source.mode == 'RGBA'
    for tile in selected:
        print(tile['file'], flush=True)
        converter.encode(source, tile['file'], (0, tile['crop_top'], 941, tile['crop_bottom']), Path(tmp))
    # One continuous tiny image prevents independent resize kernels from inventing seams.
    profile = ImageCms.ImageCmsProfile(BytesIO(source.info['icc_profile']))
    tiny_height = round(source.height * 24 / 941)
    tiny = source.resize((24, tiny_height), Image.Resampling.LANCZOS)
    alpha = tiny.getchannel('A')
    tiny = ImageCms.profileToProfile(tiny.convert('RGB'), profile, converter.SRGB, renderingIntent=1,
        outputMode='RGB', flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
    tiny.putalpha(alpha)
    tiny = tiny.filter(ImageFilter.GaussianBlur(.6))
    tiny.putalpha(alpha)
    for tile in selected:
        top, bottom = tile['crop_top'], tile['crop_bottom']
        h = round((bottom-top)*24/941)
        preview = tiny.transform((24,h), Image.Transform.EXTENT,
            (0, top*tiny_height/32127, 24, bottom*tiny_height/32127), Image.Resampling.BICUBIC)
        buffer = BytesIO(); preview.save(buffer, format='WEBP', lossless=True, exact=True, method=6, icc_profile=converter.SRGB_BYTES)
        raw=buffer.getvalue(); check=Image.open(BytesIO(raw))
        assert check.info['icc_profile']==converter.SRGB_BYTES and check.convert('RGBA').tobytes()==preview.tobytes()
        key='/art/'+tile['file']+'.webp'
        manifest[key]={'src':'data:image/webp;base64,'+base64.b64encode(raw).decode(), 'width':941, 'height':bottom-top}
manifest_path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
report_path = ROOT/'docs/evidence/loading-flow/feed-color-metrics.json'
retained = json.loads(report_path.read_text())['files'] if args.only and report_path.exists() else []
rows = {row['file']: row for row in retained}
rows.update({row['file']: row for row in converter.REPORT})
files = [rows[tile['file'] + '.webp'] for tile in plan['segments']]
report={'source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(), 'method':'Adobe RGB to sRGB relative colorimetric + black point compensation; q95 and sharp-yuv comparison, exact alpha, lossless fallback; continuous master-derived 24px previews', 'files':files}
(ROOT/'docs/evidence/loading-flow/feed-color-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
