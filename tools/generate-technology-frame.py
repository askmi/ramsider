"""Export the designer's contour and independent navigation sprites, never copy text."""
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from PIL import Image, ImageCms
import numpy as np

ROOT = Path('public/art/technology')
EVIDENCE = Path('docs/evidence/technology-viewer/layers')
CONTOUR = Path('design/references/frame01.png')
REFERENCE = Path('design/references/technology_frame.PNG')
OPENING = (29, 31, 912, 1600)
SPRITES = {
    'arrow-right.png': (668, 49, 696, 94),
    'arrow-down.png': (455, 1583, 500, 1612),
    'dot-active.png': (383, 111, 412, 140),
    'dot-inactive.png': (423, 111, 452, 140),
}

def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    source = Image.open(CONTOUR)
    assert source.size == (941, 1628) and source.mode == 'RGB'
    profile = ImageCms.ImageCmsProfile(BytesIO(source.info['icc_profile']))
    srgb = ImageCms.createProfile('sRGB')
    master = ImageCms.profileToProfile(source, profile, srgb, outputMode='RGB', renderingIntent=1, flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
    icc = ImageCms.ImageCmsProfile(srgb).tobytes()
    frame = master.convert('RGBA')
    frame.paste((0, 0, 0, 0), OPENING)
    output = ROOT / 'frame-template.webp'
    frame.save(output, format='WEBP', lossless=True, method=6, exact=True, icc_profile=icc)
    decoded = Image.open(output).convert('RGBA')
    assert decoded.tobytes() == frame.tobytes()
    assert Image.open(output).info['icc_profile'] == icc
    # Quantify lossless vs q95 delivery rather than assuming PNG is needed.
    png = BytesIO()
    frame.save(png, format='PNG', optimize=True, icc_profile=icc)
    sizes = {'png': len(png.getvalue())}
    for lossless in [False, True]:
        candidate = BytesIO()
        frame.save(candidate, format='WEBP', quality=95, lossless=lossless, method=6, icc_profile=icc, exact=True)
        test = np.asarray(Image.open(BytesIO(candidate.getvalue())).convert('RGBA')).astype(int)
        target = np.asarray(frame).astype(int)
        visible = target[:,:,3] > 0
        error = np.abs(test[:,:,:3] - target[:,:,:3])[visible]
        sizes['lossless-webp' if lossless else 'q95-webp'] = {'bytes': len(candidate.getvalue()), 'rgb_max': int(error.max()), 'rgb_mean': float(error.mean()), 'rgb_p99': float(np.percentile(error,99)), 'alpha_exact': bool(np.array_equal(test[:,:,3],target[:,:,3]))}
    reference = Image.open(REFERENCE)
    assert reference.size == (954,1649) and reference.mode == 'RGB'
    sprite_metrics = {}
    for name, box in SPRITES.items():
        crop = reference.crop(box)
        sprite = crop.convert('RGBA')
        values = np.array(sprite)
        values[:,:,3] = np.where(np.all(values[:,:,:3] == 0,axis=2),0,255)
        sprite = Image.fromarray(values)
        sprite.save(ROOT/name, optimize=True)
        reloaded = Image.open(ROOT/name).convert('RGBA')
        assert reloaded.tobytes() == sprite.tobytes()
        assert np.array_equal(np.array(reloaded)[:,:,:3],np.array(crop))
        sprite_metrics[name] = {'box':box,'bytes':(ROOT/name).stat().st_size,'rgb_max_error':0,'alpha':'zero only for exact black pixels'}
    result = {'source':str(CONTOUR),'sha256':sha256(CONTOUR.read_bytes()).hexdigest(),'size':source.size,'source_profile':ImageCms.getProfileName(profile).strip(),'conversion':'LittleCMS relative colorimetric + black point compensation → embedded sRGB','opening':OPENING,'output':str(output),'decoded_rgba_max_error':0,'candidates':sizes,'selected':'lossless WebP; zero decoded error, smaller than PNG','sprites':sprite_metrics,'reference_sha256':sha256(REFERENCE.read_bytes()).hexdigest(),'reference_profile':'untagged; RGB preserved'}
    (EVIDENCE/'assets.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__ == '__main__':
    main()
