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
EXT_RATIO = 640 / REF_W    # sharp garden continued on each side (reaches the edges of a 21:9 screen)
SKIP_RATIO = 52 / REF_W    # edge vine strip (pergola post) that is replaced, not repeated
REAL_RATIO = 150 / REF_W   # outer columns that are real garden (not behind the couple)
GROW = 0.3                 # trees continued past the edge grow this much by the far end (nearer in the avenue)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def band(n, a0, a1, b0, b1):
    """1-D ramp: 0 before a0, 1 between a1 and b0, 0 after b1."""
    x = np.arange(n, dtype=np.float32)
    return smoothstep(a0, a1, x) * (1 - smoothstep(b0, b1, x))


def pingpong(strip, n, flip_first=True):
    """Repeat a strip by alternating mirrors until it is n px wide."""
    parts, cur, flip = [], 0, flip_first
    while cur < n:
        parts.append(np.flip(strip, 1) if flip else strip)
        cur += strip.shape[1]
        flip = not flip
    return np.concatenate(parts, 1)[:, :n]


def _grow(rgb, alpha, grow, pivot, seam_right):
    """Perspective continuation: content scales up steadily with distance from the seam, around
    row `pivot`, so trees past the edge read as nearer, larger trees rather than repeats."""
    h, n = alpha.shape
    u = np.arange(n, dtype=np.float32)
    if seam_right:
        u = u[::-1]                      # distance from the seam, in output px
    s = 1 + grow * u / max(n - 1, 1)
    # source distance: integral of du / s(u), so the stretch is continuous (no steps)
    g = max(grow, 1e-6)
    u_src = (n - 1) / g * np.log1p(g * u / max(n - 1, 1))
    x_src = (n - 1 - u_src) if seam_right else u_src
    ys = np.arange(h, dtype=np.float32)[:, None]
    map_x = np.repeat(x_src[None, :], h, 0).astype(np.float32)
    map_y = (pivot + (ys - pivot) / s[None, :]).astype(np.float32)
    a = alpha.astype(np.float32)
    pre = cv2.remap(rgb.astype(np.float32) * a[..., None], map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    a2 = np.clip(cv2.remap(a, map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT), 0, 1)
    out = np.where(a2[..., None] > 1e-3, pre / np.maximum(a2[..., None], 1e-3), 0)
    return np.clip(out, 0, 255).astype(np.uint8), a2


def mirror_extend(rgb, alpha, ext, skip, real, left=True, right=True, scale=1.0, grow=0.0, pivot=None):
    """Continues the garden `ext` px past the chosen edges (zeros on the others), at full sharpness.

    The `real` columns next to the edge are mirrored outward (mirroring keeps every row continuous
    across the seam); the `skip` px edge strip (the vine post) is replaced rather than repeated, so
    the layer keeps its width. With `grow`, the continuation also scales up steadily around row
    `pivot`, the way a cypress avenue's trees get larger towards the viewer.
    """
    W = rgb.shape[1]
    n = ext + skip
    pivot = alpha.shape[0] / 2 if pivot is None else pivot
    if left:
        lc = np.ascontiguousarray(np.flip(pingpong(rgb[:, skip:skip + real], n, flip_first=False), 1))
        la = np.ascontiguousarray(np.flip(pingpong(alpha[:, skip:skip + real], n, flip_first=False), 1))
        if grow:
            lc, la = _grow(lc, la, grow, pivot, seam_right=True)
    if right:
        rc = np.ascontiguousarray(pingpong(np.flip(rgb[:, W - (skip + real):W - skip], 1), n, flip_first=False))
        ra = np.ascontiguousarray(pingpong(np.flip(alpha[:, W - (skip + real):W - skip], 1), n, flip_first=False))
        if grow:
            rc, ra = _grow(rc, ra, grow, pivot, seam_right=False)
    mid_rgb = rgb[:, (skip if left else 0):(W - skip if right else W)]
    mid_a = alpha[:, (skip if left else 0):(W - skip if right else W)]
    pad3 = np.zeros((rgb.shape[0], ext, 3), rgb.dtype)
    pad1 = np.zeros((alpha.shape[0], ext), np.float32)
    rgb2 = np.concatenate([lc if left else pad3, mid_rgb, rc if right else pad3], 1)
    a2 = np.concatenate([la if left else pad1, mid_a.astype(np.float32), ra if right else pad1], 1)
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


def _crossfade_concat(pieces, blend):
    """Joins (rgb, alpha) column pieces left to right, cross-fading `blend` px at every join."""
    rgb, a = pieces[0][0].astype(np.float32), pieces[0][1].astype(np.float32)
    for prgb, pa in pieces[1:]:
        prgb, pa = prgb.astype(np.float32), pa.astype(np.float32)
        b = min(blend, rgb.shape[1] - 1, prgb.shape[1] - 1)
        if b > 0:
            t = np.linspace(0, 1, b, dtype=np.float32)[None, :]
            # premultiplied cross-fade so a join through open sky never leaves a pale seam
            pre_l, pre_r = rgb[:, -b:] * a[:, -b:, None], prgb[:, :b] * pa[:, :b, None]
            ja = a[:, -b:] * (1 - t) + pa[:, :b] * t
            jc = (pre_l * (1 - t[..., None]) + pre_r * t[..., None]) / np.maximum(ja[..., None], 1e-3)
            rgb = np.concatenate([rgb[:, :-b], jc, prgb[:, b:]], 1)
            a = np.concatenate([a[:, :-b], ja, pa[:, b:]], 1)
        else:
            rgb, a = np.concatenate([rgb, prgb], 1), np.concatenate([a, pa], 1)
    return np.clip(rgb, 0, 255).astype(np.uint8), np.clip(a, 0, 1)


def gap_slices(alpha, x0, x1, y0, y1, min_w=34):
    """Splits columns [x0, x1) at the most open columns of rows [y0, y1) (sky between tree
    crowns), so slices can be rearranged without cutting through a tree."""
    col = alpha[y0:y1, x0:x1].mean(0)
    col = np.convolve(col, np.ones(5) / 5, "same")
    cuts = [0]
    for i in range(min_w, len(col) - min_w):
        if col[i] == col[max(0, i - min_w // 2):i + min_w // 2].min() and i - cuts[-1] >= min_w:
            cuts.append(i)
    if len(col) - cuts[-1] < min_w:
        cuts[-1] = len(col)
    else:
        cuts.append(len(col))
    return [(x0 + a, x0 + b) for a, b in zip(cuts[:-1], cuts[1:]) if b > a]


def tile_slices(sources, width, rng, blend=6):
    """Fills `width` columns with slices drawn in random order (never the same twice running).
    `sources` is a list of (rgb, alpha, [(x0, x1), ...]); slices keep their rows and lighting."""
    pool = [(rgb, a, s) for rgb, a, sl in sources for s in sl]
    pieces, total, last = [], 0, -1
    while total < width + blend:
        i = int(rng.integers(len(pool)))
        if i == last and len(pool) > 1:
            continue
        last = i
        rgb, a, (x0, x1) = pool[i]
        pieces.append((rgb[:, x0:x1], a[:, x0:x1]))
        total += (x1 - x0) - blend
    rgb, a = _crossfade_concat(pieces, blend)
    return rgb[:, :width], a[:, :width]


def quilt(rgb, alpha, x0, x1, width, rng, win=(26, 44), blend=12):
    """Texture continuation: random column windows of [x0, x1), some mirrored, cross-faded.
    Good for stone, lawn and hedges, where a mirrored window is indistinguishable."""
    pieces, total = [], 0
    while total < width + blend:
        w = int(rng.integers(win[0], min(win[1], x1 - x0) + 1))
        s = int(rng.integers(x0, x1 - w + 1))
        prgb, pa = rgb[:, s:s + w], alpha[:, s:s + w]
        if rng.random() < 0.5:
            prgb, pa = np.flip(prgb, 1), np.flip(pa, 1)
        pieces.append((np.ascontiguousarray(prgb), np.ascontiguousarray(pa)))
        total += w - blend
    out, a = _crossfade_concat(pieces, blend)
    return out[:, :width], a[:, :width]


def grow_side(rgb, alpha, grow, pivot, seam_right):
    """Public wrapper of the perspective growth used by mirror_extend."""
    return _grow(rgb, alpha, grow, pivot, seam_right)
