"""Repaint the garden window as real white-painted wood, at 4x the old sprites' size.

The window keeps the old sprites' geometry (public/assets/window/frame.webp, door-l.webp and
door-r.webp from tools/build_window.py: a 324 x 348 casing whose opening is 34,28 258 x 304, split
into two shutters at x = 162), so everything placed round it still lines up. Its outlines are
redrawn as true curves (the casing's arch and the shutters' tops are arcs of one circle), and the
wood is drawn afresh:

  * planks of real-looking wood grain (fractal noise drawn out along the grain) under an off-white
    paint that is a little worn in places, with dark seams between the planks
  * a moulded casing: its edges catch the light from the upper left and fall into shade on the
    lower right; along the arch the grain follows the curve
  * black iron strap hinges with rivets, a handle on each shutter, and knuckles on the casing,
    each casting a soft shadow on the paint

    python3 tools/build_window_wood.py   # writes public/assets/window/{frame,door-l,door-r}-painted.webp
"""
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "public", "assets", "window")
S = 4  # output scale over the old sprites
rng = np.random.default_rng(7)

PAINT = np.array([238, 235, 227], np.float32)
WOOD = np.array([176, 160, 138], np.float32)
IRON = np.array([38, 36, 35], np.float32)


# the geometry, in the old sprites' px: the arch is centred at (CX, CY); the casing runs from
# radius R_IN (the opening) to R_OUT, its posts from X_OUT to the opening, its sill under it
CX, CY = 162.0, 206.0
R_OUT, R_IN = 203.0, 178.0
X_OUT_L, X_OUT_R = 7.0, 317.0
OPEN = (34.0, 28.0, 292.0, 332.0)  # x0, y0, x1, y1
FOOT = 341.0
SS = 3  # supersampling for the outlines


def _grid(w, h, x0=0.0, y0=0.0):
    """Sample positions (old-sprite px) of an S x image whose top left is (x0, y0)."""
    ys, xs = np.mgrid[0:h * SS, 0:w * SS].astype(np.float32)
    return x0 + (xs + 0.5) / (S * SS), y0 + (ys + 0.5) / (S * SS)


def _down(m, w, h):
    return cv2.resize(m.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)


def opening(x, y):
    """Inside the window's opening (the arch above, the sill below)."""
    return (x >= OPEN[0]) & (x <= OPEN[2]) & (y <= OPEN[3]) & ((x - CX) ** 2 + (y - CY) ** 2 <= R_IN ** 2) | \
        ((x >= OPEN[0]) & (x <= OPEN[2]) & (y >= CY) & (y <= OPEN[3]))


def frame_mask():
    w, h = 324 * S, 348 * S
    x, y = _grid(w, h)
    outer = (x >= X_OUT_L) & (x <= X_OUT_R) & (y <= FOOT) & (((x - CX) ** 2 + (y - CY) ** 2 <= R_OUT ** 2) | (y >= CY - np.sqrt(R_OUT ** 2 - (X_OUT_R - CX) ** 2)))
    return _down(outer & ~opening(x, y), w, h)


def door_mask(left):
    x0 = OPEN[0] if left else CX
    x1 = CX if left else OPEN[2]
    w, h = int(round((x1 - x0) * S)), int(round((OPEN[3] - OPEN[1]) * S))
    x, y = _grid(w, h, x0, OPEN[1])
    return _down(opening(x, y), w, h)


def fbm(h, w, sx, sy, octaves=5, seed=0):
    """Fractal noise; sx/sy are the base feature sizes (px) across and along the grain."""
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gx, gy = max(2, int(w / sx) + 2), max(2, int(h / sy) + 2)
        n = r.standard_normal((gy, gx)).astype(np.float32)
        out += amp * cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
        tot += amp
        amp *= 0.55
        sx, sy = sx / 2, sy / 2
    return out / tot


def wood(h, w, seed, along="y"):
    """Painted wood, grain running down (along='y') the board: an RGB float image."""
    if along == "y":
        g = fbm(h, w, 6 * S, 140 * S, 6, seed)
        fine = fbm(h, w, 1.2 * S, 30 * S, 3, seed + 1)
    else:
        g = fbm(h, w, 140 * S, 6 * S, 6, seed)
        fine = fbm(h, w, 30 * S, 1.2 * S, 3, seed + 1)
    # a few darker streaks in the grain
    streak = np.clip(np.abs(fbm(h, w, 3 * S if along == "y" else 90 * S, 90 * S if along == "y" else 3 * S, 3, seed + 2)) * 2.2 - 1.2, 0, 1)
    lum = 1 + 0.018 * g + 0.010 * fine - 0.03 * streak
    img = PAINT[None, None, :] * lum[..., None]
    # paint worn thin in places, the wood showing through
    wear = fbm(h, w, 40 * S, 40 * S, 4, seed + 3)
    wear = np.clip((wear - 0.95) * 2.5, 0, 1) * np.clip(0.5 + 0.5 * g, 0, 1)
    img = img * (1 - 0.35 * wear[..., None]) + WOOD[None, None, :] * (0.35 * wear[..., None])
    # paper-fine speckle
    img += rng.normal(0, 1.6, (h, w, 1)).astype(np.float32)
    return img


def soft_shadow(mask, dx, dy, blur, strength):
    """A shadow (0..1 darkening) cast by `mask` onto what is under it."""
    m = np.roll(np.roll(mask, int(dy), 0), int(dx), 1)
    return cv2.GaussianBlur(m, (0, 0), blur) * strength


def iron(img, shape, shade_dir=(0, 1)):
    """Lay black iron (with a highlight along its upper edge and a shadow below) where `shape` is."""
    sh = soft_shadow(shape, 2 * S * 0.6, 3 * S * 0.6, 2.2 * S * 0.6, 0.42)
    img *= (1 - np.clip(sh - shape, 0, 1))[..., None]
    gy = cv2.Sobel(cv2.GaussianBlur(shape, (0, 0), S * 0.6), cv2.CV_32F, 0, 1, ksize=3)
    gx = cv2.Sobel(cv2.GaussianBlur(shape, (0, 0), S * 0.6), cv2.CV_32F, 1, 0, ksize=3)
    light = np.clip(gy * 1.6 + gx * 0.8, 0, 1)  # edges facing up and left
    metal = IRON[None, None, :] * (1 + 0.25 * fbm(*shape.shape, 8 * S, 8 * S, 3, 11))[..., None]
    metal = metal + light[..., None] * 95
    img[:] = img * (1 - shape[..., None]) + metal * shape[..., None]


def ellipse_mask(h, w, cx, cy, rx, ry):
    m = np.zeros((h * 2, w * 2), np.uint8)
    cv2.ellipse(m, (int(cx * 2), int(cy * 2)), (max(1, int(rx * 2)), max(1, int(ry * 2))), 0, 0, 360, 255, -1, cv2.LINE_AA)
    return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def poly_mask(h, w, pts):
    m = np.zeros((h * 2, w * 2), np.uint8)
    cv2.fillPoly(m, [np.round(np.array(pts) * 2).astype(np.int32)], 255, cv2.LINE_AA)
    return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def edge_shading(mask, width, k_light, k_ao):
    """Rounded edges: lit on the upper left, shaded on the lower right, a touch darker at the rim."""
    m8 = (mask > 0.5).astype(np.uint8)
    d = cv2.distanceTransform(m8, cv2.DIST_L2, 5).astype(np.float32)
    band = np.clip(1 - d / width, 0, 1)
    ds = cv2.GaussianBlur(d, (0, 0), width * 0.35)
    gx = cv2.Sobel(ds, cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(ds, cv2.CV_32F, 0, 1, ksize=5)
    n = np.sqrt(gx ** 2 + gy ** 2) + 1e-6
    # the gradient points inward; light from the upper left lights the edges whose inside is down-right
    facing = (gx / n) * 0.6 + (gy / n) * 0.8
    return 1 + band * (k_light * facing) - band ** 2 * k_ao


def finish(img, mask):
    rgba = np.dstack([np.clip(img, 0, 255), mask * 255]).astype(np.uint8)
    return Image.fromarray(rgba)


# ------------------------------------------------------------------ the shutters
def door(hinge_left, seed):
    m = door_mask(hinge_left)
    h, w = m.shape
    img = wood(h, w, seed)
    # four boards (the narrow one on the hinge side), each painted a shade apart
    seams = [0.13, 0.36, 0.585, 0.80] if hinge_left else [0.20, 0.415, 0.64, 0.87]
    edges = [0.0] + seams + [1.0]
    for i in range(len(edges) - 1):
        x0, x1 = int(edges[i] * w), int(edges[i + 1] * w)
        img[:, x0:x1] *= 1 + rng.uniform(-0.018, 0.018)
    for s in seams:
        x = s * w
        xs = np.arange(w, dtype=np.float32)
        dark = np.exp(-((xs - x) / (0.55 * S)) ** 2) * 0.55
        shade = np.clip((xs - x) / (3.2 * S), 0, 1) * np.exp(-np.clip(xs - x, 0, None) / (3.2 * S)) * 0.16
        lit = np.exp(-((xs - (x - 1.1 * S)) / (0.5 * S)) ** 2) * 0.08
        img *= (1 - dark - shade + lit)[None, :, None]
    img *= edge_shading(m, 3.5 * S, 0.10, 0.18)[..., None]
    # light falls a little brighter towards the top
    img *= (1.03 - 0.06 * np.linspace(0, 1, h, dtype=np.float32))[:, None, None]

    # strap hinges from the hinge edge, ending in a spear point, with three rivets
    for yy in (0.29, 0.84):
        y = yy * h
        t = 0.017 * h  # half thickness
        L = 0.36 * w
        if hinge_left:
            pts = [(0, y - t), (L - 3.2 * t, y - t), (L - 2.4 * t, y - 1.9 * t), (L, y), (L - 2.4 * t, y + 1.9 * t), (L - 3.2 * t, y + t), (0, y + t)]
        else:
            pts = [(w, y - t), (w - L + 3.2 * t, y - t), (w - L + 2.4 * t, y - 1.9 * t), (w - L, y), (w - L + 2.4 * t, y + 1.9 * t), (w - L + 3.2 * t, y + t), (w, y + t)]
        strap = poly_mask(h, w, pts) * m
        iron(img, strap)
        for f in (0.12, 0.42, 0.7):
            cx = f * L if hinge_left else w - f * L
            # a domed rivet: a darker rim, a small highlight up and to the left
            rim = ellipse_mask(h, w, cx, y, 0.5 * t, 0.5 * t)
            hi = ellipse_mask(h, w, cx - 0.15 * t, y - 0.15 * t, 0.2 * t, 0.2 * t)
            img *= (1 - 0.35 * rim)[..., None]
            img += (hi * 26)[..., None]
    # the handle near the meeting edge: two diamond plates and a bar
    hx = 0.86 * w if hinge_left else 0.14 * w
    p = 0.022 * h
    plates = np.zeros((h, w), np.float32)
    for yy in (0.465, 0.635):
        y = yy * h
        plates = np.maximum(plates, poly_mask(h, w, [(hx, y - p), (hx + 0.7 * p, y), (hx, y + p), (hx - 0.7 * p, y)]))
    bar = np.zeros((h * 2, w * 2), np.uint8)
    off = (-1 if hinge_left else 1) * 0.9 * p
    pts = np.array([(hx, 0.48 * h), (hx + off, 0.50 * h), (hx + off, 0.60 * h), (hx, 0.62 * h)], np.float32) * 2
    cv2.polylines(bar, [pts.astype(np.int32)], False, 255, int(0.36 * p * 2), cv2.LINE_AA)
    bar = cv2.resize(bar, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    iron(img, np.clip(plates + bar, 0, 1) * m)
    return finish(img, m)


# ------------------------------------------------------------------ the casing
def frame():
    m = frame_mask()
    h, w = m.shape
    # the arch: where the casing turns from its posts into the curve (the posts' tops)
    spring = int((CY - np.sqrt(R_OUT ** 2 - (X_OUT_R - CX) ** 2)) * S)
    posts = wood(h, w, 21, "y")
    # along the arch the grain follows the curve: noise laid out in polar coordinates round the
    # arch's centre, then mapped back
    cx, cy = CX * S, CY * S
    R = R_OUT * S
    ang_n, rad_n = 1400, 220
    polar = wood(rad_n * 1, ang_n, 23, "x")  # (radius, angle): grain runs along the angle
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    rr = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    th = np.arctan2(xs - cx, cy - ys)  # 0 straight up
    map_x = ((th + 1.2) / 2.4 * (ang_n - 1)).astype(np.float32)
    map_y = np.clip((R - rr) / ((R_OUT - R_IN) * S) * (rad_n - 1), 0, rad_n - 1).astype(np.float32)
    arch = cv2.remap(polar, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    blend = np.clip((spring + 3 * S - ys) / (6 * S), 0, 1)[..., None]
    img = posts * (1 - blend) + arch * blend
    # the mitre joints where the arch meets the posts
    for x0, x1 in ((0, 0.18 * w), (0.82 * w, w)):
        line = np.zeros((h, w), np.float32)
        yy = np.arange(h, dtype=np.float32)[:, None]
        line += np.exp(-((yy - spring) / (0.5 * S)) ** 2) * ((xs >= x0) & (xs <= x1))
        img *= (1 - 0.35 * line)[..., None]
    # the moulding: rounded on both edges, and a groove a little inside the outer edge
    img *= edge_shading(m, 6 * S, 0.16, 0.22)[..., None]
    d = cv2.distanceTransform((m > 0.5).astype(np.uint8), cv2.DIST_L2, 5).astype(np.float32)
    groove = np.exp(-((d - 7.5 * S) / (0.7 * S)) ** 2)
    img *= (1 - 0.10 * groove)[..., None]
    # the casing's shadow falling into the opening side of itself (deeper at the bottom)
    img *= (1.02 - 0.05 * (ys / h))[..., None]
    # hinge knuckles on the inner edges of the posts
    op_l, op_r = 34 / 324 * w, (34 + 258) / 324 * w
    for yy in (0.31, 0.82):
        y = yy * h
        for x in (op_l - 0.6 * S, op_r + 0.6 * S):
            k = poly_mask(h, w, [(x - 2.2 * S, y - 7 * S), (x + 2.2 * S, y - 7 * S), (x + 2.2 * S, y + 7 * S), (x - 2.2 * S, y + 7 * S)])
            iron(img, k * m)
    return finish(img, m)


if __name__ == "__main__":
    out = {"frame-painted": frame(), "door-l-painted": door(True, 31), "door-r-painted": door(False, 41)}
    for n, im in out.items():
        p = os.path.join(DIR, f"{n}.webp")
        im.save(p, "WEBP", quality=88, method=6)
        print(p, im.size)
