"""The garden window's real flowers, the couple's photo in it, and the thank-you letter frame.

  assets-src/window/ref-vine.webp          a climbing rose (pink blossoms, real leaves), cut out
  assets-src/window/ref-couple.webp        the couple, shown in the window once the invitation is accepted
  assets-src/window/ref-letter-frame.webp  a lace letter frame with a rose and a bird, for the thank-you

    python3 tools/build_window_flora.py
      public/assets/window/vine-real.webp        the whole vine: over the window's top and down its left side
      public/assets/window/vine-real-arch.webp   its arching branch: under the window (flipped) and on the card
      public/assets/window/vine-real-stem.webp   its rising stem: up the window's right side (mirrored)
      public/assets/window/flower-real.webp      one blossom with its leaves, on the envelope
      public/assets/window/letter-frame.webp     the letter frame
      public/assets/img/ceremony-couple.webp     the couple's photo (replace it with your own photo of the
                                                 same name, any portrait size: it is cropped to fit)
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "window")
OUT = os.path.join(ROOT, "public", "assets", "window")
IMG = os.path.join(ROOT, "public", "assets", "img")


def clean(im):
    """Clear the faint haze the cut-out has round it, and trim to what is left."""
    a = np.array(im.convert("RGBA")).astype(np.float32)
    alpha = np.clip((a[..., 3] - 40) / (255 - 40), 0, 1) * 255
    a[..., 3] = alpha
    out = Image.fromarray(a.astype(np.uint8))
    return out.crop(out.getbbox())


def fit(im, width):
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def save(im, path, q=86):
    im.save(path, "WEBP", quality=q, method=6)
    print(path, im.size)


vine = Image.open(os.path.join(SRC, "ref-vine.webp"))
save(fit(clean(vine), 1200), os.path.join(OUT, "vine-real.webp"))
save(fit(clean(vine.crop((250, 180, 1485, 800))), 1000), os.path.join(OUT, "vine-real-arch.webp"))
save(fit(clean(vine.crop((0, 150, 340, 1059))), 340), os.path.join(OUT, "vine-real-stem.webp"))
save(fit(clean(vine.crop((830, 300, 1080, 540))), 250), os.path.join(OUT, "flower-real.webp"))

frame = Image.open(os.path.join(SRC, "ref-letter-frame.webp")).convert("RGB")
save(fit(frame, 1200), os.path.join(OUT, "letter-frame.webp"), 84)

couple = Image.open(os.path.join(SRC, "ref-couple.webp")).convert("RGB")
save(fit(couple, 900), os.path.join(IMG, "ceremony-couple.webp"), 84)
