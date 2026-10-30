#!/usr/bin/env python3
"""Re-cut approved native charcoal plates below subjects, without changing RGB."""
from pathlib import Path
from PIL import Image, ImageFilter
from io import BytesIO
from hashlib import sha256
import json, base64
ROOT = Path(__file__).resolve().parents[1]
plan = json.loads((ROOT/'docs/evidence/loading-flow/additional-ribbon-plan.json').read_text())
manifest_path = ROOT/'lib/media-previews.json'
manifest = json.loads(manifest_path.read_text())
for key in list(manifest):
    if key.startswith('/art/charcoal/'):
        del manifest[key]
rows = []
heights = [2250,2250,1900,2150]
plates = []
for index,(height,cut) in enumerate(zip(heights,plan['inventory']['charcoal']['newCuts']),1):
    # The tracked PNG reserves are source-exact approved clean artwork, not lossy deliveries.
    master = Image.new('RGB',(1080,height))
    sources = []
    for tile in range(3):
        path = ROOT/f'design/derived/lossless-originals/art/charcoal/{index}-{tile}.png'
        part = Image.open(path)
        top = max(0,tile*750-2)
        if tile:
            assert master.crop((0,top,1080,tile*750+2)).tobytes() == part.crop((0,0,1080,4)).tobytes()
        master.paste(part,(0,top))
        sources.append({'path':str(path.relative_to(ROOT)),'sha256':sha256(path.read_bytes()).hexdigest()})
    clean = ROOT/f'screenshots/charcoal/clean-{index}.png'
    if clean.exists():
        assert master.tobytes() == Image.open(clean).convert('RGB').tobytes()
    old = ROOT/f'public/art/charcoal/{index}-0.webp'
    profile = Image.open(old).info['icc_profile']
    plates.append((master,sources,profile))
continuous = Image.new('RGB',(1080,sum(heights)))
offset=0
for master,_,_ in plates:
    continuous.paste(master,(0,offset));offset+=master.height
tiny_height = round(continuous.height*24/1080)
tiny = continuous.resize((24,tiny_height),Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.6))
buffer = BytesIO();tiny.save(buffer,format='WEBP',lossless=True,exact=True,method=6,icc_profile=plates[0][2])
shared_preview = buffer.getvalue()
offset=0
for index,((master,sources,profile),height,cut) in enumerate(zip(plates,heights,plan['inventory']['charcoal']['newCuts']),1):
    for tile,(top,bottom) in enumerate([(0,cut),(cut-160,height)]):
        crop = master.crop((0,top,1080,bottom))
        target = ROOT/f'public/art/charcoal/v2-{index}-{tile}.webp'
        if not target.exists():
            crop.save(target,format='WEBP',lossless=True,exact=True,quality=100,method=6,icc_profile=profile)
        decoded = Image.open(target)
        assert decoded.convert('RGBA').tobytes()==crop.convert('RGBA').tobytes()
        assert decoded.info['icc_profile']==profile
        # Keep the whole tiny plane: cropping/re-expanding its edge pixels would clamp interpolation.
        raw=shared_preview;check=Image.open(BytesIO(raw))
        assert check.convert('RGBA').tobytes()==tiny.convert('RGBA').tobytes() and check.info['icc_profile']==profile
        src='/'+str(target.relative_to(ROOT/'public'))
        manifest[src]={'src':'data:image/webp;base64,'+base64.b64encode(raw).decode(),'width':1080,'height':bottom-top}
        rows.append({'src':src,'plate':index,'top':top,'bottom':bottom,'width':1080,'sources':sources,'sourceProfileIntent':'UNKNOWN; preserve existing untagged browser-sRGB RGB numbers','iccSHA256':sha256(profile).hexdigest(),'sha256':sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'decodedRGBAExact':True,'alphaExact':True,'maxChannelError':0,'previewSHA256':sha256(raw).hexdigest(),'previewBytes':len(raw),'previewDecodedExact':True})
    offset+=height
manifest_path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
(ROOT/'docs/evidence/loading-flow/additional-ribbon-export.json').write_text(json.dumps({'id':'CHG0182','recipe':'Native RGB source-exact tracked PNG reserves; Pillow lossless/exact WebP method6 quality100, original delivery sRGB ICC. Continuous full-plate Lanczos24/Gaussian.6 preview plane. No source resize or color transform.','rows':rows,'totalBytes':sum(r['bytes'] for r in rows)},indent=2)+'\n')
print(json.dumps({'count':len(rows),'bytes':sum(r['bytes'] for r in rows),'decodedExact':True}))
