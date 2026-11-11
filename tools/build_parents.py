"""Cut the two oval parent portraits (frame and photo) out of their white sheet.

assets-src/family/ref-parents.webp holds both framed portraits side by side on white, with a soft
shadow. Each oval is found from its green frame, fitted with an ellipse, and cut on that ellipse
with an anti-aliased edge, so the frame's outline stays clean (the page draws its own shadow).

    python3 tools/build_parents.py      # writes public/assets/img/family-bride.webp, family-groom.webp
"""
import cv2
import numpy as np
from PIL import Image

SRC = "assets-src/family/ref-parents.webp"
OUT = "public/assets/img/family-{}.webp"
PAD = 2

img = cv2.cvtColor(np.array(Image.open(SRC).convert("RGB")), cv2.COLOR_RGB2BGR)
H, W = img.shape[:2]
# the frame's sage green (the shadow is grey, the paper white, so neither is caught)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
ink = cv2.inRange(hsv, (26, 45, 50), (60, 255, 235))
ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

for name, (x0, x1) in (("bride", (0, W // 2)), ("groom", (W // 2, W))):
    half = np.zeros_like(ink)
    half[:, x0:x1] = ink[:, x0:x1]
    cnts, _ = cv2.findContours(half, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    (cx, cy), (a, b), ang = cv2.fitEllipse(c)
    # just inside the frame's outer edge, so no white or shadow is kept
    a -= 6; b -= 6
    s = 4  # supersampled for a smooth edge
    m = np.zeros((H * s, W * s), np.uint8)
    cv2.ellipse(m, ((cx * s, cy * s), (a * s, b * s), ang), 255, -1, cv2.LINE_AA)
    alpha = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA)
    x, y, w, h = cv2.boundingRect((alpha > 0).astype(np.uint8))
    x, y = max(0, x - PAD), max(0, y - PAD)
    w, h = min(W - x, w + 2 * PAD), min(H - y, h + 2 * PAD)
    rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), alpha])[y:y + h, x:x + w]
    Image.fromarray(rgba).save(OUT.format(name), "WEBP", quality=88, method=6)
    print(name, (round(cx), round(cy)), (round(a), round(b)), round(ang, 1), "->", (w, h))
