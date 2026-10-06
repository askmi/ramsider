"""Publish the four photograph masters byte-for-byte; never encode or transform."""
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

PHOTOS = {
    '02': 'HeatCore_02_THREE_HEATERS_941x1672.png',
    '03': 'HeatCore_03_ACTIVE_AIR_SAILS_941x1672.png',
    '04': 'HeatCore_04_PROGRAMMABLE_HEAT_PROFILES_941x1672.png',
    '05': 'HeatCore_05_GOLD_AND_TITANIUM_NITRIDE_941x1672.png',
}

def main():
    items=[]
    for identifier, filename in PHOTOS.items():
        source=Path('design/references/tech_01')/filename
        output=Path('public/art/technology')/(identifier+'.png')
        shutil.copyfile(source, output)
        assert source.read_bytes()==output.read_bytes()
        with Image.open(source) as image:
            assert image.size==(941,1672)
            items.append({'id':identifier,'source':str(source),'output':str(output),'size':image.size,'mode':image.mode,'iccBytes':len(image.info.get('icc_profile',b'')),'sourceBytes':source.stat().st_size,'outputBytes':output.stat().st_size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'byteIdentical':True})
    report={'method':'shutil.copyfile; no decode/reencode, resizing, color conversion or optimization','items':items,'totalPhotoBytes':sum(item['outputBytes'] for item in items)}
    Path('docs/evidence/technology-viewer/original-png/assets.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    main()
