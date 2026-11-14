"""The floral arch in the opening scene (src/scenes/hero/Hero.tsx, src/scenes/hero/Arch.tsx).

  assets-src/arch/ref-arch.webp   a Hindu wedding arch in a Tuscan garden: roses, jasmine strands,
                                  hydrangeas and brass bells, with brass urns and a bowl of petals

The arch is lifted off its garden (it stands in the opening scene's own cypress avenue), and cut
into the pieces that move at their own depths:

  public/assets/arch/ring.webp    the arch itself, with the flowers, urns and bowl at its feet
  public/assets/arch/hang.webp    the jasmine strands and brass bells hanging inside it
  public/assets/arch/opening.png  the shape of its opening (a mask): the couple's photograph is
                                  shown through it, behind the arch, so it never covers a flower
  public/assets/arch/backdrop.webp  the garden seen through the arch (the hedge, the lawn and the
                                  hills with the villa), with no arch: it closes the far end of the
                                  opening scene's cypress avenue, behind the arch
  public/assets/arch/arch.json    the sizes, and where the opening is

    python3 tools/build_arch.py
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "arch", "ref-arch.webp")
OUT = os.path.join(ROOT, "public", "assets", "arch")
DEBUG = os.environ.get("ARCH_DEBUG")
os.makedirs(OUT, exist_ok=True)

rgb = np.array(Image.open(SRC).convert("RGB"))
H, W = rgb.shape[:2]
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.int32)
hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]

FLOOR = 868        # where the arch's feet meet the stone floor (photo px)
CX = 830           # the middle of the opening


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m.astype(bool)


def stroke(pts, width):
    m = np.zeros((H, W), np.uint8)
    cv2.polylines(m, [np.array(pts, np.int32)], False, 1, width)
    return m.astype(bool)


# ------------------------------------------------------------------ what is surely not the arch
sky = (hh >= 92) & (hh <= 125) & (ss >= 20) & (vv >= 150)
# (the clouds: pale, colourless, high up and next to the sky)
cloud = (ss < 40) & (vv > 200) & (np.arange(H)[:, None] < 520)
cloud &= cv2.dilate(sky.astype(np.uint8), np.ones((25, 25), np.uint8)).astype(bool)
sky |= cloud
# the garden seen through the arch: the hills, the hedge of hydrangeas and the lawn
through = poly([(565, 470), (1105, 470), (1110, 860), (560, 860)])
# the cypresses, bushes and stone pillars either side, and the branches overhead
left_out = poly([(0, 0), (300, 0), (380, 90), (300, 200), (215, 300), (195, 480), (180, 650), (110, 690), (0, 700)])
right_out = poly([(1320, 0), (W, 0), (W, H), (1560, H), (1545, 790), (1490, 700), (1465, 560), (1450, 420), (1400, 300), (1330, 170), (1300, 80)])
# (the stone pillar and the bushes beside the arch's left foot, and the hedge's blurred
# hydrangeas beside its right foot)
pillar_l = poly([(0, 620), (150, 630), (140, 690), (120, 725), (60, 765), (22, 790), (22, H), (0, H)])
hedge_r = poly([(1105, 600), (1150, 600), (1152, 690), (1135, 765), (1105, 770)])
top_left_branch = poly([(0, 0), (430, 0), (430, 60), (330, 120), (250, 250), (0, 260)])
floor = np.zeros((H, W), bool)
floor[FLOOR + 30:, :] = True
sure_bg = sky | through | left_out | right_out | top_left_branch | floor | pillar_l | hedge_r

# ------------------------------------------------------------------ what is surely the arch
ring_line = [(355, 820), (345, 700), (330, 600), (325, 500), (340, 400), (375, 305), (430, 225), (510, 155),
             (610, 108), (730, 75), (860, 58), (985, 72), (1095, 105), (1185, 155), (1245, 235), (1285, 330),
             (1305, 430), (1315, 530), (1320, 640), (1320, 740), (1330, 830)]
sure_fg = stroke(ring_line, 34)
# the flowers, the bowl and the urns at its feet
sure_fg |= poly([(235, 690), (380, 690), (385, 790), (230, 790)])
sure_fg |= poly([(150, 835), (295, 835), (290, 885), (155, 885)])
sure_fg |= poly([(1300, 790), (1480, 790), (1475, 880), (1305, 880)])
sure_fg |= poly([(1190, 640), (1290, 640), (1290, 760), (1190, 760)])
# the jasmine strands and the bells
for s in [[(452, 330), (455, 510)], [(520, 300), (522, 400)], [(578, 245), (578, 325)], [(895, 150), (895, 225)],
          [(1065, 215), (1065, 285)], [(1128, 170), (1128, 340)], [(1190, 180), (1200, 470)], [(1245, 300), (1245, 600)]]:
    sure_fg |= stroke(s, 12)
sure_fg &= ~(sky & ~stroke(ring_line, 10))

mask = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
# near the arch's line it is probably the arch
near = cv2.dilate(stroke(ring_line, 120).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
mask[near] = cv2.GC_PR_FGD
mask[poly([(20, 700), (560, 700), (560, FLOOR + 30), (20, FLOOR + 30)])] = cv2.GC_PR_FGD
mask[poly([(1110, 600), (1520, 600), (1520, FLOOR + 30), (1110, FLOOR + 30)])] = cv2.GC_PR_FGD
mask[sure_bg] = cv2.GC_BGD
mask[sure_fg] = cv2.GC_FGD

bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
# the arch is one piece: crumbs of hedge that came along with it go
n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
keep = np.zeros_like(fg)
for k in range(1, n):
    if st[k, cv2.CC_STAT_AREA] > 4000:
        keep[lab == k] = 1
fg = keep
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
# the sky never belongs to it (a soft edge, so the leaves don't look cut with scissors)
alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 1.1)
alpha[sky & (cv2.erode(fg, np.ones((3, 3), np.uint8)) == 0)] *= 0.25
alpha = np.clip((alpha - 0.08) / 0.84, 0, 1)

# ------------------------------------------------------------------ the hangings and the opening
# the jasmine strands and the bells that hang free inside the arch: (box, the row below which they
# are clear of the arch). They are a layer of their own, behind the arch, tied on under it.
HANG = [((432, 318, 500, 532), 345), ((492, 285, 550, 428), 315), ((555, 236, 603, 344), 255),
        ((860, 116, 932, 250), 140), ((1038, 193, 1092, 304), 215), ((1094, 128, 1166, 370), 165),
        ((1164, 168, 1229, 498), 200)]
fgb = fg.astype(bool)
hang_box = np.zeros((H, W), bool)
hang_core = np.zeros((H, W), bool)
for (bx0, by0, bx1, by1), clear in HANG:
    hang_box[by0:by1, bx0:bx1] = True
    hang_core[clear:by1, bx0:bx1] = True
hang_box &= fgb
hang_core &= fgb
# the opening: what the middle reaches without crossing the arch (the hangings don't count),
# above the floor, smoothed into one clean shape
free = ((fg == 0) | hang_core).astype(np.uint8)
free[FLOOR:, :] = 0
n, lab = cv2.connectedComponents(free)
inside = (lab == lab[500, CX]).astype(np.uint8)
inside &= poly([(380, 0), (1290, 0), (1300, FLOOR), (420, FLOOR)]).astype(np.uint8)
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))
opening = cv2.morphologyEx(inside, cv2.MORPH_CLOSE, k)
cnts, _ = cv2.findContours(opening, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cnt = max(cnts, key=cv2.contourArea)
opening = np.zeros_like(opening)
cv2.drawContours(opening, [cnt], -1, 1, -1)
opening = cv2.morphologyEx(opening, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
opening[FLOOR:, :] = 0
soft_core = cv2.GaussianBlur(hang_core.astype(np.float32), (0, 0), 0.8)
hang_a = alpha * hang_box
ring_a = alpha * (1 - soft_core)
# the photograph shows a little beyond the opening, under the arch's inner edge
photo = cv2.dilate(opening, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (63, 63)))
# (but never past the arch's outer edge, where its garland is thin)
outer = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) | opening
cnts, _ = cv2.findContours(outer, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outer = np.zeros_like(outer)
cv2.drawContours(outer, [max(cnts, key=cv2.contourArea)], -1, 1, -1)
photo &= cv2.erode(outer, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 23)))
photo[FLOOR:, :] = 0
photo = cv2.GaussianBlur(photo.astype(np.float32), (0, 0), 1.5)
# (its foot melts into the lawn the arch stands on, rather than ending in a hard line)
ramp = np.clip((FLOOR - 4 - np.arange(H, dtype=np.float32)) / 46, 0, 1)[:, None]
photo *= ramp

# ------------------------------------------------------------------ crop and write
ys, xs = np.nonzero(alpha > 0.02)
x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, max(0, int(ys.min()) - 2), min(H, FLOOR + 40)
crop = lambda a: a[y0:y1, x0:x1]


def save_rgba(name, a):
    rgba = np.dstack([crop(rgb), (crop(a) * 255).astype(np.uint8)])
    Image.fromarray(rgba).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)


save_rgba("ring", ring_a)
save_rgba("hang", hang_a)
# (a CSS mask reads the alpha channel: white, with the opening as its alpha)
om = (crop(photo) * 255).astype(np.uint8)
Image.fromarray(np.dstack([np.full_like(om, 255)] * 3 + [om])).save(os.path.join(OUT, "opening.png"), optimize=True)
oys, oxs = np.nonzero(crop(photo) > 0.02)
meta = {
    "w": x1 - x0, "h": y1 - y0,
    # the opening's box, as fractions of the arch
    "opening": {"x": round(oxs.min() / (x1 - x0), 5), "y": round(oys.min() / (y1 - y0), 5),
                "w": round((oxs.max() + 1 - oxs.min()) / (x1 - x0), 5), "h": round((oys.max() + 1 - oys.min()) / (y1 - y0), 5)},
    # where its feet stand on the floor, as a fraction of its height
    "floor": round((FLOOR - y0) / (y1 - y0), 5),
}
# ------------------------------------------------------------------ the avenue beyond
# What is seen through the arch and at the far end of the opening scene's avenue: a straight,
# clean cypress avenue (public/assets/img/cypress-avenue.webp), two rows of cypresses meeting at a
# villa, with a mown grass path between them (the photograph's gravel road, turned to grass:
# the grass beside it, with the trees' shadows still lying across it). Its sky is keyed out, so
# the opening scene's own sky carries on above the trees.
av = np.array(Image.open(os.path.join(ROOT, "public", "assets", "img", "cypress-avenue.webp")).convert("RGB"))
AH, AW = av.shape[:2]
ahsv = cv2.cvtColor(av, cv2.COLOR_RGB2HSV).astype(np.int32)
a_h, a_s, a_v = ahsv[..., 0], ahsv[..., 1], ahsv[..., 2]
# the road: between its two edges (from the villa down to the foot of the picture) ...
road_l = [(578, 640), (490, 1000), (225, 1300), (15, 1500), (-160, AH)]
road_r = [(600, 640), (690, 1000), (965, 1300), (1165, 1480), (1320, AH)]
road = np.zeros((AH, AW), np.uint8)
cv2.fillPoly(road, [np.array(road_l + road_r[::-1], np.int32)], 1)
road = cv2.dilate(road, np.ones((9, 9), np.uint8)).astype(bool)
# ... where it is not already grass
grassy = (a_h >= 28) & (a_h <= 55) & (a_s >= 70)
road &= ~grassy
road = cv2.morphologyEx(road.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool)
# the grass beside the road, row by row (its colour in the sun)
lum = av.astype(np.float32) @ np.array([0.3, 0.55, 0.15], np.float32)
sunny_grass = grassy & (a_v > 120) & (np.arange(AH)[:, None] > 600)
green = np.zeros((AH, 3), np.float32)
glum = np.ones(AH, np.float32)
for y in range(AH):
    m = sunny_grass[y]
    if m.sum() > 20:
        green[y] = av[y][m].mean(axis=0)
        glum[y] = lum[y][m].mean()
known = green.sum(axis=1) > 0
for c in range(3):
    green[:, c] = np.interp(np.arange(AH), np.nonzero(known)[0], green[known, c])
glum = np.interp(np.arange(AH), np.nonzero(known)[0], glum[known])
green = cv2.GaussianBlur(green[:, None, :], (0, 0), sigmaX=0.1, sigmaY=12)[:, 0, :]
# the road's own light and shade (gravel speckle becomes the grass's texture, softened a little)
rl = cv2.GaussianBlur(lum, (0, 0), 1.2)
road_lum = np.where(road, rl, np.nan)
ref = np.array([np.nanmedian(r) if np.isfinite(r).any() else 1 for r in road_lum], np.float32)
ref = np.interp(np.arange(AH), np.nonzero(np.isfinite(ref))[0], ref[np.isfinite(ref)])
shade = np.clip(rl / ref[:, None], 0.25, 1.35) ** 1.15
mown = green[:, None, :] * shade[..., None] * (glum / np.maximum(green @ np.array([0.3, 0.55, 0.15], np.float32), 1))[:, None, None]
# (mown short, a cooler, deeper green than the sunlit verges)
mown *= np.array([0.8, 0.93, 0.74], np.float32)
soft = cv2.GaussianBlur(road.astype(np.float32), (0, 0), 1.5)[..., None]
avenue = np.clip(av * (1 - soft) + mown * soft, 0, 255).astype(np.uint8)
# the sky: blue (and its pale haze) above the villa's roofline, keyed per column at the skyline
skyish = ((a_h >= 88) & (a_h <= 130) & (a_s >= 20)) | ((a_s < 35) & (a_v > 200))
skyish[700:, :] = False
land = ~skyish
run = land[:-3] & land[1:-2] & land[2:-1] & land[3:]
line = np.argmax(run, axis=0).astype(np.float32)
line = cv2.GaussianBlur(line[None, :], (0, 0), 1.5)[0]
aa = np.clip((np.arange(AH, dtype=np.float32)[:, None] - line[None, :]) / 2.5, 0, 1)
# (and its sides melt into the opening scene's own rows of trees)
ax_ = np.minimum(np.arange(AW), AW - 1 - np.arange(AW)).astype(np.float32)
aa *= np.clip(ax_ / 60, 0, 1)[None, :]
Image.fromarray(np.dstack([avenue, (aa * 255).astype(np.uint8)])).save(
    os.path.join(OUT, "backdrop.webp"), "WEBP", quality=88, method=6)
# where its path vanishes (at the villa), as a fraction of its height
meta["backdrop"] = {"w": AW, "h": AH, "vanish": round(650 / AH, 5)}

# (a short hash of the files, so browsers fetch them again whenever they change)
import hashlib
_h = hashlib.md5()
for _n in ("ring.webp", "hang.webp", "opening.png", "backdrop.webp"):
    with open(os.path.join(OUT, _n), "rb") as _f:
        _h.update(_f.read())
meta["version"] = _h.hexdigest()[:10]
with open(os.path.join(OUT, "arch.json"), "w") as f:
    json.dump(meta, f, indent=1)
print(meta)

if DEBUG:
    d = DEBUG
    os.makedirs(d, exist_ok=True)
    chk = np.full((H, W, 3), (40, 90, 160), np.uint8)
    chk[(np.arange(H)[:, None] // 24 + np.arange(W)[None, :] // 24) % 2 == 0] = (70, 120, 190)
    out = (rgb * alpha[..., None] + chk * (1 - alpha[..., None])).astype(np.uint8)
    out[opening.astype(bool) & (alpha < 0.5)] = (out[opening.astype(bool) & (alpha < 0.5)] * 0.4 + np.array([255, 200, 0]) * 0.6).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(d, "cut.png"))
    hv = (rgb * hang_a[..., None] + chk * (1 - hang_a[..., None])).astype(np.uint8)
    Image.fromarray(hv).save(os.path.join(d, "hang.png"))


# ------------------------------------------------------------------ the opening scene, without the couple
# The cut-out couple used to sit in front of the avenue's far end, and the layers behind them were
# never meant to be seen there (the gap was filled with a blur). The arch is smaller than they
# were, so those places are taken out of the layers (the couple's own outline, a little wider):
# the garden beyond (backdrop.webp) and the sky show there instead. The original layers are kept
# in assets-src/arch/hero-orig/, and every run starts from them.
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layerlib as lib  # noqa: E402

HERO = os.path.join(ROOT, "public", "scenes", "hero")
ORIG = os.path.join(ROOT, "assets-src", "arch", "hero-orig")
os.makedirs(ORIG, exist_ok=True)
CLEAN = {"hills": 80, "far": 84, "cypress-l": 84, "cypress-r": 84}
for n in [*CLEAN, "couple"]:
    for ext in ("webp", "avif"):
        src = os.path.join(HERO, f"{n}.{ext}")
        if not os.path.exists(os.path.join(ORIG, f"{n}.{ext}")) and os.path.exists(src):
            shutil.copy2(src, os.path.join(ORIG, f"{n}.{ext}"))
with open(os.path.join(HERO, "manifest.json")) as f:
    man = json.load(f)
cw, ch = man["canvas"]["w"], man["canvas"]["h"]
cb = man["layers"]["couple"]
gone = np.zeros((ch, cw), np.float32)
ca = np.array(Image.open(os.path.join(ORIG, "couple.webp")).convert("RGBA"))[..., 3].astype(np.float32) / 255
gone[cb["y"]:cb["y"] + cb["h"], cb["x"]:cb["x"] + cb["w"]] = ca
couple_at = (gone > 0.05).astype(np.uint8)
gone = cv2.dilate(couple_at, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (81, 81))).astype(np.float32)
gone = cv2.GaussianBlur(gone, (0, 0), 6)
# (in the rows of trees: the couple's outline, a little wider, only where the trees stand)
gone_rows = cv2.dilate(couple_at, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45))).astype(np.float32)
gone_rows[1075:, :] = 0
# the rows of cypresses go on where the couple stood: the gap is filled with the trees beside it
# in the same row (from further out); the far end and the hills are simply taken out, and the
# garden beyond shows there
CLONE = {"cypress-l": -330, "cypress-r": 340}
BASE = {"cypress-l": 1075, "cypress-r": 1075}   # the trees' foot, along the walls (canvas px)
for n, q in CLEAN.items():
    L = man["layers"][n]
    im = np.array(Image.open(os.path.join(ORIG, f"{n}.webp")).convert("RGBA")).astype(np.float32)
    g = gone[L["y"]:L["y"] + L["h"], L["x"]:L["x"] + L["w"]][..., None]
    if n in CLONE:
        dx = CLONE[n]
        # (the whole height of the trees above the gap, so they keep their own pointed tops)
        g = gone_rows[L["y"]:L["y"] + L["h"], L["x"]:L["x"] + L["w"]]
        g = np.maximum.accumulate(g[::-1], axis=0)[::-1]
        g = cv2.GaussianBlur(g, (0, 0), sigmaX=14, sigmaY=4)[..., None]
        # (from further out along the row, and smaller, as trees further away are: shrunk
        # towards the row's foot, so the sky between the rows stays open for the names)
        k, base = 0.55, BASE[n] - L["y"]
        xa = L["w"] - 1 if dx < 0 else 0
        Mi = np.float32([[1 / k, 0, xa - xa / k + dx], [0, 1 / k, base - base / k]])
        src = cv2.warpAffine(im, Mi, (L["w"], L["h"]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        im = im * (1 - g) + src * g
        # (and the filled row fades out towards the avenue's end, into the garden beyond)
        xs_ = np.arange(L["w"], dtype=np.float32)
        inner = (L["w"] - 1 - xs_) if dx < 0 else xs_
        ramp = np.clip(inner / 80, 0, 1)
        a = im[..., 3] / 255 * (1 - g[..., 0] + g[..., 0] * ramp[None, :])
    else:
        a = im[..., 3] / 255 * (1 - g[..., 0])
    im = np.clip(im, 0, 255).astype(np.uint8)
    # (layerlib takes OpenCV's BGR, and alpha from 0 to 1)
    lib.write_image(os.path.join(HERO, n), np.ascontiguousarray(im[..., 2::-1]), a, q)
man["version"] = lib.content_version(HERO)
with open(os.path.join(HERO, "manifest.json"), "w") as f:
    f.write(json.dumps(man, indent=2))
print("opening scene layers cleaned; version", man["version"])


# ------------------------------------------------------------------ the sample couple photo
# The template's own photo in the arch (wedding.ts, archPhoto): the seated couple exchanging
# garlands from the opening picture, an ordinary photo with its background. It is enlarged with
# care and sharpened, so it stays crisp in the arch on wide screens.
from PIL import ImageFilter  # noqa: E402

ref = Image.open(os.path.join(ROOT, "assets-src", "ref-opening.webp")).convert("RGB").crop((0, 740, 941, 1560))
# (the opening picture has its lettering, a small mountain mark and "SWITZERLAND", in the sky just
# above the couple: painted out with the sky round it)
r_ = np.array(ref)
zone = np.zeros(r_.shape[:2], np.uint8)
zone[0:52, 360:590] = 1
ink = (cv2.cvtColor(r_, cv2.COLOR_RGB2GRAY) < 200) & zone.astype(bool)
ink = cv2.dilate(ink.astype(np.uint8), np.ones((5, 5), np.uint8))
ref = Image.fromarray(cv2.inpaint(r_, ink, 6, cv2.INPAINT_TELEA)).crop((0, 20, 941, 820))
big = ref.resize((round(ref.width * 1.6), round(ref.height * 1.6)), Image.LANCZOS)
big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
big = big.filter(ImageFilter.UnsharpMask(radius=0.8, percent=45, threshold=1))
big.save(os.path.join(ROOT, "public", "assets", "img", "arch-couple.webp"), "WEBP", quality=85, method=6)
print("sample couple photo", big.size)
