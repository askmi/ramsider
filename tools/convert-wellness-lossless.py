#!/usr/bin/env python3
"""Lossless sRGB WebP delivery from immutable Wellness PNG reference masters.

Requires Pillow/LittleCMS and cwebp. Untagged source RGB values retain their
existing browser-sRGB interpretation; no colour transform or resampling.
"""
from pathlib import Path
from hashlib import sha256
from PIL import Image, ImageCms, ImageChops
import io
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/references/RAMSIDER_Wellness_TOP/assets'
OUTPUT = ROOT / 'public/art/wellness'
MASTERS = {
    '01-ritual_uno_white_v3': 'e98cef021ba3a9f4c143a35fffbabe15c33035acbc80d67cd8ba3b3fff217f8f',
    '03-botanicals': '87662640ab413bf61f632df00121771adedc01a6e118584ddd7b6d93f42f56e4',
    '04-capsules_v3': 'aba57b8ee8a3825f4faef1a44c477ab474c94b8ac99e6051d7e4df8d604a030f',
    '02-water_bouquet': 'cf2fdc8d8631a52682fee367817ebf70a7702cc08b2d090fd76ecf4eb8d70cba',
}
OPTIONS = ['-lossless', '-exact', '-q', '100', '-m', '6', '-mt', '-metadata', 'icc']


def digest(raw):
    return sha256(raw).hexdigest()


def chunks(raw):
    assert raw[:4] == b'RIFF' and raw[8:12] == b'WEBP'
    result = []
    offset = 12
    while offset < len(raw):
        name = raw[offset:offset + 4].decode('ascii')
        length = int.from_bytes(raw[offset + 4:offset + 8], 'little')
        result.append(name)
        offset += 8 + length + (length % 2)
    assert offset == len(raw)
    return result


def main():
    # Reuse the site's pinned, established sRGB ICC rather than a new timestamped profile.
    profile = Image.open(ROOT / 'public/art/00.webp').info['icc_profile']
    assert digest(profile) == '74ab7710541511d745bdaa97365677aea4e5757b658b8c45be7518cc3085db4e'
    assert 'sRGB' in ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(profile)))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rows = []
    with tempfile.TemporaryDirectory() as temporary:
        for name, expected_sha in MASTERS.items():
            source = SOURCE / f'{name}.png'
            source_raw = source.read_bytes()
            assert digest(source_raw) == expected_sha, f'Changed master needs review: {source}'
            original = Image.open(io.BytesIO(source_raw))
            assert original.mode == 'RGB' and original.size == (1024, 1536)
            assert not original.info, 'New colour metadata requires explicit review'
            before = original.convert('RGBA')
            control = Path(temporary) / f'{name}.png'
            original.save(control, icc_profile=profile)
            candidate = Path(temporary) / f'{name}.webp'
            subprocess.run(['cwebp', '-quiet', *OPTIONS, str(control), '-o', str(candidate)], check=True)
            raw = candidate.read_bytes()
            decoded = Image.open(io.BytesIO(raw))
            assert decoded.size == original.size and decoded.info['icc_profile'] == profile
            assert ImageChops.difference(before, decoded.convert('RGBA')).getbbox(alpha_only=False) is None
            container_chunks = chunks(raw)
            assert 'VP8L' in container_chunks and 'ICCP' in container_chunks and 'VP8 ' not in container_chunks
            assert len(raw) < len(source_raw), f'No payload reduction: {name}'
            target = OUTPUT / candidate.name
            target.write_bytes(raw)
            rows.append({
                'source': str(source.relative_to(ROOT)), 'output': str(target.relative_to(ROOT)),
                'sourceSHA256': expected_sha, 'outputSHA256': digest(raw),
                'sourceBytes': len(source_raw), 'outputBytes': len(raw), 'dimensions': list(original.size),
                'sourceMode': original.mode, 'sourceICC': None, 'sourceProfileIntent': 'UNKNOWN',
                'policy': 'Preserve existing untagged browser-sRGB interpretation; embed sRGB without RGB transform',
                'codec': 'VP8L lossless', 'chunks': container_chunks, 'iccSHA256': digest(profile),
                'decodedRGBAEqual': True, 'maximumChannelError': 0, 'alphaExact': True,
            })
        # Delete redundant public PNGs only after every output passes; masters stay untouched.
        for name in MASTERS:
            live = OUTPUT / f'{name}.png'
            if live.exists():
                assert digest(live.read_bytes()) == MASTERS[name], f'Changed live PNG needs review: {live}'
                live.unlink()
    manifest = {
        'change': 'CHG0133', 'date': '2026-10-22', 'status': 'DECODED_VERIFIED_BROWSER_PENDING',
        'encoder': subprocess.check_output(['cwebp', '-version'], text=True).strip(),
        'options': OPTIONS, 'sourceBytes': sum(r['sourceBytes'] for r in rows),
        'outputBytes': sum(r['outputBytes'] for r in rows), 'assets': rows,
    }
    receipt = ROOT / 'docs/evidence/wellness/lossless-export.json'
    receipt.parent.mkdir(parents=True, exist_ok=True)
    receipt.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({k: manifest[k] for k in ['sourceBytes', 'outputBytes']}))


if __name__ == '__main__':
    main()
