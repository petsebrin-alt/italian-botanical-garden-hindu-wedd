"""Cuts the five celebration photographs from assets-src/botanical/ref-events.webp (a 3 x 2
collage, each with its own welcome sign) into 4:5 portraits for S04 · Celebrations:

    python3 tools/build_events.py      # writes public/assets/img/event-<id>.webp/.avif
"""
import os

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-events.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")

# 403 x 504 boxes (4:5) inside each tile, framed on the scene and its sign
BOXES = {
    "haldi": (100, 4, 503, 508),
    "mehendi": (596, 4, 999, 508),
    "sangeet": (1036, 4, 1439, 508),
    "ceremony": (2, 518, 405, 1022),
    "reception": (600, 518, 1003, 1022),
}


def main():
    im = Image.open(SRC).convert("RGB")
    for name, box in BOXES.items():
        c = im.crop(box).resize((560, 700), Image.LANCZOS)
        c = c.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
        base = os.path.join(OUT, f"event-{name}")
        c.save(base + ".webp", quality=86, method=6)
        c.save(base + ".avif", quality=60)
        print(f"event-{name}: {c.width}x{c.height}  webp {os.path.getsize(base + '.webp') // 1024} KB")


if __name__ == "__main__":
    main()
