"""Decomposes the opening reference (assets-src/ref-opening.webp) into the
separate parallax layers used by the hero scene, plus procedural sky clouds and
distant hills. Writes WebP + AVIF and a manifest to public/scenes/hero/.

    python3 tools/build_layers.py                  # build layers
    python3 tools/build_layers.py --debug DIR      # also write inspection composites
    python3 tools/build_layers.py --export-cuts DIR  # also write the full-size cuts as PNGs:
                                                     # the template for hand-cut layers (import_layers.py)

Layer geometry is expressed on a "wide canvas": the 941 x 1672 source with
EXT px of mirrored garden added on each side, so desktop screens never see an
edge. See docs/OPENING-SCREEN-PLAN.md for the hole-safety rules these cuts obey.
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

import layerlib as lib
from layerlib import band, fbm, make_cloud, make_hills, smoothstep

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "ref-opening.webp")
OUT = os.path.join(ROOT, "public", "scenes", "hero")
EXT = 420  # mirrored extension each side (source px)
RNG = np.random.default_rng(15082027)

EXPORT = sys.argv[sys.argv.index("--export-cuts") + 1] if "--export-cuts" in sys.argv else None

DEBUG = None
if "--debug" in sys.argv:
    DEBUG = sys.argv[sys.argv.index("--debug") + 1]
    os.makedirs(DEBUG, exist_ok=True)


# ---------------------------------------------------------------- helpers
def poly(shape, pts, feather=0):
    m = np.zeros(shape[:2], np.float32)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1.0)
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


def inpaint(rgb, alpha, hole, radius=9):
    """Fill `hole` (bool) in both colour and alpha so moving layers stay solid."""
    m = (hole * 255).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=1)
    small = 0.5
    rs = cv2.resize(rgb, None, fx=small, fy=small, interpolation=cv2.INTER_AREA)
    ms = cv2.resize(m, None, fx=small, fy=small, interpolation=cv2.INTER_NEAREST)
    a8 = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    as_ = cv2.resize(a8, None, fx=small, fy=small, interpolation=cv2.INTER_AREA)
    fr = cv2.inpaint(rs, ms, radius, cv2.INPAINT_TELEA)
    fa = cv2.inpaint(as_, ms, radius, cv2.INPAINT_TELEA)
    fr = cv2.resize(fr, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
    fa = cv2.resize(fa, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
    # keep a little grain inside the fill so it does not read as a smear
    grain = RNG.normal(0, 3.0, fr.shape).astype(np.float32)
    fr = np.clip(fr.astype(np.float32) + grain, 0, 255).astype(np.uint8)
    w = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 2)[..., None]
    out = (rgb * (1 - w) + fr * w).astype(np.uint8)
    out_a = alpha * (1 - w[..., 0]) + (fa.astype(np.float32) / 255) * w[..., 0]
    return out, out_a


SKIP = 52   # edge vine strip (pergola post) is not repeated
REAL = 150  # outer columns of the source that are real garden (not behind the couple)


def mirror_extend(rgb, alpha, left=True, right=True, skip=None):
    return lib.mirror_extend(rgb, alpha, EXT, SKIP if skip is None else skip, REAL, left, right)


def pad_wide(rgb, alpha):
    return lib.pad_wide(rgb, alpha, EXT)


MANIFEST = {"canvas": {"w": 0, "h": 0, "ext": EXT, "srcW": 0}, "layers": {}}


def save_layer(name, rgb, alpha, quality=86, offset=(0, 0), scale=1.0):
    """Crops to the alpha bounding box, writes webp+avif, records geometry."""
    a = np.clip(alpha, 0, 1)
    ys, xs = np.where(a > 0.004)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop = rgb[y0:y1, x0:x1]
    ca = (a[y0:y1, x0:x1] * 255).astype(np.uint8)
    im = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    im.putalpha(Image.fromarray(ca))
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    base = os.path.join(OUT, name)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=max(quality - 26, 45))
    MANIFEST["layers"][name] = {
        "x": int(x0 + offset[0]), "y": int(y0 + offset[1]),
        "w": int(x1 - x0), "h": int(y1 - y0),
    }
    kb = os.path.getsize(base + ".webp") // 1024
    print(f"  {name:14s} {x1-x0:5d}x{y1-y0:<5d} at ({x0+offset[0]},{y0+offset[1]})  webp {kb} KB")


def decontaminate(rgb, alpha, sky):
    """Remove the pale reference sky from semi-transparent edge pixels."""
    a = np.clip(alpha, 0, 1)[..., None]
    c = rgb.astype(np.float32)
    f = (c - (1 - a) * sky) / np.maximum(a, 0.08)
    f = np.where(a > 0.98, c, f)
    return np.clip(f, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- source
img = cv2.cvtColor(np.array(Image.open(SRC).convert("RGB")), cv2.COLOR_RGB2BGR)
H, W = img.shape[:2]
MANIFEST["canvas"] = {"w": W + 2 * EXT, "h": H, "ext": EXT, "srcW": W}
f32 = img.astype(np.float32)
b, g, r = f32[..., 0], f32[..., 1], f32[..., 2]
vmax = np.maximum(np.maximum(r, g), b)
vmin = np.minimum(np.minimum(r, g), b)
sat = (vmax - vmin) / np.maximum(vmax, 1)

# Gold lettering baked into the reference sky + "SCROLL TO EXPLORE" on the path.
gold = ((r - b) > 14) & (r >= g - 12)
text_mask = np.zeros((H, W), bool)
text_mask[176:792, 280:668] = gold[176:792, 280:668] | (vmax[176:792, 280:668] < 205)
text_mask[1562:1660, 360:585] = (vmax[1562:1660, 360:585] < 200)
tm = cv2.dilate(text_mask.astype(np.uint8) * 255, np.ones((5, 5), np.uint8), iterations=2)
clean = cv2.inpaint(img, tm, 7, cv2.INPAINT_TELEA)

# ---------------------------------------------------------------- sky field
confident = (b >= r + 4) & (sat < 0.16) & (vmax > 200)
confident[176:760, 280:668] = False
haze = (vmin > 236) & (sat < 0.05)              # bright haze near the horizon
confident[760:1000] |= haze[760:1000]
sky_row = np.zeros((H, 3), np.float32)
last = np.array([245, 246, 248], np.float32)
for y in range(H):
    m = confident[y]
    if y < 1000 and m.sum() > 12:
        last = np.median(clean[y][m].astype(np.float32), axis=0)
    sky_row[y] = last
k = 31
sky_row = np.stack([np.convolve(np.pad(sky_row[:, c], k, mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), "same")[k:-k] for c in range(3)], 1)
SKY = np.repeat(sky_row[:, None, :], W, axis=1)

dist = np.linalg.norm(clean.astype(np.float32) - SKY, axis=2)
fg = smoothstep(9, 40, dist)
# below the horizon nothing is sky
fg[1130:] = 1.0
# the lettering box is pure sky
fg[176:760, 280:655] = 0
fg[176:792, 280:668] = np.where(text_mask[176:792, 280:668], 0, fg[176:792, 280:668])
# soft white clouds belong to the sky, not to the foliage
cloudy = smoothstep(222, 238, vmin) * (1 - smoothstep(0.05, 0.10, sat))
cloudy[835:] = 0
haze_band = smoothstep(232, 242, vmin) * (1 - smoothstep(0.04, 0.08, sat))
haze_band[:835] = 0
haze_band[885:] = 0
haze_band[:, :300] = 0
haze_band[:, 570:] = 0
cloudy = np.maximum(cloudy, haze_band)
fg = fg * (1 - cloudy)
fg[700:795, 360:600] = np.minimum(fg[700:795, 360:600], smoothstep(780, 800, np.arange(700, 795, dtype=np.float32))[:, None])
fg = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.8)
rgbd = decontaminate(clean, fg, SKY)

# ---------------------------------------------------------------- couple
print("segmenting couple…")
gc = np.full((H, W), cv2.GC_BGD, np.uint8)
gc[785:1522, 25:936] = cv2.GC_PR_BGD
gc[790:1515, 40:930] = cv2.GC_PR_FGD
for (x0, y0, x1, y1) in [(250, 850, 320, 920), (260, 990, 350, 1400), (612, 915, 668, 975),
                         (600, 1050, 720, 1230), (440, 1300, 860, 1470), (60, 1280, 110, 1450),
                         (310, 1260, 430, 1430), (440, 1000, 510, 1220)]:
    gc[y0:y1, x0:x1] = cv2.GC_FGD
for (x0, y0, x1, y1) in [(0, 0, W, 790), (360, 800, 560, 880), (0, 1100, 30, 1230), (905, 1050, W, 1230),
                         (120, 1525, 900, H), (0, 1060, 120, 1200), (790, 1040, 900, 1080)]:
    gc[y0:y1, x0:x1] = cv2.GC_BGD
# colour prior: foliage, lawn and stone walls are never part of the couple
green = (g - r > 22) & (g > b + 6)
stone = (sat < 0.10) & (vmax < 175)
prior_bg = cv2.morphologyEx((green | stone).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
seed_fg = gc == cv2.GC_FGD
gc[prior_bg & ~seed_fg & (np.arange(H)[:, None] < 1300)] = cv2.GC_BGD
bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(clean, gc, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
cm = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(cm)
big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
cm = (lab == big).astype(np.uint8)
# the kalgi plume is pale against the sky, so GrabCut drops it; recover it by warmth
plume_box = np.zeros((H, W), bool)
plume_box[786:852, 262:338] = True
plume = plume_box & ((r - b) > 12) & (vmax > 140)
plume = cv2.morphologyEx(plume.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
cm = np.maximum(cm, plume)
# fill interior holes (lace, gaps fully enclosed by the silhouette)
cnts, _ = cv2.findContours(cm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
filled = np.zeros_like(cm)
cv2.drawContours(filled, cnts, -1, 1, -1)
cm = cv2.morphologyEx(filled, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
couple_a = cv2.GaussianBlur(cm.astype(np.float32), (0, 0), 1.1)
couple_hard = cm.astype(bool)

# ---------------------------------------------------------------- blooms
def grab_bloom(rect, fg_boxes, bg_boxes):
    m = np.full((H, W), cv2.GC_BGD, np.uint8)
    x0, y0, x1, y1 = rect
    m[y0:y1, x0:x1] = cv2.GC_PR_FGD
    for bx in fg_boxes:
        m[bx[1]:bx[3], bx[0]:bx[2]] = cv2.GC_FGD
    for bx in bg_boxes:
        m[bx[1]:bx[3], bx[0]:bx[2]] = cv2.GC_BGD
    # pale petal path is background
    pale = (vmin > 200) & (sat < 0.12)
    m[(m == cv2.GC_PR_FGD) & pale] = cv2.GC_PR_BGD
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(clean, m, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    mm = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    mm = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    mm = cv2.morphologyEx(mm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    mm[couple_hard] = 0
    return cv2.GaussianBlur(mm.astype(np.float32), (0, 0), 1.4)


print("segmenting blooms…")
bloom_l = grab_bloom((0, 1395, 320, H), [(0, 1450, 80, H), (0, 1600, 250, H)], [(140, 1500, 340, 1580)])
bloom_r = grab_bloom((660, 1330, W, H), [(860, 1440, W, H), (720, 1600, W, H)], [(640, 1500, 720, 1580)])

# ---------------------------------------------------------------- frames
frame_l_poly = [(0, 0), (425, 0), (425, 190), (262, 232), (252, 470), (172, 525), (152, 585),
                (100, 572), (58, 478), (0, 452)]
frame_r_poly = [(452, 0), (W, 0), (W, 462), (868, 470), (800, 452), (790, 342), (615, 322),
                (600, 176), (452, 170)]
frame_l = poly(img.shape, frame_l_poly, 10) * fg
frame_r = poly(img.shape, frame_r_poly, 10) * fg
leaf = ((g > 135) & (r > 95) & (b < g - 28)).astype(np.float32)
leaf = cv2.morphologyEx(leaf, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
leaf = cv2.GaussianBlur(leaf, (0, 0), 1.2)
edge_l = poly(img.shape, [(0, 440), (52, 440), (52, 1120), (0, 1120)], 6)
edge_r = poly(img.shape, [(895, 440), (W, 440), (W, 1120), (895, 1120)], 6)
# (edge vines stay with the cypress rows: they read as the pergola posts)
frames = np.maximum(frame_l, frame_r)

# ---------------------------------------------------------------- depth bands
cols = W
ys = np.arange(H, dtype=np.float32)
# far avenue (distant hills, tree line, centre lawn)
far_x = band(cols, 262, 312, 548, 598)
far_y = band(H, 770, 790, 1255, 1300)
far = fg * far_x[None, :] * far_y[:, None]
# cypress rows (extend 90 px below the near-ground seam)
cyp_y = band(H, 400, 420, 1310, 1345)
cyp_l = fg * (1 - smoothstep(282, 318, np.arange(cols, dtype=np.float32)))[None, :] * cyp_y[:, None]
cyp_r = fg * smoothstep(538, 574, np.arange(cols, dtype=np.float32))[None, :] * cyp_y[:, None]
# near ground
ground_a = smoothstep(1232, 1290, ys)[:, None].repeat(W, 1)

# ---------------------------------------------------------------- fills
print("filling hidden regions…")
hole_couple = cv2.dilate(couple_hard.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)

far_rgb, far_a = inpaint(rgbd, far, hole_couple & (far_y[:, None] > 0) & (far_x[None, :] > 0))
cl_rgb, cl_a = inpaint(rgbd, cyp_l, (hole_couple | (frame_l > 0.15)) & (cyp_y[:, None] > 0) & (np.arange(W)[None, :] < 330))
cr_rgb, cr_a = inpaint(rgbd, cyp_r, (hole_couple | (frame_r > 0.15)) & (cyp_y[:, None] > 0) & (np.arange(W)[None, :] > 520))
# where the frame owned the pixel, the cypress keeps only what the inpaint rebuilt behind it
cl_a = np.where(frame_l > 0.15, np.minimum(cl_a, 1.0), cl_a)
cr_a = np.where(frame_r > 0.15, np.minimum(cr_a, 1.0), cr_a)

# ground: path texture under the blooms, inpaint under the couple
g_rgb = clean.copy()
# lawn colour from the visible slivers at both edges; path colour from the centre
lawn_px = clean[1060:1240, 410:560].reshape(-1, 3).astype(np.float32)
lawn_px = lawn_px[(lawn_px[:, 1] > lawn_px[:, 0] + 50) & (lawn_px[:, 1] > lawn_px[:, 2] - 15)]  # BGR
lawn_c = np.median(lawn_px, axis=0) * 0.93
tex_l = fbm(H, W, 5, base=18, seed=5)[..., None]
lawn = lawn_c * (0.86 + 0.24 * tex_l) * (1.0 - 0.10 * smoothstep(1230, 1470, ys))[:, None, None]
path_rows0 = np.median(clean[1535:H, 300:660].astype(np.float32), axis=1)
path_c = np.median(path_rows0, axis=0)
path = path_c * (0.97 + 0.05 * fbm(H, W, 4, base=10, seed=9)[..., None])
t_path = smoothstep(1445, 1500, ys)[:, None, None]
synth_ground = lawn * (1 - t_path) + path * t_path
real = np.zeros((H, W), np.float32)
real[1490:H, 150:800] = 1.0      # real petal path between the flowers
real = cv2.GaussianBlur(real, (0, 0), 14) * (1 - couple_a)
g_rgb = np.clip(clean * real[..., None] + synth_ground * (1 - real[..., None]), 0, 255).astype(np.uint8)
ground_a = smoothstep(1232, 1290, ys)[:, None].repeat(W, 1)
under_bloom = np.maximum(bloom_l, bloom_r) > 0.02
under_bloom = cv2.dilate(under_bloom.astype(np.uint8), np.ones((29, 29), np.uint8)).astype(bool)
# synthesise plain pale stone path under the flowers (row colour + grain)
path_rows = np.median(clean[:, 300:660].astype(np.float32), axis=1)
path_rows[:1535] = path_rows[1535]
synth = np.repeat(path_rows[:, None, :], W, axis=1) + RNG.normal(0, 3.5, (H, W, 3))
synth = cv2.GaussianBlur(synth.astype(np.float32), (0, 0), 1.2)
pathy = under_bloom & (ys[:, None] >= 1470)
wpath = cv2.GaussianBlur(pathy.astype(np.float32), (0, 0), 5)[..., None]
g_rgb = np.clip(g_rgb * (1 - wpath) + synth * wpath, 0, 255).astype(np.uint8)

# couple colour (no sky contamination below 785)
couple_rgb = clean.copy()

# ---------------------------------------------------------------- write
os.makedirs(OUT, exist_ok=True)
print("writing layers…")
hills_rgb, hills_a = make_hills(W + 2 * EXT, 320)
save_layer("hills", hills_rgb, hills_a, quality=80, offset=(0, 760))

wf_rgb, wf_a = pad_wide(far_rgb, far_a)
save_layer("far", wf_rgb, wf_a, quality=84)

l_rgb, l_a = mirror_extend(cl_rgb, cl_a, left=True, right=False)
save_layer("cypress-l", l_rgb, l_a, quality=84)
r_rgb, r_a = mirror_extend(cr_rgb, cr_a, left=False, right=True)
save_layer("cypress-r", r_rgb, r_a, quality=84)

gw_rgb, gw_a = mirror_extend(g_rgb, ground_a)
save_layer("ground", gw_rgb, gw_a, quality=84)

c_rgb, c_a = pad_wide(couple_rgb, couple_a)
save_layer("couple", c_rgb, c_a, quality=88)

# frames and flowers continue past the source edge as softened garden too
fl_rgb, fl_a = mirror_extend(rgbd, frame_l, left=True, right=False, skip=0)
save_layer("frame-l", fl_rgb, fl_a, quality=84)
fr_rgb, fr_a = mirror_extend(rgbd, frame_r, left=False, right=True, skip=0)
save_layer("frame-r", fr_rgb, fr_a, quality=84)
bl_rgb, bl_a = mirror_extend(clean, bloom_l, left=True, right=False, skip=0)
save_layer("bloom-l", bl_rgb, bl_a, quality=84)
br_rgb, br_a = mirror_extend(clean, bloom_r, left=False, right=True, skip=0)
save_layer("bloom-r", br_rgb, br_a, quality=84)
# very-near bokeh copies for the desktop screen corners (pre-blurred, never CSS-blurred)
for name, a_ in [("bloom-l", bloom_l), ("bloom-r", bloom_r)]:
    bl = cv2.GaussianBlur(clean, (0, 0), 2.6)
    ba = cv2.GaussianBlur(a_, (0, 0), 2.6)
    save_layer(name + "-near", np.ascontiguousarray(np.flip(bl, 1)), np.ascontiguousarray(np.flip(ba, 1)), quality=80)

for i, (cw, ch, seed) in enumerate([(520, 170, 11), (380, 120, 23), (300, 96, 37)]):
    crgb, ca = make_cloud(cw, ch, seed)
    save_layer(f"cloud-{i+1}", crgb, ca, quality=78)

# trees only (no lawn, nothing that sat behind the couple) for decorative reuse
xs_ = np.arange(W, dtype=np.float32)
base_fade = (1 - smoothstep(985, 1065, ys))[:, None]
save_layer("trees-l", cl_rgb, cl_a * base_fade * (1 - smoothstep(188, 214, xs_))[None, :], quality=84)
save_layer("trees-r", cr_rgb, cr_a * base_fade * smoothstep(796, 822, xs_)[None, :], quality=84)

# loose wisteria racemes (with their leaves) for the other sections
for i, (x0, y0, x1, y1, src_a) in enumerate([(712, 0, 812, 312, frame_r), (30, 10, 170, 340, frame_l), (160, 318, 228, 452, frame_l)]):
    pink = smoothstep(0.05, 0.25, (r - g) / np.maximum(vmax, 1))   # the racemes, not the leaves
    pink = cv2.GaussianBlur(cv2.dilate(pink.astype(np.float32), np.ones((9, 9), np.uint8)), (0, 0), 3)
    a = src_a * np.clip(pink * 1.4, 0, 1)
    a = a * band(W, x0, x0 + 12, x1 - 12, x1)[None, :] * band(H, y0, y0 + 26, y1 - 6, y1)[:, None]
    save_layer(f"wisteria-{i+1}", rgbd, a, quality=84)

# text-free full frame: reduced-motion fallback + social preview
fb = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB))
fb.save(os.path.join(OUT, "fallback.webp"), quality=84, method=6)
fb.save(os.path.join(OUT, "fallback.avif"), quality=60)
MANIFEST["sky"] = [[int(y), [int(v) for v in sky_row[y][::-1]]] for y in range(0, 1000, 100)]
# where the couple meets the path (they grow around it) and the title's top, for the hero script
MANIFEST["anchors"] = {"contact": {"x": EXT + 470, "y": 1500}, "titleTop": round(176 / W, 4)}
# a single resolution: drop any phone-sized set left by import_layers.py
mobile_dir = os.path.join(OUT, "m")
if os.path.isdir(mobile_dir):
    for f in os.listdir(mobile_dir):
        os.remove(os.path.join(mobile_dir, f))
    os.rmdir(mobile_dir)
MANIFEST["version"] = lib.content_version(OUT)
with open(os.path.join(OUT, "manifest.json"), "w") as fh:
    json.dump(MANIFEST, fh, indent=2)
print("manifest written")

# ---------------------------------------------------------------- full-size cuts (template for hand-cut layers)
if EXPORT:
    os.makedirs(EXPORT, exist_ok=True)
    for name, rgb_, a_ in [("far", far_rgb, far_a), ("cypress-l", cl_rgb, cl_a), ("cypress-r", cr_rgb, cr_a),
                           ("ground", g_rgb, ground_a), ("couple", couple_rgb, couple_a),
                           ("bloom-l", clean, bloom_l), ("bloom-r", clean, bloom_r),
                           ("frame-l", rgbd, frame_l), ("frame-r", rgbd, frame_r)]:
        im = Image.fromarray(cv2.cvtColor(rgb_, cv2.COLOR_BGR2RGB))
        im.putalpha(Image.fromarray((np.clip(a_, 0, 1) * 255).astype(np.uint8)))
        im.save(os.path.join(EXPORT, f"{name}.png"))
    Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)).save(os.path.join(EXPORT, "master.png"))
    print(f"full-size cuts written to {EXPORT}")

# ---------------------------------------------------------------- debug composites
if DEBUG:
    def over(dst, rgb, a):
        a = np.clip(a, 0, 1)[..., None]
        return (dst * (1 - a) + rgb * a).astype(np.uint8)

    canvas = np.zeros((H, W, 3), np.uint8)
    canvas[:] = (255, 0, 255)
    for (rgb_, a_) in [(far_rgb, far_a), (cl_rgb, cl_a), (cr_rgb, cr_a), (g_rgb, ground_a)]:
        canvas = over(canvas, rgb_, a_)
    cv2.imwrite(os.path.join(DEBUG, "bg_no_couple.jpg"), canvas)
    ck = np.zeros_like(img); ck[:] = (255, 0, 255)
    cv2.imwrite(os.path.join(DEBUG, "couple.jpg"), over(ck, couple_rgb, couple_a))
    ck[:] = (255, 0, 255)
    for (rgb_, a_) in [(rgbd, frame_l), (rgbd, frame_r), (clean, bloom_l), (clean, bloom_r)]:
        ck = over(ck, rgb_, a_)
    cv2.imwrite(os.path.join(DEBUG, "front.jpg"), ck)
    sky = np.zeros_like(img)
    sky[:] = (235, 205, 150)
    full = sky.copy()
    for (rgb_, a_) in [(far_rgb, far_a), (cl_rgb, cl_a), (cr_rgb, cr_a), (g_rgb, ground_a), (couple_rgb, couple_a),
                       (clean, bloom_l), (clean, bloom_r), (rgbd, frame_l), (rgbd, frame_r)]:
        full = over(full, rgb_, a_)
    cv2.imwrite(os.path.join(DEBUG, "recomposed.jpg"), full)
