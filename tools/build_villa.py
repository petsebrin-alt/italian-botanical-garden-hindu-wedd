"""The closing scene's pieces (src/sections/ThankYou.tsx), cut from the Villa Cetinale photograph:
assets-src/closing/ref-cetinale.webp (1000 x 1333): a long avenue of cypresses on a grass path
running up to the hermitage on the hill, between two brick gateways with statues and obelisks.

  back      the sky, the hills and the palace at the avenue's end, the far trees and gardens
  row-l     the left row of cypresses, and row-r the right one
  lawn      the grass path between the rows and the lawn in front (the photo's own small walking
            couple taken out: the lawn carries on where they were)
  gate-l    the left gateway (its obelisk, bust, statue and walls), and gate-r the right one
  front-l   the low wall and shrub at the lower left, and front-r the big cypress at the lower right

Each piece arrives on its own, so where a later piece will stand the earlier ones carry the
scene on: behind the cypresses and the gateways, the sky and the hills continue (mirrored in from
either side, blended); behind the gateways' feet and the front trees, the lawn continues. When
all have arrived it is the photograph itself. Pieces are cropped to what they hold; villa.json
says where each sits (as fractions of the photo).

    python3 tools/build_villa.py
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "closing", "ref-cetinale.webp")
OUT = os.path.join(ROOT, "public", "assets", "villa")
os.makedirs(OUT, exist_ok=True)

img = np.array(Image.open(SRC).convert("RGB"))
H, W = img.shape[:2]
bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.int32)
Y = np.arange(H)[:, None]


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return m


def refine(rough, ring=22, iters=5):
    """Fit a rough outline to the real edge of the thing (GrabCut): inside it, probably the thing;
    a band round it, probably not; further out, surely not."""
    m = np.full((H, W), cv2.GC_BGD, np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * ring + 1, 2 * ring + 1))
    m[cv2.dilate(rough, k) > 0] = cv2.GC_PR_BGD
    m[rough > 0] = cv2.GC_PR_FGD
    m[cv2.erode(rough, k) > 0] = cv2.GC_FGD
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, m, None, bgm, fgm, iters, cv2.GC_INIT_WITH_MASK)
    out = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(out)
    if n > 1:
        out = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    return out


# ------------------------------------------------------------------ the sky
# (the overcast sky is pale and faintly blue; the obelisks' brick is warm, so it is not sky)
sky = (hsv[..., 1] < 45) & (img.min(-1) > 150) & (hsv[..., 0] > 60) & (Y < 470)
# where the sky is cut off by the hills, columns hold no sky below their first hill pixel
sky = cv2.morphologyEx(sky.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
sky = cv2.morphologyEx(sky.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0

# ------------------------------------------------------------------ the pieces (photo px)
gate_l = refine(poly([(62, 270), (74, 276), (110, 436), (113, 452), (150, 482), (200, 520), (256, 546), (262, 500),
                      (280, 486), (310, 490), (330, 520), (328, 560), (318, 576), (325, 600), (322, 975), (250, 1004),
                      (150, 1040), (100, 1060), (60, 1072), (45, 1065), (45, 440), (50, 430)]))
gate_r = refine(poly([(877, 276), (889, 282), (905, 440), (909, 452), (910, 1024), (880, 1030), (760, 1010),
                      (660, 995), (655, 990), (655, 600), (645, 576), (640, 520), (655, 490), (685, 485),
                      (700, 500), (705, 550), (760, 520), (810, 490), (845, 452), (850, 440)]))
# (the obelisks are tall and thin: their outlines are kept whole)
gate_l = np.maximum(gate_l, poly([(60, 264), (77, 270), (115, 440), (115, 470), (42, 470), (43, 440)]))
gate_r = np.maximum(gate_r, poly([(875, 269), (892, 275), (910, 440), (912, 470), (840, 470), (845, 440)]))
front_r = refine(poly([(1000, 600), (985, 622), (960, 680), (930, 760), (900, 800), (880, 850), (870, 900),
                       (876, 1000), (890, 1100), (905, 1200), (915, 1333), (1000, 1333)]), ring=16)
front_l = refine(poly([(0, 948), (40, 958), (70, 1000), (76, 1080), (60, 1130), (30, 1152), (0, 1142)]), ring=12)
row_l = poly([(300, 872), (300, 560), (305, 330), (330, 240), (342, 206), (356, 238), (370, 224), (380, 214),
              (390, 262), (402, 350), (415, 344), (426, 374), (438, 380), (452, 420), (463, 480), (470, 600), (472, 872)])
row_r = poly([(528, 845), (531, 600), (545, 420), (558, 372), (571, 364), (590, 300), (604, 250), (616, 300),
              (626, 380), (641, 450), (652, 520), (656, 845)])
# (a generous outline, so the whole of each treetop comes with its row; the sky is left out)
row_l = cv2.dilate(row_l, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
row_r = cv2.dilate(row_r, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
for m in (row_l, row_r):
    m[sky] = 0
row_l[gate_l > 0] = 0
row_r[gate_r > 0] = 0
lawn = np.zeros((H, W), np.uint8)
lawn[Y[:, 0] >= 862] = 255
lawn[poly([(462, 578), (538, 578), (548, 700), (562, 845), (470, 872), (456, 700)]) > 0] = 255

# each pixel to the piece highest in the stack that claims it
ORDER = ["back", "row-l", "row-r", "lawn", "gate-l", "gate-r", "front-l", "front-r"]
claims = {"row-l": row_l, "row-r": row_r, "lawn": lawn, "gate-l": gate_l, "gate-r": gate_r, "front-l": front_l, "front-r": front_r}
owner = np.zeros((H, W), np.uint8)
for i, n in enumerate(ORDER):
    if n in claims:
        owner[claims[n] > 0] = i
back_i = 0

# ------------------------------------------------------------------ the scene carried on
plate = img.astype(np.float32).copy()

# the photo's own small couple, walking up the path: the lawn carries on where they were
walkers = poly([(470, 840), (535, 840), (538, 935), (468, 935)])
ys, xs = np.nonzero(walkers)
plate[ys, xs] = img[ys, np.clip(xs + 75, 0, W - 1)]

# behind the cypresses and the gateways (above the lawn), the scene continues, so nothing is ever
# missing before they arrive:
#   * above the hills: the sky (the photo's own clouds where they show, each row's own sky colour
#     elsewhere, so no outline of anything that will arrive is left in it)
#   * the band of hills: carried across the gaps from the real hills either side, mirrored in
#   * below it, down to the lawn: a real Tuscan garden's hedges and lawn (the lower part of
#     public/assets/window/garden-ground.webp), toned to this photograph's lawn
lawn_i = ORDER.index("lawn")
movers = np.isin(owner, [ORDER.index(n) for n in ("row-l", "row-r", "gate-l", "gate-r", "front-l", "front-r")])
gap = cv2.dilate(movers.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
gap &= (owner != lawn_i) & (Y < 880)
# (the far path belongs to the lawn, which arrives later: until then the scene carries on there too)
plate_pre = plate.copy()
path_far = (owner == lawn_i) & (Y < 862)
gap |= path_far

land = (~sky) & (~gap) & (Y >= 300) & (Y < 600)
top_of = np.where(land.any(0), np.argmax(land, 0), -1).astype(np.float32)
have = top_of >= 0
ridge = np.interp(np.arange(W), np.nonzero(have)[0], top_of[have])
ridge = np.convolve(np.pad(ridge, 25, mode="edge"), np.ones(51) / 51, mode="valid")
R = ridge[None, :]

sky_rows = np.array([np.median(img[y][sky[y]], axis=0) if sky[y].sum() > 20 else [0, 0, 0] for y in range(H)], np.float32)
for y in range(1, H):
    if not sky_rows[y].any():
        sky_rows[y] = sky_rows[y - 1]
above = Y < R
# (in the sky, what will arrive and its edges become the plain sky; the photo's own sky stays)
plate = np.where((above & gap)[..., None], sky_rows[:, None, :], plate)

brick = (hsv[..., 0] < 25) & (hsv[..., 1] > 35)
known_hills = (~gap) & (~sky) & ~above & ~brick


def mirror_fill(y, holes, source):
    runs = np.flatnonzero(np.diff(np.concatenate([[0], holes.astype(np.int8), [0]])))
    for a_, b_ in zip(runs[::2], runs[1::2]):
        n = b_ - a_
        i = np.arange(n)
        ls, rs = a_ - 1 - i, b_ + (n - 1 - i)
        okl = (ls >= 0) & source[np.clip(ls, 0, W - 1)]
        okr = (rs < W) & source[np.clip(rs, 0, W - 1)]
        t = ((i + 0.5) / n)[:, None]
        wl, wr = (1 - t) * okl[:, None], t * okr[:, None]
        tot = wl + wr
        val = (plate[y, np.clip(ls, 0, W - 1)] * wl + plate[y, np.clip(rs, 0, W - 1)] * wr) / np.maximum(tot, 1e-6)
        ok = tot[:, 0] > 0
        seg = plate[y, a_:b_]
        seg[ok] = val[ok]
        plate[y, a_:b_] = seg


HILL_FOOT = 470
for y in range(int(ridge.min()), HILL_FOOT + 6):
    holes = gap[y] & ~above[y]
    if holes.any():
        mirror_fill(y, holes, known_hills[y])

# the garden's hedges and lawn below the hills
gg = np.array(Image.open(os.path.join(ROOT, "public", "assets", "window", "garden-ground.webp")).convert("RGBA")).astype(np.float32)
gg = gg[300:]  # (its hedges and lawn: the hills above are left out)
GH = 880 - HILL_FOOT + 40
GW = round(gg.shape[1] * GH / gg.shape[0])
gg = np.array(Image.fromarray(np.clip(gg, 0, 255).astype(np.uint8)).resize((max(GW, W), GH), Image.LANCZOS)).astype(np.float32)
x0 = (gg.shape[1] - W) // 2
gg = gg[:, x0:x0 + W, :3]
ref = img[900:].reshape(-1, 3).astype(np.float32)
cur = gg.reshape(-1, 3)
gg = np.clip((gg - cur.mean(0)) * np.clip(ref.std(0) / (cur.std(0) + 1e-6), 0.7, 1.3) + ref.mean(0), 0, 255)
garden = np.zeros((H, W, 3), np.float32)
garden[HILL_FOOT - 20:HILL_FOOT - 20 + GH] = gg[: H - (HILL_FOOT - 20)]
low = gap & (Y >= HILL_FOOT - 20)
# (it fades in over the hills' foot)
t = np.clip((Y - (HILL_FOOT - 20)) / 26, 0, 1)[..., None] * np.ones((1, W, 1), np.float32)
plate = np.where(low[..., None], garden * t + plate * (1 - t), plate)
# (a breath of softening only inside what was filled, so its joins do not show as lines)
soft_fill = cv2.GaussianBlur(plate, (0, 0), 0.8)
plate[gap & ~above] = soft_fill[gap & ~above]

# behind the gateways' feet and the front trees, on the lawn, the lawn continues from beside them
lawn_gap = (np.isin(owner, [ORDER.index(n) for n in ("gate-l", "gate-r", "front-l", "front-r")])) & (Y >= 862)
for y in range(862, H):
    g = lawn_gap[y]
    if not g.any():
        continue
    runs = np.flatnonzero(np.diff(np.concatenate([[0], g.astype(np.int8), [0]])))
    for a, b in zip(runs[::2], runs[1::2]):
        n = b - a
        # mirror in from the side nearer the middle (the open lawn)
        if (a + b) / 2 < W / 2:
            src = b + (b - 1 - np.arange(a, b))
        else:
            src = a - 1 - (np.arange(a, b) - a)
        src = np.clip(src, 0, W - 1)
        plate[y, a:b] = plate[y, src]

# ------------------------------------------------------------------ write the pieces
FEATHER = 4
meta = {"w": W, "h": H, "layers": {}}


def save(name, rgb, alpha):
    a8 = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    ys, xs = np.nonzero(a8 > 2)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a8])[y0:y1, x0:x1]
    Image.fromarray(rgba).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=86, method=6)
    meta["layers"][name] = {"x": round(x0 / W, 5), "y": round(y0 / H, 5), "w": round((x1 - x0) / W, 5), "h": round((y1 - y0) / H, 5)}
    print(name, x1 - x0, y1 - y0, os.path.getsize(os.path.join(OUT, f"{name}.webp")) // 1024, "KB")


def soft(m, grow=0):
    if grow:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), FEATHER * 0.6)


for i, name in enumerate(ORDER):
    if name == "back":
        # the sky and the hills, carried on behind everything above the lawn; it reaches a little
        # under the lawn's edge so no seam shows
        region = ((owner == back_i) | gap).astype(np.uint8) * 255
        region[Y[:, 0] >= 880] = 0
        save(name, plate, soft(region))
        continue
    region = np.where(owner == i, 255, 0).astype(np.uint8)
    if name == "lawn":
        region = np.maximum(region, (lawn_gap * 255).astype(np.uint8))
        save(name, np.where(path_far[..., None], plate_pre, plate), soft(region, 2))
        continue
    # each later piece carries a few pixels of its real surroundings, so it is fully solid at its
    # true outline and its soft edge falls over the very same pixels beneath it
    top = name.startswith(("gate", "front", "row"))
    save(name, img.astype(np.float32) if top else plate, soft(region, 4 if top else 2))

# the couple (cut out by tools/build_closing.py from assets-src/closing/ref-couple-garden.webp),
# standing on the path in front of the gateways: feet at y 1235, 470 px tall, centred on the path
# (its edge is trimmed to the couple themselves, so none of their own golden garden comes with
# them, and their light is eased towards this photograph's soft overcast day)
couple = np.array(Image.open(os.path.join(ROOT, "public", "assets", "closing", "couple.webp")).convert("RGBA")).astype(np.float32)
a = couple[..., 3]
a = cv2.erode(a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
a = cv2.GaussianBlur(a, (0, 0), 0.9)
rgb = couple[..., :3]
gray = rgb.mean(-1, keepdims=True)
rgb = (rgb * 0.88 + gray * 0.12) * np.array([0.95, 0.97, 1.03], np.float32)  # a little less gold, a touch cooler
couple = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a]).astype(np.uint8))
couple.save(os.path.join(OUT, "couple.webp"), "WEBP", quality=86, method=6)
ch = 470
cw = ch * couple.width / couple.height
meta["layers"]["couple"] = {"x": round((497 - cw / 2) / W, 5), "y": round((1235 - ch) / H, 5), "w": round(cw / W, 5), "h": round(ch / H, 5)}

with open(os.path.join(OUT, "villa.json"), "w") as f:
    json.dump(meta, f, indent=1)
