"""Cuts the garden-window invitation's pieces from assets-src/botanical/ref-window-sheet.webp
(the asset sheet: closed window, butterflies, vines, flowers and petals on a transparent sheet):

    python3 tools/build_window.py         # writes public/assets/window/*.webp + window.json
    WINDOW_DEBUG=/tmp/w python3 tools/build_window.py

  frame          the arched stone frame of the closed window, its opening cleared
  door-l/door-r  the two wooden shutters, front on, each hinged on its outer edge
  vine-top, vine-bottom, vine-side   the climbing roses round the window
  rose, daisy, rosebud               single flowers
  butterfly-1..3 pink and cream butterflies
  petal-1..3     rose petals

(The lawn the window stands on is built by tools/build_lawn.py.)

The sheet's pieces are small, so each is lifted 2x (Lanczos on premultiplied colour, a light
unsharp mask). The faint haze the sheet has round every piece is cleared from the background.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical")
OUT = os.path.join(ROOT, "public", "assets", "window")
DEBUG = os.environ.get("WINDOW_DEBUG")
UP = 2

# (x0, y0, x1, y1) of each piece on the sheet
BOXES = {
    "window": (28, 395, 190, 569),
    "butterfly-1": (630, 392, 700, 456),
    "butterfly-2": (667, 429, 740, 493),
    "butterfly-3": (624, 477, 716, 551),
    "vine-bottom": (8, 610, 234, 697),
    "vine-top": (218, 610, 436, 700),
    "vine-side": (440, 600, 510, 700),
    "rose": (528, 620, 586, 690),
    "daisy": (585, 620, 633, 690),
    "rosebud": (634, 622, 673, 690),
    "petals": (674, 618, 744, 688),
}


def key(rgba, haze=True, largest=False):
    """Clear the sheet's haze: alpha measured against the background's own level round the crop,
    and the pale, colourless veil it leaves round leaves and petals removed."""
    a = rgba[..., 3].astype(np.float32)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = float(np.percentile(border, 60))
    lo, hi = bg + 22, max(bg + 60, 232)
    na = np.clip((a - lo) / (hi - lo), 0, 1)
    na = na * na * (3 - 2 * na)
    if haze:
        rgb = rgba[..., :3]
        v, ch = rgb.max(-1), rgb.max(-1) - rgb.min(-1)
        veil = (a < 236) & (ch < 46) & (v > 175)
        na = np.where(veil, na * np.clip((a - 200) / 36, 0, 1), na)
    out = rgba.astype(np.float32).copy()
    out[..., 3] = na * 255
    # drop specks and anything belonging to a neighbour
    m = (na > 0.25).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = stats[1:, cv2.CC_STAT_AREA].max()
        keep = np.zeros_like(m, bool)
        for i in range(1, n):
            area = stats[i, cv2.CC_STAT_AREA]
            if (largest and area == big) or (not largest and area >= max(25, 0.12 * big)):
                keep |= lab == i
        keep = cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        out[..., 3] *= keep
    return out


def lift(rgba, scale=UP):
    a = rgba[..., 3:4] / 255
    pm = np.concatenate([rgba[..., :3] * a, a * 255], axis=2)
    h, w = rgba.shape[:2]
    big = np.stack([np.array(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((w * scale, h * scale), Image.LANCZOS)).astype(np.float32) for c in range(4)], axis=2)
    al = big[..., 3:4] / 255
    rgb = np.where(al > 1e-3, big[..., :3] / np.maximum(al, 1e-3), 0)
    blur = cv2.GaussianBlur(rgb, (0, 0), 1.2)
    rgb = np.clip(rgb + 0.6 * (rgb - blur), 0, 255)
    return np.concatenate([rgb, big[..., 3:4]], axis=2)


def save(name, rgba, meta, extra=None):
    os.makedirs(OUT, exist_ok=True)
    im = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8))
    im.save(os.path.join(OUT, name + ".webp"), quality=92, method=6)
    meta[name] = {"w": im.width, "h": im.height, **(extra or {})}
    print(f"{name}: {im.width}x{im.height}")


def main():
    sheet = np.array(Image.open(os.path.join(SRC, "ref-window-sheet.webp")).convert("RGBA")).astype(np.float32)
    meta = {}
    cut = {name: key(sheet[y0:y1, x0:x1], haze=name != "window", largest=name.startswith("butterfly") or name == "window")
           for name, (x0, y0, x1, y1) in BOXES.items()}

    # ---------------------------------------------- the window: frame and two doors
    win = cut.pop("window")
    H, W = win.shape[:2]
    # the doors fill the inner arch; it is found from the frame's lighter stone border
    door = np.zeros((H, W), np.uint8)
    cv2.fillPoly(door, [np.round(np.array(DOOR_OUTLINE) ).astype(np.int32)], 1)
    door = door.astype(bool)
    frame = win.copy()
    frame[..., 3] *= ~door
    seam = SEAM_X
    left = win.copy(); left[..., 3] *= door; left[:, seam:, 3] = 0
    right = win.copy(); right[..., 3] *= door; right[:, :seam, 3] = 0
    ys, xs = np.where(door)
    dx0, dx1, dy0, dy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    save("frame", lift(frame), meta, {"opening": [int(dx0 * UP), int(dy0 * UP), int((dx1 - dx0) * UP), int((dy1 - dy0) * UP)], "seam": seam * UP})
    save("door-l", lift(left[dy0:dy1, dx0:seam]), meta, {"x": int(dx0 * UP), "y": int(dy0 * UP)})
    save("door-r", lift(right[dy0:dy1, seam:dx1]), meta, {"x": int(seam * UP), "y": int(dy0 * UP)})

    # ---------------------------------------------- petals: one file each
    petals = cut.pop("petals")
    m = (petals[..., 3] > 40).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    k = 0
    for i in sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])[:4]:
        x, y, w, h = stats[i, :4]
        p = petals[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2].copy()
        sub = lab[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2]
        p[..., 3] *= cv2.dilate((sub == i).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        k += 1
        save(f"petal-{k}", lift(p), meta)

    for name, rgba in cut.items():
        ys, xs = np.where(rgba[..., 3] > 10)
        rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        save(name, lift(rgba), meta)

    with open(os.path.join(OUT, "window.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    if DEBUG:
        for name in ("frame", "door-l", "door-r"):
            im = Image.open(os.path.join(OUT, name + ".webp")).convert("RGBA")
            bg = Image.new("RGBA", im.size, (40, 90, 60, 255)); bg.alpha_composite(im)
            bg.convert("RGB").save(os.path.join(DEBUG, name + ".png"))


# the inner arch the two doors fill (window-crop px), and the line where they meet
DOOR_OUTLINE = [(17, 43), (25, 35), (40, 22.5), (60, 16.5), (81, 14.5), (100, 16.5), (120, 22.5),
                (138, 34), (145, 43), (145, 165), (17, 165)]
SEAM_X = 81

if __name__ == "__main__":
    main()
