#!/usr/bin/env python3
"""Lossless WebP derivatives from path-bound original PNGs; never overwrite masters.
Requires Pillow/LittleCMS and cwebp. Run on beta; see docs/beta-media-optimization.md.
"""
from pathlib import Path
from PIL import Image, ImageCms, ImageChops
from hashlib import sha256
import base64, io, json, shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
RESERVE = ROOT / 'design/derived/webp-small-originals'
CONTROL = Path('/tmp/ramsider-beta-media/color-controls')
INVENTORY = json.loads((ROOT / 'docs/evidence/beta-media/inventory-before.json').read_text())
PROFILE = Image.open(ROOT / 'public/art/00.webp').info['icc_profile']
UNUSED = {f'art/technology/{name}.png' for name in ['arrow-right','arrow-down','dot-active','dot-inactive']}
rows = []
with tempfile.TemporaryDirectory() as tmp:
 for item in INVENTORY['images']:
  if not item['path'].endswith('.png'): continue
  rel = Path(item['path']).relative_to('public')
  live, master = ROOT / item['path'], RESERVE / rel
  path = master if master.exists() else live
  if live.exists(): assert sha256(live.read_bytes()).hexdigest() == item['sha256'], f'Changed live input requires review: {rel}'
  raw = path.read_bytes()
  assert sha256(raw).hexdigest() == item['sha256'], f'Changed master requires review: {rel}'
  if not master.exists():
   master.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(path,master)
  if str(rel) in UNUSED:
   live.unlink(missing_ok=True)
   rows.append({'source':str(rel),'sourceSHA256':item['sha256'],'sourceBytes':len(raw),'status':'unused legacy controls reserved outside public'})
   continue
  src = Image.open(io.BytesIO(raw)); before = src.convert('RGBA'); icc = src.info.get('icc_profile')
  if str(rel) == 'art/rams-group-diamond.png':
   assert icc and 'Adobe RGB' in ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc)))
   expected = ImageCms.profileToProfile(before, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.ImageCmsProfile(io.BytesIO(PROFILE)), renderingIntent=1, outputMode='RGBA', flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
   embedded, policy = PROFILE, 'AdobeRGB to sRGB managed control, original alpha retained'
  elif str(rel) == 'art/brand-mark-white.png':
   assert icc and 'sRGB' in ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc)))
   expected, embedded, policy = before, icc, 'Existing sRGB pixels and profile preserved'
  else:
   assert not icc, f'Unexpected tagged input: {rel}'
   expected, embedded, policy = before, PROFILE, 'Untagged browser interpretation/raw RGBA preserved; no RGB transform'
  assert ImageChops.difference(before.getchannel('A'),expected.getchannel('A')).getbbox() is None
  control = CONTROL / rel
  control.parent.mkdir(parents=True,exist_ok=True); expected.save(control,icc_profile=embedded)
  target = live.with_suffix('.webp')
  subprocess.run(['cwebp','-quiet','-lossless','-exact','-q','100','-m','6','-mt','-metadata','icc',str(control),'-o',str(target)],check=True)
  decoded = Image.open(target)
  assert expected.size == decoded.size and ImageChops.difference(expected,decoded.convert('RGBA')).getbbox(alpha_only=False) is None
  assert decoded.info['icc_profile'] == embedded
  live.unlink(missing_ok=True)
  rows.append({'source':str(rel),'output':str(target.relative_to(ROOT)),'master':str(master.relative_to(ROOT)),'sourceSHA256':item['sha256'],'outputSHA256':sha256(target.read_bytes()).hexdigest(),'sourceBytes':len(raw),'outputBytes':target.stat().st_size,'dimensions':list(expected.size),'policy':policy,'codec':'VP8L','decodedControlRGBAExact':True,'alphaExact':True,'iccSHA256':sha256(embedded).hexdigest()})
 # Inline seam rows are raster assets as well; keep their original JSON as master.
 master = RESERVE / 'charcoal-joins.json'
 seam_source = master if master.exists() else ROOT/'lib/charcoal-joins.json'
 seam_raw = seam_source.read_bytes()
 assert sha256(seam_raw).hexdigest() == INVENTORY['inlineSeams']['sha256'], 'Changed seam master requires review'
 seam_values = json.loads(seam_raw)
 assert len(seam_values) == INVENTORY['inlineSeams']['count'], 'Changed seam count requires review'
 if not master.exists(): shutil.copyfile(seam_source,master)
 joins=[]
 for index,url in enumerate(seam_values):
  raw=base64.b64decode(url.split(',',1)[1]);image=Image.open(io.BytesIO(raw)).convert('RGBA')
  src=Path(tmp)/f'join-{index}.png';dst=src.with_suffix('.webp');image.save(src,icc_profile=PROFILE)
  subprocess.run(['cwebp','-quiet','-lossless','-exact','-m','6','-metadata','icc',str(src),'-o',str(dst)],check=True)
  assert ImageChops.difference(image,Image.open(dst).convert('RGBA')).getbbox(alpha_only=False) is None
  joins.append('data:image/webp;base64,'+base64.b64encode(dst.read_bytes()).decode())
 (ROOT/'lib/charcoal-joins.json').write_text(json.dumps(joins,indent=2)+'\n')
# The prior frame is no longer referenced by the SVG-based viewer.
frame=ROOT/'public/art/technology/frame-template.webp'
if frame.exists():
 target=RESERVE/'art/technology/frame-template.webp';target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists(): assert target.read_bytes()==frame.read_bytes(), 'Changed legacy frame requires review'
 else: shutil.copyfile(frame,target)
 frame.unlink()
report={'date':'2026-10-20','encoder':subprocess.check_output(['cwebp','-version'],text=True).strip(),'options':'-lossless -exact -q100 -m6 -mt -metadata icc','assets':rows,'inlineSeams':len(joins),'inlineRGBAExact':True,'sourceBytes':sum(r['sourceBytes'] for r in rows),'webpBytes':sum(r.get('outputBytes',0) for r in rows),'sourceProfileIntent':'Untagged editorial intent UNKNOWN; current browser interpretation preserved'}
(ROOT/'docs/evidence/beta-media/small-images.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:v for k,v in report.items() if k!='assets'})
