"""Flood-fill black background to alpha and regenerate favicon assets."""
from __future__ import annotations

from collections import deque
from pathlib import Path
import struct

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SRC = PUBLIC / "logo-transparent-source.png"


def is_bg(r: int, g: int, b: int) -> bool:
    # JPEG noise on the solid black field reaches ~47; gold rim starts brighter.
    return max(r, g, b) <= 50


def flood_clear(src: Image.Image) -> int:
    w, h = src.size
    px = src.load()
    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        i = y * w + x
        if visited[i]:
            return
        visited[i] = 1
        q.append((x, y))

    starts = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (0, h // 2),
        (w - 1, h // 2),
        (w // 2, h - 1),
    ]
    for x, y in starts:
        r, g, b, _ = px[x, y]
        if is_bg(r, g, b):
            push(x, y)

    cleared = 0
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        cleared += 1
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
                r, g, b, _ = px[nx, ny]
                if is_bg(r, g, b):
                    push(nx, ny)
    return cleared


def make_size(src: Image.Image, size: int, pad_ratio: float = 0.02) -> Image.Image:
    pad = max(0, round(size * pad_ratio))
    inner = size - pad * 2
    resized = src.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, (pad, pad), resized)
    return canvas


def ico_from_pngs(pairs: list[tuple[int, bytes]], out_path: Path) -> None:
    count = len(pairs)
    offset = 6 + count * 16
    entries: list[bytes] = []
    bodies: list[bytes] = []
    for size, data in pairs:
        w = 0 if size >= 256 else size
        entry = struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(data), offset)
        entries.append(entry)
        bodies.append(data)
        offset += len(data)
    header = struct.pack("<HHH", 0, 1, count)
    out_path.write_bytes(header + b"".join(entries) + b"".join(bodies))


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    cleared = flood_clear(src)
    print(f"cleared {cleared} bg pixels of {src.width * src.height}")

    src.save(PUBLIC / "logo-mark.png", "PNG")
    print("logo-mark.png", (PUBLIC / "logo-mark.png").stat().st_size)

    outputs = {
        16: ("favicon-16.png", 0.0),
        32: ("favicon-32.png", 0.0),
        48: ("favicon-48.png", 0.0),
        180: ("apple-touch-icon.png", 0.02),
        192: ("icon-192.png", 0.02),
        512: ("logo-512.png", 0.02),
    }
    for size, (name, pad) in outputs.items():
        make_size(src, size, pad).save(PUBLIC / name, "PNG")
        print(name, (PUBLIC / name).stat().st_size)

    make_size(src, 48, 0.0).save(PUBLIC / "favicon.png", "PNG")

    pairs = []
    for size in (16, 32, 48):
        pairs.append((size, (PUBLIC / f"favicon-{size}.png").read_bytes()))
    ico_from_pngs(pairs, PUBLIC / "favicon.ico")
    print("favicon.ico", (PUBLIC / "favicon.ico").stat().st_size)

    corner = Image.open(PUBLIC / "favicon-32.png").getpixel((0, 0))
    mark = Image.open(PUBLIC / "logo-mark.png")
    print("favicon-32 corner", corner)
    print("logo-mark corner", mark.getpixel((0, 0)))
    print("logo-mark center", mark.getpixel((512, 512)))


if __name__ == "__main__":
    main()
