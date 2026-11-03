"""Image maths shared by build_layers.py (automatic cuts from the reference) and
import_layers.py (hand-cut layers from a final master).

Arrays are OpenCV-style BGR uint8 colour plus a float32 alpha in 0..1. Pixel
sizes are given at the reference scale (941 px wide) and multiplied by `scale`,
so a 2x master gets proportionally the same blur, extension and texture.
"""
import hashlib
import os

import cv2
import numpy as np
from PIL import Image

REF_W = 941          # width of the original reference, the unit for every ratio below
EXT_RATIO = 420 / REF_W    # mirrored garden added on each side
SKIP_RATIO = 52 / REF_W    # edge vine strip (pergola post) that is not repeated
REAL_RATIO = 150 / REF_W   # outer columns that are real garden (not behind the couple)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def band(n, a0, a1, b0, b1):
    """1-D ramp: 0 before a0, 1 between a1 and b0, 0 after b1."""
    x = np.arange(n, dtype=np.float32)
    return smoothstep(a0, a1, x) * (1 - smoothstep(b0, b1, x))


def soften(strip, alpha, seam_left, scale=1.0):
    """Blur grows with distance from the seam: reads as lens fall-off, hides the mirror."""
    w = strip.shape[1]
    d = np.linspace(0, 1, w, dtype=np.float32)
    if not seam_left:
        d = d[::-1]
    out_c = strip.astype(np.float32).copy()
    out_a = alpha.astype(np.float32).copy()
    for sigma, lo, hi in [(1.2, 0.0, 0.12), (3, 0.06, 0.28), (7, 0.2, 0.48), (14, 0.4, 0.72), (24, 0.65, 1.0)]:
        bc = cv2.GaussianBlur(strip.astype(np.float32), (0, 0), sigma * scale)
        ba = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), sigma * scale)
        t = smoothstep(lo, hi, d)[None, :]
        out_c = out_c * (1 - t[..., None]) + bc * t[..., None]
        out_a = out_a * (1 - t) + ba * t
    return np.clip(out_c, 0, 255).astype(np.uint8), out_a


def pingpong(strip, n):
    """Repeat a strip by alternating mirrors until it is n px wide (seam side first)."""
    parts, cur, flip = [], 0, True
    while cur < n:
        parts.append(np.flip(strip, 1) if flip else strip)
        cur += strip.shape[1]
        flip = not flip
    return np.concatenate(parts, 1)[:, :n]


def mirror_extend(rgb, alpha, ext, skip, real, left=True, right=True, scale=1.0):
    """Adds `ext` px of softened, mirrored garden on the chosen sides (zeros on the others)."""
    W = rgb.shape[1]
    if left:
        lc = np.flip(pingpong(rgb[:, skip:skip + real], ext), 1)
        la = np.flip(pingpong(alpha[:, skip:skip + real], ext), 1)
        lc, la = soften(lc, la, seam_left=False, scale=scale)
    if right:
        rc = pingpong(np.flip(rgb[:, W - (skip + real):W - skip], 1), ext)
        ra = pingpong(np.flip(alpha[:, W - (skip + real):W - skip], 1), ext)
        rc, ra = soften(np.ascontiguousarray(rc), np.ascontiguousarray(ra), seam_left=True, scale=scale)
    rgb2 = np.concatenate(([lc] if left else []) + [rgb] + ([rc] if right else []), 1)
    a2 = np.concatenate(([la] if left else []) + [alpha] + ([ra] if right else []), 1)
    if not left:
        rgb2 = np.concatenate([np.zeros_like(rgb[:, :ext]), rgb2], axis=1)
        a2 = np.concatenate([np.zeros_like(alpha[:, :ext]), a2], axis=1)
    if not right:
        rgb2 = np.concatenate([rgb2, np.zeros_like(rgb[:, :ext])], axis=1)
        a2 = np.concatenate([a2, np.zeros_like(alpha[:, :ext])], axis=1)
    return rgb2, a2


def pad_wide(rgb, alpha, ext):
    z3 = np.zeros((rgb.shape[0], ext, 3), rgb.dtype)
    z1 = np.zeros((alpha.shape[0], ext), alpha.dtype)
    return np.concatenate([z3, rgb, z3], 1), np.concatenate([z1, alpha, z1], 1)


def fbm(h, w, octaves=5, base=64, seed=0):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = max(2, int(base / (2 ** o)))
        n = rng.random(((h // s) + 3, (w // s) + 3)).astype(np.float32)
        n = cv2.resize(n, ((w // s + 3) * s, (h // s + 3) * s), interpolation=cv2.INTER_CUBIC)[:h, :w]
        acc += amp * n
        tot += amp
        amp *= 0.55
    return acc / tot


def make_cloud(w, h, seed):
    n = fbm(h, w, 6, base=max(w, h) // 3, seed=seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ex = ((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.58) / (h * 0.46)) ** 2
    shape = np.clip(1.1 - ex, 0, 1)
    dens = smoothstep(0.42, 0.78, n * 0.55 + shape * 0.75)
    dens = cv2.GaussianBlur(dens, (0, 0), 2.2)
    shade = 0.86 + 0.14 * (1 - yy / h)
    col = np.stack([248 * shade, 249 * shade, 252 * shade], -1)
    col = col + (n[..., None] - 0.5) * 10
    return np.clip(col, 0, 255).astype(np.uint8), (dens * 0.92).astype(np.float32)


def make_hills(w, h, scale=1.0):
    """Two hazy ridges, tinted from the reference's distant hills."""
    x = np.arange(w, dtype=np.float32)
    rng = np.random.default_rng(7)

    def ridge(base, amp, seed, freq):
        r = np.zeros(w, np.float32)
        a = amp
        for o in range(5):
            ph = rng.random() * 6.28
            r += a * np.sin(x / w * 6.28 * freq * (2 ** o) + ph)
            a *= 0.45
        return base + r

    yy = np.arange(h, dtype=np.float32)[:, None]
    far_r = ridge(h * 0.30, h * 0.10, 1, 1.3)
    near_r = ridge(h * 0.52, h * 0.12, 2, 1.9)
    e = 1.5 * scale
    a_far = smoothstep(-e, e, yy - far_r[None, :])
    a_near = smoothstep(-e, e, yy - near_r[None, :])
    tex = fbm(h, w, 5, base=int(24 * scale), seed=3)
    farc = np.array([196, 190, 172], np.float32)   # BGR hazy blue-grey
    nearc = np.array([128, 158, 148], np.float32)  # BGR muted green
    depth_far = smoothstep(0, h * 0.5, yy - far_r[None, :])[..., None]
    col_far = farc - depth_far * np.array([30, 22, 30]) + (tex[..., None] - 0.5) * 14
    depth_near = smoothstep(0, h * 0.45, yy - near_r[None, :])[..., None]
    col_near = nearc - depth_near * np.array([40, 30, 46]) + (tex[..., None] - 0.5) * 26
    col = col_far * (1 - a_near[..., None]) + col_near * a_near[..., None]
    alpha = np.maximum(a_far, a_near)
    col = cv2.GaussianBlur(col.astype(np.float32), (0, 0), 1.2 * scale)
    return np.clip(col, 0, 255).astype(np.uint8), alpha.astype(np.float32)


def alpha_box(alpha, thresh=0.004):
    """(x0, y0, x1, y1) of everything visible, or None for an empty layer."""
    ys, xs = np.where(alpha > thresh)
    if not len(ys):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resize_rgba(rgb, alpha, size):
    """Resizes colour + alpha with premultiplication, so edges never gain a dark or pale halo."""
    w, h = size
    a = alpha.astype(np.float32)[..., None]
    shrink = w < rgb.shape[1]
    interp = cv2.INTER_AREA if shrink else cv2.INTER_LANCZOS4
    pre = cv2.resize(rgb.astype(np.float32) * a, (w, h), interpolation=interp)
    a2 = np.clip(cv2.resize(alpha.astype(np.float32), (w, h), interpolation=interp), 0, 1)
    out = np.where(a2[..., None] > 1e-3, pre / np.maximum(a2[..., None], 1e-3), 0)
    return np.clip(out, 0, 255).astype(np.uint8), a2


def content_version(folder):
    """Short hash of every image in `folder` (and its m/ set): changes whenever any layer does."""
    h = hashlib.md5()
    for root, _, files in sorted(os.walk(folder)):
        for f in sorted(files):
            if f.endswith((".webp", ".avif")):
                with open(os.path.join(root, f), "rb") as fh:
                    h.update(f.encode() + fh.read())
    return h.hexdigest()[:10]


def write_image(base, rgb, alpha=None, quality=84):
    """Writes base.webp + base.avif (AVIF quality tracks the WebP quality)."""
    im = Image.fromarray(cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB))
    if alpha is not None:
        im.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)))
    os.makedirs(os.path.dirname(base), exist_ok=True)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=max(quality - 26, 45))
    return os.path.getsize(base + ".webp"), os.path.getsize(base + ".avif")
