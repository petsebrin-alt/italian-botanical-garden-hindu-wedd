"""The closing scene's layers (src/sections/ThankYou.tsx), cut from one photograph:
assets-src/closing/ref-couple-garden.webp, the couple greeting with joined hands in a Tuscan garden.

The photo is divided into the pieces the scene builds up from, one at a time:

  garden   the sky, the hills with the villa on the hilltop, and the cypress avenue (everything
           not in another piece); where the gateways will stand, the sky carries on and the hills
           fade away into a soft haze
  wall-l   the left stone gateway with its statue, bust and bougainvillea
  wall-r   the right one
  lawn     the lawn and the flower beds at its edge
  couple   the couple (cut out of the garden by colour and shape: GrabCut)
  urn-l    the urns of flowers in front
  urn-r
  leaves   the branch hanging in from the top left

Every piece is the photograph's own pixels, and each one reaches a little way under the pieces
stacked above it, so when all of them are in place the photograph is whole again, without seams.
(Behind the urns and the branch, which arrive last, the lawn and the sky are carried on from
beside them, so no gap shows before they come.) The pieces are stacked in the order they arrive.
Each piece is cropped to what it holds; closing.json says where it sits (as fractions of the photo).

    python3 tools/build_closing.py
    CLOSING_DEBUG=/tmp/c python3 tools/build_closing.py   # also writes a map of the pieces
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "closing", "ref-couple-garden.webp")
OUT = os.path.join(ROOT, "public", "assets", "closing")
DEBUG = os.environ.get("CLOSING_DEBUG")
FEATHER = 5  # px: the soft edge where one piece meets the next

img = np.array(Image.open(SRC).convert("RGB"))
H, W = img.shape[:2]
bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.int32)


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return m


def grabcut(rect, sure_fg=(), sure_bg=(), green_bg=True, iters=6):
    """A figure cut from the garden: inside `rect` probably figure, `sure_fg` polygons surely,
    `sure_bg` polygons surely not, and anything leafy green (in this golden light the lawn is a
    warm yellow-green) inside the rect probably garden."""
    x0, y0, x1, y1 = rect
    m = np.full((H, W), cv2.GC_BGD, np.uint8)
    m[y0:y1, x0:x1] = cv2.GC_PR_FGD
    if green_bg:
        g = (hsv[..., 0] >= 20) & (hsv[..., 0] <= 90) & (hsv[..., 1] >= 70)
        sub = m[y0:y1, x0:x1]
        sub[g[y0:y1, x0:x1]] = cv2.GC_PR_BGD
    for p in sure_bg:
        m[poly(p) > 0] = cv2.GC_BGD
    for p in sure_fg:
        m[poly(p) > 0] = cv2.GC_FGD
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, m, None, bg, fg, iters, cv2.GC_INIT_WITH_MASK)
    out = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the figure itself: its largest piece, holes filled, edges smoothed
    n, lab, st, _ = cv2.connectedComponentsWithStats(out)
    if n > 1:
        out = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    # peel away leafy green still clinging to the outline (the gold embroidery inside the figure is
    # enclosed by it, so it stays)
    if green_bg:
        leafy = ((hsv[..., 0] >= 22) & (hsv[..., 0] <= 95) & (hsv[..., 1] >= 60)).astype(np.uint8)
        for _ in range(3):
            cand = (out > 0) & (leafy > 0)
            n, lab = cv2.connectedComponents(cand.astype(np.uint8))
            edge = cv2.dilate((out == 0).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
            touching = np.unique(lab[edge & cand])
            touching = touching[touching > 0]
            if not len(touching):
                break
            out[np.isin(lab, touching)] = 0
        n, lab, st, _ = cv2.connectedComponentsWithStats(out)
        if n > 1:
            out = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    # (only small holes are filled: the garden seen between two figures stays garden)
    inv = 255 - out
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] < 600:
            out[lab == k] = 255
    return cv2.morphologyEx(out, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))


def soft(m, grow=0):
    """A region's alpha: grown by `grow` px (to reach under the pieces above it), edge feathered."""
    if grow:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    a = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), FEATHER * 0.6)
    return np.clip(a, 0, 1)


# ------------------------------------------------------------------ the pieces (photo px)
couple = grabcut(
    (292, 462, 918, 1338),
    sure_fg=[
        [(352, 640), (520, 640), (520, 1010), (352, 1010)],            # his sherwani
        [(372, 1010), (470, 1010), (470, 1250), (372, 1250)],         # his legs
        [(410, 490), (480, 490), (485, 600), (405, 600)],             # his face and turban
        [(560, 640), (690, 640), (700, 830), (555, 830)],             # her blouse and hands
        [(520, 860), (840, 860), (880, 1290), (480, 1290)],           # her lehenga
        [(575, 580), (640, 580), (640, 650), (575, 650)],             # her face
    ],
    sure_bg=[
        [(800, 462), (918, 462), (918, 880), (806, 880)],             # the right gateway
        [(508, 462), (570, 462), (568, 698), (549, 726), (534, 726), (531, 640), (508, 598)],  # the path between them
        [(292, 462), (402, 462), (402, 616), (292, 616)],             # the cypresses left of his turban
        [(648, 462), (800, 462), (800, 690), (726, 684), (672, 590)],  # the cypresses right of her veil
        [(752, 862), (918, 862), (918, 1338), (912, 1338), (900, 1292), (866, 1172), (838, 1062), (792, 1018), (758, 930)],  # the lawn right of her veil
    ],
)
urn_l = grabcut((0, 860, 160, 1245), sure_fg=[[(5, 1060), (80, 1060), (80, 1200), (5, 1200)]],
                sure_bg=[[(100, 1150), (160, 1150), (160, 1245), (100, 1245)]])
urn_r = grabcut((926, 870, W, 1235), sure_fg=[[(1010, 1060), (1080, 1060), (1080, 1200), (1010, 1200)]], green_bg=True)

leaves = poly([(0, 0), (322, 0), (302, 36), (226, 72), (128, 122), (76, 172), (42, 218), (0, 245)])
wall_l = poly([(0, 280), (60, 292), (140, 318), (204, 352), (230, 344), (240, 312), (270, 298), (302, 310),
               (320, 350), (314, 420), (300, 438), (306, 700), (312, 932), (0, 932)])
wall_r = poly([(W, 276), (1020, 296), (960, 326), (882, 356), (864, 344), (856, 310), (828, 298), (800, 310),
               (784, 346), (790, 420), (800, 440), (796, 700), (790, 918), (W, 918)])
avenue = poly([(286, 905), (286, 330), (298, 170), (318, 60), (344, 0), (374, 0), (398, 96), (424, 148),
               (450, 172), (472, 204), (492, 254), (507, 334), (515, 430), (520, 498), (560, 504), (598, 498),
               (603, 330), (618, 250), (640, 194), (660, 128), (688, 54), (712, 0), (734, 0), (748, 68),
               (762, 154), (778, 244), (795, 294), (808, 330), (808, 905)])
# (the sky between and above the cypresses' tips belongs with the hills)
sky = (hsv[..., 0] >= 95) & (hsv[..., 0] <= 125) & (img[..., 2].astype(np.int32) > 150)
avenue[sky & (np.arange(H)[:, None] < 520)] = 0
lawn = np.zeros((H, W), np.uint8)
lawn[868:] = 255

# each pixel belongs to one piece: the one highest in the stack that claims it
order = ["garden", "wall-l", "wall-r", "lawn", "couple", "urn-l", "urn-r", "leaves"]
claims = {"lawn": lawn, "wall-l": wall_l, "wall-r": wall_r,
          "couple": couple, "urn-l": urn_l, "urn-r": urn_r, "leaves": leaves}
owner = np.zeros((H, W), np.uint8)  # index into order; 0 = hills
for i, name in enumerate(order):
    if name in claims:
        owner[claims[name] > 0] = i
# what lies behind the urns and the branch, carried on from beside them (the lawn and flower beds
# to the urns' inner side, the open sky to the branch's right)
plate = img.copy()
behind = {}
for name, dx in (("urn-l", 172), ("urn-r", -164), ("leaves", 336)):
    region = cv2.dilate(claims[name], np.ones((2 * FEATHER + 5, 2 * FEATHER + 5), np.uint8)) > 0
    ys, xs = np.nonzero(region)
    plate[ys, xs] = img[ys, np.clip(xs + dx, 0, W - 1)]
    behind[name] = region
low_owner = owner.copy()
low_owner[behind["urn-l"] | behind["urn-r"]] = order.index("lawn")
low_owner[behind["leaves"]] = order.index("garden")
low_owner[np.isin(owner, [order.index(n) for n in ("urn-l", "urn-r", "leaves")]) & ~(behind["urn-l"] | behind["urn-r"] | behind["leaves"])] = order.index("lawn")

# where the couple stand, the garden carries on behind them, crisp, so nothing is ever missing
# before they arrive: above the lawn, each column continues downward what lies just above the
# couple there (the cypresses, the path), mirrored back and forth; on the lawn, each row continues
# the lawn and flower bed beside them, so it keeps its own distance and scale
# (only what the couple themselves cover: everything round them stays the photograph's own)
stand = cv2.dilate(couple, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
LAWN_Y = 868
P = 70
tops = np.array([np.nonzero(stand[:LAWN_Y, x])[0].min() if stand[:LAWN_Y, x].any() else LAWN_Y for x in range(W)])
for x in range(W):
    col = np.nonzero(stand[:LAWN_Y, x])[0]
    if not len(col):
        continue
    # (the repeat starts a little above the couple's highest point nearby, clear of the turban's plume)
    top = int(tops[max(0, x - 40): x + 41].min()) - 14
    for y in col:
        m = (y - top) % (2 * P)
        sy = top - 1 - m if m < P else top - P + (m - P)
        plate[y, x] = img[max(0, sy), x]
SRC_X0, SRC_W = 172, 116  # a stretch of lawn and flower bed left of the couple, clear of the urn
for y in range(LAWN_Y, H):
    row = np.nonzero(stand[y])[0]
    if not len(row):
        continue
    m = (row - row.min()) % (2 * SRC_W)
    sx = np.where(m < SRC_W, SRC_X0 + m, SRC_X0 + 2 * SRC_W - 1 - m)
    plate[y, row] = img[y, sx]
# (a breath of softening only along the seams of the repeats)
ys, xs = np.nonzero(stand)
plate[ys, xs] = cv2.GaussianBlur(plate, (0, 0), 1.0)[ys, xs]
low_owner[(stand > 0) & (np.arange(H)[:, None] < LAWN_Y)] = order.index("garden")
low_owner[(stand > 0) & (np.arange(H)[:, None] >= LAWN_Y)] = order.index("lawn")

# the garden arrives first, before the gateways in front of it: so where they stand, the garden
# piece carries on the sky (each row's own colour) and the hills as a soft haze that fades away
# below them, rather than leaving holes in their shapes
hills_i = order.index("garden")
open_sky = sky & (owner == hills_i)
rows_sky = np.array([np.median(img[y][open_sky[y]], axis=0) if open_sky[y].sum() > 20 else [0, 0, 0] for y in range(H)], np.float32)
for y in range(1, H):  # (rows with no open sky take the row above's colour)
    if not rows_sky[y].any():
        rows_sky[y] = rows_sky[y - 1]
land = (owner == hills_i) & ~sky
rows_land = np.array([img[y][land[y]].mean(axis=0) if land[y].sum() > 20 else [0, 0, 0] for y in range(H)], np.float32)
for y in range(1, H):
    if not rows_land[y].any():
        rows_land[y] = rows_land[y - 1]
land_low = land & (np.arange(H)[:, None] >= 150)  # (the hills never rise higher; above, only leaves)
skyline = np.array([np.argmax(land_low[:, x]) if land_low[:, x].any() else H for x in range(W)], np.float32)
known = skyline < H
skyline = np.interp(np.arange(W), np.nonzero(known)[0], skyline[known])
skyline = np.convolve(np.pad(skyline, 40, mode="edge"), np.ones(81) / 81, mode="valid")
covered = np.isin(owner, [order.index("wall-l"), order.index("wall-r")])
yy = np.arange(H, dtype=np.float32)[:, None]
fill = np.where(yy < skyline[None, :], 1, 0)[..., None] * rows_sky[:, None, :] + \
    np.where(yy >= skyline[None, :], 1, 0)[..., None] * rows_land[:, None, :]
fill = cv2.GaussianBlur(fill.astype(np.float32), (0, 0), 3)
hills_rgb = np.where(covered[..., None], fill, plate.astype(np.float32))
hills_fade = np.clip(1 - (yy - skyline[None, :] - 40) / 150, 0, 1)  # the haze below the hills' tops
hills_alpha = np.where(covered, hills_fade, 0.0).astype(np.float32)

os.makedirs(OUT, exist_ok=True)
meta = {"w": W, "h": H, "layers": {}}
for i, name in enumerate(order):
    if name == "garden":
        region = np.where(low_owner == i, 255, 0).astype(np.uint8)
        # (it too reaches a little under the pieces above it)
        reach = cv2.dilate(region, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * FEATHER + 3, 2 * FEATHER + 3)))
        region = np.where((reach > 0) & (low_owner != i), 255, region).astype(np.uint8)
        alpha = np.maximum(soft(region), cv2.GaussianBlur(hills_alpha, (0, 0), 2) * (1 - soft(region)))
        alpha = np.clip(alpha, 0, 1)
        rgb = hills_rgb
    else:
        top = name in ("couple", "urn-l", "urn-r", "leaves")
        own = owner if top else low_owner
        region = np.where(own == i, 255, 0).astype(np.uint8)
        # reach a little under the pieces stacked above, so no seam shows when all are in place
        above = np.isin(own, list(range(i + 1, len(order))))
        reach = cv2.dilate(region, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * FEATHER + 3, 2 * FEATHER + 3)))
        region = np.where((reach > 0) & above, 255, region).astype(np.uint8)
        # (each cut-out carries a few pixels of its own real surroundings, so it is fully solid at
        # its true outline and its soft edge falls over the very same pixels beneath it)
        alpha = soft(region, 4)
        rgb = (img if top else plate).astype(np.float32)
    a8 = (alpha * 255).astype(np.uint8)
    ys, xs = np.nonzero(a8 > 2)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a8])[y0:y1, x0:x1]
    p = os.path.join(OUT, f"{name}.webp")
    Image.fromarray(rgba).save(p, "WEBP", quality=84, method=6)
    meta["layers"][name] = {"x": round(x0 / W, 5), "y": round(y0 / H, 5), "w": round((x1 - x0) / W, 5), "h": round((y1 - y0) / H, 5)}
    print(name, (x1 - x0, y1 - y0), os.path.getsize(p) // 1024, "KB")

with open(os.path.join(OUT, "closing.json"), "w") as f:
    json.dump(meta, f, indent=1)

if DEBUG:
    os.makedirs(DEBUG, exist_ok=True)
    colours = np.array([[80, 140, 255], [40, 160, 60], [150, 220, 90], [255, 120, 60], [255, 200, 40],
                        [255, 255, 255], [230, 40, 120], [140, 60, 220], [60, 220, 220], [20, 90, 20]], np.float32)
    over = img.astype(np.float32) * 0.45 + colours[owner] * 0.55
    Image.fromarray(over.astype(np.uint8)).resize((W // 2, H // 2)).save(os.path.join(DEBUG, "pieces.jpg"))
    cut = np.dstack([img, couple])
    bg = np.full_like(img, 230)
    comp = img * (couple[..., None] / 255) + bg * (1 - couple[..., None] / 255)
    Image.fromarray(comp.astype(np.uint8)).resize((W // 2, H // 2)).save(os.path.join(DEBUG, "couple.jpg"))
