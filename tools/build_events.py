"""Builds the Celebrations section's images:

    python3 tools/build_events.py

  event-<id>          each celebration's photograph, cut from the 3 x 2 collage
                      assets-src/botanical/ref-events.webp. Each window is the full height of
                      its tile and as wide as the frame's opening allows (0.82 : 1), placed so the
                      celebration's sign stands whole inside it.
  botanical-gold-frame-wide(-mask)
                      the gold botanical frame, widened in its plain middle (its flowers and
                      curves are untouched) so the opening matches the photographs.
  bloom-hydrangea     a real pink hydrangea head, cut from ref-flowers.webp: the flower that
                      blooms on the timeline at each celebration.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical")
OUT = os.path.join(ROOT, "public", "assets", "img")

TILE = 512
ASPECT = 0.82                       # the widened frame's opening, width : height
WIN = round(TILE * ASPECT)          # 420 px of each 512 px tile
# each tile's top-left in the collage, and where its window starts (tile px): signs whole
WINDOWS = {
    "haldi": ((0, 0), 72),
    "mehendi": ((512, 0), 70),
    "sangeet": ((1024, 0), 8),
    "ceremony": ((0, 512), 0),
    "reception": ((512, 512), 84),
}
OUT_W, OUT_H = 656, 800

# the frame: columns whose only content is the thin gold line at the top and bottom of the arch
FRAME_SPLIT = 340
FRAME_INSERT = 158                  # (504 + 158) / 807 ≈ 0.82, the photographs' shape


def save(img, name, quality=86, avif=True):
    base = os.path.join(OUT, name)
    img.save(base + ".webp", quality=quality, method=6)
    if avif:
        img.save(base + ".avif", quality=max(quality - 26, 40))
    print(f"{name}: {img.width}x{img.height}  {os.path.getsize(base + '.webp') // 1024} KB")


def photos():
    im = Image.open(os.path.join(SRC, "ref-events.webp")).convert("RGB")
    for name, ((tx, ty), x0) in WINDOWS.items():
        x0 = min(max(x0, 0), TILE - WIN)
        c = im.crop((tx + x0, ty + 2, tx + x0 + WIN, ty + TILE - 2)).resize((OUT_W, OUT_H), Image.LANCZOS)
        c = c.filter(ImageFilter.UnsharpMask(radius=1.3, percent=55, threshold=2))
        save(c, f"event-{name}")


def widen(path, out, png=False):
    im = Image.open(os.path.join(OUT, path)).convert("RGBA")
    a = np.array(im)
    col = a[:, FRAME_SPLIT:FRAME_SPLIT + 1]
    wide = np.concatenate([a[:, :FRAME_SPLIT], np.repeat(col, FRAME_INSERT, axis=1), a[:, FRAME_SPLIT:]], axis=1)
    res = Image.fromarray(wide)
    if png:
        res.save(os.path.join(OUT, out + ".png"), optimize=True)
        print(f"{out}.png: {res.width}x{res.height}")
    else:
        res.save(os.path.join(OUT, out + ".webp"), quality=92, method=6)
        print(f"{out}.webp: {res.width}x{res.height}")
    return res.size


def hydrangea():
    """The big pink hydrangea head: GrabCut inside an ellipse round it."""
    img = np.array(Image.open(os.path.join(SRC, "ref-flowers.webp")).convert("RGB"))
    cx, cy, rx, ry = 890, 330, 178, 148
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    e = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[e < 1.12] = cv2.GC_PR_BGD
    gc[e < 0.95] = cv2.GC_PR_FGD
    r, g, b = img[..., 0].astype(int), img[..., 1].astype(int), img[..., 2].astype(int)
    pink = (r > g + 25) & (r > 170)
    gc[(e < 0.7) & pink] = cv2.GC_FGD
    bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)) & (e < 1.0)
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    fg = (lab == big).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.9)
    ys, xs = np.where(alpha > 0.01)
    x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
    side = max(x1 - x0, y1 - y0)
    mx, my = (x0 + x1) // 2, (y0 + y1) // 2
    x0, y0 = mx - side // 2, my - side // 2
    rgba = np.dstack([img, (alpha * 255).astype(np.uint8)])[y0:y0 + side, x0:x0 + side]
    out = Image.fromarray(rgba, "RGBA").resize((240, 240), Image.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))
    out.save(os.path.join(OUT, "bloom-hydrangea.webp"), quality=90, method=6)
    print(f"bloom-hydrangea.webp: {out.width}x{out.height}")


def main():
    photos()
    w, h = widen("botanical-gold-frame-stem.webp", "botanical-gold-frame-wide")
    widen("botanical-gold-frame-mask.png", "botanical-gold-frame-wide-mask", png=True)
    print(json.dumps({"frame": {"w": w, "h": h, "split": FRAME_SPLIT, "insert": FRAME_INSERT}}))
    hydrangea()


if __name__ == "__main__":
    main()
