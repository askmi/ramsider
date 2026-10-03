"""Rebuild color-managed WebP art from the current Photoshop PNG exports.

The RGB comparison is against the same Adobe RGB -> sRGB conversion used for
encoding, never against unconverted Adobe RGB channel numbers.
"""

from io import BytesIO
from pathlib import Path
import base64
import hashlib
import json
import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/art"
REF = ROOT / "design/references"
MAIN = [(f"{i:02}", i * 2800, (i + 1) * 2800) for i in range(9)]
MAIN += [("09-10", 25200, 30800), ("11", 30800, 32127)]
FAQ = [(27147, 172, 7), (27326, 171, 8), (27505, 171, 7),
       (27683, 171, 7), (27861, 170, 6), (28037, 170, 0)]
DOCS = [("electrical", 120, 23305), ("emc", 510, 23305),
        ("uae", 120, 23550), ("rohs", 510, 23550),
        ("telecom", 120, 23795)]
SRGB = ImageCms.createProfile("sRGB")
SRGB_BYTES = ImageCms.ImageCmsProfile(SRGB).tobytes()
REPORT = []
PREVIEWS = {}


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Approximate CIE Lab (D65) for a small sampled sRGB array."""
    value = rgb.astype(np.float32) / 255
    linear = np.where(value <= .04045, value / 12.92, ((value + .055) / 1.055) ** 2.4)
    xyz = linear @ np.array([[.4124564, .3575761, .1804375],
                              [.2126729, .7151522, .0721750],
                              [.0193339, .1191920, .9503041]], dtype=np.float32).T
    xyz /= np.array([.95047, 1.0, 1.08883], dtype=np.float32)
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack((116 * f[..., 1] - 16,
                     500 * (f[..., 0] - f[..., 1]),
                     200 * (f[..., 1] - f[..., 2])), axis=-1)


def color_metrics(expected: np.ndarray, actual: np.ndarray) -> dict:
    """Measure visible color, including local and high-percentile errors."""
    diff = actual[:, :, :3] - expected[:, :, :3]
    visible = expected[:, :, 3] > 0
    absolute = np.abs(diff)
    red = ((expected[:, :, 0] > expected[:, :, 1] * 1.05)
           & (expected[:, :, 0] > expected[:, :, 2] * 1.1)
           & (expected[:, :, 0] > 80) & (expected[:, :, 3] == 255))
    red_mean = diff[red].mean(axis=0).round(3).tolist() if red.any() else None
    local_max_mae = 0.0
    local_max_red_shift = 0.0
    for top in range(0, expected.shape[0], 64):
        for left in range(0, expected.shape[1], 64):
            block_visible = visible[top:top + 64, left:left + 64]
            if block_visible.sum() >= 64:
                local_max_mae = max(local_max_mae, float(absolute[top:top + 64, left:left + 64][block_visible].mean(axis=0).max()))
            block_red = red[top:top + 64, left:left + 64]
            if block_red.sum() >= 32:
                local_max_red_shift = max(local_max_red_shift,
                                          float(np.abs(diff[top:top + 64, left:left + 64][block_red].mean(axis=0)).max()))
    sample = np.s_[::4, ::4]
    sample_visible = visible[sample]
    lab_error = np.linalg.norm(rgb_to_lab(expected[sample][:, :, :3])
                               - rgb_to_lab(actual[sample][:, :, :3]), axis=-1)[sample_visible]
    return {"rgb_mae": absolute[visible].mean(axis=0).round(3).tolist(),
            "rgb_p99_abs": np.percentile(absolute[visible], 99, axis=0).tolist(),
            "red_mean_signed": red_mean,
            "local_max_mae": round(local_max_mae, 3),
            "local_max_red_shift": round(local_max_red_shift, 3),
            "sampled_delta_e76_p99": round(float(np.percentile(lab_error, 99)), 3),
            "visible_pixels": int(visible.sum())}


def encode(source: Image.Image, name: str, box: tuple[int, int, int, int], temp: Path) -> None:
    crop = source.crop(box)
    source_icc = ImageCms.ImageCmsProfile(BytesIO(source.info["icc_profile"]))
    assert "Adobe RGB (1998)" in ImageCms.getProfileName(source_icc)
    rgb = ImageCms.profileToProfile(crop.convert("RGB"), source_icc, SRGB,
                                    renderingIntent=1, outputMode="RGB",
                                    flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
    rgb.putalpha(crop.getchannel("A"))
    # Preserve the source alpha. Align invisible edge RGB with its neighbor;
    # cwebp may discard these values, but must never turn transparency opaque.
    if box[0] == 0 and crop.width == 941:
        pixels = np.array(rgb)
        edge = (pixels[:, -1, 3] == 0) & (pixels[:, -2, 3] == 255)
        pixels[edge, -1, :3] = pixels[edge, -2, :3]
        rgb = Image.fromarray(pixels, "RGBA")
    png = temp / f"{name}.png"
    rgb.save(png, icc_profile=SRGB_BYTES)
    if os.environ.get("ART_REFERENCE_PNG_DIR"):
        reference_dir = Path(os.environ["ART_REFERENCE_PNG_DIR"])
        reference_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(png, reference_dir / png.name)
    output = ART / f"{name}.webp"
    candidate = temp / f"{name}.webp"
    subprocess.run(["cwebp", "-quiet", "-q", "95", "-m", "6",
                    "-alpha_q", "100", "-metadata", "icc", str(png),
                    "-o", str(candidate)], check=True)
    decoded = Image.open(candidate)
    assert decoded.size == rgb.size
    assert decoded.info.get("icc_profile") == SRGB_BYTES
    actual = np.asarray(decoded.convert("RGBA"), dtype=np.int16)
    expected = np.asarray(rgb, dtype=np.int16)
    assert np.array_equal(expected[:, :, 3], np.asarray(crop.getchannel("A"))), name
    alpha_mismatch = int(np.count_nonzero(actual[:, :, 3] != expected[:, :, 3]))
    assert alpha_mismatch == 0, (name, alpha_mismatch)
    metrics = color_metrics(expected, actual)
    lossy_metrics = metrics.copy()
    lossy_bytes = candidate.stat().st_size
    sharp_candidate = temp / f"{name}-sharp.webp"
    subprocess.run(["cwebp", "-quiet", "-q", "95", "-m", "6", "-alpha_q", "100",
                    "-sharp_yuv", "-metadata", "icc", str(png),
                    "-o", str(sharp_candidate)], check=True)
    sharp_decoded = Image.open(sharp_candidate)
    assert sharp_decoded.info.get("icc_profile") == SRGB_BYTES
    sharp_actual = np.asarray(sharp_decoded.convert("RGBA"), dtype=np.int16)
    assert np.array_equal(sharp_actual[:, :, 3], expected[:, :, 3]), name
    sharp_metrics = color_metrics(expected, sharp_actual)
    sharp_bytes = sharp_candidate.stat().st_size
    perceptual_gain = (lossy_metrics["sampled_delta_e76_p99"]
                       - sharp_metrics["sampled_delta_e76_p99"])
    red_gain = (lossy_metrics["local_max_red_shift"]
                - sharp_metrics["local_max_red_shift"])
    use_sharp = (sharp_bytes <= lossy_bytes * 1.20
                 and max(sharp_metrics["rgb_p99_abs"]) <= max(lossy_metrics["rgb_p99_abs"])
                 and sharp_metrics["local_max_red_shift"] <= lossy_metrics["local_max_red_shift"] + 1
                 and (perceptual_gain >= .25 or red_gain >= 5))
    chosen = sharp_candidate if use_sharp else candidate
    if use_sharp:
        metrics = sharp_metrics
        actual = sharp_actual
    mode = "lossy-q95"
    if use_sharp:
        mode = "lossy-q95-sharp-yuv"
    if (name.startswith("doc-") or max(metrics["rgb_mae"]) >= 3
            or max(metrics["rgb_p99_abs"]) > 15
            or (metrics["red_mean_signed"] is not None
                and max(map(abs, metrics["red_mean_signed"])) >= 2)):
        chosen = temp / f"{name}-lossless.webp"
        subprocess.run(["cwebp", "-quiet", "-lossless", "-q", "85", "-m", "6",
                        "-exact", "-metadata", "icc", str(png), "-o", str(chosen)], check=True)
        decoded = Image.open(chosen)
        assert decoded.info.get("icc_profile") == SRGB_BYTES
        actual = np.asarray(decoded.convert("RGBA"), dtype=np.int16)
        assert np.array_equal(actual, expected), name
        metrics = color_metrics(expected, actual)
        mode = "lossless"
    record = {"file": output.name, "box": box, "srgb_png_bytes": png.stat().st_size,
              "webp_bytes": chosen.stat().st_size,
              "mode": mode,
              "lossy_candidate_bytes": lossy_bytes,
              "lossy_candidate_metrics": lossy_metrics,
              "sharp_yuv_candidate_bytes": sharp_bytes,
              "sharp_yuv_candidate_metrics": sharp_metrics,
              **metrics,
              "alpha_mismatch": alpha_mismatch}
    assert (max(metrics["rgb_mae"]) < 3 and max(metrics["rgb_p99_abs"]) <= 15
            and (metrics["red_mean_signed"] is None
                 or max(map(abs, metrics["red_mean_signed"])) < 2)), record
    chosen.replace(output)
    if not name.startswith("doc-") and name != "00":
        preview_png = temp / f"{name}-preview.png"
        preview_webp = temp / f"{name}-preview.webp"
        rgb.resize((118, max(1, round(rgb.height * 118 / rgb.width))),
                   Image.Resampling.LANCZOS).save(preview_png, icc_profile=SRGB_BYTES)
        subprocess.run(["cwebp", "-quiet", "-q", "75", "-m", "6", "-metadata", "icc",
                        str(preview_png), "-o", str(preview_webp)], check=True)
        assert Image.open(preview_webp).info.get("icc_profile") == SRGB_BYTES
        record["preview_bytes"] = preview_webp.stat().st_size
        PREVIEWS[name] = "data:image/webp;base64," + base64.b64encode(preview_webp.read_bytes()).decode("ascii")
    REPORT.append(record)


def main() -> None:
    ART.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        temp = Path(directory)
        for filename, jobs in [
            ("background.png", [(name, (0, top - (2 if top else 0), 941, bottom))
                                for name, top, bottom in MAIN]
             + [(f"faq-row-{i}", (0, top - 4, 941, top + height + gap + 4))
                for i, (top, height, gap) in enumerate(FAQ, 1)]),
            ("background_text.png", [(f"doc-{name}", (x, y, x + 95, y + 140))
                                     for name, x, y in DOCS]),
        ]:
            path = REF / filename
            with Image.open(path) as source:
                assert source.size == (941, 32127) and source.mode == "RGBA"
                for name, box in jobs:
                    encode(source, name, box, temp)
    summary = {"method": "Adobe RGB (1998) -> sRGB via LittleCMS relative colorimetric intent with black point compensation; cwebp 1.6.0 q95 m6 alpha_q100 metadata icc; compare default and sharp_yuv candidates, select sharp when sampled Delta E76 p99 improves >=0.25 or local red shift drops >=5 with <=20% byte growth, no RGB p99 worsening and <=1 local red regression; documents lossless; lossless exact fallback when visible RGB MAE >=3, visible p99 >15, or global red shift >=2",
               "source_sha256": hashlib.sha256((REF / "background.png").read_bytes()).hexdigest(),
               "source_text_sha256": hashlib.sha256((REF / "background_text.png").read_bytes()).hexdigest(),
               "files": REPORT}
    report = ROOT / "docs/evidence/art-webp/color-metrics.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(summary, indent=2) + "\n")
    (ROOT / "lib/art-previews.json").write_text(json.dumps(PREVIEWS, indent=2) + "\n")
    print(f"Verified {len(REPORT)} color-managed WebP crops; report: {report}")


if __name__ == "__main__":
    main()
