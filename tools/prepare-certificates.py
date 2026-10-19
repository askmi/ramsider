"""Reproduce native-viewable PDFs from untouched certificate inputs (pypdf)."""
from pathlib import Path
from pypdf import PdfReader, PdfWriter
import hashlib, json, shutil
root = Path(__file__).resolve().parents[1]
source = root / 'design/references/certificates'
out = root / 'public/certificates'
out.mkdir(exist_ok=True)
names = {
 'electrical-safety': '1_Electrical_Safety_IEC60335-1_CB_CNCVC3375.pdf',
 'emc': '2_EMC_CB_Scheme_BELLIS_BY-00473.pdf',
 'uae-conformity': '3_UAE_Conformity_ECAS_MoIAT_25-12-176846.pdf',
 'uae-telecom': '5_UAE_Telecom_TDRA_ER55730-26.pdf',
 'all-certificates': '6_RAMSIDER_UNO_All_Certificates_8docs.pdf',
}
receipt = []
for name, filename in names.items():
 src = source / filename; dst = out / f'{name}.pdf'
 correction = None
 if name == 'all-certificates':
  reader = PdfReader(src)
  upright = PdfReader(source / names['electrical-safety'])
  # The bundle lost the standalone scan's rotation. Native viewers must not
  # depend on the retired application viewer to make this page readable.
  assert len(reader.pages) == 15 and reader.pages[0].rotation == 0
  assert upright.pages[0].rotation == 270
  assert reader.pages[0].mediabox == upright.pages[0].mediabox
  writer = PdfWriter(reader, incremental=True)
  writer.pages[0].rotation = 270
  with dst.open('wb') as stream: writer.write(stream)
  result = PdfReader(dst)
  assert dst.read_bytes().startswith(src.read_bytes())
  for index, page in enumerate(result.pages):
   original = reader.pages[index]
   assert page.get_contents().get_data() == original.get_contents().get_data()
   assert page.mediabox == original.mediabox and page.cropbox == original.cropbox
   assert page.rotation == (270 if index == 0 else original.rotation)
  correction = {'page': 1, 'sourceRotation': 0, 'rotation': 270,
                'incremental': True, 'sourcePrefixExact': True,
                'pageStreamsExact': True}
 else:
  shutil.copyfile(src, dst)
 item = {'destination': str(dst.relative_to(root)), 'source': str(src.relative_to(root)), 'sha256': hashlib.sha256(dst.read_bytes()).hexdigest(), 'sourceExact': src.read_bytes() == dst.read_bytes(), 'pages': len(PdfReader(dst).pages), 'bytes': dst.stat().st_size}
 if correction: item['orientationCorrection'] = correction
 receipt.append(item)
src = source / names['all-certificates']; reader = PdfReader(src)
writer = PdfWriter()
for index in range(5,8): writer.add_page(reader.pages[index])
dst = out / 'rohs.pdf'
with dst.open('wb') as stream: writer.write(stream)
result = PdfReader(dst)
assert len(result.pages) == 3
for index, page in enumerate(result.pages):
 assert page.get_contents().get_data() == reader.pages[index+5].get_contents().get_data()
 assert page.mediabox == reader.pages[index+5].mediabox
receipt.append({'destination': str(dst.relative_to(root)), 'source': str(src.relative_to(root)), 'sourcePages': [6,7,8], 'pageStreamsExact': True, 'sha256': hashlib.sha256(dst.read_bytes()).hexdigest(), 'pages':3, 'bytes':dst.stat().st_size})
(root/'docs/evidence/certificates/assets.json').write_text(json.dumps(receipt,indent=2)+'\n')
