#!/usr/bin/env python3
"""Prepare an immutable, source-bound mobile HLS VOD package. FFmpeg required."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
from fractions import Fraction


DEFAULT_PROFILES = [
    {"name": "144p", "height": 144, "maxVideoKbps": 28, "crf": 30},
    {"name": "360p", "height": 360, "maxVideoKbps": 550, "crf": 19},
    {"name": "720p", "height": 720, "maxVideoKbps": 2000, "crf": 18},
    {"name": "1080p", "height": 1080, "maxVideoKbps": 4500, "crf": 18, "level": "4.1", "refs": 4},
    {"name": "1440p", "height": 1440, "maxVideoKbps": 8000, "crf": 18},
    {"name": "2160p", "height": 2160, "maxVideoKbps": 14000, "crf": 17},
]

# H.264 Annex A frame/macroblock-rate constraints (see FFmpeg h264_levels.c).
LEVEL_LIMITS = {12:(6000,396),13:(11880,396),20:(11880,396),21:(19800,792),22:(20250,1620),30:(40500,1620),31:(108000,3600),32:(216000,5120),40:(245760,8192),41:(245760,8192),42:(522240,8704),50:(589824,22080),51:(983040,36864),52:(2073600,36864)}


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def probe(path, *args):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", *args, "-of", "json", str(path)
    ]))


def media_segments(playlist):
    result = []
    duration = None
    for line in playlist.read_text().splitlines():
        if line.startswith("#EXTINF:"):
            duration = float(line[8:].split(",")[0])
        elif line and not line.startswith("#"):
            if duration is None:
                raise ValueError("Segment without EXTINF")
            result.append((line, duration, (playlist.parent / line).stat().st_size))
            duration = None
    return result


def bandwidth(segments, target):
    # RFC8216 peak windows: contiguous segments lasting0.5–1.5 target durations.
    rates = []
    for i in range(len(segments)):
        seconds = size = 0
        for _, duration, length in segments[i:]:
            seconds += duration
            size += length
            if seconds > 1.5 * target + .000001:
                break
            if seconds >= .5 * target:
                rates.append(size * 8 / seconds)
    if not rates:
        rates = [sum(x[2] for x in segments) * 8 / sum(x[1] for x in segments)]
    return math.ceil(max(rates)), round(sum(x[2] for x in segments) * 8 / sum(x[1] for x in segments))


def codec_string(init):
    data = init.read_bytes()
    at = data.find(b"avcC")
    if at < 0 or b"mp4a" not in data:
        raise ValueError("Expected H264/AAC initialization")
    return "avc1." + data[at + 5:at + 8].hex() + ",mp4a.40.2"


def audio_identity(path):
    packets = probe(path, "-select_streams", "a:0", "-show_packets", "-show_data_hash", "sha256",
                    "-show_entries", "packet=data_hash,size")["packets"]
    return {"packets": len(packets), "bytes": sum(int(p["size"]) for p in packets),
            "sha256": hashlib.sha256("\n".join(p["data_hash"] for p in packets).encode()).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--id", required=True, help="Logical film ID")
    parser.add_argument("--language", required=True, help="Actual audio locale, e.g.en orru")
    parser.add_argument("--version", required=True, help="New immutable version")
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--profiles", type=Path, help="JSON profile array; omit to use initial candidates")
    parser.add_argument("--reuse-package", type=Path, help="Previously verified package; reuse only identical profiles/source audio")
    parser.add_argument("--reuse-receipt", type=Path, help="Exact receipt for --reuse-package")
    parser.add_argument("--segment-seconds", type=float, default=2)
    parser.add_argument("--preset", default="slow")
    parser.add_argument("--threads", type=int, default=6)
    args = parser.parse_args()
    for value in (args.id, args.language, args.version):
        if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9-]{0,63}", value):
            parser.error("IDs/locales/versions must be safe path components")
    if not (0.5 <= args.segment_seconds <= 10) or args.threads < 1:
        parser.error("Invalid segment duration or thread count")
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        parser.error("Install FFmpeg and FFprobe before preparation")
    src = args.source.resolve(strict=True)
    source = probe(src, "-show_streams", "-show_format")
    video = next(x for x in source["streams"] if x["codec_type"] == "video")
    audio = next((x for x in source["streams"] if x["codec_type"] == "audio"), None)
    if audio is None:
        parser.error("This recipe requires audio; explicitly adapt the package for a silent film")
    if video.get("sample_aspect_ratio", "1:1") != "1:1":
        parser.error("Resolve non-square source pixels explicitly to preserve display aspect")
    if any(video.get(x) != "bt709" for x in ("color_space", "color_transfer", "color_primaries")) or video.get("color_range") != "tv":
        parser.error("This recipe preserves declared SDR BT709 limited range only; resolve other color explicitly")
    if any("rotation" in x and float(x["rotation"]) != 0 for x in video.get("side_data_list", [])):
        parser.error("Resolve rotated source explicitly before packaging")
    if audio["codec_name"] != "aac" or audio.get("profile") != "LC":
        parser.error("Main variants copy AAC-LC; explicitly adapt the recipe for other audio codecs")
    fps = Fraction(video["avg_frame_rate"])
    if fps != Fraction(video["r_frame_rate"]):
        parser.error("Variable frame rate requires an explicit timing policy")
    gop = round(float(fps) * args.segment_seconds)
    if abs(gop / float(fps) - args.segment_seconds) > .02:
        parser.error("Choose a segment duration aligned to the source frame rate")
    folder = args.output_root / args.id / f"{args.language}-{args.version}"
    if folder.exists() or args.archive.exists():
        parser.error("Output/archive already exists; use a fresh version rather than mutate a published one")
    profiles = json.loads(args.profiles.read_text()) if args.profiles else DEFAULT_PROFILES
    selected = [p for p in profiles if p["height"] <= video["height"]]
    if not selected:
        parser.error("Source smaller than every configured rendition")
    if any("audioKbps" in p for p in selected):
        parser.error("Audio must preserve the source AAC; audioKbps overrides are not supported")
    current_encoder = subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0]
    source_audio = audio_identity(src)
    reuse = None
    if bool(args.reuse_package) != bool(args.reuse_receipt):
        parser.error("Supply both reuse package and receipt")
    if args.reuse_package:
        reuse = json.loads(args.reuse_receipt.read_text())
        if reuse["sourceSHA256"] != sha(src) or reuse["recipe"]["segmentSeconds"] != args.segment_seconds:
            parser.error("Reuse source or segment duration differs")
        requested_recipe = {"preset": args.preset, "threads": args.threads, "gopFrames": gop}
        if reuse.get("encoder") != current_encoder or any(reuse["recipe"].get(k) != v for k, v in requested_recipe.items()):
            parser.error("Reuse encoder settings differ; omit reuse to re-encode")
        expected = {r["path"] for r in reuse["files"]}
        if expected != {str(p.relative_to(args.reuse_package)) for p in args.reuse_package.rglob("*") if p.is_file()}:
            parser.error("Reuse file set differs")
        for record in reuse["files"]:
            file = args.reuse_package / record["path"]
            if file.is_symlink() or not file.resolve().is_relative_to(args.reuse_package.resolve()) or file.stat().st_size != record["bytes"] or sha(file) != record["sha256"]:
                parser.error("Reuse package integrity mismatch")
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    folder.mkdir(parents=True)
    renditions = []
    for profile in selected:
        name = profile["name"]
        if not re.fullmatch(r"[a-zA-Z0-9-]+", name):
            raise ValueError("Unsafe profile name")
        height = profile["height"]
        width = round(video["width"] * height / video["height"] / 2) * 2
        dest = folder / name
        previous = next((r for r in reuse["renditions"] if r["name"] == name and r["profile"] == profile), None) if reuse else None
        if previous and audio_identity(args.reuse_package / name / "index.m3u8") == source_audio:
            shutil.copytree(args.reuse_package / name, dest)
            renditions.append(previous)
            print(f"Reused byte-identical {name}: verified source audio and package", flush=True)
            continue
        dest.mkdir()
        command = [
            "ffmpeg", "-hide_banner", "-nostdin", "-y", "-i", str(src),
            "-map", f"0:{video['index']}", "-map", f"0:{audio['index']}",
            "-map_metadata", "-1", "-c:v", "libx264", "-preset", args.preset,
            "-threads", str(args.threads), "-crf", str(profile["crf"]),
            "-maxrate", str(profile["maxVideoKbps"]) + "k",
            "-bufsize", str(profile["maxVideoKbps"] * 2) + "k",
            "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-g", str(gop), "-keyint_min", str(gop), "-sc_threshold", "0",
            "-x264-params", f"keyint={gop}:min-keyint={gop}:scenecut=0:open-gop=0:colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
            "-vf", f"scale={width}:{height}:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,setsar=1",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
        ]
        command += ["-c:a", "copy"]
        if "level" in profile:
            macroblocks = math.ceil(width / 16) * math.ceil(height / 16)
            preferred = round(float(profile["level"]) * 10)
            level = next((value for value,(rate,frame) in LEVEL_LIMITS.items() if value >= preferred and macroblocks <= frame and macroblocks * float(fps) <= rate), None)
            if level is None:
                raise ValueError("No supported H264 level for this resolution/frame rate")
            command += ["-level:v", str(level / 10), "-refs", str(profile.get("refs", 4))]
        command += [
            "-metadata:s:a:0", "language=" + {"en":"eng","ru":"rus","de":"deu","fr":"fra","es":"spa","it":"ita","tr":"tur","ar":"ara","zh":"zho","ja":"jpn","ko":"kor"}.get(args.language.split("-")[0], "und"),
            "-f", "hls", "-hls_segment_type", "fmp4", "-hls_time", str(args.segment_seconds),
            "-hls_playlist_type", "vod", "-hls_flags", "independent_segments",
            "-hls_fmp4_init_filename", "init.mp4", "-hls_segment_filename", str(dest / "segment-%05d.m4s"),
            str(dest / "index.m3u8"),
        ]
        print(f"Encoding {name}: {width}x{height}, source{fps}fps, GOP{gop}", flush=True)
        with (dest / "encode.log").open("w") as log:
            subprocess.run(command, stdout=log, stderr=log, check=True)
        segments = media_segments(dest / "index.m3u8")
        target = int(re.search(r"#EXT-X-TARGETDURATION:(\d+)", (dest / "index.m3u8").read_text()).group(1))
        peak, average = bandwidth(segments, target)
        renditions.append(dict(name=name, width=width, height=height, fps=float(fps), codecs=codec_string(dest / "init.mp4"),
                               bandwidth=peak, averageBandwidth=average, segments=len(segments), duration=sum(x[1] for x in segments),
                               profile=profile))
        # Logs remain next to the separate receipt, never inside the public package.
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(dest / "encode.log", args.receipt.parent / f"{args.id}-{args.language}-{args.version}-{name}.log")
    # Conservative visual startup variant first; emergency is available but not the default.
    startup = min(renditions, key=lambda r: abs(r["height"] - 360))
    ordered = [startup] + [r for r in renditions if r is not startup]
    master = ["#EXTM3U", "#EXT-X-VERSION:7", "#EXT-X-INDEPENDENT-SEGMENTS"]
    for r in ordered:
        master += [f'#EXT-X-STREAM-INF:BANDWIDTH={r["bandwidth"]},AVERAGE-BANDWIDTH={r["averageBandwidth"]},CODECS="{r["codecs"]}",RESOLUTION={r["width"]}x{r["height"]},FRAME-RATE={r["fps"]:.3f}', f'{r["name"]}/index.m3u8']
    (folder / "master.m3u8").write_text("\n".join(master) + "\n")
    fallback = min(renditions, key=lambda r: abs(r["height"] - 720))
    subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(folder / fallback["name"] / "index.m3u8"),
                    "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", "-movflags", "+faststart", str(folder / "fallback.mp4")], check=True)
    files = [{"path": str(p.relative_to(folder)), "bytes": p.stat().st_size, "sha256": sha(p)} for p in sorted(folder.rglob("*")) if p.is_file()]
    args.archive.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(args.archive, "w") as archive:
        for record in files:
            info = archive.gettarinfo(str(folder / record["path"]), arcname=record["path"])
            info.uid = info.gid = info.mtime = 0
            info.uname = info.gname = ""
            with (folder / record["path"]).open("rb") as stream:
                archive.addfile(info, stream)
    keep = {"index", "codec_name", "codec_type", "profile", "level", "width", "height", "pix_fmt", "color_range", "color_space", "color_transfer", "color_primaries", "r_frame_rate", "avg_frame_rate", "duration", "sample_aspect_ratio", "sample_rate", "channels"}
    sanitized_source = {"streams": [{k:v for k,v in stream.items() if k in keep} for stream in source["streams"]], "duration": source["format"]["duration"]}
    receipt = {"schema": 1, "id": args.id, "audioLocale": args.language, "version": args.version,
               "sourceSHA256": sha(src), "source": sanitized_source, "encoder": current_encoder,
               "audioPolicy": "source-copy", "sourceAudio": source_audio,
               "reuseReceiptSHA256": sha(args.reuse_receipt) if args.reuse_receipt else None,
               "recipe": {"segmentSeconds": args.segment_seconds, "gopFrames": gop, "preset": args.preset, "threads": args.threads},
               "width": video["width"], "height": video["height"], "duration": float(video["duration"]), "renditions": renditions,
               "files": files, "archive": {"bytes": args.archive.stat().st_size, "sha256": sha(args.archive)},
               "qualityApproval": "PENDING decoded-frame comparison/quality metrics/browser tests"}
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"folder": str(folder), "archiveBytes": receipt["archive"]["bytes"], "renditions": renditions}, indent=2))


if __name__ == "__main__":
    main()
