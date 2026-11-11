"""Cuts the flowering creeper (assets-src/botanical/ref-creeper.webp) into the pieces that grow
along the Celebrations timeline:

    python3 tools/build_creeper.py           # writes public/assets/img/creeper-*.webp + creeper.json
    CREEPER_DEBUG=/tmp/c python3 tools/build_creeper.py   # also writes inspection images

  creeper-stem.webp    the bare stem and fine tendrils, with every leaf, bud and flower lifted off
  creeper-atlas.webp   each leaf, bud and flower on its own, packed into one sheet
  creeper.json         where each piece sits on the stem, the point it grows from (a leaf's base,
                       a bud's stalk, a flower's heart) and the stem's line from top to foot

On the page (src/sections/creeper.ts) the stem grows down as the guest scrolls, and every piece
unfurls from its own point as the stem reaches it; put back together they make the picture again.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-creeper.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")
DEBUG = os.environ.get("CREEPER_DEBUG")
X0, X1 = 376, 664                  # the creeper's own columns of the picture


def disk(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def main():
    img = np.array(Image.open(SRC).convert("RGBA"))[:, X0:X1].astype(np.float32)
    H, W = img.shape[:2]
    rgb, al = img[..., :3], img[..., 3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    v, mn = rgb.max(-1), rgb.min(-1)
    solid = al > 60

    pink = solid & (r > g + 24) & (r > 150)
    white = solid & (v > 205) & (v - mn < 38)
    yellow = solid & (r > 170) & (g > 130) & (b < 120) & (r - b > 70)
    green = solid & (g >= r - 8) & (g > b + 30)        # olive leaves; the stem is browner (r > g)

    # blossoms: pink or white petals round a yellow heart; buds: small pink knots
    petals = ((pink | white | yellow) * 255).astype(np.uint8)
    petals = cv2.morphologyEx(petals, cv2.MORPH_CLOSE, disk(3))
    petals = cv2.morphologyEx(petals, cv2.MORPH_OPEN, disk(2))
    n, lab, stats, cents = cv2.connectedComponentsWithStats((petals > 0).astype(np.uint8))
    flowers, buds = [], []
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        comp = lab == i
        has_heart = (yellow & cv2.dilate(comp.astype(np.uint8), disk(2)).astype(bool)).sum() > 6
        if area >= 700 and has_heart:
            flowers.append(comp)
        elif area >= 110:              # (smaller specks stay with the stem)
            buds.append(comp)

    # leaves: the broad green blades (thin stems vanish in the opening)
    blades = cv2.morphologyEx((green * 255).astype(np.uint8), cv2.MORPH_OPEN, disk(3))
    n, lab, stats, _ = cv2.connectedComponentsWithStats((blades > 0).astype(np.uint8))
    leaves = [lab == i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 120]

    # each piece takes its own pixels plus a hair of edge; buds take their green sepals too
    taken = np.zeros((H, W), bool)
    pieces = []
    def claim(kind, mask, grow):
        nonlocal taken
        m = cv2.dilate(mask.astype(np.uint8), disk(grow)).astype(bool) & (al > 8) & ~taken
        taken |= m
        pieces.append((kind, m))
    for f in flowers:
        claim("flower", f, 3)
    for bd in buds:
        sep = cv2.dilate(bd.astype(np.uint8), disk(7)).astype(bool) & green
        claim("bud", bd | sep, 2)
    for lf in leaves:
        claim("leaf", lf, 2)

    # what is left is the stem: find its centre line, for the growth front and the joins
    stem_mask = (al > 60) & ~taken
    stem_alpha = al * (~taken)
    rows = []
    for y in range(0, H, 8):
        xs = np.where(stem_mask[y])[0]
        rows.append(float(np.median(xs)) if len(xs) else None)
    # fill the gaps (where a flower sat on the stem) by interpolation
    known = [(i, x) for i, x in enumerate(rows) if x is not None]
    line = []
    for i in range(len(rows)):
        if rows[i] is not None:
            line.append(rows[i]); continue
        before = [k for k in known if k[0] < i]
        after = [k for k in known if k[0] > i]
        if before and after:
            (i0, x0), (i1, x1) = before[-1], after[0]
            line.append(x0 + (x1 - x0) * (i - i0) / (i1 - i0))
        else:
            line.append((before or after)[-1 if before else 0][1])

    # the point each piece grows from: the pixel of it nearest the stem
    dist = cv2.distanceTransform((~stem_mask).astype(np.uint8), cv2.DIST_L2, 5)
    sprites = []
    for kind, m in pieces:
        ys, xs = np.where(m)
        if len(xs) < 20:
            continue
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        if kind == "flower":
            px, py = float(xs.mean()), float(ys.mean())
        else:
            # the end of the leaf (or bud) nearest the main stem's line, i.e. where it is attached
            lx = np.array([line[min(len(line) - 1, int(yy) // 8)] for yy in ys])
            near = np.abs(xs - lx) + 0.15 * dist[ys, xs]
            k = int(np.argmin(near))
            px, py = float(xs[k]), float(ys[k])
        sp = {"kind": kind, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0),
              "px": round(px - x0, 1), "py": round(py - y0, 1), "mask": m[y0:y1, x0:x1]}
        if kind == "flower":
            sp["pink"] = bool((r[m] - b[m]).mean() > 30)
        sprites.append(sp)

    # pack the pieces into one sheet (shelves, tallest first)
    pad = 2
    order = sorted(range(len(sprites)), key=lambda i: -sprites[i]["h"])
    SW, x, y, shelf = 1024, 0, 0, 0
    for i in order:
        s = sprites[i]
        if x + s["w"] + pad > SW:
            x, y, shelf = 0, y + shelf + pad, 0
        s["ax"], s["ay"] = x, y
        x += s["w"] + pad
        shelf = max(shelf, s["h"])
    SH = y + shelf
    sheet = np.zeros((SH, SW, 4), np.float32)
    for s in sprites:
        sub = img[s["y"]:s["y"] + s["h"], s["x"]:s["x"] + s["w"]].copy()
        sub[..., 3] *= s["mask"]
        sheet[s["ay"]:s["ay"] + s["h"], s["ax"]:s["ax"] + s["w"]] = sub
    Image.fromarray(sheet.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, "creeper-atlas.webp"), quality=92, method=6)
    stem = img.copy()
    stem[..., 3] = stem_alpha
    Image.fromarray(stem.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, "creeper-stem.webp"), quality=92, method=6)

    meta = {
        "w": W, "h": H, "atlas": {"w": SW, "h": int(SH)},
        "line": [round(v, 1) for v in line], "lineStep": 8,
        "pieces": [{k: v for k, v in s.items() if k != "mask"} for s in sorted(sprites, key=lambda s: s["y"] + s["py"])],
    }
    with open(os.path.join(OUT, "creeper.json"), "w") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    counts = {k: sum(1 for s in sprites if s["kind"] == k) for k in ("flower", "bud", "leaf")}
    print(f"creeper: {W}x{H}, {counts}, atlas {SW}x{SH}, "
          f"stem {os.path.getsize(os.path.join(OUT, 'creeper-stem.webp')) // 1024} KB, "
          f"atlas {os.path.getsize(os.path.join(OUT, 'creeper-atlas.webp')) // 1024} KB; "
          f"stem x at top {line[0]:.0f}, at foot {line[-1]:.0f}")
    if DEBUG:
        vis = np.zeros((H, W, 3), np.uint8) + 245
        colours = {"flower": (230, 90, 140), "bud": (240, 170, 60), "leaf": (60, 160, 70)}
        for kind, m in pieces:
            vis[m] = colours[kind]
        vis[stem_mask] = (90, 70, 40)
        for s in sprites:
            cv2.circle(vis, (int(s["x"] + s["px"]), int(s["y"] + s["py"])), 3, (0, 0, 255), -1)
        Image.fromarray(vis).save(os.path.join(DEBUG, "pieces.png"))
        Image.fromarray(sheet.clip(0, 255).astype(np.uint8)).save(os.path.join(DEBUG, "atlas.png"))


if __name__ == "__main__":
    main()
