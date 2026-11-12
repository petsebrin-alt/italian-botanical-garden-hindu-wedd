"""The ground the garden window stands on, as one natural scene (public/assets/window/garden-ground.webp):

  * along the horizon, the real Tuscan garden photo the site already uses (public/assets/img/
    fields-meadow.webp: low hills, cypresses, clipped hedges and the start of the lawn)
  * in front, the lawn from tools/build_lawn.py, toned to the photo's own grass (its sunlit and
    shaded greens), with the soft shadows of passing clouds and trees on it, and a little out of
    focus towards the distance, where the photo's lawn takes over

    python3 tools/build_ceremony_ground.py     (after tools/build_lawn.py)

The sky is transparent, so the section's own sky shows above the hills.
"""
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIN = os.path.join(ROOT, "public", "assets", "window")
W = 2400
LAWN_TOP = 88     # lawn.webp: the first row of grass (above it: haze and hills)
BAND_GRASS = 190  # fields-meadow.webp: where its lawn begins
JOIN = 300        # where the lawn starts in the scene; the photo fades into it below this
rng = np.random.default_rng(5)


def noise(h, w, sx, sy, octaves=4, seed=0):
    r = np.random.default_rng(seed)
    out, amp, tot = np.zeros((h, w), np.float32), 1.0, 0.0
    for _ in range(octaves):
        n = r.standard_normal((max(2, int(h / sy) + 2), max(2, int(w / sx) + 2))).astype(np.float32)
        out += amp * cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
        tot += amp
        amp *= 0.5
        sx, sy = sx / 2, sy / 2
    return out / tot


band = Image.open(os.path.join(ROOT, "public", "assets", "img", "fields-meadow.webp")).convert("RGBA")
bh = round(band.height * W / band.width)
band = np.array(band.resize((W, bh), Image.LANCZOS)).astype(np.float32)
grass0 = round(BAND_GRASS * W / 1836)
# the photo's sky was cut away roughly: clear what is left of it (white cloud, blue) above the
# hills, and soften the hills' outline against the section's sky
# (column by column: the hills begin at the first of several rows in a row that are neither
# cloud-white nor sky-blue; everything above that line goes, nothing below it)
sky_rows = round(150 * W / 1836)
rgbb = band[:sky_rows, :, :3]
skyish = (band[:sky_rows, :, 3] < 128) | (rgbb.min(-1) > 170) | ((rgbb[..., 2] > rgbb[..., 1] + 4) & (rgbb[..., 2] > rgbb[..., 0] + 14))
solid = cv2.erode((~skyish).astype(np.uint8), np.ones((9, 1), np.uint8), anchor=(0, 0))
line = np.where(solid.any(0), solid.argmax(0), sky_rows).astype(np.float32)
line = np.convolve(np.pad(line, 15, mode="edge"), np.ones(31) / 31, mode="valid")  # a smooth outline
rows = np.arange(bh, dtype=np.float32)[:, None]
keep = np.clip(rows - line[None, :] + 1.5, 0, 1.0)  # a soft pixel at the outline
band[..., 3] = band[..., 3] * np.maximum(keep, (rows >= sky_rows).astype(np.float32))

lawn = Image.open(os.path.join(WIN, "lawn.webp")).convert("RGBA")
lawn = np.array(lawn.resize((W, round(lawn.height * W / lawn.width)), Image.LANCZOS)).astype(np.float32)[LAWN_TOP:]
lh = lawn.shape[0]

# tone the lawn to the photo's grass: match each channel's mean and spread
ref = band[grass0 + 20:, :, :3].reshape(-1, 3)
cur = lawn[:, :, :3].reshape(-1, 3)
gain = ref.std(0) / (cur.std(0) + 1e-6)
rgb = (lawn[:, :, :3] - cur.mean(0)) * np.clip(gain, 0.7, 1.4) + ref.mean(0)

# soft shadows of clouds and trees, wider and flatter with distance
ys = np.linspace(0, 1, lh, dtype=np.float32)[:, None]
sh = noise(lh, W, 520, 140, 3, 9)
shadow = np.clip((sh - 0.15) * 1.8, 0, 1) * (0.55 + 0.45 * ys)
rgb *= (1 - 0.26 * shadow)[..., None]
# a gentle unevenness of light over the whole lawn
rgb *= (1 + 0.05 * noise(lh, W, 300, 90, 3, 12))[..., None]

# the distance a little out of focus (the top rows most), so the grass's pattern fades away
blurred = cv2.GaussianBlur(rgb, (0, 0), 2.4)
far = np.clip(1 - ys / 0.45, 0, 1) ** 1.5
rgb = rgb * (1 - far[..., None]) + blurred * far[..., None]
# and a touch of the air's haze
rgb = rgb * (1 - 0.12 * far[..., None]) + np.array([214, 224, 214], np.float32) * (0.12 * far[..., None])
rgb += rng.normal(0, 1.2, rgb.shape).astype(np.float32)

# the scene: the photo above, the lawn below; the photo fades into the lawn over its own grass
H = JOIN + lh
out = np.zeros((H, W, 4), np.float32)
out[JOIN:, :, :3] = rgb
out[JOIN:, :, 3] = 255
top = band[: min(bh, H)]
fade = np.ones(top.shape[0], np.float32)
yy = np.arange(top.shape[0], dtype=np.float32)
fade = np.clip((bh - yy) / (bh - JOIN), 0, 1) ** 1.3
fade[yy < JOIN] = 1
a = top[:, :, 3:4] / 255 * fade[:, None, None]
seg = out[: top.shape[0]]
seg[:, :, :3] = top[:, :, :3] * a + seg[:, :, :3] * (1 - a)
seg[:, :, 3:4] = 255 * (a + seg[:, :, 3:4] / 255 * (1 - a))
out[: top.shape[0]] = seg

img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
p = os.path.join(WIN, "garden-ground.webp")
img.save(p, "WEBP", quality=84, method=6)
print(p, img.size)
