"""Cut the photo opening and replace the source's five fixed dots with live controls."""

from pathlib import Path
from PIL import Image, ImageDraw


SOURCE = Path("design/references/technology_frame.PNG")
OUTPUT = Path("public/art/technology/frame-template.png")
SIZE = (954, 1649)
OPENING = (83, 186, 870, 1465)  # PIL inclusive rectangle; CSS x83:871, y186:1466.
DOT_BAND = (382, 110, 572, 140)
DOT_SPRITES = {
    "dot-active.png": (383, 111, 412, 140),
    "dot-inactive.png": (423, 111, 452, 140),
}


def main() -> None:
    source = Image.open(SOURCE)
    if source.size != SIZE or source.mode != "RGB":
        raise ValueError(f"Unexpected frame source: {source.size} {source.mode}")
    frame = source.convert("RGBA")
    ImageDraw.Draw(frame).rectangle(OPENING, fill=(0, 0, 0, 0))
    ImageDraw.Draw(frame).rectangle(DOT_BAND, fill=(0, 0, 0, 255))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame.save(OUTPUT, optimize=True)
    for filename, box in DOT_SPRITES.items():
        source.crop(box).save(OUTPUT.parent / filename, optimize=True)

    decoded = Image.open(OUTPUT).convert("RGBA")
    source_rgb = source.tobytes()
    output_rgb = decoded.convert("RGB").tobytes()
    alpha = decoded.getchannel("A")
    for y in range(SIZE[1]):
        for x in range(SIZE[0]):
            inside = 83 <= x <= 870 and 186 <= y <= 1465
            dots = 382 <= x <= 572 and 110 <= y <= 140
            if alpha.getpixel((x, y)) != (0 if inside else 255):
                raise AssertionError(f"Alpha mismatch at {(x, y)}")
            if not inside and not dots:
                offset = (y * SIZE[0] + x) * 3
                if output_rgb[offset : offset + 3] != source_rgb[offset : offset + 3]:
                    raise AssertionError(f"RGB mismatch at {(x, y)}")
    for filename, box in DOT_SPRITES.items():
        sprite = Image.open(OUTPUT.parent / filename)
        if sprite.tobytes() != source.crop(box).tobytes():
            raise AssertionError(f"Source-dot mismatch: {filename}")
    print(f"Exact frame outside opening and dot band: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
