"""Cuts the crystal curtain's pieces from assets-src/botanical/ref-crystal-curtain.webp:

    python3 tools/build_crystals.py      # writes public/assets/img/crystal-atlas.webp + .json

The curtain itself is drawn by the page (src/sections/crystal-curtain.ts): every strand is built
from these real crystals, each at (or under) its own photographed size, so they stay sharp at any
screen size and the curtain can reach the foot of the section. Gold wire, spacers, the rod and the
sparkle of light are drawn live.

  clear-*, pink-*, small     round faceted beads
  diamond                    a long faceted drop, one or two per strand
  teardrop                   the pendant at the foot of each strand
  butterfly                  the iridescent butterfly resting on a strand
  finial                     the rose-gold end of the rod
  rod                        one column of the rod (stretched along it)

Each piece is lifted 2x with Lanczos on premultiplied colour (no dark fringes), sharpened, and
given a faint shadow so it stands off the sky behind it.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-crystal-curtain.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")
DEBUG = os.environ.get("CRYSTAL_DEBUG")
UP = 2

# (strand x, top row, bottom row) of a clean example of each bead, found along the strands
BEADS = {
    "clear-a": (503, 60, 85),
    "clear-b": (503, 162, 185),
    "clear-c": (227, 60, 85),
    "small": (503, 562, 575),
    "pink-a": (503, 116, 144),
    "pink-b": (227, 142, 163),
    "pink-c": (503, 475, 499),
    "diamond": (780, 200, 249),
    "teardrop": (503, 644, 708),
}
# the butterfly resting on the strand at x = 390, traced round its wings (photo px)
BUTTERFLY = [
    (387, 177), (382, 163), (367, 153), (350, 148), (339, 149), (341, 160), (350, 173), (361, 185),
    (357, 192), (355, 202), (359, 213), (370, 220), (382, 220), (389, 210), (392, 200), (395, 209),
    (400, 218), (412, 221), (422, 215), (426, 205), (424, 193), (415, 186), (428, 180), (438, 167),
    (443, 153), (438, 149), (427, 151), (410, 156), (398, 167), (394, 177),
]
BUTTERFLY_BODY = (390.5, 188)
FINIAL = (2, 6, 48, 46)            # the left end of the rod
ROD = (300, 9, 301, 43)           # one column of the rod


def premul_resize(rgba, scale):
    a = rgba[..., 3:4].astype(np.float32) / 255
    pm = np.concatenate([rgba[..., :3].astype(np.float32) * a, a * 255], axis=2)
    h, w = rgba.shape[:2]
    big = np.stack([np.array(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((w * scale, h * scale), Image.LANCZOS)).astype(np.float32) for c in range(4)], axis=2)
    al = big[..., 3:4] / 255
    rgb = np.where(al > 1e-3, big[..., :3] / np.maximum(al, 1e-3), 0)
    # a gentle unsharp mask on colour only
    blur = cv2.GaussianBlur(rgb, (0, 0), 1.1)
    rgb = np.clip(rgb + 0.55 * (rgb - blur), 0, 255)
    return np.concatenate([rgb, big[..., 3:4]], axis=2)


def with_shadow(rgba, dx=1.5, dy=2.5, blur=2.2, strength=0.22, pad=6):
    h, w = rgba.shape[:2]
    out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.float32)
    sh = np.zeros((h + 2 * pad, w + 2 * pad), np.float32)
    sh[pad:pad + h, pad:pad + w] = rgba[..., 3] / 255
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    sh = cv2.warpAffine(sh, M, (w + 2 * pad, h + 2 * pad))
    sh = cv2.GaussianBlur(sh, (0, 0), blur) * strength
    a = np.zeros_like(sh)
    a[pad:pad + h, pad:pad + w] = rgba[..., 3] / 255
    rgb = np.zeros((h + 2 * pad, w + 2 * pad, 3), np.float32)
    rgb[pad:pad + h, pad:pad + w] = rgba[..., :3]
    shadow_rgb = np.array([60, 52, 40], np.float32)
    out_a = a + sh * (1 - a)
    out_rgb = (rgb * a[..., None] + shadow_rgb * (sh * (1 - a))[..., None]) / np.maximum(out_a[..., None], 1e-4)
    out[..., :3] = out_rgb
    out[..., 3] = out_a * 255
    return out, pad


def bead(img, sx, y0, y1):
    """One bead: the band round its strand, trimmed to the bead's own rows and outline."""
    band = img[y0 - 1:y1 + 1, sx - 24:sx + 25].copy()
    al = band[..., 3]
    m = (al > 40).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        band[~keep, 3] = 0
    ys, xs = np.where(band[..., 3] > 8)
    x0, x1 = xs.min(), xs.max() + 1
    cut = band[ys.min():ys.max() + 1, x0:x1]
    # the strand runs down column 24 of the band
    return cut, float(24 - x0)


def main():
    img = np.array(Image.open(SRC).convert("RGBA"))
    pieces = {}
    for name, (sx, y0, y1) in BEADS.items():
        cut, cx = bead(img, sx, y0, y1)
        pieces[name] = (cut, cx, 0.0)

    # the butterfly: inside its traced outline only
    m = np.zeros(img.shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(BUTTERFLY, np.int32)], 1)
    # the tracing runs just inside the wings' glowing rims: take them in too
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.9)
    bf = img.copy().astype(np.float32)
    bf[..., 3] *= m
    xs = [p[0] for p in BUTTERFLY]; ys = [p[1] for p in BUTTERFLY]
    bx0, bx1, by0, by1 = min(xs) - 6, max(xs) + 7, min(ys) - 6, max(ys) + 7
    pieces["butterfly"] = (bf[by0:by1, bx0:bx1].astype(np.uint8), BUTTERFLY_BODY[0] - bx0, BUTTERFLY_BODY[1] - by0)

    x0, y0, x1, y1 = FINIAL
    pieces["finial"] = (img[y0:y1, x0:x1], 0.0, (y1 - y0) / 2)
    x0, y0, x1, y1 = ROD
    pieces["rod"] = (np.repeat(img[y0:y1, x0:x1], 4, axis=1), 0.0, (y1 - y0) / 2)

    # lift, shadow and pack
    packed = {}
    for name, (cut, ax, ay) in pieces.items():
        big = premul_resize(cut.astype(np.uint8), UP)
        pad = 0
        if name not in ("rod",):
            big, pad = with_shadow(big, pad=6)
        packed[name] = (big, ax * UP + pad, ay * UP + pad, pad)
    W = sum(p[0].shape[1] + 4 for p in packed.values())
    H = max(p[0].shape[0] for p in packed.values())
    atlas = np.zeros((H, W, 4), np.float32)
    meta, x = {"scale": UP, "sprites": {}}, 0
    for name, (big, ax, ay, pad) in packed.items():
        h, w = big.shape[:2]
        atlas[:h, x:x + w] = big
        # (x, y, w, h) in the atlas; (ax, ay) the strand's line through it; pad of shadow margin
        meta["sprites"][name] = {"x": x, "y": 0, "w": w, "h": h, "ax": round(ax, 1), "ay": round(ay, 1), "pad": pad}
        x += w + 4
    Image.fromarray(np.clip(atlas, 0, 255).astype(np.uint8)).save(os.path.join(OUT, "crystal-atlas.webp"), lossless=False, quality=94, method=6)
    with open(os.path.join(OUT, "crystal-atlas.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    print(f"crystal-atlas.webp: {W}x{H}  {os.path.getsize(os.path.join(OUT, 'crystal-atlas.webp')) // 1024} KB")
    if DEBUG:
        bg = np.zeros((H, W, 3), np.float32) + np.array([120, 165, 215], np.float32)
        a = atlas[..., 3:4] / 255
        Image.fromarray(np.clip(bg * (1 - a) + atlas[..., :3] * a, 0, 255).astype(np.uint8)).save(os.path.join(DEBUG, "atlas.png"))


if __name__ == "__main__":
    main()
