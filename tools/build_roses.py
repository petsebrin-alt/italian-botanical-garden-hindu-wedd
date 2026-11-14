"""The roses that blossom in the closing scene (src/sections/ThankYou.tsx):

  assets-src/closing/ref-rose-bush.webp      a rose bush on white   -> a bush at the foot of each gateway
  assets-src/closing/ref-rose-garland.png    a low rose hedge (on a drawn checkerboard) -> the garland
                                             along the foot of the section, edge to edge

Each is keyed off its background (its bees and butterfly, which float free of it, are left out).
Then every rose head on it is found (by its pink) and lifted off as a sprite of its own, so it
can open from a bud; under them, the plant is kept whole as a base, its roses turned to the deep
green of closed buds. The sprites of each plant are packed into one
atlas, with a white-rose copy of it for the white roses at the couple's feet.

    python3 tools/build_roses.py     # writes public/assets/villa/roses/*.webp + roses.json
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "closing")
OUT = os.path.join(ROOT, "public", "assets", "villa", "roses")
os.makedirs(OUT, exist_ok=True)


def key(rgb):
    """The plant's own pixels: everything but the pale, colourless background."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.int32)
    # (and the soft grey shadow the photo has under the plant)
    low = np.arange(rgb.shape[0])[:, None] > rgb.shape[0] * 0.8
    bg = ((hsv[..., 1] < 22) & (hsv[..., 2] > 222)) | ((hsv[..., 1] < 30) & (hsv[..., 2] > 170)) \
        | (low & (hsv[..., 1] < 40) & (hsv[..., 2] > 120))
    m = (~bg).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # the plant is its big pieces; small things floating free of it (bees, a butterfly) go
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    big = st[1:, cv2.CC_STAT_AREA].max()
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] > big * 0.02:
            keep[lab == k] = 255
    # (holes inside the plant that are leaf-shadow, not background, are kept)
    a = cv2.GaussianBlur(keep.astype(np.float32) / 255, (0, 0), 0.8)
    return np.clip(a * 1.15, 0, 1)


def roses_of(rgb, alpha, min_area):
    """The rose heads: pink, bright enough, a good size."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.int32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    pink = (((h >= 140) | (h <= 8)) & (s >= 35) & (v >= 120)) & (alpha > 0.5)
    pink = cv2.morphologyEx(pink.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    pink = cv2.morphologyEx(pink, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    # (a rose, or a small bunch of roses touching, is one piece: they open together)
    n, lab, st, _ = cv2.connectedComponentsWithStats(pink)
    return [(lab == k, None, None) for k in range(1, n) if st[k, cv2.CC_STAT_AREA] >= min_area]


def pack(sprites):
    """Shelf-pack sprites (RGBA arrays) into one atlas; returns the atlas and each one's rect."""
    pad = 2
    order = sorted(range(len(sprites)), key=lambda i: -sprites[i].shape[0])
    width = 1024
    x = y = shelf = 0
    rects = [None] * len(sprites)
    for i in order:
        hh, ww = sprites[i].shape[:2]
        if x + ww + pad > width:
            x, y, shelf = 0, y + shelf + pad, 0
        rects[i] = (x, y, ww, hh)
        x += ww + pad
        shelf = max(shelf, hh)
    atlas = np.zeros((y + shelf + pad, width, 4), np.uint8)
    for i, (rx, ry, ww, hh) in enumerate(rects):
        atlas[ry:ry + hh, rx:rx + ww] = sprites[i]
    return atlas, rects


def white(rgba):
    """The same roses, white: the pink drained to a warm ivory (their green sepals stay green)."""
    rgb = rgba[..., :3].astype(np.float32)
    hsv = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2HSV).astype(np.float32)
    pinkish = np.clip((hsv[..., 1] - 25) / 30, 0, 1) * (((hsv[..., 0] >= 135) | (hsv[..., 0] <= 10))).astype(np.float32)
    lum = rgb @ np.array([0.3, 0.55, 0.15], np.float32)
    ivory = np.clip(lum[..., None] * 0.55 + np.array([120, 116, 104], np.float32), 0, 255)
    out = rgb * (1 - pinkish[..., None]) + ivory * pinkish[..., None]
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), rgba[..., 3]])


def build(name, path, min_area, width):
    rgb = np.array(Image.open(path).convert("RGB"))
    a = key(rgb)
    ys, xs = np.nonzero(a > 0.1)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb, a = rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]
    sc = width / rgb.shape[1]
    rgb = cv2.resize(rgb, (width, round(rgb.shape[0] * sc)), interpolation=cv2.INTER_AREA)
    a = cv2.resize(a, (width, rgb.shape[0]), interpolation=cv2.INTER_AREA)
    H, W = a.shape
    found = roses_of(rgb, a, min_area * sc * sc)

    base = rgb.copy()
    lift = np.zeros((H, W), np.uint8)
    sprites, places = [], []
    for mask, st, cen in found:
        m8 = mask.astype(np.uint8) * 255
        m8 = cv2.dilate(m8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
        bx, by, bw, bh = cv2.boundingRect(m8)
        p = 3
        bx0, by0, bx1, by1 = max(0, bx - p), max(0, by - p), min(W, bx + bw + p), min(H, by + bh + p)
        sa = cv2.GaussianBlur(m8.astype(np.float32) / 255, (0, 0), 0.9)[by0:by1, bx0:bx1]
        sa = np.minimum(sa, a[by0:by1, bx0:bx1])
        sprites.append(np.dstack([rgb[by0:by1, bx0:bx1], (sa * 255).astype(np.uint8)]))
        places.append((bx0 / W, by0 / H, (bx1 - bx0) / W, (by1 - by0) / H))
        lift |= m8
    # the plant before its roses open: each rose's petals turned the deep green of the leaves
    # round it, like a closed bud in its sepals (the plant keeps its exact outline, so there is no
    # hole and nothing smeared); the rose itself then opens over it
    lum = (base.astype(np.float32) @ np.array([0.3, 0.55, 0.15], np.float32))[..., None] / 255
    bud = np.clip(lum ** 1.15 * np.array([70, 112, 58], np.float32) + np.array([10, 22, 10], np.float32), 0, 255)
    soft_lift = cv2.GaussianBlur(lift.astype(np.float32) / 255, (0, 0), 1.2)[..., None]
    base = base.astype(np.float32) * (1 - soft_lift) + bud * soft_lift
    Image.fromarray(np.dstack([np.clip(base, 0, 255).astype(np.uint8), (a * 255).astype(np.uint8)])).save(
        os.path.join(OUT, f"{name}-base.webp"), "WEBP", quality=84, method=6)

    atlas, rects = pack(sprites)
    Image.fromarray(atlas).save(os.path.join(OUT, f"{name}-roses.webp"), "WEBP", quality=86, method=6)
    Image.fromarray(white(atlas)).save(os.path.join(OUT, f"{name}-roses-white.webp"), "WEBP", quality=86, method=6)
    print(name, (W, H), len(sprites), "roses; atlas", atlas.shape[1], atlas.shape[0])
    return {
        "w": W, "h": H, "atlas": {"w": atlas.shape[1], "h": atlas.shape[0]},
        "roses": [{"a": list(r), "p": [round(v, 5) for v in pl]} for r, pl in zip(rects, places)],
    }


meta = {
    "bush": build("bush", os.path.join(SRC, "ref-rose-bush.webp"), 900, 700),
    "garland": build("garland", os.path.join(SRC, "ref-rose-garland.png"), 160, 1000),
}
with open(os.path.join(OUT, "roses.json"), "w") as f:
    json.dump(meta, f)
