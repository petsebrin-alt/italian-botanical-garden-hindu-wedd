"""Drops finished photographs into the site.

Name each file after its target in docs/PHOTO-PROMPTS.md (e.g. portrait-bride.jpg,
gallery-03.png), put them in one folder, then run:

    python3 tools/import_photos.py ~/Downloads/final-photos

Each photo is resized to its target's long edge (never upscaled), stripped of
metadata (including GPS), and written to public/assets/img as WebP + AVIF,
replacing the placeholder of the same name. Unknown names are skipped.
"""
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets", "img")

# target -> (long edge in px, expected width / height)
TARGETS = {
    "villa-terrace": (2000, 3 / 4),
    "portrait-bride": (2000, 3 / 4),
    "portrait-groom": (2000, 3 / 4),
    **{f"story-{i}": (1875, 4 / 5) for i in range(1, 6)},
    "cypress-avenue": (3840, 3 / 2),
    "ceremony-arch": (2100, 2 / 3),
    **{f"fabric-{e}": (1200, 3 / 4) for e in ("mehendi", "haldi", "sangeet", "wedding", "reception")},
    "venue-villa": (1875, 4 / 5),
    "tuscan-hills-strip": (3840, 4 / 1),
    **{f"gallery-{i:02d}": (2400, None) for i in range(1, 15)},
}
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff")


def main(folder: str) -> None:
    done = 0
    for entry in sorted(os.listdir(folder)):
        name, ext = os.path.splitext(entry)
        if ext.lower() not in EXTS:
            continue
        if name not in TARGETS:
            print(f"  skip  {entry}: not a target name (see docs/PHOTO-PROMPTS.md)")
            continue
        edge, ratio = TARGETS[name]
        im = ImageOps.exif_transpose(Image.open(os.path.join(folder, entry))).convert("RGB")
        if ratio and abs(im.width / im.height - ratio) / ratio > 0.08:
            print(f"  note  {entry}: {im.width}x{im.height} differs from the expected aspect; the site will crop it")
        scale = min(1.0, edge / max(im.size))
        if scale < 1:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        if max(im.size) < edge * 0.6:
            print(f"  warn  {entry}: only {im.width}x{im.height}; aim for a {edge}px long edge")
        base = os.path.join(OUT, name)
        im.save(base + ".webp", quality=82, method=6)
        im.save(base + ".avif", quality=55)
        print(f"  ok    {name}: {im.width}x{im.height}  webp {os.path.getsize(base + '.webp') // 1024} KB")
        done += 1
    print(f"{done} photo(s) imported into public/assets/img")


if __name__ == "__main__":
    if len(sys.argv) != 2 or not os.path.isdir(sys.argv[1]):
        sys.exit(__doc__)
    main(sys.argv[1])
