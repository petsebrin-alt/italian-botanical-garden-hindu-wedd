"""Builds the photographed landscape bands from assets-src/botanical/ref-welcome.webp:

    python3 tools/build_fields.py

  fields-hills    S03 Couple: rolling vineyard hills, distant mountains and the lawn, under the
                  two portraits (replaces the drawn ridges)
  fields-meadow   S05 Save the Date: the open valley and a wide sunlit lawn under the sky
                  (no cypresses)

The sky is keyed out so each band's own skyline sits on the section's sky or paper. The photo's
landscape is only ~600 px wide, so each band is continued sideways with sharp mirrored copies of
itself: never stretched or blurred.
"""
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-welcome.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")


def sky_alpha(img):
    """0 for the bright blue-white sky connected to the top edge, 1 for the land."""
    r, g, b = [img[..., i].astype(int) for i in range(3)]
    v = img.max(-1).astype(int)
    sky = ((v > 222) & (b >= r + 4)) | ((v > 236) & (b >= r - 2))
    sky = cv2.morphologyEx(sky.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab = cv2.connectedComponents(sky)
    top = np.unique(lab[0][lab[0] > 0])
    sky = np.isin(lab, top)
    land = (~sky).astype(np.float32)
    # a one-pixel feather keeps the skyline crisp without stair-steps
    return cv2.GaussianBlur(land, (3, 3), 0.6)


def mirrored(img, alpha, copies=3):
    """[mirror | original | mirror ...]: the band continues sideways with no visible seam."""
    tiles, atiles = [], []
    for k in range(copies):
        flip = (k - copies // 2) % 2 != 0
        tiles.append(img[:, ::-1] if flip else img)
        atiles.append(alpha[:, ::-1] if flip else alpha)
    return np.concatenate(tiles, 1), np.concatenate(atiles, 1)


def save(name, rgb, alpha, quality=86):
    im = Image.fromarray(rgb)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    im.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    base = os.path.join(OUT, name)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=max(quality - 30, 40))
    sizes = [os.path.getsize(base + e) // 1024 for e in (".webp", ".avif")]
    print(f"{name}: {im.width}x{im.height}  webp {sizes[0]} KB, avif {sizes[1]} KB")
    # AVIF is only worth shipping when it is the smaller file
    if sizes[1] >= sizes[0]:
        os.remove(base + ".avif")
        print(f"  (dropped {name}.avif: larger than the WebP)")


def clear_corner(img):
    """The Welcome photo's foreground hydrangea pokes into the lawn's left corner: the lawn and
    hedge beside it (same rows, 150 px to the right) take its place."""
    out = img.copy()
    m = np.zeros(img.shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array([(466, 686), (548, 686), (566, 738), (614, 778), (622, 872), (466, 872)], np.int32)], 1)
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 2.5)[..., None]
    shifted = np.roll(img, -150, axis=1)
    return (out * (1 - m) + shifted * m).astype(np.uint8)


def main():
    img = clear_corner(np.array(Image.open(SRC).convert("RGB")))
    a = sky_alpha(img)
    box = (slice(560, 812), slice(480, 1092))
    # the landscape between the cypresses (left) and the villa (right)
    save("fields-hills", *mirrored(img[box], a[box], 3))
    # Save the Date: the same valley seen the other way round, with the lawn's full depth
    box = (slice(560, 872), slice(480, 1092))
    save("fields-meadow", *mirrored(img[box][:, ::-1], a[box][:, ::-1], 3))


if __name__ == "__main__":
    main()
