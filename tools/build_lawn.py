"""Builds the open lawn the garden window stands on (public/assets/window/lawn.webp):

    python3 tools/build_lawn.py
    LAWN_DEBUG=/tmp/l python3 tools/build_lawn.py     # also writes inspection images

The grass is real: it comes from the sharp, sunlit lawn of assets-src/botanical/ref-welcome.webp.
That stretch of lawn is small, so it is never stretched. Instead:

  1  quilting: patches of the real grass are stitched, edge to edge along their least visible
     seams, into a large lawn that tiles seamlessly both ways (Efros & Freeman's image quilting)
  2  perspective: the lawn is laid out as a ground plane running to the horizon. Near grass is
     shown at its photographed size (never larger), each row further away smaller, sampled from
     pre-shrunk copies so it stays crisp, not blurred
  3  distance: the far grass takes on the light haze of the air, and the horizon is a clean edge
     against the sky, with low, hazy hills beyond it

The image has a transparent sky, so the section's own sky shows above the hills.
"""
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "botanical", "ref-welcome.webp")
OUT = os.path.join(ROOT, "public", "assets", "window", "lawn.webp")
DEBUG = os.environ.get("LAWN_DEBUG")

GRASS = (640, 796, 900, 872)        # an evenly lit stretch of the Welcome photo's lawn: clumps,
                                    # blades and small flecks of sun, no large shadows
P, O = 42, 10                       # quilting patch and overlap
STEP = P - O
NX, NY = 80, 40                     # 2560 x 1280: tiles both ways, and halves cleanly 7 times
W, LAWN_H, HILLS_H = 2400, 640, 84  # the finished image
D0 = 12                             # how far below the horizon the first row of grass lies


def mincut(err):
    """Cheapest top-to-bottom path through err (rows x cols): the column to cut at, per row."""
    h, w = err.shape
    cost = err.copy()
    for r in range(1, h):
        prev = cost[r - 1]
        left = np.r_[np.inf, prev[:-1]]
        right = np.r_[prev[1:], np.inf]
        cost[r] += np.minimum(np.minimum(left, prev), right)
    path = np.zeros(h, int)
    path[-1] = int(np.argmin(cost[-1]))
    for r in range(h - 2, -1, -1):
        c = path[r + 1]
        lo, hi = max(c - 1, 0), min(c + 2, w)
        path[r] = lo + int(np.argmin(cost[r, lo:hi]))
    return path


def quilt(src, rng):
    """A seamless (wrap-around both ways) lawn quilted from patches of src."""
    # the grass and its mirror image, stacked: twice the variety (no patch may straddle the join)
    h0 = src.shape[0]
    src = np.ascontiguousarray(np.concatenate([src, src[:, ::-1]], 0))
    sh, sw = src.shape[:2]
    Hc, Wc = NY * STEP + O, NX * STEP + O
    out = np.zeros((Hc, Wc, 3), np.float32)
    mt = lambda templ: cv2.matchTemplate(src, np.ascontiguousarray(templ), cv2.TM_SQDIFF)
    ny_c, nx_c = sh - P + 1, sw - P + 1
    for i in range(NY):
        for j in range(NX):
            y, x = i * STEP, j * STEP
            left, top = j > 0, i > 0
            right, bottom = j == NX - 1, i == NY - 1
            # the wrap: the far edges overlap what the first row and column already hold
            if right:
                out[y:y + P, NX * STEP:NX * STEP + O] = out[y:y + P, 0:O]
            if bottom:
                out[NY * STEP:NY * STEP + O, x:x + P] = out[0:O, x:x + P]
            score = np.zeros((ny_c, nx_c), np.float32)
            if left:
                score += mt(out[y:y + P, x:x + O])[:ny_c, :nx_c]
            if top:
                score += mt(out[y:y + O, x:x + P])[:ny_c, :nx_c]
            if right:
                score += mt(out[y:y + P, x + P - O:x + P])[:ny_c, P - O:P - O + nx_c]
            if bottom:
                score += mt(out[y + P - O:y + P, x:x + P])[P - O:P - O + ny_c, :nx_c]
            score[max(0, h0 - P + 1):h0] = np.inf
            if not (left or top):
                py, px = rng.integers(0, h0 - P + 1), rng.integers(0, nx_c)
            else:
                best = float(score.min())
                cand = np.argwhere(score <= best * 1.3 + 1e-6)
                py, px = cand[rng.integers(0, len(cand))]
            patch = src[py:py + P, px:px + P]
            take = np.ones((P, P), bool)
            region = out[y:y + P, x:x + P]
            if left:
                cut = mincut(((patch[:, :O] - region[:, :O]) ** 2).sum(-1))
                for r in range(P):
                    take[r, :cut[r]] = False
            if right:
                cut = mincut(((patch[:, P - O:] - region[:, P - O:]) ** 2).sum(-1))
                for r in range(P):
                    take[r, P - O + cut[r] + 1:] = False
            if top:
                cut = mincut(((patch[:O, :] - region[:O, :]) ** 2).sum(-1).T)
                for c in range(P):
                    take[:cut[c], c] = False
            if bottom:
                cut = mincut(((patch[P - O:, :] - region[P - O:, :]) ** 2).sum(-1).T)
                for c in range(P):
                    take[P - O + cut[c] + 1:, c] = False
            out[y:y + P, x:x + P] = np.where(take[..., None], patch, region)
            # carry the wrapped edges back to the start, so the lawn tiles
            if right:
                out[y:y + P, 0:O] = out[y:y + P, NX * STEP:NX * STEP + O]
            if bottom:
                out[0:O, x:x + P] = out[NY * STEP:NY * STEP + O, x:x + P]
    return out[:NY * STEP, :NX * STEP]


def smooth_noise(shape, cells, rng, octaves=3):
    """Soft, large-scale variation (sunlight and shade on the lawn), tileable."""
    h, w = shape
    total = np.zeros(shape, np.float32)
    amp, norm = 1.0, 0.0
    for k in range(octaves):
        cy, cx = cells[0] * 2 ** k, cells[1] * 2 ** k
        g = rng.standard_normal((cy, cx)).astype(np.float32)
        g = np.concatenate([g, g[:, :1]], 1); g = np.concatenate([g, g[:1]], 0)
        total += amp * cv2.resize(g, (w + w // cx, h + h // cy), interpolation=cv2.INTER_CUBIC)[:h, :w]
        norm += amp
        amp *= 0.5
    return total / norm


def main():
    rng = np.random.default_rng(15082027)
    img = np.array(Image.open(SRC).convert("RGB")).astype(np.float32)
    x0, y0, x1, y1 = GRASS
    src = img[y0:y1, x0:x1].copy()
    # even out what little large-scale light it has, then brighten it to a sunny summer lawn,
    # keeping all of its own detail
    lum = src.mean(-1)
    low = cv2.GaussianBlur(lum, (0, 0), 14)
    src *= (np.clip(low.mean() / np.maximum(low, 1), 0.7, 1.4) ** 0.8)[..., None]
    target = np.array([112, 150, 48], np.float32)
    src = np.clip(255 * (src / 255) ** 0.85 * (target / (255 * (src.reshape(-1, 3).mean(0) / 255) ** 0.85)), 0, 255).astype(np.float32)

    Q = quilt(src, rng)
    Qh, Qw = Q.shape[:2]
    # (a little of the blades' own light back, so they read as grass, not felt)
    if DEBUG:
        Image.fromarray(Q.astype(np.uint8)).save(os.path.join(DEBUG, "quilt.png"))

    # pre-shrunk copies (sharp area averaging, never blurred)
    mips = [Q]
    while mips[-1].shape[1] > 40:
        m = mips[-1]
        mips.append(cv2.resize(m, (m.shape[1] // 2, m.shape[0] // 2), interpolation=cv2.INTER_AREA))
    L = len(mips) - 1

    # ------------------------------------------------ the ground plane
    ys = np.arange(LAWN_H, dtype=np.float32)
    s = (ys + D0) / (LAWN_H - 1 + D0)                 # 1 at the foot, ~0.02 at the horizon
    dty = s ** -1.5                                   # rows of grass per row of the image
    ty = np.cumsum(dty[::-1])[::-1] - dty[-1]         # 0 at the foot, growing into the distance
    ty = -ty + 400.0
    X = np.arange(W, dtype=np.float32)
    level = np.clip(np.log2(1 / s) * 1.05, 0, L)
    lawn = np.zeros((LAWN_H, W, 3), np.float32)
    weight = np.zeros(LAWN_H, np.float32)
    for k in range(L + 1):
        wk = np.clip(1 - np.abs(level - k), 0, 1)
        rows = np.where(wk > 0)[0]
        if not len(rows):
            continue
        sc = 2.0 ** k
        mapx = ((X[None, :] - W / 2) / s[rows, None] + 1100.0) / sc
        mapy = np.repeat((ty[rows] / sc)[:, None], W, axis=1)
        part = cv2.remap(mips[k], mapx.astype(np.float32), mapy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        lawn[rows] += part * wk[rows, None, None]
        weight[rows] += wk[rows]
    lawn /= np.maximum(weight, 1e-6)[:, None, None]

    # sunlight and soft shade across the lawn, laid out on the ground itself (never repeating):
    # sunlit grass warmer and brighter, the shade a deeper, cooler green; it fades into the
    # evenness of the distance
    grid = rng.standard_normal((48, 1600)).astype(np.float32)
    grid = cv2.GaussianBlur(grid, (0, 0), 0.9)
    grid /= grid.std()
    wx = ((X[None, :] - W / 2) / s[:, None]) / 520.0 + 800
    wy = np.repeat(((ty - ty.min()) / 360.0)[:, None], W, axis=1) + 4
    n = cv2.remap(grid, wx.astype(np.float32), wy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    n += 0.45 * cv2.remap(grid, ((wx - 800) * 2.3 + 800).astype(np.float32), (wy * 1.6 + 3).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    fade = np.clip((s - 0.03) / 0.25, 0, 1)[:, None]
    sun = np.clip(0.6 + 0.26 * n * fade, 0, 1)[..., None]
    lit = np.array([1.16, 1.12, 0.96], np.float32)
    shade = np.array([0.84, 0.9, 0.92], np.float32)
    lawn = np.clip(lawn * (shade + (lit - shade) * sun), 0, 255)

    # ------------------------------------------------ distance: the air's own haze
    haze = np.array([214, 228, 222], np.float32)
    d = ys
    a = 0.62 * np.exp(-d / 46) + 0.12 * np.exp(-d / 170)
    lawn = lawn * (1 - a[:, None, None]) + haze * a[:, None, None]
    # a touch less saturated in the distance
    grey = lawn.mean(-1, keepdims=True)
    desat = (0.35 * np.exp(-d / 90))[:, None, None]
    lawn = lawn * (1 - desat) + grey * desat

    # ------------------------------------------------ the horizon and the hills beyond it
    # layered back to front: far hills, nearer hills, then the lawn, each a clean edge
    H = HILLS_H + LAWN_H
    xs = np.linspace(0, 1, W)
    wave = lambda f, ph: np.sin(2 * np.pi * (f * xs + ph))
    yy = np.arange(H, dtype=np.float32)[:, None]
    C = np.zeros((H, W, 3), np.float32)     # premultiplied colour
    A = np.zeros((H, W, 1), np.float32)

    def over(colour, cover):
        nonlocal C, A
        a = cover[..., None]
        C = C * (1 - a) + colour * a
        A = A * (1 - a) + a

    hills = (
        (HILLS_H - (34 + 16 * wave(1.3, 0.1) + 9 * wave(3.1, 0.6) + 4 * wave(7.7, 0.3)), (188, 206, 212), 0.55),
        (HILLS_H - (15 + 9 * wave(1.9, 0.45) + 5 * wave(4.3, 0.2) + 2.5 * wave(11, 0.7)), (172, 197, 187), 0.78),
    )
    for top, col, op in hills:
        depth = np.clip((yy - top[None, :]) / 38, 0, 1)[..., None]
        colour = np.array(col, np.float32) * (1 - 0.14 * depth) + np.array([230, 237, 235], np.float32) * 0.14 * depth
        over(colour, np.clip(yy - top[None, :] + 0.5, 0, 1) * op)
    # the lawn's far edge rises and falls a little, as an open meadow's does
    edge = HILLS_H + 3 * wave(0.8, 0.15) + 1.5 * wave(2.6, 0.5)
    full = np.empty((H, W, 3), np.float32)
    full[HILLS_H:] = lawn
    full[:HILLS_H] = lawn[0]
    over(full, np.clip(yy - edge[None, :] + 0.5, 0, 1))
    rgb = C / np.maximum(A, 1e-4)
    alpha = A[..., 0]

    im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8))
    im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=2))
    im.save(OUT, quality=84, method=6)
    print(f"lawn.webp: {im.width}x{im.height}  {os.path.getsize(OUT) // 1024} KB  (horizon {HILLS_H}px from the top)")
    if DEBUG:
        sky = Image.new("RGBA", im.size, (196, 220, 240, 255))
        sky.alpha_composite(im)
        sky.convert("RGB").save(os.path.join(DEBUG, "lawn_on_sky.png"))


if __name__ == "__main__":
    main()
