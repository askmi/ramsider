#!/usr/bin/env python3
"""Lossy sRGB WebP delivery for the 35 photographic assets that are currently VP8L lossless.

Scope: public/art/wellness/*.webp (4), public/art/charcoal/v2-*.webp (8) and
public/art/technology/slides/*.webp (23). Logos, icons, certificates, seams and
previews stay lossless and are not touched.

Source policy: the current lossless WebP files are decoded-exact copies of the
approved masters (CHG0113 manifest outputSHA256 for the 23 technology slides,
CHG0133 pinned MASTERS for the 4 Wellness PNGs, CHG0182 source-exact charcoal
plates), so each is used as the single colour-managed intermediate. Every source
hash is pinned below and re-checked before encoding; a changed source aborts.

Encoding follows docs/art-color-pipeline.md: `cwebp -m 6 -metadata icc`, default
and `-sharp_yuv` candidates, decoded and measured against the exact source
(visible-pixel RGB mean / p99, local 64 px errors, red shift, sampled CIE Lab
ΔE76 p99). The owner-approved base quality is 90 (Founder 2026-11-05 on A/B
pairs). A candidate that trips the pipeline fallback thresholds (mean ≥ 3/255,
p99 > 15/255 or worst-channel mean signed shift on red-dominant pixels ≥ 2/255,
no minimum pixel count) is retried at q95; if q95 also trips, the asset keeps
its lossless file and the receipt records the fallback.

Only the Python standard library plus the cwebp/dwebp/webpinfo binaries are
required (Pillow is intentionally not needed), so the tool runs in the same
environment that produced the receipts.

Usage:
  python3 tools/convert-photos-lossy.py --dry-run   # candidates + receipt only
  python3 tools/convert-photos-lossy.py --apply     # replace public/art files
"""
from __future__ import annotations

import argparse
import hashlib
import json
import operator
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/art"
EVIDENCE = ROOT / "docs/evidence/photos-lossy"
BASE_QUALITY = 90
RETRY_QUALITY = 95
ASSETS = [
    "wellness/01-ritual_uno_white_v3", "wellness/02-water_bouquet",
    "wellness/03-botanicals", "wellness/04-capsules_v3",
    "charcoal/v2-1-0", "charcoal/v2-1-1", "charcoal/v2-2-0", "charcoal/v2-2-1",
    "charcoal/v2-3-0", "charcoal/v2-3-1", "charcoal/v2-4-0", "charcoal/v2-4-1",
    "technology/slides/air-01", "technology/slides/air-02",
    "technology/slides/aqua-01", "technology/slides/aqua-02",
    "technology/slides/capsule-01", "technology/slides/capsule-02",
    "technology/slides/capsule-03", "technology/slides/cyber-01",
    "technology/slides/cyber-02", "technology/slides/heat-02",
    "technology/slides/heat-03", "technology/slides/heat-04",
    "technology/slides/heat-05", "technology/slides/mood-01",
    "technology/slides/mood-02", "technology/slides/noble-01",
    "technology/slides/noble-02", "technology/slides/poly-01",
    "technology/slides/quick-01", "technology/slides/quick-02",
    "technology/slides/touch-01", "technology/slides/touch-02",
    "technology/slides/touch-03",
]
# sha256 of the lossless sources at branch creation (origin/main 45a7110). Mandatory.
PINNED_PATH = ROOT / "tools/convert-photos-lossy.sources.json"
PINNED = json.loads(PINNED_PATH.read_text())
assert set(PINNED) == set(ASSETS), "pinned source list must cover exactly the asset list"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(cmd: list[str]) -> str:
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def webp_info(path: Path) -> dict:
    out = run(["webpinfo", str(path)])
    return {
        "lossless": "Lossless" in out,
        "icc": "Chunk ICCP" in out,
        "alpha": any(line.strip().startswith("Alpha: 1") for line in out.splitlines()),
    }


def decode_ppm(path: Path, temp: Path) -> tuple[int, int, bytes]:
    """Decode WebP to raw RGB bytes through dwebp's PPM writer."""
    ppm = temp / (path.stem + ".ppm")
    run(["dwebp", "-quiet", "-ppm", str(path), "-o", str(ppm)])
    raw = ppm.read_bytes()
    # P6\n<w> <h>\n255\n<data>
    header, _, rest = raw.partition(b"\n")
    assert header == b"P6", header
    dims, _, rest = rest.partition(b"\n")
    width, height = (int(v) for v in dims.split())
    maxval, _, data = rest.partition(b"\n")
    assert maxval == b"255" and len(data) == width * height * 3, (path, len(data))
    return width, height, data


def srgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    def lin(v: int) -> float:
        v /= 255
        return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    rl, gl, bl = lin(r), lin(g), lin(b)
    x = (rl * .4124564 + gl * .3575761 + bl * .1804375) / .95047
    y = rl * .2126729 + gl * .7151522 + bl * .0721750
    z = (rl * .0193339 + gl * .1191920 + bl * .9503041) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > .008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def percentile_from_hist(hist: list[int], q: float) -> int:
    total = sum(hist)
    target = q * total
    seen = 0
    for value, count in enumerate(hist):
        seen += count
        if seen >= target:
            return value
    return 255


def color_metrics(width: int, height: int, expected: bytes, actual: bytes, sample: int = 4) -> dict:
    """Port of tools/convert-art-webp.py color_metrics for opaque RGB images."""
    n = width * height
    signed = list(map(operator.sub, actual, expected))          # actual - expected per channel
    absolute = bytes(map(abs, signed))
    channel_abs = [absolute[c::3] for c in range(3)]
    mean = [round(sum(ch) / n, 3) for ch in channel_abs]
    hists = [[ch.count(v) for v in range(256)] for ch in channel_abs]
    p99 = [percentile_from_hist(h, .99) for h in hists]
    # red-dominant pixels: R > 1.05 G and R > 1.1 B and R > 80 (expected image)
    red_mask = bytearray(n)
    red_sum = [0, 0, 0]
    red_count = 0
    red_box = [width, height, -1, -1]  # left, top, right, bottom of red-dominant pixels
    for i in range(n):
        j = i * 3
        r, g, b = expected[j], expected[j + 1], expected[j + 2]
        if r > 80 and r * 100 > g * 105 and r * 10 > b * 11:
            red_mask[i] = 1
            red_count += 1
            red_sum[0] += signed[j]
            red_sum[1] += signed[j + 1]
            red_sum[2] += signed[j + 2]
            y, x = divmod(i, width)
            red_box = [min(red_box[0], x), min(red_box[1], y), max(red_box[2], x), max(red_box[3], y)]
    red_mean = [round(s / red_count, 3) for s in red_sum] if red_count else None
    # local 64 px blocks
    local_max_mae = 0.0
    local_max_red = 0.0
    local_max_mae_block = None
    local_max_red_block = None
    row_bytes = width * 3
    for top in range(0, height, 64):
        rows = range(top, min(top + 64, height))
        for left in range(0, width, 64):
            right = min(left + 64, width)
            block_px = len(rows) * (right - left)
            if block_px < 64:
                continue
            sums = [0, 0, 0]
            red_shift = [0, 0, 0]
            red_n = 0
            for y in rows:
                start = y * row_bytes + left * 3
                seg = absolute[start:start + (right - left) * 3]
                sums[0] += sum(seg[0::3]); sums[1] += sum(seg[1::3]); sums[2] += sum(seg[2::3])
                base = y * width + left
                for x in range(right - left):
                    if red_mask[base + x]:
                        red_n += 1
                        j = (base + x) * 3
                        red_shift[0] += signed[j]; red_shift[1] += signed[j + 1]; red_shift[2] += signed[j + 2]
            block_mae = max(sums) / block_px
            if block_mae > local_max_mae:
                local_max_mae, local_max_mae_block = block_mae, [left, top]
            if red_n >= 32:
                # worst channel of the mean signed shift on the block's red pixels (as convert-art-webp.py)
                block_red_shift = max(abs(s / red_n) for s in red_shift)
                if block_red_shift > local_max_red:
                    local_max_red, local_max_red_block = block_red_shift, [left, top]
    # sampled ΔE76 p99 (every `sample`-th pixel in both axes)
    deltas = []
    for y in range(0, height, sample):
        for x in range(0, width, sample):
            j = (y * width + x) * 3
            l1, a1, b1 = srgb_to_lab(expected[j], expected[j + 1], expected[j + 2])
            l2, a2, b2 = srgb_to_lab(actual[j], actual[j + 1], actual[j + 2])
            deltas.append(((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2) ** .5)
    deltas.sort()
    de_p99 = deltas[min(len(deltas) - 1, int(len(deltas) * .99))]
    return {
        "rgb_mean_abs": mean,
        "rgb_p99_abs": p99,
        "rgb_max_abs": max(absolute),
        "red_pixels": red_count,
        "red_pixels_box": red_box if red_count else None,
        "red_mean_shift": red_mean,
        "local_max_mae": round(local_max_mae, 3),
        "local_max_mae_block": local_max_mae_block,
        "local_max_red_shift": round(local_max_red, 3),
        "local_max_red_block": local_max_red_block,
        "sampled_delta_e76_p99": round(de_p99, 3),
        "sample_step": sample,
    }


def trips_fallback(m: dict) -> bool:
    """Pipeline fallback thresholds, exactly as tools/convert-art-webp.py:
    visible RGB mean >= 3/255, p99 > 15/255, or worst-channel mean signed shift
    on red-dominant pixels >= 2/255 (no minimum red-pixel count)."""
    red = max(map(abs, m["red_mean_shift"])) if m["red_mean_shift"] else 0.0
    return max(m["rgb_mean_abs"]) >= 3 or max(m["rgb_p99_abs"]) > 15 or red >= 2


def encode(source: Path, target: Path, quality: int, sharp: bool) -> None:
    cmd = ["cwebp", "-quiet", "-q", str(quality), "-m", "6", "-metadata", "icc"]
    if sharp:
        cmd.append("-sharp_yuv")
    run(cmd + [str(source), "-o", str(target)])


def choose(source: Path, temp: Path, width: int, height: int, expected: bytes, quality: int) -> dict:
    plain = temp / f"{source.stem}-q{quality}.webp"
    sharp = temp / f"{source.stem}-q{quality}-sharp.webp"
    encode(source, plain, quality, False)
    encode(source, sharp, quality, True)
    results = {}
    for label, path in (("default", plain), ("sharp_yuv", sharp)):
        w, h, actual = decode_ppm(path, temp)
        assert (w, h) == (width, height), (path, w, h)
        info = webp_info(path)
        assert info["icc"] and not info["lossless"], (path, info)
        results[label] = {"path": path, "bytes": path.stat().st_size,
                          "metrics": color_metrics(width, height, expected, actual)}
    lossy, sh = results["default"], results["sharp_yuv"]
    perceptual_gain = lossy["metrics"]["sampled_delta_e76_p99"] - sh["metrics"]["sampled_delta_e76_p99"]
    red_gain = lossy["metrics"]["local_max_red_shift"] - sh["metrics"]["local_max_red_shift"]
    use_sharp = (sh["bytes"] <= lossy["bytes"] * 1.20
                 and max(sh["metrics"]["rgb_p99_abs"]) <= max(lossy["metrics"]["rgb_p99_abs"])
                 and sh["metrics"]["local_max_red_shift"] <= lossy["metrics"]["local_max_red_shift"] + 1
                 and (perceptual_gain >= .25 or red_gain >= 5))
    chosen = "sharp_yuv" if use_sharp else "default"
    return {"quality": quality, "chosen": chosen, "candidates": {
        k: {"bytes": v["bytes"], "metrics": v["metrics"]} for k, v in results.items()},
        "path": results[chosen]["path"]}


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--apply", action="store_true")
    parser.add_argument("--only", nargs="*", help="subset of asset keys")
    parser.add_argument("--keep", type=Path, help="directory to keep chosen candidates (dry-run)")
    args = parser.parse_args()
    keys = args.only or ASSETS
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    rows = []
    started = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        temp = Path(tmp)
        for key in keys:
            source = ART / f"{key}.webp"
            source_sha = sha256(source)
            if PINNED.get(key) != source_sha:
                print(f"ABORT {key}: source sha {source_sha[:12]} != pinned {str(PINNED.get(key))[:12]}", file=sys.stderr)
                return 1
            info = webp_info(source)
            assert info["lossless"] and info["icc"] and not info["alpha"], (key, info)
            width, height, expected = decode_ppm(source, temp)
            t0 = time.time()
            result = choose(source, temp, width, height, expected, BASE_QUALITY)
            chosen_metrics = result["candidates"][result["chosen"]]["metrics"]
            fallback = None
            if trips_fallback(chosen_metrics):
                retry = choose(source, temp, width, height, expected, RETRY_QUALITY)
                retry_metrics = retry["candidates"][retry["chosen"]]["metrics"]
                if trips_fallback(retry_metrics):
                    fallback = "lossless_kept"
                else:
                    fallback = f"retry_q{RETRY_QUALITY}"
                    result = retry
            row = {
                "asset": f"public/art/{key}.webp", "width": width, "height": height,
                "sourceSHA256": source_sha, "sourceBytes": source.stat().st_size,
                "sourceCodec": "VP8L lossless", "embeddedICC": "sRGB (copied from source)",
                "quality": result["quality"], "chosen": result["chosen"], "fallback": fallback,
                "candidates": result["candidates"], "encodeSeconds": round(time.time() - t0, 1),
            }
            if fallback != "lossless_kept":
                chosen_path = result["path"]
                row["outputBytes"] = chosen_path.stat().st_size
                row["outputSHA256"] = sha256(chosen_path)
                if args.apply:
                    shutil.copyfile(chosen_path, source)
                    assert sha256(source) == row["outputSHA256"]
                elif args.keep:
                    args.keep.mkdir(parents=True, exist_ok=True)
                    dest = args.keep / f"{key.replace('/', '_')}.webp"
                    shutil.copyfile(chosen_path, dest)
            else:
                row["outputBytes"] = row["sourceBytes"]
                row["outputSHA256"] = source_sha
            rows.append(row)
            m = row["candidates"][row["chosen"]]["metrics"]
            print(f"{key}: {row['sourceBytes']//1024} KB -> {row['outputBytes']//1024} KB "
                  f"q{row['quality']} {row['chosen']} mean {m['rgb_mean_abs']} p99 {m['rgb_p99_abs']} "
                  f"dE99 {m['sampled_delta_e76_p99']} localMAE {m['local_max_mae']} "
                  f"{'FALLBACK ' + fallback if fallback else ''} ({row['encodeSeconds']} s)", flush=True)
    receipt = {
        "id": "CHG0199", "dateLocal": time.strftime("%Y-%m-%d"), "mode": "apply" if args.apply else "dry-run",
        "encoder": run(["cwebp", "-version"]).strip().replace("\n", "; "),
        "baseQuality": BASE_QUALITY, "retryQuality": RETRY_QUALITY,
        "policy": "Founder-approved q90 lossy (A/B 2026-11-05); pipeline fallback thresholds mean>=3, p99>15, red>=2 -> q95 -> lossless kept",
        "assetCount": len(rows),
        "sourceBytes": sum(r["sourceBytes"] for r in rows),
        "outputBytes": sum(r["outputBytes"] for r in rows),
        "seconds": round(time.time() - started, 1),
        "assets": rows,
    }
    out = EVIDENCE / ("manifest.json" if args.apply else "dry-run.json")
    out.write_text(json.dumps(receipt, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: receipt[k] for k in ("assetCount", "sourceBytes", "outputBytes", "seconds")}))
    print("receipt:", out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
