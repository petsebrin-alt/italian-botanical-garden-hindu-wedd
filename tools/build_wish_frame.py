"""Cut the scalloped green wish-card frame out of its white sheet.

assets-src/wishes/ref-frame.webp is the frame (green moulding, painted flowers, cream paper inside)
on white. Everything white that touches the edge of the sheet is the outside: it is flood-filled,
and the frame's outline gets a soft anti-aliased edge (the page draws its own shadow).

    python3 tools/build_wish_frame.py     # writes public/assets/img/wish-frame.webp
"""
import cv2
import numpy as np
from PIL import Image

SRC = "assets-src/wishes/ref-frame.webp"
OUT = "public/assets/img/wish-frame.webp"
WIDTH = 640  # the card is at most ~300px wide, so this is sharp at 2x

rgb = np.array(Image.open(SRC).convert("RGB"))
H, W = rgb.shape[:2]
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
# the frame's green moulding (saturated, not white, not cream)
green = cv2.inRange(hsv, (25, 40, 40), (75, 255, 245))
green = cv2.morphologyEx(green, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
# the outline: the largest outer shape of the green, filled
cnts, _ = cv2.findContours(green, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cnts, key=cv2.contourArea)
s = 4  # supersampled for a smooth edge
m = np.zeros((H * s, W * s), np.uint8)
cv2.drawContours(m, [(c * s).astype(np.int32)], -1, 255, -1, cv2.LINE_AA)
# a hair inside the moulding's outer edge, so no white fringe is kept
m = cv2.erode(m, np.ones((2 * s + 1, 2 * s + 1), np.uint8))
alpha = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA)

x, y, w, h = cv2.boundingRect((alpha > 0).astype(np.uint8))
rgba = np.dstack([rgb, alpha])[y:y + h, x:x + w]
out = Image.fromarray(rgba).resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS)
out.save(OUT, "WEBP", quality=86, method=6)
print(OUT, out.size, f"aspect {w}/{h}")
