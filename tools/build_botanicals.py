"""Cuts the sharp botanical layers the sections use from the photographs in assets-src/botanical/:

    ref-flowers.webp  a 2 x 2 collage: wisteria on white | hydrangea bed
                                       hydrangeas on the petal path | (avenue, unused)
    ref-avenue.webp   the cypress avenue leading to the villa

Writes transparent WebP + AVIF layers to public/assets/botanical/:
    canopy-l / canopy-r       a wisteria canopy for a top corner (the right one is its mirror)
    strand-1 / -2 / -3        single hanging wisteria strands
    bed-l / bed-r             a hydrangea bed for a bottom corner (natural inner edge)
    bed-wide                  a long hydrangea border (both ends meant to run off-screen)
    cypress-l / cypress-r     a group of tall cypresses for the left / right edge
and the avenue photograph itself to public/assets/img/cypress-avenue.

    python3 tools/build_botanicals.py [--debug DIR]

Nothing here is blurred: every edge comes from a colour key or GrabCut on an in-focus photo.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical")
OUT = os.path.join(ROOT, "public", "assets", "botanical")
IMG = os.path.join(ROOT, "public", "assets", "img")
DEBUG = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None


def load(name):
    return cv2.cvtColor(np.array(Image.open(os.path.join(SRC, name)).convert("RGB")), cv2.COLOR_RGB2BGR)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def unsharp(bgr, amount=0.35, sigma=1.0):
    f = bgr.astype(np.float32)
    return np.clip(f + amount * (f - cv2.GaussianBlur(f, (0, 0), sigma)), 0, 255).astype(np.uint8)


def save(name, bgr, alpha=None, folder=OUT, scale=1.0, quality=88, crisp=0.3):
    os.makedirs(folder, exist_ok=True)
    if alpha is not None:
        ys, xs = np.where(alpha > 0.01)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        bgr, alpha = bgr[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    if scale != 1.0:
        size = (round(bgr.shape[1] * scale), round(bgr.shape[0] * scale))
        if alpha is not None:   # premultiplied, so edges gain no dark or pale halo
            pre = cv2.resize(bgr.astype(np.float32) * alpha[..., None], size, interpolation=cv2.INTER_LANCZOS4)
            alpha = np.clip(cv2.resize(alpha, size, interpolation=cv2.INTER_LANCZOS4), 0, 1)
            bgr = np.clip(pre / np.maximum(alpha[..., None], 1e-3), 0, 255).astype(np.uint8)
        else:
            bgr = cv2.resize(bgr, size, interpolation=cv2.INTER_LANCZOS4)
    if crisp:
        bgr = unsharp(bgr, crisp)
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    if alpha is not None:
        im.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)))
    base = os.path.join(folder, name)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=quality - 14)
    print(f"  {name:12s} {im.width}x{im.height}  webp {os.path.getsize(base + '.webp') // 1024} KB")
    return im


def decontaminate(bgr, alpha, bg):
    """Takes the background colour out of semi-transparent edge pixels (no white or green fringe)."""
    a = np.clip(alpha, 0, 1)[..., None]
    c = bgr.astype(np.float32)
    f = (c - (1 - a) * np.asarray(bg, np.float32)) / np.maximum(a, 0.1)
    return np.clip(np.where(a > 0.97, c, f), 0, 255).astype(np.uint8)


def keep_big(mask, min_area):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    keep = np.zeros(n, bool)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] >= min_area
    return keep[lab]


def grabcut(bgr, init, iters=6):
    m = init.copy()
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(bgr, m, None, bgm, fgm, iters, cv2.GC_INIT_WITH_MASK)
    return np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)


def soft(mask, sigma=1.0):
    return cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigma)


collage = load("ref-flowers.webp")
TL, TR, BL = collage[0:589, 0:618], collage[0:589, 625:1237], collage[596:1271, 0:618]

# ---------------------------------------------------------------- wisteria (on white)
print("wisteria…")
bg = np.median(TL[480:585, 470:615].reshape(-1, 3), axis=0)
dist = np.linalg.norm(TL.astype(np.float32) - bg, axis=2)
# background = near-white pixels connected to the border; pale petals inside the flowers stay
tb, tg, tr_ = [c.astype(np.float32) for c in cv2.split(TL)]
tv = np.maximum(np.maximum(tr_, tg), tb)
tsat = (tv - np.minimum(np.minimum(tr_, tg), tb)) / np.maximum(tv, 1)
# the wall is lit unevenly (warmer and darker on the left), so key on "bright and unsaturated" too
near = ((dist < 26) | ((tsat < 0.085) & (tv > 200))).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(near)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
# the wall shows through the gaps between strands too: any sizeable white patch is background,
# while pale petals are small and tinted, so they stay
big = np.zeros(n, bool)
big[1:] = st[1:, cv2.CC_STAT_AREA] > 90
outside = np.isin(lab, list(border)) | big[lab]
# how much a background pixel looks like the wall: near its colour, or bright and unsaturated
wall = np.maximum(1 - smoothstep(8, 26, dist), (1 - smoothstep(0.06, 0.11, tsat)) * smoothstep(196, 214, tv))
alpha = np.where(outside, 1 - wall, 1.0).astype(np.float32)
alpha = soft(alpha, 0.7)
alpha *= keep_big(alpha > 0.5, 60)
w_rgb = decontaminate(TL, alpha, bg)
xs = np.arange(TL.shape[1], dtype=np.float32)[None, :]
canopy_a = alpha * (1 - smoothstep(540, 616, xs))       # the photo's right edge fades out
save("canopy-l", w_rgb, canopy_a)
save("canopy-r", np.ascontiguousarray(w_rgb[:, ::-1]), np.ascontiguousarray(canopy_a[:, ::-1]))
for i, (x0, y0, x1, y1) in enumerate([(104, 110, 262, 582), (238, 46, 470, 530), (392, 175, 448, 378)]):
    a = alpha[y0:y1, x0:x1].copy()
    # the strand hangs from its top edge; keep only what connects to it
    a *= keep_big(a > 0.3, 400)
    save(f"strand-{i + 1}", w_rgb[y0:y1, x0:x1], a, scale=1.25)

# ---------------------------------------------------------------- hydrangeas
print("hydrangeas…")
# bed-l: the cluster on the petal path (its inner edge is the plant's own silhouette)
h, w = BL.shape[:2]
init = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
init[225:, :560] = cv2.GC_PR_FGD
init[:210, :] = cv2.GC_BGD                        # lawn
init[50:392, 372:] = cv2.GC_BGD                   # bench and lehenga
init[380:470, 560:] = cv2.GC_BGD                  # path and petals on the right
# the petal path is cream-pink and only mildly saturated; flowers are either saturated pink or
# near-white, so path-coloured pixels on the inner side are background
bb, gg, rr = [c.astype(np.float32) for c in cv2.split(BL)]
vv = np.maximum(np.maximum(rr, gg), bb)
sat = (vv - np.minimum(np.minimum(rr, gg), bb)) / np.maximum(vv, 1)
pathy = (sat > 0.15) & (sat < 0.36) & (vv > 185) & (gg > rr * 0.62)
yy, xx = np.mgrid[0:h, 0:w]
init[pathy & (xx > 380) & (yy > 300)] = cv2.GC_BGD
init[pathy & (xx > 300) & (yy > 240) & (init != cv2.GC_FGD)] = cv2.GC_PR_BGD
# the bare path along the right edge: anything pale and not leaf-green
init[(yy > 300) & (xx > 548) & (vv > 170) & (rr >= gg)] = cv2.GC_BGD
init[150:230, 0:140] = cv2.GC_BGD                 # hanging strand and lawn top-left
init[360:675, 0:400] = cv2.GC_FGD                 # the big hydrangea heads
init[610:675, 340:560] = cv2.GC_FGD               # leaves along the bottom
m = grabcut(BL, init)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
m = keep_big(m, 3000).astype(np.uint8)
a = soft(m, 1.0)
lawn = np.median(BL[100:200, 100:350].reshape(-1, 3), axis=0)
bed = decontaminate(BL, a, lawn)
save("bed-l", bed, a)
save("bed-r", np.ascontiguousarray(bed[:, ::-1]), np.ascontiguousarray(a[:, ::-1]))

# bed-wide: the long border, its blurred lawn and the out-of-focus leaves at the top removed
h, w = TR.shape[:2]
init = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
init[:118, :] = cv2.GC_BGD
init[:150, :215] = cv2.GC_BGD                     # out-of-focus leaves, top left
init[118:175, :] = cv2.GC_PR_BGD
init[240:, :] = cv2.GC_FGD
m = grabcut(TR, init)
m = keep_big(cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)), 3000).astype(np.uint8)
a = soft(m, 1.0)
save("bed-wide", decontaminate(TR, a, np.median(TR[40:110, 260:600].reshape(-1, 3), axis=0)), a)

# ---------------------------------------------------------------- cypresses (against the sky)
print("cypresses…")
av = load("ref-avenue.webp")
b, g, r = [c.astype(np.float32) for c in cv2.split(av)]
v = np.maximum(np.maximum(r, g), b)
sky = smoothstep(6, 22, b - r) * smoothstep(150, 185, v)
# the pale haze along the horizon is sky too
mn = np.minimum(np.minimum(r, g), b)
sky = np.maximum(sky, smoothstep(190, 215, v) * (1 - smoothstep(0.08, 0.16, (v - mn) / np.maximum(v, 1))))
# below the horizon the trees stand against sunlit lawn, which is bright and yellow
lawn = smoothstep(120, 150, g) * smoothstep(10, 35, g - b)
tree = np.clip(1 - np.maximum(sky, lawn), 0, 1)
ys = np.arange(av.shape[0], dtype=np.float32)[:, None]
for name, (x0, x1) in [("cypress-l", (0, 228)), ("cypress-r", (506, av.shape[1]))]:
    a = tree[:, x0:x1].copy()
    a *= 1 - smoothstep(705, 765, ys)              # bases fade where the trees meet the lawn
    a = soft(keep_big(a > 0.5, 2000) * a, 0.6)
    save(name, decontaminate(av[:, x0:x1], a, (226, 198, 155)), a, scale=1.25)

# the avenue photograph for S06 (pre-enlarged with Lanczos, a touch crisper than browser scaling)
save("cypress-avenue", av, None, folder=IMG, scale=1.6, quality=86, crisp=0.4)

if DEBUG:
    os.makedirs(DEBUG, exist_ok=True)
    for f in sorted(os.listdir(OUT)):
        if f.endswith(".webp"):
            im = Image.open(os.path.join(OUT, f)).convert("RGBA")
            bgc = Image.new("RGBA", im.size, (255, 0, 255, 255))
            bgc.alpha_composite(im)
            bgc.convert("RGB").save(os.path.join(DEBUG, f.replace(".webp", ".jpg")), quality=88)
print("done")
