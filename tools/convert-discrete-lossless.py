#!/usr/bin/env python3
"""Preserve existing untagged browser-sRGB appearance; reject tagged/new inputs for review.
Requires Pillow with LittleCMS and cwebp. Original files live outside public after migration.
"""
from pathlib import Path
from PIL import Image, ImageCms, ImageChops
from hashlib import sha256
import json, subprocess, time, shutil, argparse, io
parser=argparse.ArgumentParser(description='Lossless sRGB delivery of the 35 untagged Ramsider ribbon/gallery PNG masters; no resizing or RGB transform.')
parser.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[1])
parser.add_argument('--output-root',type=Path,default=Path(__file__).resolve().parents[1])
args=parser.parse_args()
root=args.source_root.resolve();package=args.output_root.resolve()
outdir=package/'docs/evidence/lossless-webp';outdir.mkdir(parents=True,exist_ok=True)
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
paths=[]
for folder in ['art/charcoal','art/technology/slides']:
 live=root/'public'/folder;reserve=root/'design/derived/lossless-originals'/folder
 masters={p.name:p for p in reserve.glob('*.png')}
 masters.update({p.name:p for p in live.glob('*.png')})
 paths.extend(masters[k] for k in sorted(masters))
assert len(paths)==35
rows=[]
for path in paths:
 rel=Path('public')/path.relative_to(root/'design/derived/lossless-originals') if path.is_relative_to(root/'design/derived/lossless-originals') else path.relative_to(root)
 source_bytes=path.read_bytes();source_sha=sha256(source_bytes).hexdigest()
 src=Image.open(io.BytesIO(source_bytes));before=src.convert('RGBA')
 assert not src.info.get('icc_profile'), 'New ICC requires explicit managed transform review'
 intermediate=outdir/'intermediate.png'
 src.save(intermediate,icc_profile=profile)
 target=package/rel.with_suffix('.webp');target.parent.mkdir(parents=True,exist_ok=True)
 started=time.monotonic()
 subprocess.run(['cwebp','-quiet','-lossless','-exact','-q','100','-m','6','-mt','-metadata','icc',str(intermediate),'-o',str(target)],check=True)
 decoded=Image.open(target);after=decoded.convert('RGBA')
 assert before.size==after.size
 assert ImageChops.difference(before,after).getbbox(alpha_only=False) is None
 assert decoded.info['icc_profile']==profile
 raw=target.read_bytes();assert b'VP8L' in raw and b'ICCP' in raw
 original=package/'design/derived/lossless-originals'/rel.relative_to('public')
 original.parent.mkdir(parents=True,exist_ok=True)
 if path.resolve()!=original.resolve():shutil.copyfile(path,original)
 (package/rel).unlink(missing_ok=True)
 row=dict(source=str(rel),output=str(rel.with_suffix('.webp')),originalReserve=str(original.relative_to(package)),width=before.width,height=before.height,sourceMode=src.mode,sourceICC=None,colorPolicy='Preserve untagged browser sRGB interpretation; embed sRGB, no RGB transform',sourceSHA256=source_sha,outputSHA256=sha256(raw).hexdigest(),sourceBytes=len(source_bytes),webpBytes=len(raw),codec='VP8L lossless',decodedRGBAEqual=True,maxChannelError=0,alphaExact=True,embeddedICC='sRGB',iccSHA256=sha256(profile).hexdigest(),encodeSeconds=round(time.monotonic()-started,3))
 rows.append(row);print(json.dumps({"file":path.name,"png":row['sourceBytes'],"webp":row['webpBytes'],"exact":True}),flush=True)
 summary=dict(dateLocal='2026-10-18',status='DECODED_VERIFIED_BROWSER_PENDING',encoder=subprocess.check_output(['cwebp','-version'],text=True).strip(),options='-lossless -exact -q 100 -m 6 -mt -metadata icc',sourceProfileIntent='UNKNOWN; all inputs untagged',assetCount=len(rows),sourceBytes=sum(r['sourceBytes'] for r in rows),webpBytes=sum(r['webpBytes'] for r in rows),assets=rows)
 (outdir/'manifest.json').write_text(json.dumps(summary,indent=2)+'\n')
for file in ['lib/charcoal-assets.ts','lib/technology-gallery.ts']:
 p=package/file;s=p.read_text();p.write_text(s.replace('.png','.webp'))
intermediate.unlink()
print(json.dumps({'complete':len(rows),'sourceBytes':summary['sourceBytes'],'webpBytes':summary['webpBytes']}),flush=True)
