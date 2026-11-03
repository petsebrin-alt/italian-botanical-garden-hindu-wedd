"""Builds the parallax layers and photo crops in public/assets/img from the
reference artwork in assets-src/. Re-run after replacing a reference image:

    python3 tools/prepare_assets.py
"""
import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src")
OUT = os.path.join(ROOT, "public", "assets", "img")


def load(name):
    return cv2.cvtColor(np.array(Image.open(os.path.join(SRC, name)).convert("RGB")), cv2.COLOR_RGB2BGR)


def save(name, bgr, alpha=None, scale=1.0, sharpen=False, quality=84):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb)
    if alpha is not None:
        im.putalpha(Image.fromarray(alpha))
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2))
    base = os.path.join(OUT, name)
    im.save(base + ".webp", quality=quality, method=6)
    im.save(base + ".avif", quality=max(quality - 22, 40))
    print(f"{name}: {im.width}x{im.height}")


def crop(img, x0, y0, x1, y1):
    return img[y0:y1, x0:x1].copy()


def remove_text(img, box):
    """Inpaints the gold invitation lettering baked into the opening artwork."""
    x0, y0, x1, y1 = box
    b, g, r = [c.astype(int) for c in cv2.split(img)]
    gold = ((r - b) > 14) & (r >= g - 12)
    mask = np.zeros(img.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = (gold[y0:y1, x0:x1] * 255).astype(np.uint8)
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    return cv2.inpaint(img, mask, 7, cv2.INPAINT_TELEA)


def sky_alpha(img, limit_y, blue_margin, bright_white=235):
    """Alpha that is 0 for sky connected to the top edge, 255 elsewhere."""
    b, g, r = [c.astype(int) for c in cv2.split(img)]
    v = np.maximum(np.maximum(r, g), b)
    sky = (((b - r) >= blue_margin) & (v > 140)) | ((v > bright_white) & (np.abs(b - r) < 14) & (b >= g - 6))
    sky[limit_y:, :] = False
    sky = sky.astype(np.uint8)
    sky = cv2.morphologyEx(sky, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels = cv2.connectedComponents(sky)
    top = set(np.unique(labels[0:4, :])) - {0}
    keep = np.isin(labels, list(top)).astype(np.uint8)
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    alpha = (1 - keep) * 255
    alpha = cv2.GaussianBlur(alpha.astype(np.uint8), (5, 5), 0)
    return alpha


def polygon_mask(shape, points, feather):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(points, np.int32)], 255)
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


def radial_mask(w, h, cx, cy, rx, ry, soft=0.45):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    a = np.clip((1 - d) / soft, 0, 1)
    return (a * 255).astype(np.uint8)


def opening_layers():
    img = load("ref-opening.webp")
    clean = remove_text(img, (280, 176, 668, 792))
    save("hero-clean", clean, quality=86)

    alpha = sky_alpha(clean, limit_y=900, blue_margin=6)
    h, w = clean.shape[:2]
    left = [(0, 0), (420, 0), (420, 190), (260, 230), (250, 470), (170, 520), (150, 580), (0, 600)]
    right = [(455, 0), (w, 0), (w, 470), (800, 450), (790, 340), (615, 320), (600, 175), (455, 170)]
    frame_l = polygon_mask(clean.shape, left, 18)
    frame_r = polygon_mask(clean.shape, right, 18)

    scene_alpha = alpha.astype(float) * (1 - np.maximum(frame_l, frame_r) / 255.0)
    save("hero-scene", clean, scene_alpha.astype(np.uint8), quality=86)

    fl = (alpha.astype(float) * frame_l / 255.0).astype(np.uint8)
    fr = (alpha.astype(float) * frame_r / 255.0).astype(np.uint8)
    save("hero-wisteria-left", crop(clean, 0, 0, 430, 610), crop(fl, 0, 0, 430, 610))
    save("hero-wisteria-right", crop(clean, 450, 0, w, 480), crop(fr, 450, 0, w, 480))

    bl = crop(clean, 0, 1400, 330, h)
    save("hero-bloom-left", bl, radial_mask(bl.shape[1], bl.shape[0], 40, bl.shape[0], 330, 250))
    br = crop(clean, 680, 1360, w, h)
    save("hero-bloom-right", br, radial_mask(br.shape[1], br.shape[0], br.shape[1] - 30, br.shape[0], 280, 300))

    save("portrait-groom", crop(clean, 120, 780, 470, 1260), scale=1.3, sharpen=True)
    save("portrait-bride", crop(clean, 480, 870, 860, 1390), scale=1.3, sharpen=True)
    save("story-garland", crop(clean, 330, 900, 640, 1320), scale=1.4, sharpen=True)
    save("gallery-garland", crop(clean, 0, 760, w, 1560), quality=86)
    save("path-petals", crop(clean, 0, 1080, w, 1671), quality=84)


def cypress_layers():
    img = load("ref-cypress.webp")
    save("cypress-avenue", img, scale=2.0, sharpen=True, quality=86)
    alpha = sky_alpha(img, limit_y=330, blue_margin=24, bright_white=200)
    save("cypress-avenue-layer", img, alpha, scale=2.0, sharpen=True, quality=86)


def website_crops():
    img = load("ref-website.webp")
    crops = {
        "couple-garland-wide": (24, 312, 502, 578),
        "villa-terrace": (838, 64, 1022, 312),
        "portrait-bride-arch": (612, 374, 738, 512),
        "portrait-groom-arch": (797, 374, 925, 512),
        "story-walk": (40, 646, 302, 846),
        "venue-villa": (514, 856, 852, 1078),
        "garden-urn": (514, 700, 662, 846),
        "fabric-mehendi": (60, 1164, 164, 1252),
        "fabric-haldi": (206, 1164, 312, 1252),
        "fabric-wedding": (354, 1164, 460, 1252),
        "gallery-closeup": (536, 1159, 686, 1302),
        "gallery-villa": (695, 1159, 857, 1302),
        "gallery-dance": (866, 1159, 1005, 1302),
        "tuscan-hills-strip": (670, 1452, 1024, 1534),
    }
    for name, box in crops.items():
        save(name, crop(img, *box), scale=2.4, sharpen=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    opening_layers()
    cypress_layers()
    website_crops()
