#!/usr/bin/env python3
"""Produce original arena-style narration, crowd mix, and timed captions."""

from __future__ import annotations

import json
import math
import os
from pathlib import Path
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "deliverables"
OUT.mkdir(exist_ok=True)
FFMPEG = os.environ.get(
    "FFMPEG",
    "/private/tmp/ramsider-media/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1",
)
SR = 44100
DURATION = 89.5

# Start and end are tied to the Playwright action plan; short pauses remain deliberate.
CUES = [
    (0.0, 5.2, "Ladies and gentlemen! Allow me to introduce the new site for... RAM... SIDER UNO!"),
    (5.2, 10.0, "One story, many languages. Watch the message change, then return to English."),
    (10.0, 15.0, "Fire gives way to a new ritual. The journey begins."),
    (15.0, 18.0, "Shared moments. Precise feeling. Intentional control."),
    (18.0, 23.0, "The technology panel opens a connected system of features."),
    (23.0, 27.0, "Choice becomes part of the experience."),
    (27.0, 32.0, "Even the film controls show their current state. Beyond the device, the ritual expands."),
    (32.0, 40.0, "And now, the contenders! UNO PRO... and UNO GOLD! Compare these two expressions."),
    (40.0, 45.0, "The complete set shows how the pieces belong together."),
    (45.0, 50.0, "A made-to-order journey unfolds in three steps. The next action is clearly marked."),
    (50.0, 59.0, "Testing enters the story. Explore the document cards and open each detail view."),
    (59.0, 65.0, "For venues, MINI brings the vision into shared spaces."),
    (65.0, 73.0, "Six questions unfold before you. Tap to see what is available today."),
    (73.0, 84.0, "Personal and business paths lead into RAMS-GROUP, with four related projects."),
    (84.0, 88.0, "The story closes with one invitation: create your UNO."),
    (88.0, 89.5, "RAM... SIDER!"),
]


def synthesize(text: str, number: int) -> Path:
    target = OUT / f"voice-{number:02d}.aiff"
    if target.exists() and target.stat().st_size >= 10000:
        return target
    speed = "210" if number == 0 else "185"
    subprocess.run(
        ["say", "-v", "Reed (English (US))", "-r", speed, "-o", str(target), text],
        check=True,
    )
    if target.stat().st_size < 10000:
        raise RuntimeError(f"Speech synthesis produced an empty clip: {target}")
    return target


def decode_voice(source: Path, pitch: float, tempo: float) -> np.ndarray:
    # Lower the timbre while keeping the measured cue within its slot.
    filter_ = f"asetrate={int(22050 * pitch)},aresample={SR},atempo={tempo / pitch:.4f}"
    result = subprocess.run(
        [
            FFMPEG, "-v", "error", "-i", str(source), "-af", filter_,
            "-f", "f32le", "-ar", str(SR), "-ac", "1", "pipe:1",
        ],
        check=True,
        capture_output=True,
    )
    return np.frombuffer(result.stdout, dtype="<f4").copy()


def timestamp(value: float) -> str:
    total_ms = round(value * 1000)
    hours, remaining = divmod(total_ms, 3600000)
    minutes, remaining = divmod(remaining, 60000)
    seconds, millis = divmod(remaining, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"


length = round(DURATION * SR)
voice = np.zeros(length, np.float32)
cue_report = []
subtitles = []
for index, (start, end, text) in enumerate(CUES):
    source = synthesize(text, index)
    pitch = 0.83 if index in (0, 15) else 0.91
    raw = decode_voice(source, pitch, 1.0)
    allowance = end - start - 0.12
    tempo = max(1.0, len(raw) / SR / allowance)
    if tempo > 1.0:
        raw = decode_voice(source, pitch, tempo)
    peak = float(np.max(np.abs(raw))) or 1.0
    rms = float(np.sqrt(np.mean(raw * raw))) or 1.0
    raw = np.tanh(raw * min(0.28 / rms, 3.4)) * 0.76
    raw = raw[: round(allowance * SR)]
    offset = round(start * SR)
    voice[offset:offset + len(raw)] += raw
    cue_report.append({
        "start": start, "end": end, "spokenSeconds": round(len(raw) / SR, 2),
        "tempo": round(tempo, 3), "sourcePeak": round(peak, 3), "text": text,
    })
    subtitles.append(f"{index + 1}\n{timestamp(start)} --> {timestamp(end)}\n{text}\n")

rng = np.random.default_rng(3921)
times = np.arange(length, dtype=np.float32) / SR

# Diffuse audience bed: diffuse rumble, airy crowd hiss, and three ovation waves.
coarse_x = np.arange(0, length + 256, 256)
coarse = rng.normal(0, 1, len(coarse_x)).astype(np.float32)
rumble = np.interp(np.arange(length), coarse_x, coarse).astype(np.float32)
air = rng.normal(0, 1, length).astype(np.float32)
waves = (
    0.3
    + 0.9 * np.exp(-((times - 3.0) / 4.0) ** 2)
    + 0.65 * np.exp(-((times - 36.0) / 8.0) ** 2)
    + 1.0 * np.exp(-((times - 87.0) / 4.5) ** 2)
)
crowd_l = (rumble * 0.016 + air * 0.012) * waves
crowd_r = (np.roll(rumble, 1093) * 0.016 + np.roll(air, 371) * 0.012) * waves

# Nonverbal handclaps follow the same waves. Stereo variations keep it spacious.
for moment in rng.uniform(0.2, DURATION - 0.2, 420):
    active = max(math.exp(-((moment - center) / width) ** 2) for center, width in ((3, 5), (36, 8), (87, 5)))
    if rng.random() > (0.23 + 0.65 * active):
        continue
    span = min(round(SR * rng.uniform(0.045, 0.105)), length - round(moment * SR))
    x = np.arange(span, dtype=np.float32) / SR
    burst = rng.normal(0, 1, span).astype(np.float32) * np.exp(-x * rng.uniform(27, 55))
    burst *= 0.045 + 0.045 * active
    at = round(moment * SR)
    pan = rng.uniform(0.2, 0.8)
    crowd_l[at:at + span] += burst * pan
    crowd_r[at:at + span] += burst * (1 - pan)

# Arena whistles / high crowd whoops. These are original synthesised effects.
for moment in (2.4, 4.1, 33.5, 39.2, 85.7, 88.3):
    span = round(SR * 0.36)
    x = np.arange(span, dtype=np.float32) / SR
    chirp = np.sin(2 * np.pi * (1040 * x + 380 * x * x)) * np.sin(np.pi * x / x[-1]) ** 2 * 0.025
    at = round(moment * SR)
    crowd_l[at:at + span] += chirp * 0.7
    crowd_r[at:at + span] += chirp

# Short original audience whoops in a female voice: a cheering arena texture,
# never a copied fight broadcast or recognisable announcer recording.
cheer_file = OUT / "audience-whoop.aiff"
if not cheer_file.exists() or cheer_file.stat().st_size < 10000:
    subprocess.run(
        ["say", "-v", "Samantha", "-r", "245", "-o", str(cheer_file), "Woo! Yeah!"],
        check=True,
    )
cheer = decode_voice(cheer_file, 1.12, 1.0)
cheer = np.tanh(cheer * 1.6) * 0.065
for index, moment in enumerate((1.0, 3.2, 33.3, 36.8, 39.0, 85.0, 87.0)):
    at = round(moment * SR)
    span = min(len(cheer), length - at)
    if index % 2:
        crowd_l[at:at + span] += cheer[:span] * 0.6
        crowd_r[at:at + span] += cheer[:span]
    else:
        crowd_l[at:at + span] += cheer[:span]
        crowd_r[at:at + span] += cheer[:span] * 0.6

# Keep the crowd well below the spoken voice. Light room echo sits behind the voice.
echo = np.zeros_like(voice)
for seconds, gain in ((0.13, 0.14), (0.27, 0.09)):
    offset = round(seconds * SR)
    echo[offset:] += voice[:-offset] * gain
left = np.tanh(voice * 0.89 + echo * 0.55 + crowd_l)
right = np.tanh(voice * 0.89 + echo * 0.65 + crowd_r)
stereo = np.stack((left, right), axis=1)
peak = np.max(np.abs(stereo))
stereo = np.int16(np.clip(stereo / max(peak, 1.0) * 0.92, -1, 1) * 32767)
wave_path = OUT / "ramsider-demo-mix.wav"
with wave.open(str(wave_path), "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SR)
    output.writeframes(stereo.tobytes())

(OUT / "ramsider-demo-captions.srt").write_text("\n".join(subtitles), encoding="utf-8")
(OUT / "ramsider-demo-audio-report.json").write_text(
    json.dumps({"sampleRate": SR, "duration": DURATION, "peak": float(peak), "cues": cue_report}, indent=2),
    encoding="utf-8",
)
print(json.dumps({"duration": DURATION, "cues": cue_report, "mix": str(wave_path)}, indent=2))
