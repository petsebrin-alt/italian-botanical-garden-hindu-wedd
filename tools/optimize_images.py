"""Lighter versions of the heaviest pictures, at the size they are shown (most of the page's
weight). Each original is kept once in assets-src/optimized-orig/ and every run encodes from it,
so running this again never loses quality.

    python3 tools/optimize_images.py
"""
import os
import shutil

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, "assets-src", "optimized-orig")

# (file under public/, the widest it needs to be, WebP quality)
JOBS = [
    ("assets/gate/frame.webp", None, 80),          # the gate: the very first picture
    ("assets/img/monogram-wreath.webp", 520, 82),  # shown at up to 200px wide (2x for sharp screens)
    ("assets/window/garden-ground.webp", None, 74),
    ("assets/window/vine-real.webp", None, 78),
    ("assets/window/vine-real-arch.webp", None, 78),
    ("assets/img/creeper-stem.webp", None, 74),
    ("assets/img/ceremony-couple.webp", None, 80),
    ("assets/img/thank-you-hands.webp", None, 80),
]


def main():
    total_before = total_after = 0
    for rel, max_w, q in JOBS:
        dst = os.path.join(ROOT, "public", rel)
        src = os.path.join(ORIG, rel)
        if not os.path.exists(src):
            os.makedirs(os.path.dirname(src), exist_ok=True)
            shutil.copy2(dst, src)
        before = os.path.getsize(src)
        im = Image.open(src)
        im.load()
        if max_w and im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=q, method=6, alpha_quality=90)
        after = os.path.getsize(dst)
        total_before += before
        total_after += after
        print(f"{rel:44} {before // 1024:5d}KB -> {after // 1024:5d}KB  {im.size}")
    print(f"{'total':44} {total_before // 1024:5d}KB -> {total_after // 1024:5d}KB")


if __name__ == "__main__":
    main()
