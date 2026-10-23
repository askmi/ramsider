#!/usr/bin/env python3
"""Tiny disposable previews from source-exact lossless delivery; never modifies originals."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageCms
import base64, hashlib, io, json
ROOT = Path(__file__).resolve().parents[1]
manifest, rows = {}, []
for path in sorted((ROOT/'public/art').rglob('*.webp')):
    raw=path.read_bytes(); image=Image.open(io.BytesIO(raw))
    if image.width < 600 and not path.name.startswith('doc-'): continue
    relative=path.relative_to(ROOT/'public')
    candidates=[ROOT/'design/derived/lossless-originals'/relative.with_suffix('.png'), ROOT/'design/derived/webp-small-originals'/relative.with_suffix('.png'), ROOT/'design/derived/original-png'/path.with_suffix('.png').name]
    if 'wellness' in path.parts: candidates.insert(0,ROOT/'design/references/RAMSIDER_Wellness_TOP/assets'/path.with_suffix('.png').name)
    if path.name=='footer-paper.webp': candidates.insert(0,ROOT/'screenshots/footer-texture/master.png')
    source=next((p for p in candidates if p.exists()),None); assert source, path
    master=Image.open(source); assert master.size==image.size,(source,master.size,image.size)
    profile=image.info.get('icc_profile'); assert profile, path
    source_profile=master.info.get('icc_profile')
    image_rgba=master.convert('RGBA')
    if source_profile and source_profile!=profile:
        converted=ImageCms.profileToProfile(image_rgba.convert('RGB'),ImageCms.ImageCmsProfile(io.BytesIO(source_profile)),ImageCms.ImageCmsProfile(io.BytesIO(profile)),renderingIntent=1,outputMode='RGB',flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
        converted.putalpha(image_rgba.getchannel('A')); image_rgba=converted
    width=24; height=max(1,round(image.height*width/image.width))
    tiny=image_rgba.resize((width,height),Image.Resampling.LANCZOS)
    alpha=tiny.getchannel('A'); tiny=tiny.filter(ImageFilter.GaussianBlur(.6)); tiny.putalpha(alpha)
    buf=io.BytesIO(); tiny.save(buf,format='WEBP',lossless=True,exact=True,method=6,icc_profile=profile)
    encoded=buf.getvalue(); check=Image.open(io.BytesIO(encoded))
    assert check.convert('RGBA').tobytes()==tiny.tobytes()
    assert check.info['icc_profile']==profile
    src='/'+str(path.relative_to(ROOT/'public'))
    manifest[src]={'src':'data:image/webp;base64,'+base64.b64encode(encoded).decode(),'width':image.width,'height':image.height}
    rows.append({'src':src,'source':str(source.relative_to(ROOT)),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalSHA256':hashlib.sha256(raw).hexdigest(),'previewSHA256':hashlib.sha256(encoded).hexdigest(),'bytes':len(encoded),'dimensions':[width,height],'iccSHA256':hashlib.sha256(profile).hexdigest(),'alphaExact':True,'decodedControlExact':True})
(ROOT/'lib/media-previews.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
(ROOT/'docs/evidence/loading-flow/preview-export.json').write_text(json.dumps({'date':'2026-10-23','recipe':'PNG master, color-managed to delivery sRGB ICC, Lanczos24px, GaussianBlur0.6, alpha retained, Pillow lossless WebP method6 exact','count':len(rows),'totalFileBytes':sum(r['bytes'] for r in rows),'rows':rows},indent=2)+'\n')
print(len(rows),sum(r['bytes'] for r in rows))
