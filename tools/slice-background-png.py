"""Crop reserve PNG artwork from the original files without changing RGBA or ICC."""

from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "design/derived/original-png"
REFERENCE = ROOT / "design/references"

main = [(f"{index:02}", index * 2800, (index + 1) * 2800) for index in range(9)]
main += [("09-10", 25200, 30800), ("11", 30800, 32127)]
faq = [(27147, 172, 7), (27326, 171, 8), (27505, 171, 7),
       (27683, 171, 7), (27861, 170, 6), (28037, 170, 0)]
documents = [("electrical", 120, 23305), ("emc", 510, 23305),
             ("uae", 120, 23550), ("rohs", 510, 23550),
             ("telecom", 120, 23795)]
records = []


def save_exact(source: Image.Image, source_name: str, name: str,
               box: tuple[int, int, int, int]) -> None:
    crop = source.crop(box)
    path = ART / f"{name}.png"
    crop.save(path, format="PNG", compress_level=9,
              icc_profile=source.info["icc_profile"], dpi=source.info.get("dpi"))
    with Image.open(path) as saved:
        assert saved.size == crop.size, name
        assert saved.mode == crop.mode, name
        assert saved.tobytes() == crop.tobytes(), name
        assert saved.info.get("icc_profile") == source.info["icc_profile"], name
    active_path = ROOT / "public/art" / f"{name}.webp"
    if active_path.exists():
        with Image.open(active_path) as active:
            assert active.size == crop.size, name
    records.append({"file": path.name, "source": source_name, "box": box,
                    "size": list(crop.size), "bytes": path.stat().st_size,
                    "active_webp_present": active_path.exists(),
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})


ART.mkdir(parents=True, exist_ok=True)

with Image.open(REFERENCE / "background.png") as source:
    assert source.size == (941, 32127) and source.mode == "RGBA"
    for name, top, bottom in main:
        # Two untouched source rows overlap the previous tile during CSS scaling.
        save_exact(source, "background.png", name, (0, top - (2 if top else 0), 941, bottom))
    for index, (top, height, gap) in enumerate(faq, 1):
        save_exact(source, "background.png", f"faq-row-{index}", (0, top - 4, 941, top + height + gap + 4))

with Image.open(REFERENCE / "background_text.png") as source:
    assert source.size == (941, 32127) and source.mode == "RGBA"
    for name, left, top in documents:
        save_exact(source, "background_text.png", f"doc-{name}", (left, top, left + 95, top + 140))

assert len(records) == 22
manifest = {
    "purpose": "Unused exact-source PNG alternatives for future format selection",
    "source_sha256": {name: hashlib.sha256((REFERENCE / name).read_bytes()).hexdigest()
                      for name in ("background.png", "background_text.png")},
    "files": records,
}
(ART / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print("Verified 22 PNG crops: exact RGBA pixels and source ICC profile.")
