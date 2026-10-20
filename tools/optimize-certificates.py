#!/usr/bin/env python3
"""Lossless native PDF delivery: deduplicate, optimize JPEG entropy and linearize.
Requires tools/pdf-optimization-requirements.txt, jpegtran and Poppler for QA.
Never rasterizes, downsamples, requantizes or color-converts certificate pages.
See docs/beta-media-optimization.md for research, acceptance and limitations.
"""
from pathlib import Path
from hashlib import sha256
from PIL import Image
from pypdf import PdfReader, PdfWriter
import pikepdf
import io, json, shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
MASTERS = ROOT / 'design/derived/certificate-originals'
PUBLIC = ROOT / 'public/certificates'
BASELINE = json.loads((ROOT/'docs/evidence/beta-media/pdf-inventory-before.json').read_text())['files']
pikepdf.settings.set_flate_compression_level(9)

def signature_fields(fields):
 for field in fields:
  if field.get('/FT') == pikepdf.Name('/Sig') or signature_fields(field.get('/Kids',[])): return True
 return False

def fingerprint(path):
 reader = PdfReader(path)
 return [{'media':list(p.mediabox),'crop':list(p.cropbox),'rotation':p.rotation,
          'content':sha256(p.get_contents().get_data()).hexdigest(),
          'text':p.extract_text(),
          'links':[(str(a.get_object().get('/Subtype')),str(a.get_object().get('/Rect')),str(a.get_object().get('/A',{}).get('/URI',''))) for a in p.get('/Annots',[])]}
         for p in reader.pages]

def optimize_jpegs(pdf):
 changed = []
 for obj in pdf.objects:
  if not isinstance(obj,pikepdf.Stream) or obj.get('/Subtype') != pikepdf.Name('/Image') or obj.get('/Filter') != pikepdf.Name('/DCTDecode'): continue
  original = obj.read_raw_bytes()
  candidate = subprocess.check_output(['jpegtran','-copy','all','-optimize'],input=original)
  if len(candidate) >= len(original): continue
  before, after = Image.open(io.BytesIO(original)), Image.open(io.BytesIO(candidate))
  assert before.mode == after.mode and before.size == after.size and before.tobytes() == after.tobytes(), 'JPEG sample mismatch'
  assert before.info.get('icc_profile') == after.info.get('icc_profile'), 'JPEG ICC mismatch'
  obj.write(candidate,filter=pikepdf.Name('/DCTDecode'),decode_parms=obj.get('/DecodeParms'))
  changed.append({'before':len(original),'after':len(candidate),'decodedSamplesExact':True,'iccExact':True})
 return changed

rows=[]
with tempfile.TemporaryDirectory() as directory:
 tmp=Path(directory)
 for item in BASELINE:
  name=Path(item['path']).name;live=PUBLIC/name;master=MASTERS/name
  # Existing corrected native files are the immutable inputs; they retain Rotate270.
  if not master.exists():
   MASTERS.mkdir(parents=True,exist_ok=True);shutil.copyfile(live,master)
  assert master.stat().st_size == item['bytes'] and sha256(master.read_bytes()).hexdigest() == item['sha256'], 'Master changed; review inventory before regenerating'
  original_fingerprint=fingerprint(master)
  with pikepdf.open(master) as pdf:
   assert not pdf.is_encrypted and not pdf.Root.get('/Perms') and not signature_fields(pdf.Root.get('/AcroForm',{}).get('/Fields',[])), 'Signed/encrypted inputs need a separate workflow'
  dedup=tmp/(name+'.dedup.pdf')
  writer=PdfWriter(clone_from=master);writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True);writer.write(dedup)
  candidates=[]
  for kind,source in [('entropy',master),('dedup-entropy',dedup)]:
   for linear in [False,True]:
    output=tmp/(name+f'.{kind}-{linear}.pdf')
    with pikepdf.open(source) as pdf:
     jpeg=optimize_jpegs(pdf);pdf.remove_unreferenced_resources()
     pdf.save(output,compress_streams=True,object_stream_mode=pikepdf.ObjectStreamMode.generate,recompress_flate=True,linearize=linear,deterministic_id=True)
    assert fingerprint(output) == original_fingerprint, f'Page/text/link/orientation mismatch: {name}'
    with pikepdf.open(output) as check:
     assert not check.check_pdf_syntax(), f'Output PDF syntax warnings: {name}'
     assert check.is_linearized == linear
    candidates.append({'kind':kind,'linearized':linear,'bytes':output.stat().st_size,'jpegStreams':jpeg,'path':output})
  smallest=min(candidates,key=lambda c:c['bytes'])
  linearized=min((c for c in candidates if c['linearized']),key=lambda c:c['bytes'])
  # Prefer fast web view when its overhead is small and it still saves bytes.
  selected=linearized if linearized['bytes'] < master.stat().st_size and linearized['bytes'] <= smallest['bytes']*1.01 and linearized['bytes']-smallest['bytes'] <= 8192 else smallest
  if selected['bytes'] >= master.stat().st_size:
   shutil.copyfile(master,live);selection='original smaller'
  else:
   shutil.copyfile(selected['path'],live);selection=selected['kind']
  rows.append({'file':name,'master':str(master.relative_to(ROOT)),'masterSHA256':sha256(master.read_bytes()).hexdigest(),'originalBytes':master.stat().st_size,'outputBytes':live.stat().st_size,'outputSHA256':sha256(live.read_bytes()).hexdigest(),'selection':selection,'linearized':selected['linearized'] if selection!='original smaller' else False,'pages':len(original_fingerprint),'pageContentTextBoxesRotationLinksExact':True,'candidates':[{k:v for k,v in c.items() if k!='path'} for c in candidates]})
  print(name,rows[-1]['originalBytes'],'->',rows[-1]['outputBytes'],selection,flush=True)
report={'date':'2026-10-20','status':'STRUCTURE_VERIFIED_RENDER_PENDING','pikepdf':pikepdf.__version__,'qpdf':pikepdf.__libqpdf_version__,'jpegtran':subprocess.check_output(['jpegtran','-version'],stderr=subprocess.STDOUT,text=True).strip(),'flateCompressionLevel':9,'files':rows,'sourceBytes':sum(x['originalBytes'] for x in rows),'outputBytes':sum(x['outputBytes'] for x in rows),'qualityPolicy':'No downsampling/requantization/cropping/color conversion; JPEG entropy decoded samples/ICC exact, PDF page content/text/boxes/rotation/link fingerprints exact; actual renders required separately'}
(ROOT/'docs/evidence/beta-media/pdf-optimization.json').write_text(json.dumps(report,indent=2)+'\n')
