# Opening Screen — Visual Implementation Plan

**Scope:** S01 Immersive Opening Screen (PRD §9 S01, §13, §14), built first. The rest of the site then reuses its engine and layer assets.
**Status:** Implemented in `src/scenes/hero/`. Layers are built by `tools/build_layers.py`.

**Implementation notes (where the build differs from this plan):**
- **The camera opens looking up at the sky** (revision of 4 Nov 2026). The garden starts parked below the screen; the monogram draws itself in the sky on load. The first scroll writes the names in beneath it, and further scrolling descends: sky, clouds, hills, avenue, cypress rows, couple and flower beds each rise at their own speed. Wide screens then fade the names behind the rising trees; phones keep them in the poster position. Then the visitor steps through the arch.
- **Sharp edge to edge, never blurred.** Wide screens no longer see a mirrored, blurred copy past the source's edges. The cypress avenue continues from the garden's own real, unoccluded pixels: crowns rearranged at the gaps between trees, plus hedge, wall and lawn quilted from the clear strips beside the couple, all growing steadily outward like nearer trees. The flower beds continue the same way. The arbour frames are not continued at all; they are pinned to the screen's top corners, slightly larger on wide screens.
- **Flowers stay in the world** at their source positions and rise into place. The ground under them is real path texture, so the reveal is clean.
- **The ground layer is rebuilt from real texture.** Lawn comes from the clear patch left of the bench; the petal path is kept in the centre and quilted under the beds. Past the beds, lawn runs to the bottom.
- **Decorative trees.** Other sections use dedicated `trees-l` / `trees-r` sprites: trees only, with no lawn and nothing that sat behind the couple.
- **Hero layer weight:** 595 KB in AVIF, against the 650 KB mobile budget. The sharp continuation and gentler compression account for the increase from 335 KB.

---

## 1. PRD review: what changes for the build

| # | PRD assumption | Reality / decision | Effect |
|---|---|---|---|
| R1 | Every scene has separate, purpose-generated landscape and portrait layer sets (§12). | The only photographic sources today are the three references: the opening portrait (941 × 1672), the cypress avenue (700 × 500) and the website collage (panels ≈ 500 px wide). | The hero is **decomposed from the opening reference** into nine layers. Both orientations are built from it; desktop gets a botanical "arbour" framing (§4.2). Final production assets drop in through the layer manifest without code changes. |
| R2 | A01.4: the hero starts fully composed, then you "step through the arch". | The brief now asks for the visitor to "scroll down **from the sky**" while the landscape, trees, flowers and couple move at different speeds. | Two phases: **A, Descend from the sky** (layers rise at depth-based speeds and converge into the reference composition), then **B, Step through the arch** (foreground scales past the camera). |
| R3 | A01.5: the villa-window portal into S02. | There is no villa plate with enough resolution for a full-screen hand-off. | The portal moves to **S05 → S06**, where it opens onto the cypress avenue (1400 px plate). Hero → Welcome uses the **garden-wall rise** (the video's 20 s panel slide). |
| R4 | Layers move freely. | Layers decomposed from one photo have **hidden regions** (behind the couple, flowers and foliage). Moving the wrong way exposes them. | New **hole-safety rule** (§5), written into every tween. |
| R5 | Supabase, Studio, Turnstile, Resend. | No credentials yet. | RSVP and wishes use Next.js route handlers with a JSON file store (`data/`), honeypot and rate limiting. A token-protected `/studio` lists RSVPs (CSV export) and moderates wishes. Content is edited in `src/content/wedding.ts`. The storage adapter is swappable for Supabase later. |
| R6 | MND-01 photographic mandap. | Not available. | S08 uses a gold line-art mandap (scalloped arch and pillars) framing the Jaimala photograph, with jasmine strands and diyas. Marked as a placeholder until MND assets exist. |
| R7 | Tailwind and Motion. | Not needed for this scope. | Plain CSS with the §11 tokens, and GSAP for all motion (ScrollTrigger, SplitText, DrawSVG, Flip). Fewer dependencies and a smaller bundle. |

---

## 2. Layer stack

Coordinates are in **source pixels** of `assets-src/ref-opening.webp` (941 × 1672). Layers are listed back to front.

| z | Layer | File(s) | Source / method | Depth | Brief item |
|---|---|---|---|---|---|
| 1 | **Sky** | CSS gradient + sun haze | Synthetic. Colours sampled from the reference sky, pushed towards a clear summer blue | D1 | 1 · Clear blue summer sky |
| 2 | **Clouds** ×3 | `hero/cloud-1..3` | Cut from `ref-cypress` (white over blue, alpha from the whiteness–saturation ratio) | D1 | 1 |
| 3 | **Distant hills** | `hero/hills` | Procedural two-ridge hazy hills (multi-octave noise), coloured from the reference hills, full width so spreading trees never expose an edge | D2 | 2 · Separate distant landscape |
| 4 | **Far avenue** | `hero/far` | Centre band x 250–700, y 780–1120: distant trees, gate and lawn. Sky keyed out, couple region inpainted | D2.5 | 2 |
| 5 | **Title block** | DOM | Monogram SVG, names and date: live text | D6 | 7, 8 |
| 6 | **Cypress left / right** | `hero/cypress-l`, `hero/cypress-r` | Sky keyed out; split at the avenue centre with feathered cuts; extended 90 px below the lawn line; areas behind the couple and foliage inpainted | D3 | 3 · Separate tall cypress layers |
| 7 | **Near ground** | `hero/ground` | y 1250–1672 full width: lawn edges and petal path. Baked "SCROLL TO EXPLORE" inpainted; corners under the flowers filled with mirrored path texture | D3.5 | (couple composition) |
| 8 | **Couple** | `hero/couple` | GrabCut segmentation (rectangle + colour priors), 2 px feather, bench included | D4 | 6 · Punjabi bride and groom |
| 9 | **Contact shadow** | CSS radial | Synthetic, under the bench and lehenga hem | — | 6 |
| 10 | **Flowers left / right** | `hero/bloom-l`, `hero/bloom-r` | Hydrangea clusters, GrabCut alpha | D5 | 5 · Pink flowers |
| 11 | **Arbour frame left / right** | `hero/frame-l`, `hero/frame-r` | Pergola beam, branches and hanging **pink wisteria**; sky keyed out | D4/D5 | 4 · Transparent foreground branches, 5 · Hanging pink flowers |
| 12 | **Wisteria strands** ×3 | `hero/wisteria-1..3` | Pink-hue key of individual racemes, used to sway independently and reused across sections | D5 | 5 |
| 13 | **UI** | DOM | Scroll cue, nav | — | — |

No single flattened background is used anywhere. `hero-clean` (the text-free full frame) is used **only** as the reduced-motion fallback and as the Open Graph image.

---

## 3. Choreography

The hero is pinned for `+=230%` on desktop and `+=200%` on mobile, with `scrub: 0.8` for pointer and `0.35` for touch. `p` is timeline progress.

### Intro (time-based, on load) — A01.1 / A01.2
1. Layers decode (`img.decode()`), or 2.5 s pass.
2. Back-to-front settle: each layer goes from `scale 1.06, y +2.5vh, opacity 0` to rest. 1.6 s `expo.out`, stagger 0.1 s.
3. Monogram wreath draws (DrawSVG 1.4 s).
4. `THE WEDDING OF`: the rules grow, then the letter-spacing settles.
5. `JANVI` and `ROHIT` rise per character in masked lines (1.2 s `power4.out`, stagger 0.04 s).
6. The script `&` follows, then the date with its olive sprigs, then `TUSCANY, ITALY`, then the scroll cue.
7. If the visitor scrolls during the intro, it jumps to its end state.

### Ambient (time-based, while visible; paused by reduced motion and "Pause animations")
- Arbour frames sway `rotation ±0.6°` around their top outer corner (5.5 s and 6.3 s, `sine.inOut`, yoyo).
- Wisteria strands sway ±1.6° (4–7 s, seeded).
- Clouds drift `x −5vw` over 70–95 s.
- The scroll cue bobs 8 px.

### Phase A — "Descend from the sky" (p 0 → 0.62)
The camera starts at the top of the world (sky, title, arbour, tree-tops) and ends at the bottom (the full reference composition with the couple). The world translates by `−T`, where `T = worldHeight − viewportHeight` (desktop) or the extra sky band (mobile). Each layer adds a depth offset that **converges to zero at the end** of the phase:

```
y_layer(pA) = −T·pA + (1 − f) · T · pA        ← aligned at pA = 0, lags by depth
```

That is, a layer with factor `f` travels `f·T`. All layers are aligned at pA = 0 (the reference composition); slower layers lag behind as the camera descends.

| Layer | f (travel × T) | Extra | Result on screen |
|---|---|---|---|
| Sky gradient | 0.18 | — | Barely moves |
| Clouds | 0.25 | Drift continues | Very slow |
| Hills | 0.45 | — | Slow; sinks behind the trees |
| Far avenue | 0.62 | — | Slow-medium |
| Cypress L / R | 0.80 | — | Medium; tree-tops rise past the title |
| Near ground + couple + shadow | **1.00** | One group (they never separate vertically) | Exact camera speed |
| Flowers L / R | 1.18, aligned at the **end** (they start below and rise into place) | — | Fastest rise from below |
| Arbour frames | 1.30 | Plus `scale 1 → 1.08` from the top outer corner | Leaves the top fastest, "passing overhead" |
| Title block | 0.55, opacity 1 → 0 over pA 0.35 → 0.85 | Mobile: 0.25 and stays visible until phase B | Floats up and fades; the cypress tops pass in front of it |

### Phase B — "Step through the arch" (p 0.62 → 1)
| Layer | Movement |
|---|---|
| Arbour frames | `scale → 1.55` from the top outer corners, `x ∓10vw`. They pass the camera |
| Flowers | `scale → 1.6` from the bottom outer corners. They grow past the camera |
| Couple group | `scale 1 → 1.12` around the contact point (bench and hem). We walk towards them |
| Cypress L / R | `x ∓3%`, `scale → 1.06`. The avenue opens |
| Far and hills | `scale → 1.04` |
| Title (mobile) | Fades out by p 0.75 |
| Whole stage | The last 12 %: the next section (Welcome) rises over it with its botanical edge (wall rise) |

---

## 4. Responsive model

### 4.1 The world box
All layers except the arbour and the flowers live inside a `world` element sized to the source aspect ratio (941 : 1672), centred horizontally. Children are positioned with **percentages of the source**, so one manifest serves every screen.

| Viewport | World width W | Camera travel T |
|---|---|---|
| Phone portrait (e.g. 390 × 844) | `max(100vw · 1.22, 100lvh · 0.5628)`; the sides are cropped (cypress rows only) | Extra sky band `0.42 · lvh` above the world, so the visitor starts in open sky |
| Tablet / desktop (e.g. 1440 × 900) | `min(100vw, 0.99 · 100lvh)`, so the couple fits the final frame | `worldHeight − lvh` (≈ 0.75 lvh) |

### 4.2 Desktop arbour
The sides beyond the world (≈ 275 px each on a 1440 px screen) are covered by the **arbour frames**:
- Each frame is anchored to the top corner and sized to cover 30–34 % of the width.
- Each is extended downward with a **side drape** (foliage and wisteria cut from the same frame, mirrored and stacked).
- Behind them is a **soft garden margin**: the world's edge pixels stretched and blurred, so a sliver revealed in phase B reads as out-of-focus greenery.

The effect is that the visitor looks through a pergola into the avenue.

### 4.3 Text
- `names-hero = clamp(3.25rem, 2rem + 9vw, 8.5rem)`, auto-fitted to 86 % of the title column.
- Title position: centred in the sky at p 0 on both orientations, inside the measured title safe zone (no layer above z 5 overlaps it at rest).
- Colours: `--forest` (9.6:1) and `--gold-ink` (5.5:1) on the pale sky. A radial ivory scrim (opacity ≤ 0.35) sits behind the text block only.

---

## 5. Hole-safety rules (no gaps, ever)

A decomposed photo has hidden pixels. Each tween obeys these rules:

1. **Couple and near ground move as one group.** Any extra couple motion is *scale ≥ 1 around its contact point*, which always covers its own footprint.
2. **Layers behind the couple may only lag** (move up less). Their hidden regions then slide further behind the couple, never out.
3. **Flowers rise into their final position.** Their under-region in the ground layer is pre-filled with path texture, so the short reveal early in phase A, below the fold on desktop, is clean. In phase B they only **grow from their outer corner**.
4. **Arbour frames leave over complete layers** (CSS sky, cypress). The cypress-left region behind the foliage is inpainted.
5. **Cypress layers extend 90 px below their seam** with the near ground, which covers the lag at the end of phase A (desktop worst case is about 70 px).
6. **QA:** screenshots at p = 0, 0.25, 0.5, 0.62, 0.8 and 1 on 390 × 844 and 1440 × 900. Any gap fails the build.

---

## 6. Performance and quality levels

- About 13 animated elements in **one** timeline. Transforms and opacity only; `will-change` only while the hero is pinned.
- Hero bytes: layers in WebP and AVIF, ≤ 650 KB on mobile in total. `fetchpriority="high"` for the couple, cypress and frames.
- **Tier B** (≤ 4 cores or ≤ 4 GB): travel ×0.6, no wisteria sprites, clouds static.
- **Tier C** (reduced motion or Pause): no pin. The `hero-clean` photo with the live title on top, a 200 ms fade.

---

## 7. Rest of the site: effect map

Every section is built on the same engine (sticky stage plus one scrubbed timeline), reusing the hero's photographic cut-outs as recurring botanical layers.

| Section | Signature effect | Video reference |
|---|---|---|
| S02 Welcome | Garden-wall rise over the hero; wisteria and bloom parallax; Ganesha line draw; line-mask text | 20 s panel slide |
| S03 Couple | Arched portraits uncovered by mask slide, inner parallax, desktop convergence pin | 21–24 s arch window |
| S04 Love Story | Vine draws with scroll; buds bloom; sticky arched photo swap (clip-path) | — |
| S05 Save the Date | Masked date rise; live countdown digit roll; **arch-window portal** into S06 | 5–7 s portal |
| S06 Destination | Pinned cypress-avenue **dolly-in** (near rows sweep out, far rows grow less) + highlight cards | 3–5 s multi-speed rise |
| S07 Events | Auto-generated serpentine timeline; connector draw; medallion pop; detail sheet | 12–20 s event pin |
| S08 Ceremony | Jasmine curtain parts; mandap settles; diyas ignite; petal shower | 28–31 s frame panel |
| S09 Family | Botanical frames draw; garland link meets in the middle | — |
| S10 Dress Code | Arched fabric cards rise; palette chips pop; expand | 31–33 s arched row |
| S11 Gallery | Pinned horizontal reel (desktop), inner parallax, Flip lightbox | 33–35 s arched photos scale |
| S12 Venue | Terrace parallax; cards stagger; click-to-load map facade | — |
| S13 RSVP | Arched card rise over garden layers; live form; success petal burst | — |
| S14 Wishes | Batch-revealed botanical cards; pending seal | — |
| S15 Thank You | Golden-hour rise; cypress silhouettes; line-by-line finale | 35–42 s calm close |
