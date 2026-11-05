# Final Photography: Prompt Pack

The prompts that replace the reference-derived placeholders with final, photoreal images. Every prompt maps to **one file the site already uses**, so a finished image drops in by name (§7).

The prompts follow the visual consistency bible in [PRD §12.3](PRD.md). They work in any capable image generator; tool notes are in §0.2. If the couple has a real photographer, the same list doubles as the **shot list**: the subject, framing and light lines are the brief.

---

## 0. How to use this pack

### 0.1 Workflow
1. **Make the identity sheets first** (§2). Every image with Janvi or Rohit uses them as a reference, so faces, height, jewellery and turban stay identical across the site.
2. **Build each prompt from four parts:**
   - The prompt itself.
   - The **wardrobe block** it names (§1.3).
   - The **light preset** it names (§1.2).
   - The **style block** (§1.1).
   Put the **avoid block** (§1.4) in the negative-prompt field, or append it as "Avoid: …".
3. **Generate at the stated aspect ratio.** Make at least 4 variations and pick using the checklist (§6).
4. **Save with the target file name** (for example `portrait-bride.png`) and import it (§7).

### 0.2 Tool notes
| Tool | Notes |
|---|---|
| Midjourney | Append `--ar <ratio> --style raw`. Use its character or omni-reference feature with the two identity sheets for every image with people. Use a style reference made from the approved hero master to lock the grade. |
| ChatGPT / GPT image, Gemini / Imagen, Firefly | Attach the identity sheet(s) and, for scenes, the approved hero master. Start with "Using the attached people and the attached image's light and colour grade…". State the aspect ratio in words. |
| Flux, SDXL and other local tools | Use the avoid block as the negative prompt. An IP-Adapter or face reference with the identity sheets keeps faces consistent; a depth or canny ControlNet from the current reference keeps the hero composition (§3). |

---

## 1. Shared blocks

### 1.1 Style block (append to every prompt)
```
Photorealistic editorial wedding photograph, full-frame camera, natural colour grade with olive and forest greens and dusty-rose pinks, deep but natural summer-blue sky, warm ivory highlights that never clip, softly lifted shadows, fine film grain, crisp detail, realistic skin and fabric texture. Setting: a private Tuscan countryside estate with honey-coloured stone, terracotta roofs and urns, clipped box hedges, pale gravel paths, tall slender Italian cypress trees and gently rolling green-gold hills.
```

### 1.2 Light presets
| Key | Text to insert |
|---|---|
| **L-MORNING** | `late-morning summer sunlight around 10 am from the upper left, warm-neutral 5600K, soft shadows, light atmospheric haze in the distance` |
| **L-MIDDAY** | `bright midday summer sun, crisp clear deep-blue sky, short shadows, 5800K` |
| **L-SHADE** | `soft open shade under a stone loggia, gentle warm bounce light from the terrace` |
| **L-AFTERNOON** | `warm late-afternoon light around 5 pm, 5000K, long soft shadows` |
| **L-GOLDEN** | `golden hour around 7:45 pm, low sun from the left, 3200K, long warm shadows, glowing rim light, warm peach-apricot sky` |

### 1.3 Wardrobe blocks
| Key | Text to insert |
|---|---|
| **W-BRIDE** (ceremony) | `Janvi wears a blush-pink bridal lehenga with dense gold zari and sequin floral embroidery and a matching blouse, a sheer blush dupatta with a scalloped gold border draped over her head, a kundan-and-polki choker with a long rani haar, a maang tikka, chandbali jhumkas, a small nath, blush-and-ivory chooda bangles with gold kaleeren hanging from both wrists, and intricate bridal mehendi on her hands` |
| **W-GROOM** (ceremony) | `Rohit wears an ivory sherwani with tone-on-tone gold embroidery and gold buttons, ivory churidar, a blush-pink dupatta with a gold border over one shoulder, a neatly tied symmetrical ivory safa (Punjabi turban) with a pearl kalgi brooch and a small cream feather plume, and ivory-and-gold mojari shoes` |
| **W-BRIDE-PRE** (pre-wedding) | `Janvi wears an ivory chikankari anarkali with a blush organza dupatta, small pearl jhumkas and a few blush bangles, hair loose in soft waves` |
| **W-GROOM-PRE** (pre-wedding) | `Rohit wears a sage-green linen bandhgala with an ivory pocket square, cream trousers and tan loafers; short dark side-parted hair, no turban` |

### 1.4 Avoid block (negative prompt)
```
fantasy, cartoon, illustration, painting, anime, 3D render, CGI, plastic or waxy skin, beauty-filter skin, oversaturated colours, neon green, magenta, lilac or purple wisteria, mountains, snow, alpine scenery, palm trees, text, letters, numbers, signage, watermark, logo, frame, border, extra fingers, fused or deformed hands, mismatched or asymmetrical earrings, melting or lopsided turban, duplicated people, cloned or copy-pasted trees, garland passing through hands, harsh flash, HDR halos, over-sharpening, tilted horizon, fisheye distortion, recognisable real villa or landmark
```

---

## 2. Identity sheets (make these first)

These are the references for every later image. For continuity with today's site, attach the current crops as a starting reference:
- [`public/assets/img/portrait-bride.webp`](../public/assets/img/portrait-bride.webp)
- [`public/assets/img/portrait-groom.webp`](../public/assets/img/portrait-groom.webp)

### P-00a · Janvi identity sheet
- **Aspect:** 3:2 · **Size:** ≥ 3000 × 2000 · **Light:** neutral studio
```
Character reference sheet of one woman, Janvi, a Punjabi bride in her late twenties: warm medium-brown skin, soft oval face, defined natural brows, warm brown eyes, gentle wide smile, long dark-brown hair in a low bridal bun with a centre parting. Three views side by side on a plain warm-ivory seamless backdrop: front, three-quarter and profile, head and shoulders, the same person in every view. {W-BRIDE}. Even soft studio light, no shadows on the backdrop, sharp focus on the face and jewellery.
```

### P-00b · Rohit identity sheet
- **Aspect:** 3:2 · **Size:** ≥ 3000 × 2000 · **Light:** neutral studio
```
Character reference sheet of one man, Rohit, a Punjabi groom around thirty: warm medium-brown skin, well-groomed short full black beard, kind dark eyes, broad warm smile, slightly taller than his bride. Three views side by side on a plain warm-ivory seamless backdrop: front, three-quarter and profile, head and shoulders, the same person in every view. {W-GROOM}. Even soft studio light, no shadows on the backdrop, sharp focus on the face, turban folds and kalgi.
```

### P-00c · Couple scale sheet
- **Aspect:** 3:2 · **Size:** ≥ 3000 × 2000
```
The same Janvi and Rohit from the attached identity sheets, standing side by side, full length, facing the camera, on a plain warm-ivory seamless backdrop, wearing their ceremony outfits, Rohit slightly taller. Neutral studio light. Shows true relative height, body shape and the complete outfits from turban and dupatta to mojari and lehenga hem.
```

---

## 3. Opening screen (S01)

The hero is **one master photograph that is cut into separate parallax layers**. Producing the layers separately would never match the light. The composition must follow today's reference closely, because the layer geometry, title position and motion are measured from it.

### P-01 · Hero master
- **Target:** [`assets-src/ref-opening.webp`](../assets-src/ref-opening.webp)
- **Aspect:** 9:16 portrait
- **Size:** ≥ 2160 × 3840
- **Light:** L-MORNING
- **References:** both identity sheets, plus today's `ref-opening.webp` as the composition reference (depth or canny ControlNet, or the "keep composition" option in your tool)

```
Vertical photograph looking out through a weathered stone-and-timber pergola arch onto a Tuscan cypress garden. The arch and its foliage frame the top of the picture: dense fresh green leaves and long hanging racemes of pink wisteria fill the top-left corner and the top-right corner, and the curved timber beam of the arch runs down the right edge with leafy vines climbing it. The centre of the sky is completely open: clear summer-blue sky with one or two soft white clouds, nothing at all in the middle of the frame from the top tenth down to just below the middle. Two rows of tall slender Italian cypress trees line a green lawn on both sides, bounded by low dry-stone walls, receding towards a small gap at the centre where distant hazy rolling hills and a line of far trees are visible. In the lower half, Janvi and Rohit sit on an ivory upholstered bench with carved wooden legs on a pale stone path scattered with rose petals, turned towards each other and smiling, exchanging long rose-and-jasmine garlands (Jaimala) held between them; Rohit on the left, Janvi on the right, her lehenga spreading across the path. Mounds of blush-pink hydrangea and white garden roses fill the two bottom corners, slightly closer to the camera and a little soft. Camera at seated eye level, 35 mm lens, f/4. {W-GROOM}. {W-BRIDE}. {L-MORNING}.
```

**Composition guide.** Matching these keeps the existing layer logic, title placement and motion valid:

| Element | Position (fraction of width × height) |
|---|---|
| Title zone: **open sky only** | x 30–70 % · y 10–47 % |
| Arbour foliage, top-left | x 0–46 % · y 0–35 % |
| Arbour beam and foliage, top-right | x 48–100 % · y 0–28 %, with vines down the right edge to about 65 % |
| Left cypress row | x 0–33 % · treetops at y 28–45 % |
| Right cypress row | x 58–100 % · treetops at y 24–50 % |
| Distant hills and far trees | x 30–60 % · y 47–60 % |
| Couple and bench | x 4–96 % · y 47–91 %; groom's turban top at about 48 % |
| Contact point (bench and lehenga hem on the path) | about x 50 % · y 90 % |
| Flowers | bottom-left x 0–33 % · y 83–100 %; bottom-right x 72–100 % · y 82–100 % |

**Cutting rules** (from the PRD's hole-safety rules):
- Keep a sliver of sky or lawn between the couple's heads and the trees.
- Keep a sliver of sky between the hanging wisteria and the treetops.
- No lettering anywhere; the site sets the type itself.

### Hero layers to cut from P-01
Export each layer as a transparent PNG at full master size. The names match [`public/scenes/hero/manifest.json`](../public/scenes/hero/manifest.json):

| Layer | Contains | Hidden-area fill needed |
|---|---|---|
| `far` | Distant hills, far trees, centre lawn (sky removed) | Behind the couple's heads and shoulders |
| `cypress-l` / `cypress-r` | Each tree row with its wall and lawn, plus the vine-covered posts at the edges; extends about 5 % below the lawn line | Behind the couple and behind the arbour foliage |
| `ground` | Lawn edges and the petal path | Behind the couple and behind both flower mounds |
| `couple` | Couple, bench, garlands and the kalgi plume, edges feathered 1–2 px | None |
| `bloom-l` / `bloom-r` | The two flower mounds | None |
| `frame-l` / `frame-r` | Arbour foliage, beam and wisteria (sky removed) | None |
| `trees-l` / `trees-r` | The outer 20 % of each cypress row, trees only, faded out above the wall | None (reused in other sections) |

**Two routes to the site:**
- **Route A (quick):** downscale P-01 to 941 × 1672, save it as `assets-src/ref-opening.webp`, and run `npm run layers`. The automatic cuts are tuned to today's image. Check the `--debug` composites, and adjust the polygons and seeds in `tools/build_layers.py` if the new image differs. Resolution stays at today's level.
- **Route B (full quality, recommended):** cut the layers by hand at full resolution and import them.
  1. Get a template: `python3 tools/build_layers.py --export-cuts ~/hero-template` writes today's nine cuts as full-size PNGs (plus `master.png`), showing exactly what each layer contains, including the painted-in areas behind the couple and the flowers.
  2. In Photoshop, Affinity or Photopea, cut P-01 into the same nine layers. Export each as a transparent PNG at the master's full size, named `far.png`, `cypress-l.png`, `cypress-r.png`, `ground.png`, `couple.png`, `bloom-l.png`, `bloom-r.png`, `frame-l.png` and `frame-r.png`. Add `master.png` (the flattened image) to the same folder.
     - Optional: `hills.png`, `trees-l.png` / `trees-r.png`, the P-02 wisteria sprites as `wisteria-1…3.png`, and the P-04 clouds as `cloud-1…3.png`.
     - Optional: `anchors.json` if the couple sits elsewhere, for example `{"contact": [0.5, 0.897], "titleTop": 0.187}`. These are the bench and hem point as fractions of width and height, and the title's top as a fraction of width.
  3. Validate: `python3 tools/import_layers.py ~/hero-layers --check` (writes nothing). It checks:
     - that every layer is present, transparent and the same size;
     - that the title zone is open sky;
     - that the background just inside the couple's outline is painted in;
     - that the ground under the flowers is filled;
     - that the contact point sits on the couple.
  4. Import: `python3 tools/import_layers.py ~/hero-layers`. This:
     - writes a desktop set (1800 px) and a phone set (1100 px), with the garden continued sharply past both edges, the trees and the fallback;
     - writes the manifest, with a new content version so no browser keeps the old layers;
     - backs up the previous layers to `assets-src/backups/`;
     - reports the weight against the PRD budgets (`--desktop` / `--phone` change the widths).
  5. Reload the site. To return to the automatic cuts, run `npm run layers`.

### P-02 · Wisteria racemes
- **Target:** `public/scenes/hero/wisteria-1…3` (hanging sprites in many sections)
- **Aspect:** 2:3 · **Size:** ≥ 1600 × 2400 · **Light:** L-MORNING
```
Close photograph of four long hanging racemes of pink wisteria, blush to soft rose-pink (not lilac), with a few fresh green leaves and thin stems, hanging from the top edge of the frame against a clear pale summer-blue sky, nothing else in the frame. Each raceme separate with sky between them, sharp from top to tip, gentle backlight from the upper left making the petals glow. 85 mm, f/5.6. {L-MORNING}.
```
Cut each raceme on its own and save it as `wisteria-1`, `wisteria-2` and `wisteria-3`. The pale sky behind them keys cleanly.

### P-03 · Flower mounds
- **Target:** `bloom-l`, `bloom-r` (also the near-flower corners)
- **Aspect:** 4:3 · **Size:** ≥ 2400 × 1800 · **Light:** L-MORNING · **Make two different variants; do not mirror one.**
```
A low mound of blush-pink hydrangea heads mixed with white and blush garden roses and fresh green leaves, growing at the edge of a pale stone garden path, photographed from slightly above at knee height, filling the lower half of the frame, the path plain and pale behind it. {L-MORNING}. 50 mm, f/4, the front blooms slightly soft.
```

### P-04 · Clouds (optional)
- **Target:** `cloud-1…3` (today these are procedural)
- **Aspect:** 3:1 · **Size:** ≥ 3600 × 1200
```
Three soft separate high summer cumulus clouds with clear deep summer-blue sky all around each one, gentle texture, no other objects, no horizon.
```

---

## 4. Section photographs (drop-in replacements)

Each image goes straight in by file name (§7); no code changes are needed. "Crop" describes how the site frames it.

### P-10 · Villa terrace → `villa-terrace`
- **Used in:** S02 Welcome, as a cut-out layer on the right of the garden scene (its sky is keyed out so the scene's own sky shows)
- **Aspect:** 3:4 · **Size:** ≥ 1500 × 2000 · **Light:** L-MORNING
- **Crop:** keep clear, plain blue sky above and to the left of the villa (that is what gets keyed out). After importing, run `python3 tools/prepare_assets.py villa` to cut it out
```
A honey-stone Tuscan villa with a ground-floor arcade of round arches and climbing white roses, seen across a gravel terrace with large terracotta urns overflowing with blush hydrangeas and potted lemon trees, two cypress trees beside the villa, pink wisteria trained over the arches, no people. Eye level, 35 mm, f/5.6, vertical composition with the arcade filling the middle of the frame. {L-MORNING}.
```

### P-11 · Bride portrait → `portrait-bride`
- **Used in:** S03 Couple, S11 Gallery
- **Aspect:** 3:4 · **Size:** ≥ 1500 × 2000 · **Light:** L-MORNING
- **Crop:** round-top 4:5 arch, head and shoulders, focus point 50 % / 30 %. She sits in the left arch, so have her turn slightly to her left (towards the groom's arch, on the right of the picture)
```
Portrait of Janvi from the waist up, three-quarter view, smiling softly towards the camera, one hand lightly holding the edge of her dupatta, in a Tuscan garden with soft out-of-focus cypress trees and hanging pink wisteria behind her. {W-BRIDE}. 85 mm, f/2.8, face sharp, jewellery detail crisp. {L-MORNING}.
```

### P-12 · Groom portrait → `portrait-groom`
- **Used in:** S03 Couple, S11 Gallery
- **Aspect:** 3:4 · **Size:** ≥ 1500 × 2000 · **Light:** L-MORNING
- **Crop:** as P-11, in the right arch: he turns slightly to his right (towards the bride's arch, on the left of the picture)
```
Portrait of Rohit from the waist up, three-quarter view, warm confident smile towards the camera, hands relaxed at his sherwani buttons, in a Tuscan garden with soft out-of-focus cypress trees and a stone wall behind him. {W-GROOM}. 85 mm, f/2.8, face and kalgi sharp. {L-MORNING}.
```

### P-13 to P-17 · Love story → `story-1` … `story-5`
- **Used in:** S04 Love Story
- **Aspect:** 4:5 · **Size:** ≥ 1500 × 1875
- **Crop:** round-top arch; keep heads below the top 15 %
- These illustrate the placeholder milestones. Replace them with the couple's own photographs whenever possible.

| File | Milestone | Light | Prompt |
|---|---|---|---|
| `story-1` | First meeting | L-AFTERNOON | `Janvi and Rohit in their late twenties laughing across a small table at an outdoor café on a stone piazza, cups of coffee between them, relaxed and candid, the first spark. Smart-casual: she in a pale blush blouse, he in a light linen shirt. 50 mm, f/2.8, background softly blurred. {L-AFTERNOON}.` |
| `story-2` | Our relationship | L-MIDDAY | `Janvi and Rohit walking hand in hand along a gravel path between clipped box hedges in a Tuscan garden, she glancing back at him laughing, photographed from slightly behind and to the side. {W-BRIDE-PRE}. {W-GROOM-PRE}. 50 mm, f/4. {L-MIDDAY}.` |
| `story-3` | Special memories | L-AFTERNOON | `Rohit twirling Janvi on a sunlit lawn among cypress trees, her dupatta flying in an arc, both laughing, natural motion blur only at the fabric edge. {W-BRIDE-PRE}. {W-GROOM-PRE}. 35 mm, f/4. {L-AFTERNOON}.` |
| `story-4` | The proposal | L-GOLDEN | `Rohit on one knee holding up an open ring box to Janvi, whose hands cover her mouth in joy, in the middle of a cypress-lined avenue at golden hour, the road leading to a distant farmhouse. {W-BRIDE-PRE}. {W-GROOM-PRE}. 50 mm, f/2.8. {L-GOLDEN}.` |
| `story-5` | The wedding journey | L-MORNING | `Close three-quarter shot of Janvi and Rohit holding long rose-and-jasmine garlands between them, foreheads almost touching, eyes closed, smiling, wisteria and cypress softly blurred behind. {W-BRIDE}. {W-GROOM}. 85 mm, f/2.8. {L-MORNING}.` |

### P-20 · Cypress avenue → `cypress-avenue`
- **Used in:** S06 Destination (full screen, then the camera walks in up to 1.5×), S11 Gallery
- **Aspect:** 3:2 · **Size:** ≥ 3840 × 2560 · **Light:** L-MIDDAY
- **Crop:** the dolly zooms towards a point 48.6 % across and 55 % down. Put the farmhouse at the end of the road exactly there. Phones show the central third, so keep the road and both rows strong in the middle.
```
A perfectly symmetrical pale gravel road running straight away from the camera between two long rows of tall slender Italian cypress trees, the rows converging to a small honey-stone farmhouse with a terracotta roof on a gentle rise at the vanishing point, bright green fields beyond the trees, a few soft white clouds in a clear deep-blue sky, no people, no cars. One-point perspective, camera at standing eye level in the centre of the road, 35 mm, f/8, everything sharp. {L-MIDDAY}.
```

### P-21 · Ceremony moment in the mandap arch → `ceremony-arch`
- **Used in:** S08 Ceremony (inside the scalloped mandap arch)
- **Aspect:** 2:3 · **Size:** ≥ 1400 × 2100 · **Light:** L-MORNING
- **Crop:** bottom-aligned; the scalloped arch crops the top and sides, so keep the couple in the lower 60 %
```
Janvi and Rohit seated side by side on carved wooden chairs at a traditional mandap in a Tuscan garden, facing a small brass havan kund with a gentle sacred fire, her dupatta tied to his stole (the gathbandhan), decorated with jasmine strands, blush roses and brass diyas, cypress trees and blue sky visible above and behind them. Frontal, slightly elevated view, 50 mm, f/4. {W-BRIDE}. {W-GROOM}. {L-MORNING}.
```

### P-22 · Photographic mandap (optional, future)
- **Target:** a new transparent asset to replace the gold line-art mandap. Using it needs a small code change in [`Ceremony.tsx`](../src/sections/Ceremony.tsx).
- **Aspect:** 6:7 · **Size:** ≥ 2400 × 2800 · **Light:** L-MORNING
```
A traditional Indian wedding mandap standing on a manicured lawn in a Tuscan garden, frontal and symmetrical: four carved ivory-and-gold pillars, a scalloped cusped arch canopy with a small brass kalash finial, swags of jasmine strands and blush roses between the pillars, a brass havan kund at the centre, a row of five brass diyas along the front edge, ivory cushions, no people. Clear blue sky and soft cypress trees behind. 35 mm, f/8. {L-MORNING}.
```

### P-30 to P-34 · Dress-code fabrics → `fabric-<event>`
- **Used in:** S10 Dress Code (arched cards)
- **Aspect:** 3:4 · **Size:** ≥ 900 × 1200 · **Light:** soft window light
- Shared prompt: `Close macro photograph of folded and draped festive Indian fabric filling the whole frame, soft window light from the left, rich texture, no people, no background visible.`
- **After importing `fabric-sangeet` and `fabric-reception`,** add `image: "/assets/img/fabric-sangeet"` (and the reception equivalent) to those two entries in [`wedding.ts`](../src/content/wedding.ts). Today they use a palette gradient instead.

| File | Fabric description to insert |
|---|---|
| `fabric-mehendi` | `layered mint, sage and emerald georgette with fine gold gota-patti borders and tiny mirror work` |
| `fabric-haldi` | `butter-yellow and marigold silk with turmeric-gold zari motifs and a soft organza dupatta` |
| `fabric-sangeet` | `sapphire, ruby and amethyst velvet and sequinned net with silver and gold embroidery that catches the light` |
| `fabric-wedding` | `deep sindoor-red banarasi silk with heavy gold zari brocade and a rani-pink border` |
| `fabric-reception` | `champagne satin beside midnight-blue velvet with a fine pearl-and-crystal border` |

### P-40 · Villa courtyard → `venue-villa`
- **Used in:** S12 Venue (arched photo; an ivory card covers the bottom 15 %)
- **Aspect:** 4:5 · **Size:** ≥ 1500 × 1875 · **Light:** L-AFTERNOON
```
A Tuscan villa courtyard prepared for a wedding dinner: long tables with ivory linen, blush roses and jasmine centrepieces, brass candle holders and woven chairs on pale gravel, honey-stone walls with climbing roses, an arched loggia behind, string lights above, potted lemon trees in terracotta, no people. Vertical composition, 35 mm, f/5.6, the lower part of the frame simple gravel. {L-AFTERNOON}.
```

### P-50 · Golden-hour hills → `tuscan-hills-strip`
- **Used in:** S15 Thank You (a full-width band behind the silhouettes; the top 22 % fades into the sky)
- **Aspect:** 4:1 panorama · **Size:** ≥ 3840 × 960 · **Light:** L-GOLDEN
```
Panoramic view across layered rolling Tuscan hills at golden hour, soft haze between the ridges, scattered lines of cypress trees and a distant farmhouse on one hill, fields glowing honey-gold, warm peach-apricot sky fading to pale gold at the horizon, no people. Long lens compression, 135 mm, f/8. {L-GOLDEN}.
```

### G-01 to G-14 · Gallery → `gallery-01` … `gallery-14`
- **Used in:** S11 Gallery (reel, grid and full-screen lightbox)
- **Size:** ≥ 2400 px on the long edge
- **Shapes:** wide 3:2 · arch/tall 3:4 · square 1:1
- G-01 to G-10 replace the current ten. G-11 to G-14 are optional extras: add them to the `gallery` list in [`wedding.ts`](../src/content/wedding.ts).

| File | Category · shape | Light | Prompt |
|---|---|---|---|
| `gallery-01` | Moments · 3:2 | L-MORNING | `The Jaimala: Janvi raising her garland over Rohit's turban as he bows his head slightly, both laughing, guests' hands blurred at the frame edges, petal path and cypress garden behind. {W-BRIDE}. {W-GROOM}. 50 mm, f/2.8. {L-MORNING}.` |
| `gallery-02` | Portraits · 3:4 | L-MORNING | `Janvi standing beneath a pergola of hanging pink wisteria, looking down and smiling, holding her dupatta out so its scalloped gold border catches the light. {W-BRIDE}. 85 mm, f/2.8. {L-MORNING}.` |
| `gallery-03` | Destination · 3:2 | L-MIDDAY | `The estate's cypress avenue seen from a low angle at the roadside, the rows sweeping towards the farmhouse on the hill, wild grasses in the soft foreground, no people. 24 mm, f/8. {L-MIDDAY}.` |
| `gallery-04` | Portraits · 3:4 | L-SHADE | `Rohit leaning against a honey-stone column in the villa loggia, arms folded, warm smile, arches receding behind him. {W-GROOM}. 85 mm, f/2.8. {L-SHADE}.` |
| `gallery-05` | Pre-wedding · 1:1 | L-AFTERNOON | `Janvi and Rohit dancing barefoot on the lawn, he dipping her slightly, both laughing, cypress row softly blurred behind. {W-BRIDE-PRE}. {W-GROOM-PRE}. 50 mm, f/2.8. {L-AFTERNOON}.` |
| `gallery-06` | Destination · 3:2 | L-AFTERNOON | `The villa courtyard dressed for the reception, long tables with ivory linen and blush roses, string lights, the loggia behind, no people. 35 mm, f/5.6. {L-AFTERNOON}.` |
| `gallery-07` | Pre-wedding · 1:1 | L-SHADE | `Tight portrait of Janvi and Rohit with foreheads touching, eyes closed, both smiling, soft shade, wisteria blurred behind. {W-BRIDE-PRE}. {W-GROOM-PRE}. 85 mm, f/2.2. {L-SHADE}.` |
| `gallery-08` | Pre-wedding · 3:4 | L-AFTERNOON | `Janvi and Rohit seen from behind walking hand in hand down a gravel garden path between clipped hedges towards the villa, her dupatta trailing. {W-BRIDE-PRE}. {W-GROOM-PRE}. 50 mm, f/4. {L-AFTERNOON}.` |
| `gallery-09` | Destination · 1:1 | L-MORNING | `A honey-stone Tuscan villa glimpsed between tall cypress trees on a gentle hill, terracotta roof, morning haze, no people. 85 mm, f/5.6. {L-MORNING}.` |
| `gallery-10` | Moments · 3:2 | L-MORNING | `Janvi and Rohit standing face to face on the petal path holding their exchanged garlands, wide view showing the pergola, the cypress rows and the hills. {W-BRIDE}. {W-GROOM}. 35 mm, f/4. {L-MORNING}.` |
| `gallery-11` *(extra)* | Moments · 1:1 | soft window light | `Detail of Janvi's hands resting on her lehenga: blush-and-ivory chooda, gold kaleeren hanging from the wrists, intricate bridal mehendi, a rose petal in her palm. Macro, 100 mm, f/4.` |
| `gallery-12` *(extra)* | Moments · 3:2 | L-MORNING | `The pheras: Janvi and Rohit walking around the small sacred fire at the mandap, her dupatta tied to his stole, family seated and blurred around them, jasmine and brass diyas. {W-BRIDE}. {W-GROOM}. 35 mm, f/4. {L-MORNING}.` |
| `gallery-13` *(extra)* | Portraits · 3:4 | L-SHADE | `Detail of Rohit's ivory safa: the neat folds, the pearl kalgi brooch and the feather plume, his profile and beard just visible. 100 mm, f/4. {L-SHADE}.` |
| `gallery-14` *(extra)* | Moments · 3:2 | L-GOLDEN | `Janvi and Rohit walking away down the cypress avenue at golden hour, small in the frame, backlit silhouettes with glowing rims, long shadows on the gravel. {W-BRIDE}. {W-GROOM}. 70 mm, f/5.6. {L-GOLDEN}.` |

---

## 5. Continuity rules

- **People:** the same two faces in every image (attach the identity sheets every time). Keep the height difference set in P-00c in every image.
- **Outfits:**
  - Ceremony outfits (W-BRIDE and W-GROOM) appear in the hero, portraits, ceremony, `story-5` and the ceremony gallery shots.
  - Pre-wedding outfits appear in `story-2`, `story-3`, `story-4` and the pre-wedding gallery shots.
  - `story-1` has its own café clothes.
  - Never mix the two sets in one image.
- **Light:** follow the preset named in each prompt. The site moves from morning (S01–S03) to golden hour (S15).
- **Place:** one generic, unnamed estate, with no recognisable real villa.
- **Wisteria:** pink, hanging from built structures (pergola, arches). It flowers in spring, so in an August scene it reads as styled floral decor.

---

## 6. Acceptance checklist

Reject an image if any of these are true:
- [ ] Hands have the wrong finger count, fused fingers, or a garland passing through a hand.
- [ ] Earrings or jhumkas don't match, or the turban is lopsided or melting.
- [ ] A face differs from the identity sheet, or the couple's relative height differs from P-00c.
- [ ] The wisteria is lilac or purple, or mountains, snow or palm trees appear.
- [ ] There is any lettering, signage, a watermark or a frame.
- [ ] Trees are cloned or repeated, or the sun direction contradicts the named light preset.
- [ ] Skin looks plastic, there are HDR halos, or the image is over-sharpened.
- [ ] It is below the stated minimum size, or the important subject sits outside the crop described above.
- [ ] *(Hero only)* Anything other than sky is in the title zone, or there is no gap between the couple's heads and the trees.

Cultural checks:
- [ ] The safa is neatly and symmetrically tied, and the kalgi is in front.
- [ ] The bride's dupatta is over her head in ceremony images.
- [ ] Garlands are roses and jasmine.
- [ ] The mandap has four pillars and a central havan kund.
- [ ] There is no sacred imagery on floors or near feet.

---

## 7. Importing finished photos

Name each finished file after its target (for example `portrait-bride.jpg`, `gallery-07.png`), put them in one folder, then run:

```bash
python3 tools/import_photos.py ~/Downloads/final-photos
```

The script resizes each photo to its target size (never upscaling), strips metadata including GPS, and writes WebP and AVIF into `public/assets/img/`, replacing the placeholder. It warns when an image is too small or its aspect will be cropped.

For the hero master, follow §3, Route A or Route B.
