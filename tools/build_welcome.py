"""Builds the S02 Welcome scene from one realistic photograph (assets-src/botanical/ref-welcome.webp):
a sunlit Tuscan garden, wisteria and hydrangeas on the left, the villa terrace on the right.

The lettering baked into the reference is removed, then the photo is split into depth layers
that the section moves at different speeds:

    welcome-sky      the sky, continued upward for tall screens and behind the land (opaque)
    welcome-far      lawn, hills, vineyards and the distant cypresses (the sky keyed out)
    welcome-near-l   wisteria, cypresses and the hydrangea bed on the left
    welcome-near-r   the villa terrace, its urns and the tall cypresses on the right

All four share one canvas (the photo plus EXTRA rows of sky above), so stacked they recompose
the photograph exactly. Where a near layer covers the far one, the far layer is filled in, so
the small parallax offsets never show a double edge.

    python3 tools/build_welcome.py [--debug DIR]
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-welcome.webp")
OUT = os.path.join(ROOT, "public", "assets", "img")
DEBUG = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


img = cv2.cvtColor(np.array(Image.open(SRC).convert("RGB")), cv2.COLOR_RGB2BGR)
H, W = img.shape[:2]
EXTRA = H        # sky continued above the photo, for tall screens (phones)
HORIZON = 590    # where the distant hills meet the sky
f = img.astype(np.float32)
b, g, r = f[..., 0], f[..., 1], f[..., 2]
v = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
sat = (v - mn) / np.maximum(v, 1)
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)

# ---------------------------------------------------------------- 1. remove the lettering
print("removing the lettering…")
box = np.zeros((H, W), bool)
box[0:548, 328:1012] = True
box[492:, :540] = False                 # (treetops below "blessings", left of "begin beautifully")
local_sky = cv2.GaussianBlur(cv2.medianBlur(img, 31).astype(np.float32), (0, 0), 9)
strokes = box & ((v < 200) | (np.linalg.norm(local_sky - f, axis=2) > 9))
strokes = cv2.dilate(strokes.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=3)
inp = cv2.inpaint(img, strokes * 255, 7, cv2.INPAINT_TELEA).astype(np.float32)
w = cv2.GaussianBlur(cv2.dilate(strokes, np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 5)[..., None]
clean = np.clip(inp * (1 - w) + cv2.GaussianBlur(inp, (0, 0), 14) * w, 0, 255).astype(np.uint8)
f = clean.astype(np.float32)
b, g, r = f[..., 0], f[..., 1], f[..., 2]
v = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
sat = (v - mn) / np.maximum(v, 1)

# ---------------------------------------------------------------- 2. the sky
print("keying the sky…")
skyish = (v > 186) & (b >= r - 12) & (sat < 0.42)
skyish |= (v > 228) & (sat < 0.12)                         # haze and clouds near the horizon
skyish &= (ys < 540) | (v > 212)                           # the distant blue hills are land, not sky
skyish = cv2.morphologyEx(skyish.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab = cv2.connectedComponents(skyish)
top = set(np.unique(lab[0:3, :])) - {0}
sky = np.isin(lab, list(top)).astype(np.uint8)
sky = cv2.morphologyEx(sky, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
# soft edge: how sky-like each edge pixel's colour is
edge_band = cv2.dilate(sky, np.ones((5, 5), np.uint8)) - cv2.erode(sky, np.ones((3, 3), np.uint8))
sky_soft = sky.astype(np.float32)
sky_soft = np.where(edge_band > 0, cv2.GaussianBlur(sky_soft, (0, 0), 1.0), sky_soft)
land_a = 1 - sky_soft
# sunlit leaves against the bright sky come out half-transparent and read as haze; up in the
# treetops every pixel is either leaf or sky (crisp, with a one-pixel soft edge)
crisp = smoothstep(0.5, 0.78, land_a)
land_a = np.where(ys < 470, cv2.GaussianBlur(crisp.astype(np.float32), (0, 0), 0.6), land_a)

# ---------------------------------------------------------------- 3. the near layers (GrabCut)
print("separating the foreground…")


def grab(fg_boxes, bg_boxes, pr_fg_box):
    m = np.full((H, W), cv2.GC_BGD, np.uint8)
    x0, y0, x1, y1 = pr_fg_box
    m[y0:y1, x0:x1] = cv2.GC_PR_FGD
    for (x0, y0, x1, y1) in bg_boxes:
        m[y0:y1, x0:x1] = cv2.GC_BGD
    for (x0, y0, x1, y1) in fg_boxes:
        m[y0:y1, x0:x1] = cv2.GC_FGD
    m[sky > 0] = cv2.GC_BGD
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(clean, m, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    mm = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    mm = cv2.morphologyEx(mm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    nn, ll, st, _ = cv2.connectedComponentsWithStats(mm)
    keep = np.zeros(nn, bool)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] > 1500
    return keep[ll].astype(np.uint8)


near_l = grab(
    fg_boxes=[(0, 660, 430, H), (10, 380, 170, 600), (0, 0, 120, 120), (440, 760, 560, 840)],
    bg_boxes=[(600, 600, W, H), (430, 590, 600, 700), (200, 540, 440, 640)],
    pr_fg_box=(0, 0, 610, H),
)
near_r = grab(
    fg_boxes=[(1400, 160, W, H), (1120, 230, 1250, 640), (1230, 640, 1320, 820), (1500, 0, W, 120)],
    bg_boxes=[(0, 0, 1080, H), (1080, 590, 1120, H), (1080, 760, 1300, H)],
    pr_fg_box=(1080, 0, W, H),
)
# soft edges, decontaminated against whatever is behind (sky above the skyline)
near_l_a = cv2.GaussianBlur(near_l.astype(np.float32), (0, 0), 0.9) * land_a
near_r_a = cv2.GaussianBlur(near_r.astype(np.float32), (0, 0), 0.9) * land_a

# ---------------------------------------------------------------- 4. the far layer, filled behind
print("filling behind the foreground…")
# (generous margin, so the fill is drawn from clean lawn and hills, not the flowers' own edges)
behind = cv2.dilate(np.maximum(near_l, near_r), np.ones((15, 15), np.uint8))
k = 0.5
small = cv2.resize(clean, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
hole = cv2.resize(behind * 255, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
filled = cv2.inpaint(small, hole, 9, cv2.INPAINT_TELEA)
filled = cv2.resize(filled, (W, H), interpolation=cv2.INTER_CUBIC)
wb = cv2.GaussianBlur(behind.astype(np.float32), (0, 0), 2)[..., None]
far = np.clip(clean * (1 - wb) + filled * wb, 0, 255).astype(np.uint8)
# behind the foreground, only what lies below the horizon is land; above it is open sky, so a
# near layer that settles from below uncovers real sky around its treetops, never a smear
behind_land = cv2.GaussianBlur(behind.astype(np.float32), (0, 0), 2) * smoothstep(HORIZON - 20, HORIZON + 20, ys)
far_a = np.where(behind > 0, behind_land, land_a)
far_a = np.clip(far_a, 0, 1)

# ---------------------------------------------------------------- 5. the sky plate
print("continuing the sky…")
CH = H + EXTRA
# a clean model of the sky from its open middle (x 380-1050, above the hills): one colour per
# row, a gentle left-to-right tilt, carried upward (deepening at its own rate) and downward
# (horizon haze). The corners behind the foliage use the model, never the leaves' colours.
X0, X1, YT = 380, 1050, 575
mid = f[0:YT, X0:X1]
mid_sky = sky[0:YT, X0:X1] > 0
prof = np.array([np.median(mid[y][mid_sky[y]], axis=0) if mid_sky[y].sum() > 40 else np.full(3, np.nan) for y in range(YT)])
good = ~np.isnan(prof[:, 0])
prof = np.stack([np.interp(np.arange(YT), np.where(good)[0], prof[good, c]) for c in range(3)], 1)
prof = cv2.GaussianBlur(prof[:, None, :].astype(np.float32), (0, 0), sigmaX=0.1, sigmaY=8)[:, 0, :]
tilt = (np.median(f[20:200, 900:1050][sky[20:200, 900:1050] > 0], axis=0) -
        np.median(f[20:200, 380:530][sky[20:200, 380:530] > 0], axis=0)) / 520.0     # per px in x
slope_up = (prof[0:12].mean(0) - prof[120:132].mean(0)) / 120.0
rows = np.zeros((CH, 3), np.float32)
up = np.arange(EXTRA, 0, -1, dtype=np.float32)[:, None]
rows[:EXTRA] = prof[0] + slope_up * up * (1 - 0.4 * up / EXTRA)
rows[EXTRA:EXTRA + YT] = prof
rows[EXTRA + YT:] = prof[-1]
xc = (np.arange(W, dtype=np.float32) - (X0 + X1) / 2)
xt = np.clip(xc, -700, 700)[:, None]                                   # the tilt flattens past the corners
plate = rows[:, None, :] + (tilt[None, :] * xt)[None, :, :]
# the real sky (with its soft clouds) wherever it is open sky in the middle of the photo
real = cv2.erode(sky, np.ones((5, 5), np.uint8)).astype(np.float32)
real *= (xs < 1080) * (xs > 260) * (ys < YT)
real = cv2.GaussianBlur(real, (0, 0), 24)[..., None]
plate[EXTRA:] = plate[EXTRA:] * (1 - real) + f * real
plate = np.clip(plate, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- write
def noise1d(n, scale, seed):
    rng = np.random.default_rng(seed)
    out = np.zeros(n, np.float32)
    amp = 1.0
    for o in range(4):
        step = max(4, int(scale / 2 ** o))
        pts = rng.random(n // step + 3).astype(np.float32)
        out += amp * np.interp(np.arange(n) / step, np.arange(len(pts)), pts)
        amp *= 0.5
    return (out - out.min()) / max(out.max() - out.min(), 1e-6)


def on_canvas(bgr, alpha, grow_up=0):
    """Places a layer on the tall canvas. With grow_up, foliage cut by the photo's top edge
    continues upward (its top band mirrored) and ends in an uneven, crisp, leafy outline. Only
    phones ever see this (wide screens show the photo from its top edge)."""
    c = np.zeros((CH, W, 3), np.uint8)
    a = np.zeros((CH, W), np.float32)
    c[EXTRA:], a[EXTRA:] = bgr, alpha
    if grow_up:
        M = grow_up
        c[EXTRA - M:EXTRA] = bgr[M - 1::-1]
        band_a = alpha[M - 1::-1].astype(np.float32).copy()
        u = np.arange(M, 0, -1, dtype=np.float32)[:, None]                  # distance above the seam
        reach = M * (0.35 + 0.65 * cv2.GaussianBlur(noise1d(W, 160, 7)[None], (0, 0), sigmaX=25, sigmaY=0)[0])
        rng = np.random.default_rng(3)
        n2d = sum(cv2.resize(rng.random((M // s_ + 2, W // s_ + 2)).astype(np.float32), (W, M), interpolation=cv2.INTER_CUBIC) * w_
                  for s_, w_ in [(24, 0.6), (10, 0.4)])
        edge = reach[None, :] + (n2d - 0.5) * 70
        band_a *= 1 - smoothstep(edge - 5, edge + 2, u)
        # keep only foliage that grows out of the trees below, so nothing floats in the sky
        solid = (band_a > 0.5).astype(np.uint8)
        nn, ll = cv2.connectedComponents(solid, connectivity=8)
        rooted = np.isin(ll, list(set(np.unique(ll[-3:, :])) - {0}))
        near_root = cv2.dilate(rooted.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        band_a *= rooted | ((band_a <= 0.5) & near_root)
        a[EXTRA - M:EXTRA] = band_a
    return c, a


def save(name, bgr, alpha=None, quality=88):
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    if alpha is not None:
        im.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)))
    base = os.path.join(OUT, name)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=quality - 14)
    print(f"  {name:15s} {im.width}x{im.height}  webp {os.path.getsize(base + '.webp') // 1024} KB")


# the wisteria hangs from the photo's top edge: it belongs to the static far layer (with its
# true colours), so no settling layer ever drags its cut top edge into view
wist = np.zeros((H, W), np.float32)
wist[:330, :330] = 1
wist = cv2.GaussianBlur(wist, (0, 0), 4)
far = (far * (1 - wist[..., None]) + clean * wist[..., None]).astype(np.uint8)
far_a = far_a * (1 - wist) + land_a * wist
near_l_a *= 1 - wist

save("welcome-sky", plate, quality=86)
save("welcome-far", *on_canvas(far, far_a, grow_up=180))
save("welcome-near-l", *on_canvas(clean, near_l_a))
save("welcome-near-r", *on_canvas(clean, near_r_a, grow_up=180))

if DEBUG:
    os.makedirs(DEBUG, exist_ok=True)
    cv2.imwrite(os.path.join(DEBUG, "clean.jpg"), clean)
    for name, a in [("far", far_a), ("near-l", near_l_a), ("near-r", near_r_a)]:
        src = far if name == "far" else clean
        mag = np.zeros_like(src)
        mag[:] = (255, 0, 255)
        cv2.imwrite(os.path.join(DEBUG, f"{name}.jpg"), (src * a[..., None] + mag * (1 - a[..., None])).astype(np.uint8))
    cv2.imwrite(os.path.join(DEBUG, "sky.jpg"), plate)
print("done")
