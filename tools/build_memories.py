"""Cuts the seven "sweet memories" photographs from assets-src/botanical/ref-memories.webp
(a collage: three across the top, four across the bottom) for S04 · Sweet Memories:

    python3 tools/build_memories.py    # writes public/assets/img/memory-1..7.webp/.avif

Each is framed to the same 4:5 portrait (centred on the couple) and sharpened lightly.
"""
import os

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-memories.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")

# each tile (between the white gutters), and where the couple sits in it (0..1 across)
TILES = [
    ((0, 0, 501, 516), 0.5),
    ((508, 0, 1028, 516), 0.5),
    ((1036, 0, 1536, 516), 0.56),
    ((0, 524, 388, 1024), 0.5),
    ((396, 524, 764, 1024), 0.5),
    ((771, 524, 1152, 1024), 0.5),
    ((1159, 524, 1536, 1024), 0.5),
]
W, H = 640, 800


def main():
    im = Image.open(SRC).convert("RGB")
    for n, ((x0, y0, x1, y1), cx) in enumerate(TILES, 1):
        tw, th = x1 - x0, y1 - y0
        # the largest 4:5 window in the tile, centred on the couple
        h = min(th, tw * 5 / 4)
        w = h * 4 / 5
        left = min(max(x0 + cx * tw - w / 2, x0), x1 - w)
        top = y0 + (th - h) / 2
        c = im.crop((round(left), round(top), round(left + w), round(top + h))).resize((W, H), Image.LANCZOS)
        c = c.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
        base = os.path.join(OUT, f"memory-{n}")
        c.save(base + ".webp", quality=86, method=6)
        c.save(base + ".avif", quality=60)
        print(f"memory-{n}: {os.path.getsize(base + '.webp') // 1024} KB")


if __name__ == "__main__":
    main()
