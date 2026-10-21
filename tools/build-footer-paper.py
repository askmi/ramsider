"""Rebuild the source-anchored footer paper; never modify the story artwork."""

from io import BytesIO
from pathlib import Path
import hashlib
import json
import subprocess

import numpy as np
from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design/references/background.png"
CONTINUATION = ROOT / "design/derived/footer/continuation.png"
OUT = ROOT / "screenshots/footer-texture"
OUT.mkdir(parents=True, exist_ok=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


assert sha(SOURCE) == "1b8deab0448cb73d016f3cf8571caa081c544883dc17c9a1c2db0d24e2abc971"
assert sha(CONTINUATION) == "884745c3eae59030143fbd93b772df3151c93108778253dbf496d2c20af073bb"
source = Image.open(SOURCE)
source_profile = ImageCms.ImageCmsProfile(BytesIO(source.info["icc_profile"]))
assert "Adobe RGB (1998)" in ImageCms.getProfileName(source_profile)
# Reuse the approved, fixed sRGB profile bytes; avoid time-dependent profile metadata.
icc = Image.open(ROOT / "public/art/11.webp").info["icc_profile"]
target_profile = ImageCms.ImageCmsProfile(BytesIO(icc))
assert "sRGB" in ImageCms.getProfileName(target_profile)
box = (0, 31999, 941, 32127)
tail = source.crop(box)
anchor = ImageCms.profileToProfile(
    tail.convert("RGB"), source_profile, target_profile,
    renderingIntent=1, outputMode="RGB", flags=ImageCms.Flags.BLACKPOINTCOMPENSATION,
)
anchor.putalpha(tail.getchannel("A"))
generated = Image.open(CONTINUATION)
assert generated.mode == "RGB" and not generated.info.get("icc_profile")
# Built-in imagegen's untagged RGB output is interpreted in its standard sRGB space.
height = round(generated.height * 941 / generated.width)
master = generated.resize((941, height), Image.Resampling.LANCZOS).convert("RGBA")
pixels = np.array(master)
reflected = np.array(anchor)[::-1]
# Exact first 16 original rows (including alpha), then a 112-row smooth handoff.
weight = np.clip((np.arange(128) - 16) / 111, 0, 1)
weight = weight * weight * (3 - 2 * weight)
pixels[:128] = np.rint(
    reflected * (1 - weight[:, None, None]) + pixels[:128] * weight[:, None, None]
).astype(np.uint8)
assert np.array_equal(pixels[:16], reflected[:16])
master = Image.fromarray(pixels, "RGBA")
master_path = OUT / "master.png"
master.save(master_path, icc_profile=icc)
results = []
for name, options in [("q95", ["-q", "95", "-alpha_q", "100"]),
                      ("lossless", ["-lossless", "-exact", "-q", "100"])]:
    path = OUT / f"{name}.webp"
    subprocess.run(["cwebp", "-quiet", *options, "-m", "6", "-metadata", "icc",
                    str(master_path), "-o", str(path)], check=True)
    decoded = Image.open(path)
    actual = np.array(decoded.convert("RGBA"))
    assert decoded.size == master.size and decoded.info["icc_profile"] == icc
    assert np.array_equal(actual[:, :, 3], pixels[:, :, 3])
    error = actual[:, :, :3].astype(np.int16) - pixels[:, :, :3].astype(np.int16)
    results.append({"encoding": name, "bytes": path.stat().st_size,
                    "maxRGBError": int(np.abs(error).max()),
                    "meanRGBError": np.abs(error).mean((0, 1)).round(4).tolist(),
                    "p99RGBError": np.percentile(np.abs(error), 99, axis=(0, 1)).tolist(),
                    "signedRGBError": error.mean((0, 1)).round(4).tolist(),
                    "alphaExact": True, "iccExact": True, "sha256": sha(path)})
assert results[1]["maxRGBError"] == 0
# The q95 candidate stays within the established art colour limits at one tenth the bytes.
assert max(results[0]["meanRGBError"]) < 3 and max(results[0]["p99RGBError"]) <= 15
delivery = ROOT / "public/art/footer-paper.webp"
delivery.write_bytes((OUT / "q95.webp").read_bytes())
report = {"id": "CHG0128", "sourceSHA": sha(SOURCE), "sourceICC": ImageCms.getProfileName(source_profile).strip(),
          "donorBox": [0, 31600, 941, 32127], "anchorBox": list(box),
          "sourceAlphaRetainedInFirst16Rows": True, "anchorOrientation": "vertical reflection at original final row",
          "handoff": "16 exact source rows; smoothstep through row127 into generated texture",
          "generatedInput": str(CONTINUATION.relative_to(ROOT)), "generatedSHA": sha(CONTINUATION),
          "generator": "built-in imagegen, source-edge reference; first brighter candidate rejected",
          "generatedColourInterpretation": "untagged native imagegen RGB interpreted as standard sRGB",
          "size": [941, height], "masterSHA": sha(master_path), "sRGBProfileSHA": hashlib.sha256(icc).hexdigest(),
          "candidates": results, "selected": "q95; browser PNG-control comparison required", "delivery": str(delivery.relative_to(ROOT)),
          "deliverySHA": sha(delivery), "deliveryBytes": delivery.stat().st_size}
(OUT / "export.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
