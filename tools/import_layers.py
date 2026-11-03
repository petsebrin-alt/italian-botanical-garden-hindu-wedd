"""Imports hand-cut hero layers from a final master photograph (route B in
docs/PHOTO-PROMPTS.md §3) and writes everything the opening screen needs.

Put these PNGs in one folder. All must be the master's full size and transparent
wherever the layer is empty (`build_layers.py --export-cuts DIR` writes today's
cuts in exactly this form, to use as a template):

  far.png  cypress-l.png  cypress-r.png  ground.png  couple.png
  bloom-l.png  bloom-r.png  frame-l.png  frame-r.png         required
  master.png              flattened master (reduced-motion fallback, social preview)
  hills.png               distant-hills plate; otherwise procedural hills are drawn
  trees-l.png trees-r.png decorative tree sprites; otherwise cut from the cypress rows
  wisteria-1..3.png  cloud-1..3.png   trimmed sprites of any size; otherwise kept
  anchors.json            {"contact": [0.5, 0.897], "titleTop": 0.187}: where the
                          bench/hem meets the path (fractions of width, height) and
                          the title's top (fraction of width); defaults shown

  python3 tools/import_layers.py DIR --check   # validate only, writes nothing
  python3 tools/import_layers.py DIR           # validate, back up, write

Options: --desktop 1800 --phone 1100 set the source width of the two delivered
sets (the phone set is served to portrait screens). The current layers are copied
to assets-src/backups/ first; restore one by copying it back to public/scenes/hero.
"""
import json
import os
import shutil
import sys
import time

import cv2
import numpy as np
from PIL import Image

import layerlib as lib
from layerlib import smoothstep

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "scenes", "hero")
BACKUPS = os.path.join(ROOT, "assets-src", "backups")

REQUIRED = ["far", "cypress-l", "cypress-r", "ground", "couple", "bloom-l", "bloom-r", "frame-l", "frame-r"]
SPRITES = ["wisteria-1", "wisteria-2", "wisteria-3", "cloud-1", "cloud-2", "cloud-3"]
# layers the hero positions itself (these also get the phone-sized set)
HERO = ["hills", "far", "cypress-l", "cypress-r", "ground", "couple", "bloom-l", "bloom-r", "frame-l", "frame-r"]
# how each layer continues past the master's edge: (left, right, skip the vine-post strip)
EXTEND = {
    "cypress-l": (True, False, True), "cypress-r": (False, True, True), "ground": (True, True, True),
    "frame-l": (True, False, False), "frame-r": (False, True, False),
    "bloom-l": (True, False, False), "bloom-r": (False, True, False), "hills": (True, True, False),
}
REF_ASPECT = 941 / 1671
BUDGET = {"phone": 650 * 1024, "desktop": 1200 * 1024}  # PRD §19, AVIF bytes for the hero layers


def load(path):
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA")
    a = np.asarray(im)
    rgb = cv2.cvtColor(np.ascontiguousarray(a[..., :3]), cv2.COLOR_RGB2BGR)
    return rgb, a[..., 3].astype(np.float32) / 255, has_alpha


def pct(x):
    return f"{100 * x:.1f} %"


# ---------------------------------------------------------------- validation
def validate(layers, anchors):
    """Returns (errors, warnings) at a 941 px working size."""
    errors, warnings = [], []
    W, H = next(iter(layers.values()))[0].shape[1::-1]
    if abs(W / H - REF_ASPECT) / REF_ASPECT > 0.03:
        warnings.append(f"master is {W}x{H} (aspect {W / H:.3f}); the composition guide assumes 9:16 ({REF_ASPECT:.3f})")
    if W < 1100:
        warnings.append(f"master is only {W} px wide; aim for 2160 px or more")
    w = 941
    h = round(H * w / W)
    small = {n: cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA) for n, (_, a, _) in layers.items()}

    def union(names):
        acc = np.zeros((h, w), np.float32)
        for n in names:
            acc = 1 - (1 - acc) * (1 - small[n])
        return acc

    # 1. the title zone must be open sky
    y0, y1 = int(anchors["titleTop"] * w), int(0.47 * h)
    zone = union([n for n in REQUIRED if n != "far"])[y0:y1, int(0.3 * w):int(0.7 * w)]
    covered = float((zone > 0.25).mean())
    (errors if covered > 0.08 else warnings if covered > 0.02 else []).append(
        f"title zone is {pct(covered)} covered by foreground layers (keep x 30–70 %, y {pct(anchors['titleTop'] * w / h)}–47 % clear sky)")

    # 2. just inside the couple's outline, the background must be filled: that band is what the
    #    trees spreading and the layers lagging can expose. Deep interior holes never show, and
    #    sky (above each column's skyline) is legitimately empty because the CSS sky is behind it.
    rows = np.where(small["far"].max(axis=1) > 0.5)[0]
    horizon = int(rows.min()) if len(rows) else int(0.47 * h)
    couple = (small["couple"] > 0.5).astype(np.uint8)
    band_px = max(3, round(0.06 * w))
    foot = cv2.dilate(couple, np.ones((7, 7), np.uint8)).astype(bool) & ~cv2.erode(couple, np.ones((band_px, band_px), np.uint8)).astype(bool)
    behind = union(["far", "cypress-l", "cypress-r", "ground"])
    opaque = behind >= 0.5
    skyline = np.where(opaque.any(axis=0), opaque.argmax(axis=0), h)
    foot &= np.arange(h)[:, None] >= np.maximum(skyline, horizon)[None, :]
    holes = float((behind[foot] < 0.9).mean()) if foot.any() else 0.0
    (errors if holes > 0.06 else warnings if holes > 0.01 else []).append(
        f"{pct(holes)} of the background just inside the couple's outline is unfilled; paint it in far/cypress/ground (it shows when the layers move)")

    # 3. the ground under the flowers must be filled (they rise into place)
    for b in ("bloom-l", "bloom-r"):
        fb = cv2.dilate((small[b] > 0.5).astype(np.uint8), np.ones((19, 19), np.uint8)).astype(bool)
        fb &= np.arange(h)[:, None] > horizon
        gap = float((small["ground"][fb] < 0.9).mean()) if fb.any() else 0.0
        if gap > 0.01:
            (errors if gap > 0.05 else warnings).append(f"{pct(gap)} of the ground under {b} is unfilled")

    # 4. the contact point should sit on the couple's lower edge
    cx, cy = anchors["contact"]
    bottom = np.where(small["couple"].max(axis=1) > 0.5)[0]
    if len(bottom) and abs(bottom.max() / h - cy) > 0.04:
        warnings.append(f"the couple's lowest point is at {pct(bottom.max() / h)} but the contact anchor is at {pct(cy)}; set it in anchors.json")

    for n, (_, a, has_alpha) in layers.items():
        if not has_alpha or a.min() > 0.99:
            errors.append(f"{n}.png has no transparency")
        elif a.max() < 0.5:
            errors.append(f"{n}.png is empty")
    return errors, warnings


# ---------------------------------------------------------------- build one resolution
def build_set(layers, extras, sw):
    """All hero layers on the wide canvas at source width `sw`."""
    W, H = next(iter(layers.values()))[0].shape[1::-1]
    sh = round(H * sw / W)
    scale = sw / lib.REF_W
    ext, skip, real = round(sw * lib.EXT_RATIO), round(sw * lib.SKIP_RATIO), round(sw * lib.REAL_RATIO)
    sized = {n: lib.resize_rgba(rgb, a, (sw, sh)) for n, (rgb, a, _) in layers.items()}

    if "hills" in extras:
        sized["hills"] = lib.resize_rgba(*extras["hills"], (sw, sh))
    wide = {}
    for n, (rgb, a) in sized.items():
        if n in EXTEND:
            left, right, skips = EXTEND[n]
            wide[n] = lib.mirror_extend(rgb, a, ext, skip if skips else 0, real, left, right, scale)
        else:
            wide[n] = lib.pad_wide(rgb, a, ext)
    if "hills" not in wide:
        hh = round(sh * 320 / 1672)
        hrgb, ha = lib.make_hills(sw + 2 * ext, hh, scale)
        top = round(sh * 760 / 1672)
        canvas_rgb = np.zeros((sh, sw + 2 * ext, 3), np.uint8)
        canvas_a = np.zeros((sh, sw + 2 * ext), np.float32)
        canvas_rgb[top:top + hh], canvas_a[top:top + hh] = hrgb, ha
        wide["hills"] = (canvas_rgb, canvas_a)

    # decorative sprites for the other sections
    sprites = {}
    ys = np.arange(sh, dtype=np.float32)
    xs = np.arange(sw, dtype=np.float32)
    base_fade = (1 - smoothstep(0.5895 * sh, 0.6373 * sh, ys))[:, None]
    for n, x_fade in [("trees-l", 1 - smoothstep(0.1998 * sw, 0.2274 * sw, xs)), ("trees-r", smoothstep(0.8459 * sw, 0.8735 * sw, xs))]:
        if n in extras:
            sprites[n] = lib.resize_rgba(*extras[n], (sw, sh))
        else:
            rgb, a = sized["cypress-l" if n == "trees-l" else "cypress-r"]
            sprites[n] = (rgb, a * base_fade * x_fade[None, :])
    for n in ("bloom-l", "bloom-r"):
        rgb, a = sized[n]
        sigma = 2.6 * scale
        sprites[f"{n}-near"] = (np.ascontiguousarray(np.flip(cv2.GaussianBlur(rgb, (0, 0), sigma), 1)),
                                np.ascontiguousarray(np.flip(cv2.GaussianBlur(a, (0, 0), sigma), 1)))
    return wide, sprites, (sw, sh, ext)


def main(argv):
    folder = argv[0]
    check_only = "--check" in argv
    opt = lambda k, d: int(argv[argv.index(k) + 1]) if k in argv else d
    desktop, phone = opt("--desktop", 1800), opt("--phone", 1100)

    missing = [n for n in REQUIRED if not os.path.exists(os.path.join(folder, f"{n}.png"))]
    if missing:
        sys.exit(f"missing: {', '.join(m + '.png' for m in missing)}")
    layers = {n: load(os.path.join(folder, f"{n}.png")) for n in REQUIRED}
    sizes = {n: v[0].shape[1::-1] for n, v in layers.items()}
    if len(set(sizes.values())) > 1:
        sys.exit("layers differ in size: " + ", ".join(f"{n} {w}x{h}" for n, (w, h) in sizes.items()))
    W, H = sizes["far"]
    anchors = {"contact": [0.5, 0.897], "titleTop": 0.187}
    if os.path.exists(os.path.join(folder, "anchors.json")):
        anchors.update(json.load(open(os.path.join(folder, "anchors.json"))))

    print(f"master {W}x{H}")
    errors, warnings = validate(layers, anchors)
    for w_ in warnings:
        print(f"  warn   {w_}")
    for e in errors:
        print(f"  ERROR  {e}")
    if errors:
        sys.exit("fix the errors above, then run again")
    print("  checks passed" if not warnings else "  checks passed with warnings")
    if check_only:
        return

    desktop = min(desktop, W)
    phone = min(phone, desktop)
    extras = {}
    for n in ("hills", "trees-l", "trees-r"):
        p = os.path.join(folder, f"{n}.png")
        if os.path.exists(p):
            rgb, a, _ = load(p)
            if rgb.shape[1::-1] != (W, H):
                sys.exit(f"{n}.png must be {W}x{H} like the layers")
            extras[n] = (rgb, a)

    staging = OUT + ".staging"
    shutil.rmtree(staging, ignore_errors=True)
    os.makedirs(os.path.join(staging, "m"))
    old_manifest = json.load(open(os.path.join(OUT, "manifest.json"))) if os.path.exists(os.path.join(OUT, "manifest.json")) else {}

    print(f"building desktop set at {desktop} px…")
    wide, sprites, (sw, sh, ext) = build_set(layers, extras, desktop)
    manifest = {"canvas": {"w": sw + 2 * ext, "h": sh, "ext": ext, "srcW": sw}, "layers": {}}
    weight = {"desktop": 0, "phone": 0}
    ratio = phone / desktop
    for n in HERO:
        rgb, a = wide[n]
        box = lib.alpha_box(a)
        if box is None:
            sys.exit(f"{n} ended up empty")
        x0, y0, x1, y1 = box
        q = 88 if n == "couple" else 80 if n == "hills" else 84
        _, avif = lib.write_image(os.path.join(staging, n), rgb[y0:y1, x0:x1], a[y0:y1, x0:x1], q)
        weight["desktop"] += avif
        manifest["layers"][n] = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}
        if ratio < 1:
            # the phone set is the same box at a lower resolution, so the geometry is shared
            prgb, pa = lib.resize_rgba(rgb[y0:y1, x0:x1], a[y0:y1, x0:x1], (max(1, round((x1 - x0) * ratio)), max(1, round((y1 - y0) * ratio))))
            _, avif = lib.write_image(os.path.join(staging, "m", n), prgb, pa, q)
            weight["phone"] += avif
        print(f"  {n:12s} {x1 - x0:5d}x{y1 - y0:<5d} at ({x0},{y0})")
    for n, (rgb, a) in sprites.items():
        box = lib.alpha_box(a)
        x0, y0, x1, y1 = box
        lib.write_image(os.path.join(staging, n), rgb[y0:y1, x0:x1], a[y0:y1, x0:x1], 80 if n.endswith("-near") else 84)
        manifest["layers"][n] = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}

    # sprites: supplied ones are trimmed and written, the rest carried over unchanged
    for n in SPRITES:
        p = os.path.join(folder, f"{n}.png")
        if os.path.exists(p):
            rgb, a, _ = load(p)
            x0, y0, x1, y1 = lib.alpha_box(a)
            rgb, a = rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]
            cap = round(600 * desktop / lib.REF_W)
            if rgb.shape[1] > cap:
                rgb, a = lib.resize_rgba(rgb, a, (cap, round(rgb.shape[0] * cap / rgb.shape[1])))
            lib.write_image(os.path.join(staging, n), rgb, a, 84)
            manifest["layers"][n] = {"x": 0, "y": 0, "w": rgb.shape[1], "h": rgb.shape[0]}
        else:
            for ext_ in (".webp", ".avif"):
                if os.path.exists(os.path.join(OUT, n + ext_)):
                    shutil.copy2(os.path.join(OUT, n + ext_), os.path.join(staging, n + ext_))
            if n in old_manifest.get("layers", {}):
                manifest["layers"][n] = old_manifest["layers"][n]
        if n.startswith("cloud") and os.path.exists(os.path.join(staging, n + ".avif")):
            weight["desktop"] += os.path.getsize(os.path.join(staging, n + ".avif"))
            weight["phone"] += os.path.getsize(os.path.join(staging, n + ".avif"))

    # fallback: the flattened master, or the layers composed over a summer sky
    if os.path.exists(os.path.join(folder, "master.png")):
        fb = cv2.cvtColor(np.asarray(Image.open(os.path.join(folder, "master.png")).convert("RGB")), cv2.COLOR_RGB2BGR)
    else:
        fb = np.zeros((H, W, 3), np.uint8)
        fb[:] = (238, 214, 172)
        for n in ["far", "cypress-l", "cypress-r", "ground", "couple", "bloom-l", "bloom-r", "frame-l", "frame-r"]:
            rgb, a, _ = layers[n]
            fb = (fb * (1 - a[..., None]) + rgb * a[..., None]).astype(np.uint8)
    fb = cv2.resize(fb, (sw, sh), interpolation=cv2.INTER_AREA)
    im = Image.fromarray(cv2.cvtColor(fb, cv2.COLOR_BGR2RGB))
    im.save(os.path.join(staging, "fallback.webp"), quality=84, method=6)
    im.save(os.path.join(staging, "fallback.avif"), quality=60)

    cx, cy = anchors["contact"]
    manifest["anchors"] = {"contact": {"x": round(ext + cx * sw), "y": round(cy * sh)}, "titleTop": anchors["titleTop"]}
    if ratio < 1:
        manifest["sets"] = {"m": phone}
    if "sky" in old_manifest:
        manifest["sky"] = old_manifest["sky"]
    manifest["source"] = {"width": W, "height": H, "imported": time.strftime("%Y-%m-%d %H:%M")}
    manifest["version"] = lib.content_version(staging)
    with open(os.path.join(staging, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    # back up the live layers, then swap the new set in
    if os.path.isdir(OUT):
        os.makedirs(BACKUPS, exist_ok=True)
        dest = os.path.join(BACKUPS, "hero-" + time.strftime("%Y%m%d-%H%M%S"))
        shutil.copytree(OUT, dest)
        print(f"previous layers backed up to {os.path.relpath(dest, ROOT)}")
        shutil.rmtree(OUT)
    if ratio >= 1:
        shutil.rmtree(os.path.join(staging, "m"))
    os.rename(staging, OUT)

    for k, v in weight.items():
        if k == "phone" and ratio >= 1:
            continue
        flag = "" if v <= BUDGET[k] else f"  (over the {BUDGET[k] // 1024} KB budget: lower --{k})"
        print(f"{k:8s} hero layers: {v // 1024} KB AVIF{flag}")
    print("done: reload the site to see the new opening screen")


if __name__ == "__main__":
    if not sys.argv[1:] or not os.path.isdir(sys.argv[1]):
        sys.exit(__doc__)
    main(sys.argv[1:])
