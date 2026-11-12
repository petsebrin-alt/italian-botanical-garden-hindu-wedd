"""The venue's photo (public/assets/img/venue-garden.webp + .avif): the villa garden of the Save the
Date scene at its full sharpness, its lower half (the hydrangeas, the lawn running to the hills
and the cypresses, and the villa's arched loggia with its urns of hydrangeas). The scene is put
back together from its depth layers (public/assets/img/welcome-*.webp, tools/build_welcome.py).

    python3 tools/build_venue.py
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public", "assets", "img")

scene = Image.open(os.path.join(IMG, "welcome-sky.webp")).convert("RGBA")
for layer in ("welcome-far", "welcome-near-l", "welcome-near-r"):
    scene.alpha_composite(Image.open(os.path.join(IMG, f"{layer}.webp")).convert("RGBA"))
photo = scene.convert("RGB").crop((0, 700, scene.width, scene.height))
photo.save(os.path.join(IMG, "venue-garden.webp"), "WEBP", quality=86, method=6)
photo.save(os.path.join(IMG, "venue-garden.avif"), "AVIF", quality=70)
print("venue-garden", photo.size)
