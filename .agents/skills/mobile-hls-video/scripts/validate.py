#!/usr/bin/env python3
"""Validate source-bound HLS VOD files, packet timing and archive integrity."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile
import math
from fractions import Fraction

LEVEL_LIMITS = {12:(6000,396),13:(11880,396),20:(11880,396),21:(19800,792),22:(20250,1620),30:(40500,1620),31:(108000,3600),32:(216000,5120),40:(245760,8192),41:(245760,8192),42:(522240,8704),50:(589824,22080),51:(983040,36864),52:(2073600,36864)}


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def packet_bounds(packets):
    times = sorted((float(p["pts_time"]), float(p["duration_time"])) for p in packets)
    assert times and all(duration > 0 for _, duration in times), "Missing packet timing"
    assert all(b[0] - (a[0] + a[1]) < .12 for a, b in zip(times, times[1:])), "Audio/video packet gap"
    return times[0][0], max(start + duration for start, duration in times)


def aligned_audio(path, video_bounds):
    audio = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "a:0", "-show_packets", "-show_streams",
        "-show_entries", "packet=pts_time,duration_time:stream=codec_name,profile,channels", "-of", "json", str(path)]))
    assert audio["streams"][0]["codec_name"] == "aac" and audio["streams"][0]["profile"] == "LC"
    bounds = packet_bounds(audio["packets"])
    assert all(abs(a-b) < .12 for a, b in zip(bounds, video_bounds)), "Audio packet timeline differs from video"
    return bounds


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.receipt.read_text())
    root = args.package.resolve(strict=True)
    expected = {record["path"] for record in data["files"]}
    actual = {str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()}
    assert actual == expected, "Unexpected or missing package files"
    for record in data["files"]:
        p = root / record["path"]
        assert p.resolve().is_relative_to(root) and not p.is_symlink(), "Unsafe package path"
        assert p.stat().st_size == record["bytes"] and sha(p) == record["sha256"], record["path"]
    if args.archive:
        assert args.archive.stat().st_size == data["archive"]["bytes"] and sha(args.archive) == data["archive"]["sha256"]
        with tarfile.open(args.archive) as archive:
            entries = archive.getmembers()
            assert len(entries) == len(expected) and {x.name for x in entries} == expected
            assert all(x.isfile() and not x.issym() and not x.islnk() for x in entries)
            by_path = {record["path"]: record for record in data["files"]}
            for member in entries:
                record = by_path[member.name]
                assert member.size == record["bytes"], "Archive member size mismatch"
                with archive.extractfile(member) as stream:
                    digest = hashlib.file_digest(stream, "sha256").hexdigest()
                assert digest == record["sha256"], "Archive member content mismatch"
    master = (root / "master.m3u8").read_text()
    assert master.startswith("#EXTM3U\n"), "Master must begin with EXTM3U"
    assert "#EXT-X-INDEPENDENT-SEGMENTS" in master
    lines = master.splitlines()
    variants = {}
    referenced = {"master.m3u8", "fallback.mp4"}

    def reference(parent, uri):
        assert re.fullmatch(r"[a-zA-Z0-9_./-]+", uri), "Unexpected URI syntax"
        target = parent / uri
        assert not Path(uri).is_absolute() and ".." not in Path(uri).parts, "Unsafe manifest reference"
        assert target.resolve().is_relative_to(root) and target.is_file(), "Missing/outside-package reference"
        relative = str(target.relative_to(root))
        assert relative in expected, "Unregistered referenced object"
        referenced.add(relative)
        return target

    for i, line in enumerate(lines):
        if line.startswith("#EXT-X-STREAM-INF:"):
            attrs = dict((k, v.strip('"')) for k, v in re.findall(r'([A-Z-]+)=("[^"]*"|[^,]+)', line))
            assert i + 1 < len(lines) and not lines[i+1].startswith("#"), "Missing variant URI"
            uri = lines[i+1]
            assert uri not in variants, "Duplicate rendition"
            variants[uri] = attrs
            reference(root, uri)
    assert set(variants) == {r["name"] + "/index.m3u8" for r in data["renditions"]}, "Master rendition set mismatch"
    results = []
    boundaries = None
    for rendition in data["renditions"]:
        folder = root / rendition["name"]
        playlist = (folder / "index.m3u8").read_text()
        assert playlist.startswith("#EXTM3U\n"), "Media playlist must begin with EXTM3U"
        assert "#EXT-X-PLAYLIST-TYPE:VOD" in playlist and "#EXT-X-ENDLIST" in playlist
        init_uri = re.search(r'#EXT-X-MAP:URI="([^"]+)"', playlist)
        assert init_uri, "Missing initialization reference"
        init = reference(folder, init_uri.group(1))
        lengths = [float(x) for x in re.findall(r"#EXTINF:([0-9.]+)", playlist)]
        segment_names = [x for x in playlist.splitlines() if x and not x.startswith("#")]
        assert len(segment_names) == len(lengths), "Segment/EXTINF mismatch"
        for segment in segment_names:
            reference(folder, segment)
        target = float(re.search(r"#EXT-X-TARGETDURATION:(\d+)", playlist).group(1))
        rates = []
        for i in range(len(lengths)):
            elapsed = total = 0
            for j in range(i, len(lengths)):
                elapsed += lengths[j]
                total += (folder / segment_names[j]).stat().st_size
                if elapsed > 1.5 * target + .000001:
                    break
                if elapsed >= .5 * target:
                    rates.append(total * 8 / elapsed)
        if not rates:
            rates = [sum((folder / x).stat().st_size for x in segment_names) * 8 / sum(lengths)]
        assert abs(max(rates) - rendition["bandwidth"]) <= 1.01, "Peak BANDWIDTH mismatch"
        average = sum((folder / x).stat().st_size for x in segment_names) * 8 / sum(lengths)
        assert abs(average - rendition["averageBandwidth"]) <= .51, "Average BANDWIDTH mismatch"
        assert abs(sum(lengths) - data["duration"]) < .12
        if boundaries is None:
            boundaries = lengths
        else:
            assert len(lengths) == len(boundaries) and all(abs(a-b) < .00001 for a,b in zip(lengths,boundaries)), "Variant boundary mismatch"
        packet = json.loads(subprocess.check_output([
            "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_packets", "-show_streams",
            "-show_entries", "packet=pts_time,duration_time,flags:stream=width,height,r_frame_rate,color_range,color_space,color_transfer,color_primaries,codec_name,profile,level",
            "-of", "json", str(folder / "index.m3u8")]))
        stream = packet["streams"][0]
        assert stream["codec_name"] == "h264" and stream["profile"] == "High"
        assert abs(float(Fraction(stream["r_frame_rate"])) - rendition["fps"]) < .001
        assert stream["level"] in LEVEL_LIMITS, "Unsupported H264 level"
        rate_limit, frame_limit = LEVEL_LIMITS[stream["level"]]
        macroblocks = math.ceil(stream["width"] / 16) * math.ceil(stream["height"] / 16)
        assert macroblocks <= frame_limit and macroblocks * rendition["fps"] <= rate_limit, "Declared level cannot carry this resolution/frame rate"
        assert [stream["width"], stream["height"]] == [rendition["width"], rendition["height"]]
        assert all(stream.get(k) == "bt709" for k in ("color_space", "color_transfer", "color_primaries")) and stream["color_range"] == "tv"
        frames = packet["packets"]
        first = float(frames[0]["pts_time"])
        keyframes = [float(p["pts_time"]) - first for p in frames if "K" in p["flags"]]
        cursor = 0
        for length in lengths:
            assert any(abs(x - cursor) < .002 for x in keyframes), f"Missing IDR at{cursor}"
            cursor += length
        aligned_audio(folder / "index.m3u8", packet_bounds(frames))
        init_bytes = init.read_bytes()
        at = init_bytes.find(b"avcC")
        assert at >= 0
        codec = "avc1." + init_bytes[at+5:at+8].hex() + ",mp4a.40.2"
        attrs = variants[rendition["name"] + "/index.m3u8"]
        assert attrs["CODECS"] == codec == rendition["codecs"], "CODECS mismatch"
        assert attrs["RESOLUTION"] == f'{stream["width"]}x{stream["height"]}', "RESOLUTION mismatch"
        assert abs(float(attrs["FRAME-RATE"]) - rendition["fps"]) < .001, "FRAME-RATE mismatch"
        assert int(attrs["BANDWIDTH"]) == rendition["bandwidth"] and int(attrs["AVERAGE-BANDWIDTH"]) == rendition["averageBandwidth"]
        # A packet K flag need not be an IDR. Inspect the first actual AVC VCL NAL
        # of every segment, with its initialization, without decoding/copying the film.
        with tempfile.TemporaryDirectory(prefix="hls-idr-") as temp:
            path = Path(temp) / "segment.mp4"
            for segment in segment_names:
                path.write_bytes(init_bytes + (folder / segment).read_bytes())
                annexb = subprocess.check_output(["ffmpeg", "-v", "error", "-nostdin", "-i", str(path), "-map", "0:v:0", "-frames:v", "1", "-c", "copy", "-bsf:v", "h264_mp4toannexb", "-f", "h264", "-"], stderr=subprocess.DEVNULL)
                units = re.split(b"\x00\x00\x00?\x01", annexb)
                vcl = [unit[0] & 31 for unit in units if unit and 1 <= (unit[0] & 31) <= 5]
                assert vcl and vcl[0] == 5, f"Segment does not start with IDR:{segment}"
        # Decode the stream completely: readable headers alone do not prove decodability.
        subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-nostdin", "-i", str(folder / "index.m3u8"), "-f", "null", "-"], check=True, stdout=subprocess.DEVNULL)
        assert f'BANDWIDTH={rendition["bandwidth"]},' in master
        results.append({"name": rendition["name"], "segments": len(lengths), "duration": sum(lengths), "keyframes": len(keyframes), "decode": "PASS", "level": stream.get("level")})
    fallback = root / "fallback.mp4"
    assert referenced == expected, "Orphan/unreachable package files"
    b = fallback.read_bytes()
    assert 0 <= b.find(b"moov") < b.find(b"mdat"), "Fallback must be fast-start"
    fp = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(fallback)]))
    fv = next(x for x in fp["streams"] if x["codec_type"] == "video")
    fa = next(x for x in fp["streams"] if x["codec_type"] == "audio")
    assert fv["codec_name"] == "h264" and fa["codec_name"] == "aac" and fa["profile"] == "LC", "Invalid fallback codecs"
    assert fv["width"] <= 1280 and fv["height"] <= 720, "Fallback must remain a mobile-sized rendition"
    assert abs(float(fp["format"]["duration"]) - data["duration"]) < .15, "Fallback duration mismatch"
    fallback_video = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_packets", "-show_entries", "packet=pts_time,duration_time", "-of", "json", str(fallback)]))
    aligned_audio(fallback, packet_bounds(fallback_video["packets"]))
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-nostdin", "-i", str(fallback), "-f", "null", "-"], check=True, stdout=subprocess.DEVNULL)
    assert any(r["level"] <= 41 and r["name"] != "144p" for r in results), "Provide a useful lower-level compatible rendition"
    result = {"status": "PASS", "receiptSHA256": sha(args.receipt), "checks": ["complete file set", "all SHA/size", "archive regular-file set" if args.archive else "archive not supplied", "closed master/media/init/segment graph", "actual CODECS/RESOLUTION/FPS/peak/average", "VOD init/endlist", "variant boundaries", "all segment IDR NALs", "full decode", "AAC-LC/actual packet timeline", "BT709/range", "fast-start fallback"], "renditions": results,
              "limits": "Packaging/decoding only; not perceived-quality, browser, network or physical-phone approval"}
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
