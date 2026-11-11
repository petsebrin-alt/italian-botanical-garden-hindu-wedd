"""Builds the opening gate (the splash screen) from assets-src/botanical/ref-gate.webp.

    python3 tools/build_gate.py

The photograph is split into layers that move on their own (public/assets/gate/):

  frame      the stone pillars, urns, floral arch and the vines hanging in front of the gate;
             the gate's opening is cut out. Both pillars are completed by mirroring the photo's
             edges (urns and pedestals are symmetric), so wide screens see whole pillars.
  door-l/r   the two wrought-iron leaves, keyed so only the ironwork is opaque (the garden shows
             through the scrolls and stays put while the leaves swing). The ironwork hidden by the
             bow and the vines is rebuilt from the leaves' symmetry and the pattern's repeat.
  bow-posy   the posy of flowers on the bow's knot, cut round its own flowers and leaves. The
             satin bow itself is one continuous ribbon modelled and lit in 3D by
             src/scenes/gate/ribbon.ts, so it can be untied and drawn away like real satin.
             Beyond the gate is open sky, drawn by the page.

manifest.json records every layer's box on the canvas (photo px, after the mirrored edges).
"""
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical")
OUT = os.path.join(ROOT, "public", "assets", "gate")
DEBUG = os.environ.get("GATE_DEBUG")
BOW_ONLY = "--bow" in __import__("sys").argv  # only re-cut the posy

# ---------------------------------------------------------------- the photo's geometry (1024 x 1536)
W, H = 1024, 1536
LEFT, SEAM, RIGHT = 166, 516, 867          # leaf edges: the left stile, the meeting posts, the right stile
TOP, BOTTOM = 283, 1434                    # top of the meeting posts (under the arch), the leaves' foot
ARCH_C, ARCH_A, ARCH_B = 445, 351, 162     # the arch: centre row, half-width, rise
EXT_L, EXT_R = 144, 144                    # pillar faces mirrored past each edge (up to the jamb slots)
MIRROR = LEFT + RIGHT - 1                  # x <-> MIRROR - x maps one leaf onto the other


def load(name):
    return np.array(Image.open(os.path.join(SRC, name)).convert("RGB")).astype(np.float32)


def save(name, rgb, alpha=None, quality=86, sharpen=False):
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    if alpha is not None:
        im.putalpha(Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8)))
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=2))
    base = os.path.join(OUT, name)
    im.save(base + ".webp", quality=quality, method=6)
    print(f"{name}: {im.width}x{im.height}  {os.path.getsize(base + '.webp') // 1024} KB")


def dbg(name, arr):
    if DEBUG:
        a = np.clip(arr, 0, 255).astype(np.uint8)
        Image.fromarray(a).save(os.path.join(DEBUG, name + ".png"))


def smooth(t, a, b):
    """0 at a, 1 at b (either order), smooth in between."""
    x = np.clip((t - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


def arch_top(x):
    dx = np.clip((x - SEAM + 0.5) / ARCH_A, -1, 1)
    return ARCH_C - ARCH_B * np.sqrt(1 - dx * dx)


def opening_mask():
    yy, xx = np.mgrid[0:H, 0:W]
    m = (xx >= LEFT) & (xx < RIGHT) & (yy < BOTTOM) & (yy >= arch_top(xx))
    return m


def poly(points, shape=(H, W)):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.array(points, np.int32)], 1)
    return m.astype(bool)


# ---------------------------------------------------------------- the bow, traced from the photo
BOW = {
    "band-l": [(178, 796), (346, 799), (348, 886), (178, 896)],
    "loop-l": [(343, 778), (372, 767), (420, 767), (458, 778), (482, 800), (480, 880), (456, 902), (360, 903), (344, 890)],
    "knot":   [(458, 806), (474, 796), (490, 778), (522, 776), (538, 790), (556, 788), (580, 806), (595, 830), (592, 880), (570, 900), (560, 935), (540, 965), (495, 965), (476, 935), (466, 900), (455, 880), (452, 830)],
    "loop-r": [(584, 800), (620, 784), (665, 767), (701, 769), (705, 790), (705, 899), (640, 903), (600, 892), (585, 862)],
    "band-r": [(700, 799), (855, 792), (855, 894), (700, 899)],
    "tail-l": [(428, 884), (478, 890), (470, 922), (441, 1025), (428, 1090), (405, 1140), (372, 1213), (362, 1213), (340, 1150), (318, 1093), (339, 1035), (374, 960), (399, 904)],
    "tail-r": [(544, 889), (601, 889), (626, 905), (661, 985), (713, 1060), (740, 1110), (720, 1160), (697, 1210), (692, 1210), (653, 1153), (617, 1080), (600, 1025), (569, 960), (547, 921)],
}
# the order they are painted in, back to front
BOW_ORDER = ["band-l", "band-r", "tail-l", "tail-r", "loop-l", "loop-r", "knot"]


def bow_masks(img):
    """GrabCut the whole bow from the traced outline, then share it out among the pieces.

    Against the dark garden GrabCut finds the satin's true edge; against the white bars it cannot
    tell satin from iron, so there (the straight bands, the tails' points) the tracing decides.
    """
    rough = np.zeros((H, W), bool)
    for pts in BOW.values():
        rough |= poly(pts)
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    near = cv2.dilate(rough.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
    core = cv2.erode(rough.astype(np.uint8), np.ones((13, 13), np.uint8)).astype(bool)
    gc[near] = cv2.GC_PR_BGD
    gc[rough] = cv2.GC_PR_FGD
    gc[core] = cv2.GC_FGD
    bgr = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2BGR)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    cut = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
    # the satin is smooth and broad: an opening drops the thin bars GrabCut may have kept
    cut = cv2.morphologyEx(cut, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    cut = cv2.morphologyEx(cut, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cut)
    cut = np.isin(lab, [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 400])

    yy = np.mgrid[0:H, 0:W][0]
    fg = np.zeros((H, W), bool)
    for name, pts in BOW.items():
        traced = poly(pts).astype(np.uint8)
        if name.startswith("band"):
            part = cv2.erode(traced, np.ones((3, 3), np.uint8)).astype(bool)
        elif name == "knot":
            part = cut & traced.astype(bool)
        else:
            part = (cut & cv2.dilate(traced, np.ones((7, 7), np.uint8)).astype(bool)) | \
                cv2.erode(traced, np.ones((9, 9), np.uint8)).astype(bool)
            if name.startswith("tail"):
                low = yy >= 1060
                part[low] = cv2.erode(traced, np.ones((3, 3), np.uint8)).astype(bool)[low]
        fg |= part
    # soft, sharp edge: a 1px feather on the hard mask
    alpha = cv2.GaussianBlur(fg.astype(np.float32), (3, 3), 0.7)
    # each pixel belongs to the piece whose tracing is nearest
    dist = [cv2.distanceTransform((~poly(BOW[name])).astype(np.uint8), cv2.DIST_L2, 5) for name in BOW_ORDER]
    owner = np.argmin(np.stack(dist), 0)
    pieces = {name: alpha * (owner == i) for i, name in enumerate(BOW_ORDER)}
    return fg, alpha, pieces


# the posy of flowers on the knot, traced round its flowers and leaves (photo px). The white
# curls at the top corners are the gate's own ironwork and stay out.
POSY = [
    (487, 778), (498, 769), (512, 769), (524, 775), (532, 771), (540, 763), (552, 759), (566, 763),
    (570, 776), (566, 790), (560, 800), (574, 806), (584, 810), (587, 824), (585, 840), (594, 846),
    (600, 856), (594, 866), (580, 867), (580, 880), (574, 892), (561, 897), (553, 905), (548, 917),
    (539, 928), (527, 936), (514, 939), (500, 937), (486, 931), (474, 921), (466, 907), (462, 893),
    (456, 881), (452, 867), (440, 862), (438, 850), (448, 842), (448, 830), (450, 812), (461, 805),
    (470, 799), (474, 789), (471, 778), (477, 770),
]


def posy_cut(img, manifest):
    """The posy alone, with a natural edge: GrabCut inside the traced outline separates the
    flowers and leaves from the satin, the white gate bars and the dark garden behind them."""
    outline = poly(POSY)
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[outline] = cv2.GC_PR_FGD
    core = cv2.erode(outline.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    v = img.max(-1)
    pink = (r > g + 18) & (r > 150)
    leaf = (g > r + 10) & (g > b + 25) & (v > 70)
    gc[core & (pink | leaf)] = cv2.GC_FGD
    # the heads of the roses
    for cx, cy, rx, ry in ((505, 792, 12, 9), (467, 826, 9, 9), (564, 878, 8, 8), (516, 898, 14, 7), (476, 872, 7, 7)):
        cv2.ellipse(gc, (cx, cy), (rx, ry), 0, 0, 360, cv2.GC_FGD, -1)
    bgr = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2BGR)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = max(range(1, n), key=lambda i: stats[i, cv2.CC_STAT_AREA])
    keep = np.zeros_like(fg)
    for i in range(1, n):
        # the posy, and any leaf or blossom close beside it
        if i == big or stats[i, cv2.CC_STAT_AREA] >= 25:
            keep[lab == i] = 1
    # fill pinholes, then a soft one-pixel edge
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    alpha = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.75)
    rgb = decontaminate(img, alpha)
    x0, y0, x1, y1 = bbox(alpha, pad=3)
    save("bow-posy", rgb[y0:y1, x0:x1], 255 * alpha[y0:y1, x0:x1], quality=92)
    manifest["posy"] = {"x": int(x0 + EXT_L), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}
    if DEBUG:
        for name, col in (("posy_dark", (40, 70, 40)), ("posy_sky", (170, 205, 238))):
            bg = np.zeros((y1 - y0, x1 - x0, 3), np.float32) + np.array(col, np.float32)
            a = alpha[y0:y1, x0:x1, None]
            out = bg * (1 - a) + rgb[y0:y1, x0:x1] * a
            Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.LANCZOS).save(os.path.join(DEBUG, name + ".png"))


# ---------------------------------------------------------------- the ironwork key
def fill_from(img, weight, sigmas=(3, 6, 12, 24)):
    """Normalised convolution: spreads the weighted pixels into the gaps, finest scale first."""
    out = np.zeros_like(img)
    got = np.zeros(img.shape[:2], bool)
    for sg in sigmas:
        num = cv2.GaussianBlur(img * weight[..., None], (0, 0), sg)
        den = cv2.GaussianBlur(weight, (0, 0), sg)
        ok = (den > 0.08) & ~got
        out[ok] = num[ok] / den[ok][..., None]
        got |= ok
    out[~got] = img[~got]
    return out


def iron_alpha(img):
    """Opaque where the pixel is the white-painted iron, clear where it is the garden behind.

    What shows between the bars (blue sky, trees, hedges, pink beds, the warm gravel) is out of
    focus and tinted; the iron is sharp and neutral. The garden's colour behind every bar is
    estimated from the clearly-garden pixels around it, and a pixel is iron by how far it is from
    that colour (tint counts double: sunlit iron and sunlit gravel are equally bright).
    """
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    v = img.max(-1)
    tinted = np.maximum.reduce([
        smooth(b - r, 9, 15) * smooth(v, 170, 205),         # sky
        smooth(b - r, 12, 18),
        smooth(r - b, 15, 22),                              # the warm sunlit gravel
        smooth(g - b, 10, 18),                              # foliage
        smooth(g - r, 7, 14),
        smooth(r - g, 14, 22),                              # pink flowers
    ])
    dark = smooth(v, 105, 80)
    # under the arch the iron is backlit by the sky: anything that bright there is sky
    yy = np.mgrid[0:H, 0:W][0]
    glare = ((v > 228) & (b >= r) & (v - img.min(-1) < 20) & (yy < 660)).astype(np.float32)
    seed = np.maximum.reduce([tinted, dark, glare])
    seed = np.where(seed > 0.7, 1.0, 0.0).astype(np.float32)
    bg = fill_from(img, seed)
    br, bgc, bb = bg[..., 0], bg[..., 1], bg[..., 2]
    dv = v - bg.max(-1)
    d_rb = (r - b) - (br - bb)
    d_gb = (g - b) - (bgc - bb)
    d = np.sqrt(dv * dv + 4 * d_rb * d_rb + 4 * d_gb * d_gb)
    a = smooth(d, 14, 34) * (1 - tinted) * (1 - glare) * smooth(v, 95, 125)
    a = smooth(a, 0.12, 0.7)
    # the frame members are solid iron whatever shows behind them
    a[460:, LEFT:LEFT + 20] = 1
    a[460:, RIGHT - 20:RIGHT] = 1
    a[:, 493:513] = 1
    a[:, 519:539] = 1
    a[1413:BOTTOM, :] = 1
    # drop specks at the bar scale
    hard = (a > 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, connectivity=8)
    small = np.isin(lab, np.where(stats[:, cv2.CC_STAT_AREA] < 14)[0]) & (hard > 0)
    a[small] = 0
    return a


def decontaminate(img, alpha):
    """Edge pixels carry the colour of the garden they were mixed with: give them the iron's own."""
    core = (alpha > 0.92).astype(np.float32)
    k = (0, 0)
    num = cv2.GaussianBlur(img * core[..., None], k, 2.2)
    den = cv2.GaussianBlur(core, k, 2.2)[..., None]
    iron = num / np.maximum(den, 1e-4)
    far = den[..., 0] < 0.02
    iron[far] = img[far]
    out = img.copy()
    edge = alpha <= 0.92
    out[edge] = iron[edge]
    return out


# ---------------------------------------------------------------- what hangs in front of the gate
def hanging(img, opening):
    """The vines and flowers hanging from the arch, in front of the leaves (they stay when the
    leaves swing): leaf-green and blossom pixels that reach the opening from the arch above."""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    v = img.max(-1)
    yy = np.mgrid[0:H, 0:W][0]
    leaf = (g > b + 22) & (g >= r - 16) & (v > np.where(yy < 520, 100, 128))
    blossom = (r > g + 16) & (v > 150)
    stone = (r - b > 12) & (r - b < 45) & (v > 175) & (yy < arch_top(np.mgrid[0:H, 0:W][1]) + 24)
    cand = (leaf | blossom | stone) & (yy < 820)
    cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)).astype(bool)
    seed = ~opening
    grown = cand & opening
    n, lab = cv2.connectedComponents((grown | seed).astype(np.uint8), connectivity=8)
    outside = np.unique(lab[seed])
    front = np.isin(lab, outside) & opening
    return front


# ---------------------------------------------------------------- rebuilding the hidden ironwork
PICKETS = (252, 782, 600, 1140)       # the straight bars between the scroll borders
BORDERS = [(186, 252), (782, 847)]     # the scroll columns along each leaf's outer stile


def picket_fill(alpha, rgb, hidden):
    """The bars run straight from the frieze to the lower panel: a hidden stretch of a column is
    the same bar, so it is copied from the nearest visible row whose iron matches the column's
    usual profile (ornaments and sprigs between the bars are skipped)."""
    x0, x1, y0, y1 = PICKETS
    for x in range(x0, x1):
        col_h = hidden[y0:y1, x]
        if not col_h.any():
            continue
        src_x = x
        if (~col_h).sum() < 50:
            src_x = MIRROR - x
            if hidden[y0:y1, src_x].sum() > (y1 - y0) - 50:
                continue
        vis = ~hidden[y0:y1, src_x]
        col_a = alpha[y0:y1, src_x]
        prof = np.percentile(col_a[vis], 60)
        ref = np.where(vis & (np.abs(col_a - prof) < 0.18))[0]
        if len(ref) == 0:
            ref = np.where(vis)[0]
        for y in np.where(col_h)[0]:
            j = ref[np.argmin(np.abs(ref - y))]
            alpha[y0 + y, x] = alpha[y0 + j, src_x]
            rgb[y0 + y, x] = rgb[y0 + j, src_x]


def block_fill(alpha, rgb, hidden, x0, x1, lo=560, hi=1140, ring=10):
    """A run of scrolls hidden across a border column is replaced by the run, above or below it
    (or in the other leaf's border, mirrored), whose edges best continue the visible scrolls."""
    rows = np.where(hidden[lo:hi, x0:x1].any(1))[0] + lo
    runs = []
    for r in rows:
        if runs and r == runs[-1][1]:
            runs[-1][1] = r + 1
        else:
            runs.append([r, r + 1])
    for ya, yb in runs:
        if ya - ring < lo or yb + ring > hi:
            continue          # a run touching the zone's edge is left to the mirror fill
        tgt = np.r_[alpha[ya - ring:ya, x0:x1], alpha[yb:yb + ring, x0:x1]]
        best = None
        for mirror in (False, True):
            sx = np.arange(x0, x1) if not mirror else (MIRROR - np.arange(x0, x1))
            for dy in range(lo - ya, hi - yb):
                if abs(dy) < yb - ya + ring:
                    continue
                a0, b0 = ya + dy - ring, yb + dy + ring
                if a0 < lo or b0 > hi or hidden[a0:b0][:, sx].any():
                    continue
                src = np.r_[alpha[a0:ya + dy][:, sx], alpha[yb + dy:b0][:, sx]]
                cost = float(np.mean(np.abs(src - tgt)))
                if best is None or cost < best[0]:
                    best = (cost, dy, sx)
        if best is None:
            continue
        _, dy, sx = best
        for k, x in enumerate(range(x0, x1)):
            hrow = np.where(hidden[ya:yb, x])[0] + ya
            alpha[hrow, x] = alpha[hrow + dy, sx[k]]
            rgb[hrow, x] = rgb[hrow + dy, sx[k]]
            hidden[hrow, x] = False


def mirror_fill(alpha, rgb, hidden, region, centre):
    """Fill the hidden pixels of `region` from their mirror image about column `centre`/2."""
    ys, xs = np.where(hidden & region)
    mx = centre - xs
    ok = (mx >= LEFT) & (mx < RIGHT) & ~hidden[ys, np.clip(mx, 0, W - 1)]
    ys, xs, mx = ys[ok], xs[ok], mx[ok]
    alpha[ys, xs] = alpha[ys, mx]
    rgb[ys, xs] = rgb[ys, mx]
    hidden[ys, xs] = False


def seam_cut(img, x_from, x_to, y_end):
    """A vertical cut from the top to y_end between columns x_from..x_to that runs through the
    calmest pixels (sky, open foliage), so the mirrored garland ends on its own outline."""
    g = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    e = np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 0)) + np.abs(cv2.Sobel(g, cv2.CV_32F, 0, 1))
    e = e[:y_end, x_from:x_to] + 1.0
    hh, ww = e.shape
    cost = e.copy()
    for y in range(1, hh):
        prev = cost[y - 1]
        l = np.r_[np.inf, prev[:-1]]; r = np.r_[prev[1:], np.inf]
        cost[y] += np.minimum(np.minimum(l, prev), r)
    path = np.zeros(hh, int)
    path[-1] = int(np.argmin(cost[-1]))
    for y in range(hh - 2, -1, -1):
        c = path[y + 1]
        lo, hi = max(c - 1, 0), min(c + 2, ww)
        path[y] = lo + int(np.argmin(cost[y, lo:hi]))
    return path + x_from


def cover(img, w, h):
    """Scale and centre-crop to exactly w x h."""
    s = max(w / img.shape[1], h / img.shape[0])
    im = Image.fromarray(img.astype(np.uint8)).resize((round(img.shape[1] * s), round(img.shape[0] * s)), Image.LANCZOS)
    a = np.array(im).astype(np.float32)
    oy, ox = (a.shape[0] - h) // 2, (a.shape[1] - w) // 2
    return a[oy:oy + h, ox:ox + w]


def bbox(alpha, pad=2):
    ys, xs = np.where(alpha > 0.004)
    return (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + 1 + pad, alpha.shape[1]), min(ys.max() + 1 + pad, alpha.shape[0]))


def main():
    os.makedirs(OUT, exist_ok=True)
    img = load("ref-gate.webp")
    opening = opening_mask()
    yy, xx = np.mgrid[0:H, 0:W]
    manifest = {"src": {"w": W, "h": H}, "layers": {}}
    CW = W + EXT_L + EXT_R
    manifest["canvas"] = {"w": CW, "h": H, "extL": EXT_L, "extR": EXT_R,
                          "opening": {"x": LEFT + EXT_L, "y": TOP, "w": RIGHT - LEFT, "h": BOTTOM - TOP},
                          "seam": SEAM + EXT_L}

    # ------------------------------------------------ the bow
    bow_fg, bow_a, pieces = bow_masks(img)
    bow_rgb = decontaminate(img, bow_a)
    # the satin ribbon is drawn by the page (src/scenes/gate/ribbon.ts): only the posy of flowers
    # on its knot comes from the photo
    posy_cut(img, manifest)
    if BOW_ONLY:
        with open(os.path.join(OUT, "manifest.json")) as fh:
            old = json.load(fh)
        old.pop("bow", None)
        old["posy"] = manifest["posy"]
        with open(os.path.join(OUT, "manifest.json"), "w") as fh:
            json.dump(old, fh, indent=1)
        return

    # ------------------------------------------------ what hangs in front (it stays with the arch)
    near_bow = np.zeros((H, W), np.uint8)
    for pts in BOW.values():
        near_bow |= poly(pts).astype(np.uint8)
    near_bow = cv2.dilate(near_bow, np.ones((41, 41), np.uint8)).astype(bool)
    front = hanging(img, opening) & ~near_bow
    front_a = cv2.GaussianBlur(front.astype(np.float32), (3, 3), 0.6)

    # ------------------------------------------------ the leaves
    ia = iron_alpha(img) * opening
    iron_rgb = decontaminate(img, ia)
    bow_hide = cv2.dilate((bow_fg | poly(BOW["knot"])).astype(np.uint8), np.ones((11, 11), np.uint8)).astype(bool) & opening
    vine_hide = cv2.dilate(front.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & opening
    hidden = bow_hide | vine_hide
    ia2, rgb2 = ia.copy(), iron_rgb.copy()
    hid = hidden.copy()
    x0, x1, y0, y1 = PICKETS
    zone = np.zeros((H, W), bool); zone[y0:y1, x0:x1] = True
    picket_fill(ia2, rgb2, hid & zone)
    hid[zone] = False
    for bx0, bx1 in BORDERS:
        block_fill(ia2, rgb2, hid, bx0, bx1)
    # the tails' points reach into the lower panel: its scrolls mirror across each leaf, then
    # across the meeting posts
    low = np.zeros((H, W), bool); low[1140:BOTTOM] = True
    left = np.zeros((H, W), bool); left[:, LEFT:SEAM] = True
    mirror_fill(ia2, rgb2, hid, low & left, LEFT + SEAM - 1)
    mirror_fill(ia2, rgb2, hid, low & ~left, MIRROR)
    # behind the vines (the arch's fan of scrolls) the other leaf shows what is there
    mirror_fill(ia2, rgb2, hid, ~zone, MIRROR)
    # anything still unseen (behind vines on both leaves) stays open rather than inventing scrolls
    rest = hid & opening
    ia2[rest] = 0
    print(f"leaves: rebuilt {int(hidden.sum() - rest.sum())} px, {int(rest.sum())} left open")
    # the frame members again, whole
    for (a0, a1), (b0, b1) in [((460, BOTTOM), (LEFT, LEFT + 20)), ((460, BOTTOM), (RIGHT - 20, RIGHT)),
                               ((TOP, BOTTOM), (493, 513)), ((TOP, BOTTOM), (519, 539)), ((1413, BOTTOM), (LEFT, RIGHT))]:
        sl = (slice(a0, a1), slice(b0, b1))
        ia2[sl] = np.where(opening[sl], 1, 0)
    ia2 *= opening
    for side, (x0, x1) in (("l", (LEFT, SEAM)), ("r", (SEAM, RIGHT))):
        save(f"door-{side}", rgb2[TOP:BOTTOM, x0:x1], 255 * ia2[TOP:BOTTOM, x0:x1], quality=88)
        manifest["layers"][f"door-{side}"] = {"x": x0 + EXT_L, "y": TOP, "w": x1 - x0, "h": BOTTOM - TOP}

    # ------------------------------------------------ the frame: pillars, arch, urns, hanging vines
    fa = np.where(opening, front_a, 1.0)
    fa = np.minimum(fa, 1 - np.where(opening, bow_a, 0))
    frame = np.zeros((H, CW, 3), np.float32)
    falpha = np.zeros((H, CW), np.float32)
    frame[:, EXT_L:EXT_L + W] = img
    falpha[:, EXT_L:EXT_L + W] = fa
    frame[:, :EXT_L] = img[:, :EXT_L][:, ::-1]
    falpha[:, :EXT_L] = 1
    frame[:, EXT_L + W:] = img[:, W - EXT_R:][:, ::-1]
    falpha[:, EXT_L + W:] = 1
    # the garland and the tree above end on their own outline, not on a straight edge
    r, g, b = frame[..., 0], frame[..., 1], frame[..., 2]
    sky = (b - r > 12) & (frame.max(-1) > 185)
    cy = np.mgrid[0:H, 0:CW][0]
    outer = np.zeros((H, CW), bool)
    cut_l = seam_cut(frame, 0, 60, 470)
    cut_r = seam_cut(frame, CW - 60, CW, 470)
    for y in range(470):
        outer[y, :cut_l[y]] = True
        outer[y, cut_r[y]:] = True
    sky_cc = (sky & (cy < 470)).astype(np.uint8)
    n, lab = cv2.connectedComponents((sky_cc | outer).astype(np.uint8))
    edge_lab = np.unique(np.r_[lab[:470, 0], lab[:470, -1], lab[0, :EXT_L + 200], lab[0, -(EXT_R + 200):]])
    edge_lab = edge_lab[edge_lab > 0]
    clear = np.isin(lab, edge_lab) & (cy < 470)
    clear[:, EXT_L + 200:CW - EXT_R - 200] = False
    falpha = np.minimum(falpha, 1 - cv2.GaussianBlur(clear.astype(np.float32), (3, 3), 0.7))
    save("frame", frame, 255 * falpha, quality=82)
    manifest["layers"]["frame"] = {"x": 0, "y": 0, "w": CW, "h": H}

    # beyond the gate is open sky, drawn by the page (gate.css): no photograph needed
    vx0, vy0, vx1, vy1 = LEFT - 30, TOP - 20, RIGHT + 30, BOTTOM + 20
    view = np.zeros((vy1 - vy0, vx1 - vx0, 3), np.float32) + np.array([200, 222, 240], np.float32)

    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    print("manifest.json")

    if DEBUG:
        # the closed gate re-assembled from its layers, to compare with the photo
        comp = np.zeros((H, CW, 3), np.float32)
        comp[vy0:vy1, vx0 + EXT_L:vx1 + EXT_L] = view
        for side, (x0, x1) in (("l", (LEFT, SEAM)), ("r", (SEAM, RIGHT))):
            a = ia2[TOP:BOTTOM, x0:x1, None]
            sl = comp[TOP:BOTTOM, x0 + EXT_L:x1 + EXT_L]
            comp[TOP:BOTTOM, x0 + EXT_L:x1 + EXT_L] = sl * (1 - a) + rgb2[TOP:BOTTOM, x0:x1] * a
        sky_bg = np.array([214, 232, 248], np.float32)
        comp = np.where((comp.sum(-1) == 0)[..., None], sky_bg, comp)
        comp = comp * (1 - falpha[..., None]) + frame * falpha[..., None]
        for name in BOW_ORDER:
            a = pieces[name][..., None]
            sl = comp[:, EXT_L:EXT_L + W]
            comp[:, EXT_L:EXT_L + W] = sl * (1 - a) + bow_rgb * a
        dbg("composite", comp)
        nobow = np.zeros((H, CW, 3), np.float32)
        nobow[vy0:vy1, vx0 + EXT_L:vx1 + EXT_L] = view
        for side, (x0, x1) in (("l", (LEFT, SEAM)), ("r", (SEAM, RIGHT))):
            a = ia2[TOP:BOTTOM, x0:x1, None]
            sl = nobow[TOP:BOTTOM, x0 + EXT_L:x1 + EXT_L]
            nobow[TOP:BOTTOM, x0 + EXT_L:x1 + EXT_L] = sl * (1 - a) + rgb2[TOP:BOTTOM, x0:x1] * a
        nobow = np.where((nobow.sum(-1) == 0)[..., None], sky_bg, nobow)
        nobow = nobow * (1 - falpha[..., None]) + frame * falpha[..., None]
        dbg("nobow", nobow)


if __name__ == "__main__":
    main()
