# PRD — Janvi & Rohit · The Italian Botanical Garden Wedding

**Project 05 · Premium Interactive Digital Wedding Invitation Website (reusable commercial template)**

| | |
|---|---|
| Document | Product Requirements Document v1.0 |
| Status | Draft for approval. No code is written until this PRD is signed off. |
| Date | 3 November 2026 |
| Wedding | **Sunday, 15 August 2027, 10:00 AM CEST (Europe/Rome)** |
| Destination | Tuscany, Italy (venue to be confirmed) |
| Category | Traditional Punjabi Hindu destination wedding |
| Primary feature | Immersive multi-layer parallax scroll journey |

> **Reading guide.** §0 records what was learned from the three references and the video. §1–§8 define product, people and structure. §9 is the section-by-section UX spec. §10–§12 are the visual system and asset inventory. §13–§14 are the motion specs; every animation has an ID (e.g. `A01.4`) used across the document. §15–§23 cover build, quality and delivery. Items marked **[PLACEHOLDER]** are not confirmed and must stay editable; nothing in this PRD invents a venue address.

---

## 0. Reference analysis

### 0.1 WhatsApp reference video (64 s screen recording; the website loops at ~43 s)

The video shows an illustrated Indian wedding invitation being scrolled on a laptop. The illustrations are not our style, but the scroll mechanics are exactly what this project must match in quality. Frame-by-frame findings:

| Time | What happens | Technique behind it | Our original adaptation |
|---|---|---|---|
| 0–3 s | A carved sandstone arch frames a blue sky with clouds; the couple's names sit centred in the sky. | A foreground **frame layer** over a **sky layer**; the title is DOM text placed between layers. | A wisteria-draped stone pergola frames a Tuscan summer sky (S01). |
| 3–5 s | A temple city rises from the bottom faster than the sky, and **passes in front of the title**, while the title drifts up more slowly and fades. The arch scales up and leaves the frame. | **Multi-speed parallax**, with the title z-sorted *behind* the mid-ground, plus a **scale-through** of the foreground frame. | The cypress trees rise in front of the names (a "text behind the trees" moment) while the pergola and wisteria scale past the camera (A01.4). |
| 5–7 s | A second, scalloped arch rises from below; its opening already shows the next section's sky, and it scales up until the viewer is "through" it. | **Portal transition**: a masked window grows into the next scene. | A **Tuscan round-arch window** opens onto the villa scene of S02 (A01.5). |
| 8–12 s | Blessing line, "INVITE", the parents' names and the couple's names scroll up over the sky; temples and palms on the sides rise at a different speed. | Content at native scroll speed; side scenery in parallax. | Welcome section: villa and side foliage in parallax around the family message (S02). |
| 12–20 s | The section **pins**; one event card is replaced by the next as you scroll. | **Pinned, scroll-scrubbed card stack.** | Events timeline with a drawn garland connector; a pinned card stack is offered as the mobile variant (S07). |
| ~62 s | The card stack ends on an **empty card**. | Data and layout got out of sync. | **Hard rule: never render an empty event node or card** (FR-EVT-05). |
| 20–24 s | A cream panel slides over the previous scene; an arched window shows the sky, then "Meet the Bride & Groom", then the couple artwork rising inside it. | **Section stacking**, an **arch mask** and a rising subject. | Couple section: a hedge-and-balustrade wall rises, then arched portraits reveal (S03). |
| 24–28 s | The couple image scales until it fills the screen. | **Scale-to-fill hand-off.** | Portrait zoom hand-off into the love story (A03.5). |
| 28–31 s | A painted border panel rises; its scalloped centre carries a monogram and expands to reveal paragraph text. | **Frame panel with an expanding window.** | Ceremony section: a jasmine curtain parts around a **scalloped mandap arch** (S08). |
| 31–35 s | A row of arched photos rises, then scales up to fill the width. | Staggered rise followed by scale. | Gallery reel with arched frames (S11). |
| 35–42 s | Calm ivory ending: location pin, "RSVP on WhatsApp", Instagram; the painted frame closes. | A quiet closing scene. | A golden-hour thank-you scene, plus a **real RSVP backend** instead of a WhatsApp link (S13, S15). |

**Qualities to match:** every section is a full-screen *scene*, not a card on a page; each scene has 3–6 independently moving layers; transitions are spatial (through, behind or over), never cuts; text arrives progressively and leaves gracefully; scrolling never feels hijacked.

**Weaknesses to avoid:** the empty event card; low-contrast small text over busy illustration; illustrated (non-photographic) style, which is not wanted here.

### 0.2 Opening-screen reference (portrait image)

Keep: the pergola arch with hanging pink wisteria; cypress-lined lawn with stone walls; the couple seated, exchanging flower garlands (Jaimala), Janvi in a blush lehenga and Rohit in an ivory sherwani with a turban; the olive-wreath **J|R** monogram; type hierarchy (small caps eyebrow, large engraved serif names, script ampersand, laurel-flanked date); "SCROLL TO EXPLORE" with a thin arrow.

**Corrections required:**
- The image says **"SWITZERLAND"** with a mountain icon. Ours must read **TUSCANY, ITALY** with a cypress-and-hills icon (DEC-06).
- The scene is one flattened image. It must be rebuilt as separate layers (§12.3).

### 0.3 Full-website reference (collage)

Keep: arched portrait frames (Couple), the "Our Love Story" split layout, countdown tiles, five arched event tiles, the arched fabric cards for dress code, the three-image gallery, the RSVP and "A Note from Us" and "Thank You" panels, ivory paper with botanical corners.

**Corrections required:**
- It names a real venue ("Villa La Foce"). We do **not** use any real venue: the venue stays a **[PLACEHOLDER]**.
- The "RSVP Now" and "Join Us" buttons use white text on Champagne Gold, which is **2.12:1 contrast and fails WCAG**. Fixed in §11.2.
- The countdown shows static numbers. Ours is live.
- The event tiles have no connectors. The brief asks for auto-generated curved connecting lines (S07).

### 0.4 Cypress avenue reference

A symmetrical gravel road between rows of Italian cypress, leading to a farmhouse on a rise under a deep blue sky. It is the basis for the **Destination dolly-in** (S06, A06.1) and the cypress layer family (CYP-03/04). Each row and the path must be produced as separate layers so the camera can "walk" down the avenue.

---

## 1. Project overview

**What it is.** A single-page, scroll-driven wedding invitation website for Janvi & Rohit's Punjabi Hindu wedding in Tuscany. Guests experience it as a walk through an Italian botanical garden estate, from the gate in the morning to the terrace at golden hour. Along the way they learn the who, when and where, the ceremony and events, what to wear and how to travel, and they RSVP and leave wishes.

**What it also is.** The first instance of a **reusable commercial template**. Every name, date, event, image and palette is content, not code. A customer edits it in a Customer Studio, and the live site updates automatically.

| Fixed facts | Value |
|---|---|
| Bride | Janvi |
| Groom | Rohit |
| Bride's parents | Father: Kapoor · Mother: Lalitha |
| Groom's parents | Father: Vasu · Mother: Jansi |
| Wedding date | 15 August 2027 |
| Ceremony time | 10:00 AM, Italy time (CEST, UTC+2), which is 08:00 UTC and 1:30 PM IST |
| Destination | Tuscany, Italy |
| Venue name and address | **[PLACEHOLDER]**, not confirmed |

**In scope:** the guest-facing site (15 sections), the motion engine, RSVP and wishing-wall backend, calendar files, Customer Studio (editor, media, moderation, exports), the asset production pipeline, and QA.

**Out of scope (v1):** payments or gifting registry, live streaming, guest-to-guest chat, a native app, and printed stationery.

---

## 2. Product vision and creative direction

### 2.1 Vision statement
> *"Before they board the plane, every guest should already have walked the garden."*

The invitation is not a webpage *about* a Tuscan wedding; it **is** a place. Scrolling is walking: past the pergola, down the cypress avenue, onto the villa terrace, into the mandap lawn. It should be as photographic and calm as the real estate, and carry the warmth and ritual of a Punjabi Hindu wedding.

### 2.2 Creative concept: "La Passeggiata", a walk through the garden

The site is one continuous walk and one continuous day:

| Stop | Section | Light |
|---|---|---|
| The pergola gate | S01 Opening | Late-morning sun, deep blue sky |
| The villa terrace | S02 Welcome | Morning |
| The portrait loggia | S03 Couple | Soft shade |
| The rose walk | S04 Love Story | Dappled |
| The sundial terrace | S05 Save the Date | Midday |
| The cypress avenue | S06 Destination | Bright midday |
| The garden rooms | S07 Events | Afternoon |
| The mandap lawn | S08 Ceremony | Bright, then warm |
| The family courtyard | S09 Family | Warm shade |
| The orangery | S10 Dress Code | Diffused |
| The loggia gallery | S11 Gallery | Mixed |
| The estate gate and map | S12 Venue & Stay | Afternoon |
| The guest-book pavilion | S13 RSVP | Late afternoon |
| The wishing wall | S14 Wishes | Late afternoon |
| The sunset terrace | S15 Thank You | Golden hour |

The light progression is **baked into the assets** (colour grade per scene, §12.2). There are no runtime colour filters, which are too expensive on large layers.

### 2.3 Design principles
1. **Photographic truth.** The images must be photoreal, sharp, naturally lit and believable. No fantasy forests, cartoon gardens or 3D-render sheen.
2. **Depth before decoration.** Every scene earns its richness from layered depth, not from added ornaments.
3. **Two arches, one union.** The **Tuscan round arch** (Italian) and the **scalloped mandap arch** (Indian) are the recurring frame motifs. They meet in the ceremony section.
4. **Calm motion.** Motion is slow, physical and tied to the scroll. Nothing bounces, flashes or plays loudly. The guest is always in control.
5. **Information is never hostage to animation.** Date, venue and RSVP are reachable in one tap from anywhere, and fully usable with motion off.
6. **Template-safe.** Any layout must survive longer names, more events, missing photos and a different date without a designer.

---

## 3. Business objectives

| # | Objective | KPI and target |
|---|---|---|
| B1 | Ship a flagship template that sells the premium tier | ≥ 1 sale from demo within 30 days of launch; demo → enquiry conversion ≥ 4 % |
| B2 | Make customer set-up self-serve | Median time from purchase to published site ≤ 60 min; ≤ 2 support tickets per customer |
| B3 | Drive real guest action | RSVP response rate ≥ 70 % of invited households; ≥ 30 % of visitors reach S13 |
| B4 | Perform on the phones guests actually use | Mobile Lighthouse Performance ≥ 85; ≥ 50 fps on mid-range Android (§19) |
| B5 | Reusable engine across future projects | ≥ 70 % of scene/motion code reused unchanged in Project 06 |
| B6 | Protect brand quality | 0 broken layouts in the QA matrix (§23) for 0, 1, 5 and 10 events; long names; missing media |

---

## 4. Target audience

| Segment | Who | What they need |
|---|---|---|
| **Customers (buyers)** | Indian and NRI couples (24–36) planning destination weddings; often parents co-decide and fund; wedding planners buying for clients. | A site that looks luxurious, is quick to personalise, and works on WhatsApp. |
| **Guests (primary users)** | Multi-generational (18–85), mostly on phones, opening from a WhatsApp message (often in WhatsApp's in-app browser); travelling from India, the UK, North America and the Gulf; some non-Indian friends and colleagues. | Date, place, travel and dress code fast; an easy RSVP; to understand the rituals; large, legible text. |
| **Operator** | The template business (you): sets up sites, supports customers, re-skins for future projects. | Clean content model, an admin view, low support load. |

---

## 5. User personas

> Personas are fictional archetypes. They are not Janvi, Rohit or their families.

**P1 · "The Planning Couple": Ananya (29) & Kabir (31), London / Delhi**
Customer. Busy professionals, design-savvy, comparing three invitation vendors.
- *Goals:* look exceptional to 250 guests, set up in one evening, track RSVPs without spreadsheets.
- *Frustrations:* templates that break when names are long or the event count differs; tools that need a developer.
- *Needs from us:* Studio with live preview, event editor, RSVP export, wish moderation.

**P2 · "The Elder Relative": Dadi ji (74), Ludhiana**
Guest. Android phone (2–3 years old), opens everything inside WhatsApp, uses large system font.
- *Goals:* know the date and time, see the couple, forward the invite to the family group.
- *Frustrations:* tiny text, things moving too much, buttons that are hard to hit.
- *Needs:* readable text at 200 % font size, a reduced-motion experience, big buttons, a "Share on WhatsApp" button.

**P3 · "The NRI Cousin": Simran (31), Toronto**
Guest. iPhone, plans travel early.
- *Goals:* flights, hotels, visa, which events to attend, RSVP for a family of four in under two minutes.
- *Needs:* Venue & Stay section, per-event calendar files, guest count, time shown in their own time zone.

**P4 · "The International Friend": Luca (30), Milan**
Guest. Colleague of the groom, first Indian wedding.
- *Goals:* understand what happens, what to wear for each event, and how long the ceremony is.
- *Needs:* a ritual guide in plain English, dress code palettes with examples, ceremony timings.

**P5 · "The Wedding Planner": Meera (38), Mumbai**
Customer-side collaborator.
- *Goals:* keep events and logistics current, export headcounts per event for the caterer.
- *Needs:* collaborator role, per-event RSVP counts, CSV export, change history.

**P6 · "The Operator": template business owner**
- *Goals:* launch new customers in minutes, re-skin the engine for Project 06, see all sites in one place.
- *Needs:* admin dashboard, content schema, scene manifests, asset pipeline docs.

---

## 6. User journeys

**J1 · Guest's first visit from WhatsApp (P2, P3, P4)**

| Step | Guest action | Experience | Success signal |
|---|---|---|---|
| 1 | Taps the link in WhatsApp | Link preview shows the OG card: couple, names, date, "Tuscany, Italy" | Tap-through |
| 2 | Page opens | Monogram loader (≤ 2.5 s), then the garden "breathes in" (A01.1) and the names reveal (A01.2) | LCP ≤ 2.5 s |
| 3 | Scrolls | Steps through the arch into the villa (A01.4–A01.5); the walk continues | Scroll depth |
| 4 | Reads date and countdown | Taps **Add to Calendar** | Calendar event saved |
| 5 | Reaches Events / Dress Code / Stay | Opens an event detail; checks palette | Engagement |
| 6 | RSVPs | 4 fields, submits, sees the thank-you state | RSVP stored, couple notified |
| 7 | Shares | "Share on WhatsApp" in the footer | Share click |

**J2 · "Just tell me when and where" (P2)**
Opens site → taps the floating **RSVP** pill or the menu → *Events* → sees date and time in large type → taps *Add to Calendar*. Total of three taps or fewer, no scrolling needed.

**J3 · Understanding the ceremony (P4)**
Menu → *Ceremony* → the mandap reveal → the ritual guide (six steps, plain English) → *Dress Code* → Wedding palette → *Venue & Stay* → hotel card → booking link.

**J4 · Personalised invitation link (P3)**
Opens `/{slug}/i/{code}` → greeting "Dear Simran & family" in S02 → RSVP prefilled with name and max guests of 4 → submits → can **edit** later from a private edit link shown on screen and in the confirmation email.

**J5 · Customer set-up (P1)**
Buys → receives Studio invite → **Basics** (names, date, time, time zone) → **Families** → **Events** (adds Jaggo, removes Haldi, reorders) → **Photos** (uploads cut-out hero couple, portraits, gallery) → **Dress Code** (uploads outfit illustrations, picks palettes) → **Venue** (keeps "to be announced") → **Preview** on phone and desktop → **Publish** → shares the link.

**J6 · Managing responses (P1, P5)**
Studio → **RSVPs** (table, filters, per-event headcount) → **Export CSV** → **Wishes** (approve or hide queue) → approved wishes appear on the live site within 60 s.

---

## 7. Information architecture

### 7.1 Structure
The guest site is **one long scroll page** made of 15 *scenes*. Every scene is an addressable `<section id>` with its own heading. Navigation groups the scenes into eight menu items, so the menu stays short on phones:

| Menu item | Anchor | Scenes it covers |
|---|---|---|
| Home | `#top` | S01 |
| Our Story | `#couple` | S02 Welcome, S03 Couple, S04 Love Story |
| Celebrations | `#events` | S05 Save the Date, S07 Events, S08 Ceremony, S09 Family |
| Destination | `#destination` | S06 Destination |
| Dress Code | `#dress-code` | S10 |
| Gallery | `#gallery` | S11 |
| Travel & Stay | `#venue` | S12 |
| RSVP | `#rsvp` (primary button) | S13 RSVP, S14 Wishes |

### 7.2 Persistent navigation elements
- **Top bar**: monogram on the left, which scrolls to the top. Desktop shows inline links and an **RSVP** button; mobile shows a hamburger and a **RSVP** button. Transparent over S01, ivory with a hairline divider afterwards. It hides on scroll down and reappears on scroll up (GL-02).
- **Floating RSVP pill** (mobile): appears after S01 and hides while S13 is on screen (GL-04).
- **Progress vine** (desktop ≥ 1024 px): a thin vertical vine at the right edge that grows with page progress. A leaf marks each section; markers are focusable and labelled (GL-03).
- **Motion and sound controls**: a "Pause animations" toggle in the menu and footer (WCAG 2.2.2). A music toggle appears only if music is enabled (P2, off by default).
- **Skip link**: "Skip to RSVP" is the first focusable element.

### 7.3 Content hierarchy within a scene
`Eyebrow (DM Sans, caps)` → `Script accent (optional)` → `Heading (Playfair) / Names (Cormorant)` → `Ornament divider` → `Body (DM Sans)` → `Actions`.

### 7.4 Section visibility rules (template behaviour)
Each section is shown only if its required content exists. A hidden section is removed from the DOM, the menu, the progress vine and the scroll timeline (`ScrollTrigger.refresh()` after layout):

| Section | Hidden when |
|---|---|
| S04 Love Story | 0 milestones |
| S07 Events | 0 published events |
| S08 Ceremony | Ceremony section toggled off |
| S10 Dress Code | 0 dress-code entries |
| S11 Gallery | < 3 images |
| S12 Venue | Never hidden; shows a "Venue to be announced" state instead |
| S14 Wishes | Toggled off |

S01, S05, S13 and S15 cannot be hidden.

---

## 8. Sitemap

```
Guest site  (one site per wedding, served at {slug}.{brand-domain} or /{slug})
│
├── /                              Single-page invitation
│   ├── #top            S01  Immersive Opening
│   ├── #welcome        S02  Welcome
│   ├── #couple         S03  Couple Introduction
│   ├── #story          S04  Our Love Story
│   ├── #save-the-date  S05  Save the Date
│   ├── #destination    S06  Destination Experience
│   ├── #events         S07  Wedding Events
│   ├── #ceremony       S08  Wedding Ceremony
│   ├── #family         S09  Family Introduction
│   ├── #dress-code     S10  Dress Code
│   ├── #gallery        S11  Wedding Gallery  (+ full-screen grid overlay + lightbox)
│   ├── #venue          S12  Venue & Accommodation
│   ├── #rsvp           S13  RSVP
│   ├── #wishes         S14  Wishing Wall
│   └── #thank-you      S15  Thank You (+ footer)
│
├── /i/{inviteCode}                Same page, personalised greeting + RSVP prefill
├── /rsvp/edit/{editToken}         Edit an existing RSVP (opens the S13 form prefilled)
├── /calendar/{eventId}.ics        Calendar file per event (and /calendar/all.ics)
├── /privacy                       Privacy notice (RSVP + wishes data)
└── /opengraph-image               Dynamic social preview (names, date, place, hero)

Customer Studio  (/studio, authenticated)
├── /studio/login                  Magic-link sign-in
└── /studio/{weddingId}
    ├── /basics        Names, date, time, time zone, destination, hashtag
    ├── /families      Parents, grandparents, siblings
    ├── /welcome       Invocation, welcome message
    ├── /story         Milestones (add / edit / reorder / remove)
    ├── /events        Events (add / edit / reorder / remove), ceremony rituals
    ├── /dress-code    Entries per event, palettes, illustrations
    ├── /media         Hero, portraits, gallery, focal points, alt text
    ├── /venue         Venue, map, travel, hotels, transport, essentials
    ├── /rsvp          Settings, invite codes, responses, export
    ├── /wishes        Moderation queue
    ├── /sections      Show / hide sections, music, language
    └── /publish       Preview (phone / tablet / desktop), validation, publish, history

Operator Admin  (/admin, operator role)
└── Weddings list, create from template, impersonate (read-only), usage, support notes
```

---

## 9. Section-by-section UX requirements

**Conventions.**
- *Desktop* means ≥ 1024 px, *tablet* 768–1023 px, *mobile* < 768 px.
- Animation IDs refer to §13–§14; asset IDs refer to §12.
- "Editable" means a field in the content schema (§16).
- Every section has `aria-labelledby` pointing to its heading.

### S01 · Immersive Opening Screen
**Purpose:** Wonder in the first second, and make it unmistakable whose wedding, when and where.

**Content (all editable):**
- Monogram **J | R** in an olive wreath (DEC-05; the letters are live text derived from the names).
- `THE WEDDING OF`
- `JANVI` · script `&` · `ROHIT`
- Ornament
- `15 AUGUST 2027` flanked by olive sprigs
- Cypress-and-hills icon (DEC-06)
- `TUSCANY, ITALY`
- `SCROLL TO EXPLORE` with a thin arrow

**Scene layers:**

| Order (back → front) | Layer | Asset |
|---|---|---|
| 1 | Sky | SKY-01, cloud sprites SKY-04 |
| 2 | Hills | LND-01 |
| — | **Title block (DOM text)** | |
| 3a | Cypress rows L / R | CYP-01, CYP-02 |
| 3b | Lawn, stone walls, path | BOT-01, PTH-01 |
| 6a | Couple cut-out and contact shadow | CPL-01 |
| 5 | Bottom flowers L / R | FLR-01, FLR-02 |
| 4 | Pergola arch and wisteria | VIL-02, WIS-01/02, FOL-01/02 |
| 6b | Scroll cue and UI | |

**Layout:**
- *Mobile (portrait-first):* the composition follows the portrait reference. Title block in the upper 45 % of the screen; couple in the lower 40 %; pergola frames the top corners. Stage height is `100lvh`; text uses `svh`-safe positioning so the iOS and Android toolbars never cover the names or date.
- *Desktop:* a landscape art-directed set (separate crops, `<picture>` media switch). Title centred in the upper half; couple lower-centre at about 38 % of the viewport height; pergola posts at the left and right edges.

**Rules:**
- **Title safe zone:** at scroll progress 0, no pixel of layers 3a and above may overlap the title's bounding box (an asset-production requirement). The cypress trees may pass in front of the title only during scroll.
- Names auto-fit: the font size scales down for names longer than 7 characters (§11.3).
- The hero must be meaningful with motion off: the static composite FBK-S01 shows the whole scene with all text.

**Motion:** A01.1 intro settle · A01.2 title reveal · A01.3 ambient sway · A01.4 step through the arch · A01.5 villa window portal · A01.6 scroll cue exit.

### S02 · Welcome
**Purpose:** A warm, formal invitation from both families.

**Content:**
- Ganesha line icon (DEC-01) and `॥ श्री गणेशाय नमः ॥` (editable; it can be turned off or replaced, for example with "With the blessings of the Almighty").
- Script: `Welcome`. Eyebrow: `TO OUR WEDDING CELEBRATION`.
- Message (default copy, editable):
  > *Together with their families, Kapoor & Lalitha and Vasu & Jansi, Janvi and Rohit joyfully invite you to celebrate their wedding among the gardens of Tuscany. Your blessings and presence will make our forever begin beautifully.*
- With a personalised link, a greeting appears above the message: `Dear {displayName},`

**Layout:**
- *Desktop:* the villa (VIL-01) sits in the right two-thirds of the scene; the text block sits left of centre on an ivory panel with 92 % opacity and a botanical frame (DIV-04 corners).
- *Mobile:* the villa sits in the upper half; the text panel sits in the lower half and overlaps the villa by 12 vh.

**Layers:** SKY-01 (continued from S01), VIL-01, FLR-04 garden flowers, FOL-03 side foliage, text panel.

**Motion:** A02.1 parallax · A02.2 text reveal · A02.3 frame bloom · A03.1 wall-rise exit.

### S03 · Couple Introduction
**Purpose:** Introduce the bride and groom as people, with large, beautiful portraits.

**Content:**
- Eyebrow `MEET`, script heading `The Couple`.
- Bride card: arched portrait (BRD-01), `JANVI`, script `The Bride`, a one-line description (editable, ≤ 140 characters, optional).
- Groom card: the same structure (GRM-01) with `ROHIT` and `The Groom`.

**Layout:**
- *Desktop:* two tall Tuscan-arch frames (aspect 3:4, 30 vw wide), bride on the left and groom on the right. Hanging wisteria tops each arch; rose clusters (FLR-04) sit at each base. The olive-wreath monogram sits between them.
- *Mobile:* stacked, bride first. Each portrait is 84 vw wide, followed by its text. A botanical divider (DIV-03) separates the two.

**Rules:**
- Portraits use a focal point set in Studio, so the face stays inside the arch's safe area (the top 15 % is reserved for the arch curve).
- If a portrait is missing, show a botanical monogram placeholder, never an empty frame.

**Motion:** A03.1 wall rise · A03.2 arch portrait reveal · A03.3 inner portrait parallax · A03.4 botanical sway · A03.5 "Meet" convergence (desktop, P1).

### S04 · Our Love Story
**Purpose:** A photographic timeline of the relationship.

**Content (milestones, editable list of 1–8; default 5):**

| # | Default title | Default body |
|---|---|---|
| 1 | First Meeting | [PLACEHOLDER: when and where they met] |
| 2 | Our Relationship | [PLACEHOLDER] |
| 3 | Special Memories | [PLACEHOLDER] |
| 4 | The Proposal | [PLACEHOLDER] |
| 5 | The Wedding Journey | [PLACEHOLDER] |

Each milestone has: an optional date label (free text, for example "Spring 2021"), a title, a body of ≤ 320 characters, one image (4:5) and alt text.

**Layout:**
- *Desktop (sticky scrollytelling):* a left column holds a sticky arched photo stage (40 vw wide, vertically centred). The right column scrolls the milestones, each about 70 vh tall. A vine timeline runs between the columns, with a leaf-bud node per milestone.
- *Mobile:* a single column. The vine runs along the left edge (16 px inset). Each milestone shows its image (full width minus 48 px, 4:5, arched top) followed by its text.

**Rules:**
- Images never crop faces: they use the focal point.
- With 1 milestone, no vine is drawn and it shows as a single feature block.

**Motion:** A04.1 vine draw · A04.2 node bloom · A04.3 photo swap (desktop) · A04.4 milestone text · A04.5 accent parallax.

### S05 · Save the Date
**Purpose:** Fix the date in guests' minds and calendars.

**Content:**
- Script heading `Save the Date`
- `15 AUGUST 2027` · `10:00 AM` · `TUSCANY, ITALY`
- Time-zone line: `Italy time (CEST)`. If the guest's time zone differs, append `· 1:30 PM in your time zone`, computed live with `Intl`.
- A live countdown with tiles for Days, Hours, Minutes and Seconds.
- An **Add to Calendar** button with a menu: Apple / iCal (.ics), Google Calendar, Outlook.com, Office 365, and "Download .ics".

**Layout:** a centred ivory card with a wisteria garland across its top (DIV-01), over the sundial-terrace scene (VIL-05 urns, SKY-02). Desktop shows four tiles in a row; mobile also shows four in a row (fluid width, 64–72 px each, so they fit a 320 px screen) with labels underneath.

**Rules:**
- The countdown target comes from date + time + time zone (FR-CD-01).
- After the start time: the tiles are replaced with `Today is the day` (during the ceremony day) and then `Just married · 15.08.2027`.
- Render the countdown only after hydration, to avoid an SSR mismatch. On the server, show `— — — —` placeholders.

**Motion:** A05.1 date reveal · A05.2 tile rise and digit roll · A05.3 terrace parallax.

### S06 · Destination Experience
**Purpose:** Make guests *feel* Tuscany. It is the most cinematic scene.

**Content:**
- Eyebrow `THE DESTINATION`; heading `Tuscany, Italy`; script `Benvenuti in Toscana`.
- Three highlight cards (editable defaults):
  1. *The Landscape*: cypress avenues, rolling hills, villa gardens.
  2. *Summer in Tuscany*: warm days in mid-August; light, breathable fabrics recommended.
  3. *Getting Here*: "Travel details are below", which links to `#venue`.

**Scene (pinned, three beats):**
- **Beat 1:** a cypress avenue dolly-in (CYP-03/04, PTH-02, LND-02, SKY-02).
- **Beat 2:** a horizontal pan across the villa-garden panorama (LND-04 with foreground cypress sprites CYP-05).
- **Beat 3:** the highlight cards rise over the final frame.

**Layout:** full-bleed scene. Mobile uses portrait crops of the same layers. The beat 2 panorama pans further on mobile because the viewport is narrower.

**Motion:** A06.1 dolly-in · A06.2 title · A06.3 panorama pan · A06.4 highlight cards.

### S07 · Wedding Events
**Purpose:** The schedule of celebrations, auto-built from the customer's event list.

**Default events** (dates and times other than the ceremony are **[PLACEHOLDER]**, taken from the visual reference):

| # | Event | Date | Time | Icon |
|---|---|---|---|---|
| 1 | Mehendi | 12 Aug 2027 | 4:00 PM | Henna leaf |
| 2 | Haldi | 13 Aug 2027 | 10:00 AM | Haldi bowl |
| 3 | Sangeet | 13 Aug 2027 | 7:00 PM | Dholak |
| 4 | Wedding Ceremony | **15 Aug 2027** | **10:00 AM** | Agni / havan |
| 5 | Reception | 15 Aug 2027 | 7:00 PM | Chandelier |

An optional event library is available in Studio: Chooda & Kaleeren, Jaggo, Maiyan / Vatna, Baraat & Milni, Cocktail, Welcome Dinner, Farewell Brunch, and Custom.

**Node content:** an arched medallion with an icon, then the event name, a short date (`12 AUG`) and the time.
**Detail card (on tap or click):** full date and weekday, time range, venue or area within the estate (or "Venue to be announced"), a description of ≤ 280 characters, a dress-code chip linking to S10, and Add to Calendar for this event.

**Layout (auto-generated geometry, FR-EVT-03):**
- *Desktop:* a horizontal serpentine. There are at most 5 nodes per row; rows alternate direction. Within a row, connectors are cubic Bézier arcs that alternate above and below the centre line (amplitude 28 px). Between rows, a U-turn curve runs on the outer side.
- *Mobile:* a vertical timeline. Nodes alternate left and right (± 18 % of the container width from centre), joined by S-curve connectors.

| Published events | Rendering |
|---|---|
| 0 | Section hidden |
| 1 | One centred node, no connector |
| 2–5 | One row (desktop) |
| 6–10 | Serpentine rows (desktop) |

There are never empty circles: incomplete events are drafts and are not rendered.

**Mobile variant (Studio option):** a "Card Stack" style. A pinned stack in the spirit of the reference (A07.5); the number of cards always equals the number of published events.

**Motion:** A07.0 background parallax · A07.1 connector draw · A07.2 node pop · A07.3 garland beads · A07.4 detail expand · A07.5 card stack (variant).

### S08 · Wedding Ceremony
**Purpose:** A grand moment: the Indian mandap within an Italian garden. Also helps guests understand the rituals.

**Content:**
- Eyebrow `THE WEDDING CEREMONY`; heading `Vivah Sanskar` (editable); `Sunday, 15 August 2027 · 10:00 AM`.
- **Ritual guide** (editable list; defaults shown, each ≤ 200 characters in plain English):
  1. **Baraat & Milni**: the groom's procession arrives; the families greet and embrace.
  2. **Jaimala**: the couple exchange flower garlands.
  3. **Kanyadaan**: the bride's parents bless the union.
  4. **Pheras**: the couple circle the sacred fire, making seven vows.
  5. **Sindoor & Mangalsutra**: symbols of marriage are given.
  6. **Vidaai**: an emotional farewell as the bride leaves with her new family.
- Practical note (editable): ceremony duration, seating, shade and water, phones-down request.

**Scene layers:**

| Order (back → front) | Layer | Asset |
|---|---|---|
| 1 | Sky | SKY-02 |
| 2 | Hills | LND-01 |
| 3 | Cypress backdrop | CYP-05 |
| 4 | Mandap lawn and aisle | BOT-04, PTH-03 |
| 5 | Mandap | MND-01 (four carved ivory-and-gold pillars, a scalloped arch canopy, jasmine and rose garlands) |
| 6 | Havan kund | MND-02 |
| 7 | Brass diyas and urli | MND-03, MND-04 |
| 8 | Seating | MND-05 |
| 9 | Jasmine curtain halves | MND-06 |
| 10 | Text | |

**Layout:**
- *Desktop:* the mandap is centred and the text panel sits at the bottom-left. The ritual guide is a 3 × 2 grid below the pinned scene.
- *Mobile:* the mandap fills the screen; the title is at the top. The ritual guide is a vertical list with icons.

**Motion:** A08.1 curtain parting · A08.2 mandap settle · A08.3 diya ignition · A08.4 petal shower · A08.5 ritual reveal.

### S09 · Family Introduction
**Purpose:** Honour both families.

**Content:**
- Script heading `With Love & Blessings`. Eyebrow `OUR FAMILIES`.
- **The Bride's Family:** `Kapoor & Lalitha` (displayed as entered; optional honorifics and surname fields, see §24 open questions).
- **The Groom's Family:** `Vasu & Jansi`.
- Optional editable lines: grandparents ("With the blessings of"), siblings ("Eagerly awaiting").

**Layout:**
- *Desktop:* two botanical frames (an olive-and-jasmine line frame, DIV-04 corners) side by side, joined by a drawn garland across the gap.
- *Mobile:* stacked, with the garland running vertically between the frames.
- Background: the family courtyard, softly blurred (BOT-02), with slow parallax.

**Motion:** A09.0 courtyard parallax · A09.1 frame draw · A09.2 names reveal · A09.3 garland link.

### S10 · Dress Code
**Purpose:** Show what to wear for each event, styled by the couple.

**Content:** one entry per event (linked by `eventId`, so a removed event removes its entry). Each entry has:
- The event name.
- An outfit theme (for example "Shades of Green").
- A palette of 2–6 swatches, each with a hex value and a name.
- An **outfit illustration or photo** uploaded by the customer (default: fabric image).
- A guidance note of ≤ 200 characters.
- An optional "Please avoid" note (for example "bridal blush & ivory").

Default themes, all editable:

| Event | Theme |
|---|---|
| Mehendi | Shades of Green |
| Haldi | Sunny Yellow |
| Sangeet | Jewel Tones & Sparkle |
| Wedding | Traditional Reds & Gold |
| Reception | Evening Glamour: Champagne & Midnight |

**Layout:**
- Arched cards (aspect 3:4) with the fabric or illustration in the arch and the name and theme on an ivory plate below.
- *Desktop:* ≤ 5 cards in a row; 6 or more become a carousel with arrows.
- *Mobile:* a horizontal swipe carousel (CSS scroll-snap, 78 vw cards with a 12 vw peek, native momentum) with dots.
- Tap or click expands the card: full palette with names, the illustration at large size, guidance, and the "avoid" note.

**Rules:** swatch label colour is chosen automatically (Forest or Ivory) for ≥ 4.5:1 contrast against the swatch.

**Motion:** A10.0 garland parallax · A10.1 card reveal · A10.2 fabric parallax · A10.3 palette chips · A10.4 expand.

### S11 · Wedding Gallery
**Purpose:** An editorial, full-screen photo experience.

**Content:** up to 60 images in four categories: Portraits, Pre-wedding, Wedding Moments, Destination. Each image has a caption (optional), alt text (required), a focal point, and a featured flag. 10–14 featured images form the **Reel**.

**Layout:**
- *Desktop:* the **Editorial Reel** is a pinned horizontal track of featured images in mixed formats (tall arch 3:4 at 70 vh, landscape 3:2 at 60 vh, square at 50 vh). Images are staggered vertically for rhythm and have captions under them in DM Sans small caps. A `View all photos` button opens the **Grid overlay**: full screen, category filter chips, 4 columns. Tapping any image opens the **Lightbox**.
- *Mobile:* the Reel is a horizontal swipe carousel (scroll-snap, 82 vw cards), not pinned. The Grid overlay has 2 columns. The Lightbox supports swipe and pinch-zoom.

**Lightbox:** next and previous, counter (`3 / 24`), caption, close, keyboard support (← → Esc), focus trap, and focus returns to the thumbnail on close.

**Motion:** A11.1 horizontal track · A11.2 inner parallax · A11.3 reel reveals · A11.4 image expansion · A11.5 grid filter.

### S12 · Venue & Accommodation
**Purpose:** Everything a traveller needs, without inventing facts.

**Content (all editable):**
- **Venue card:** venue name **[PLACEHOLDER: "Venue to be announced"]**, address **[PLACEHOLDER]**, optional latitude and longitude, a note.
- **Map:** a static facade image (a villa illustration plus pin). Clicking it loads a Google Maps embed (no third-party requests until clicked). Buttons: `Open in Google Maps` and `Open in Apple Maps`, built from the address or coordinates.
- **Getting there:** editable defaults marked "verify". Nearest airports are typically Florence (FLR) and Pisa (PSA); long-haul arrivals often come via Rome (FCO) or Milan (MXP). Includes train and road notes.
- **Transport:** shuttle schedule (a list of time + from + to), car hire note, parking.
- **Accommodation:** 0–8 hotel cards, each with name, image, distance from the venue, price band (€ to €€€€), booking link, group code, and book-by date.
- **Travel essentials** (editable defaults): Schengen visa reminder for guests who need one ("apply well in advance"), currency (EUR), power plugs (types C, F and L), and August weather (hot; sun protection).

**States:**
- No venue address: show "Venue details coming soon, we'll update this page." Hide the map and direction buttons; never show a broken map.
- No hotels: hide the accommodation block.

**Layout:**
- *Desktop:* left column has the venue card and map; right column has getting-there and transport. Hotel cards sit below in a 3-column grid.
- *Mobile:* stacked; hotels in a swipe carousel.
- Background: villa terrace (VIL-05, VIL-06) with slow parallax.

**Motion:** A12.1 terrace parallax · A12.2 card stagger · A12.3 map facade swap.

### S13 · RSVP
**Purpose:** Collect responses reliably. This is the most important functional element.

**Form fields:**

| Field | Type | Rule |
|---|---|---|
| Full name * | text | 2–80 characters; prefilled from an invite code |
| Attendance * | two large choice cards | `Joyfully accepts` / `Regretfully declines` |
| Number of guests * | stepper | 1 to max (max from the invite code, or the default from settings, which is 6); hidden if declining |
| Events attending | checkbox chips | Shown only if enabled in settings; all selected by default; hidden if declining |
| Dietary preference | select | Vegetarian / Jain / Vegan / Non-vegetarian / Other. Optional; shown if enabled |
| Phone or email | text | Optional; validated format; used only for updates |
| Personal message | textarea | ≤ 500 characters, with a live counter. Optional |
| Hidden | | Honeypot field; Cloudflare Turnstile (managed, usually invisible) |

**Other content:** intro line `We would be delighted to have you with us`, the RSVP deadline line `Kindly respond by [PLACEHOLDER date]`, and the privacy note with a link.

**Success state:**
- `Grazie, {firstName}!` followed by a summary: attending yes or no, guest count, events.
- Add to Calendar.
- Edit link (`/rsvp/edit/{token}`), shown on screen and in the email if one was given.
- Share on WhatsApp.

**Closed states:** after the deadline: "RSVPs are now closed. Please contact the family directly." An error state offers a retry and keeps the guest's input.

**Layout:**
- A framed ivory card (a stone-arch top, VIL-03 shape) over the pavilion garden scene.
- *Desktop:* the card is 560 px wide and centred, with garden layers either side.
- *Mobile:* the card is full width minus 32 px. Inputs are ≥ 48 px tall and use 16 px text, which prevents iOS zoom on focus.

**Motion:** A13.0 garden parallax · A13.1 card rise · A13.2 choice and conditional fields · A13.3 submit and success · A13.4 errors.

### S14 · Wishing Wall
**Purpose:** Let guests leave blessings, shown beautifully once approved.

**Form:**
- Name * (2–60 characters).
- Relation (optional select: Family of the bride / Family of the groom / Friend / Colleague / Other).
- Wish * (10–300 characters).
- Consent checkbox * "Show my wish publicly on this page."
- Honeypot and Turnstile.

**After submit:** "Thank you! Your wish will appear once Janvi & Rohit have seen it." The submitter sees their own card locally with a "Pending" seal (it is not shown to others).

**Display:**
- Approved wishes appear as botanical message cards. There are 6 pressed-flower corner variants (DIV-05), chosen by a hash of the wish ID; cards are rotated ±1.5°.
- *Desktop:* a CSS masonry of 3 columns. *Mobile:* 1 column.
- 12 wishes are shown, followed by `Read more wishes` (loads the next 12).
- Newest first; the couple can pin up to 3 wishes.
- Empty state: "Be the first to leave a wish."

**Optional style (Studio):** "Drifting rows": two marquee rows moving in opposite directions. They pause on hover or focus and obey the global Pause control.

**Motion:** A14.0 margin sprigs · A14.1 batch reveal · A14.2 card hover · A14.3 pending seal.

### S15 · Thank You
**Purpose:** An emotional close at golden hour.

**Content:**
- `TWO HEARTS.` / `ONE JOURNEY.` / `FOREVER IN BLOOM.`
- `JANVI & ROHIT` and the monogram wreath.
- `15 · 08 · 2027 · TUSCANY`
- Footer: hashtag **[PLACEHOLDER, e.g. #JanviWedsRohit]**, `Share on WhatsApp`, `Copy link`, `Back to top`, privacy link, and "Pause animations".

**Scene layers:** SKY-03 golden sky with a sun glow; LND-03 hills; CYP-06 cypress silhouettes; CPL-06 couple silhouette walking down the avenue; FLR-03 petals and dust motes.

**Layout:** the text is centred in the upper half; the couple and avenue are in the lower half. Mobile uses the same structure in portrait art direction.

**Motion:** A15.1 golden-hour rise · A15.2 line sequence · A15.3 ambient motes · A15.4 monogram finale.

---

## 10. Visual design system

### 10.1 Layout grid and spacing

| Breakpoint | Width | Columns | Gutter / side margin | Container |
|---|---|---|---|---|
| Mobile | < 768 px | 4 | 16 px / **16 px** | 100 % |
| Tablet | 768–1023 px | 8 | 24 px / 32 px | 100 % |
| Desktop | 1024–1439 px | 12 | 24 px / 48 px | 1240 px |
| Wide | ≥ 1440 px | 12 | 32 px / auto | 1320 px |

- **Spacing scale (4 px base):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.
- **Section padding:** `clamp(4rem, 10vh, 8rem)` top and bottom (content sections, not stages).
- **Text measure:** body ≤ 60 characters per line; centred text blocks ≤ 36 characters per line.
- **Scenes** are full-bleed (`100vw × 100lvh` stages). Content inside them respects the grid.

### 10.2 Shape language: "two arches"

| Motif | Geometry | Used for |
|---|---|---|
| **Tuscan round arch** | A rectangle with a semicircular top: `border-radius: 999px 999px 0 0` on a 3:4 box (it clamps to a semicircle) | Portrait frames, dress-code cards, love-story stage, RSVP card top, villa-window portal, event medallions |
| **Scalloped mandap arch** | A 7-lobe cusped arch defined once as an SVG `clipPath` (`#arch-scallop`, objectBoundingBox units) | Ceremony frame, ritual icons, ceremony detail card |
| **Olive wreath** | Two mirrored olive branches, open at the top | Monogram (DEC-05), thank-you finale |
| **Garland line** | A curved stroke, with optional jasmine-bead dash pattern `stroke-dasharray: 0 10` and round caps | Event connectors, family link, love-story vine |

UI radii: buttons are pills (`999px`); cards `4px`; inputs `2px`. There are no other radii.

### 10.3 Ornaments and dividers
- **Hairline rule:** 1 px `--gold`, 48–120 px long, with a centred lotus-sprig ornament (DEC-06b).
- **Olive sprig divider** (DIV-03): an SVG that draws on reveal.
- **Wisteria garland** (DIV-01) and **jasmine strand** (DIV-02): raster dividers that sit at the top edge of a scene and overlap the previous one by 8 vh, which hides seams between scenes.
- **Corner florals** (DIV-04): four rose-and-leaf corners for frames.

### 10.4 Imagery rules (summary, full bible in §12.2)
- Photoreal, natural light, consistent sun direction (upper left) within each scene.
- Greens are olive-forest, never neon. Pinks are blush or dusty rose, never magenta. Sky is deep summer blue, never cyan.
- Couple images keep the same faces, outfits and jewellery across the whole site.
- No text inside images. No watermarks. No visible AI artefacts (§12.7 rejection list).

### 10.5 Elevation, texture and light
- **Card shadow:** `0 1px 2px rgb(41 69 53 / .06), 0 14px 36px -14px rgb(41 69 53 / .22)`.
- **Lifted card (hover):** shadow y +6 px and blur +8 px.
- **Paper texture:** BOT-05, a tile at 4 % opacity on ivory panels. Wish cards use an SVG mask for a deckle edge.
- **Scrim** (only where photo-text contrast fails): `linear-gradient(to bottom, rgb(248 244 233 / 0) 0%, rgb(248 244 233 / .65) 100%)` behind the hero text on mobile, applied as a text-sized radial scrim rather than across the whole image.

### 10.6 Iconography
Line icons, 1.25 px stroke at 24 px (scaling with size), round caps and joins, drawn on 24 / 32 / 48 px grids. Colour: `--gold-ink` on light and `--gold` on dark. Every event icon is drawn so it can be animated with DrawSVG: one continuous path where possible.

### 10.7 Core components

| Component | Spec |
|---|---|
| Button / Primary | `--forest` fill, `--ivory` text (9.57:1), DM Sans 500 15 px caps with 0.14 em tracking, height 48 px, padding 0 28 px, pill. Hover darkens to `#1F3528`. Focus ring as below. |
| Button / Gold | `--gold` fill, **`--forest` text (4.51:1)**, DM Sans **600**. Never ivory or white text on gold (2.12:1). |
| Button / Ghost | Transparent, 1 px `--gold-ink` border, `--gold-ink` text (5.52:1). |
| Focus ring | 2 px `--gold-ink` outline plus a 2 px `--ivory` offset (≥ 3:1 against adjacent colours). Always visible on `:focus-visible`. |
| Input | 48 px tall, `--ivory` background, 1 px `--botanical` border (6.9:1), 16 px text, label above (never placeholder-only). Error: 1.5 px `--error` border, message below with an icon. |
| Choice card | 72 px tall, 1 px `--botanical` border. Selected: `--forest` fill, ivory text, and a check icon. |
| Event medallion | Tuscan arch, 112 × 136 px desktop / 88 × 108 px mobile, ivory fill, 1 px gold border, 48 px icon. |
| Countdown tile | 88 × 104 px (mobile fluid 64–72 × 88), ivory with 92 % opacity, 1 px gold border, number in Cormorant 600 at 40 px (mobile 32 px), label in DM Sans caps 11 px. |
| Chip | 32 px tall, pill, 1 px `--sage` border, DM Sans 13 px. Selected: `--botanical` fill with ivory text. |
| Swatch | 40 px circle, 1 px inner border at `rgb(41 69 53 / .15)`, name below (12 px). |

---

## 11. Colour palette and typography

### 11.1 Brand palette (from brief)

| Token | Hex | Role | Share of surface |
|---|---|---|---|
| `--forest` | **#294535** Forest Green | Primary text on light, dark surfaces, primary buttons | ~15 % |
| `--botanical` | **#405A43** Botanical Green | Secondary text, icons, borders, selected chips | ~10 % |
| `--sage` | **#A9BBA0** Sage Green | Decorative fills, dividers, quiet backgrounds (not for text) | ~5 % |
| `--ivory` | **#F8F4E9** Soft Ivory | Base surface | ~55 % |
| `--gold` | **#C4A66A** Champagne Gold | Ornaments, rules, borders, gold buttons (with forest text), display text on forest | ~5 % |
| `--rose` | **#D9A5A0** Dusty Rose | Floral accents, highlights, the script ampersand on dark (not for small text on light) | ~2 % |
| `--beige` | **#E9DDCA** Warm Beige | Secondary surfaces, card plates, form backgrounds | ~8 % |

### 11.2 Accessibility-derived tokens (added; required)
Contrast was measured with the WCAG 2.x formula. Champagne Gold, Dusty Rose and Sage **cannot carry text on light surfaces**, so ink variants are added:

| Token | Hex | Purpose | Contrast |
|---|---|---|---|
| `--gold-ink` | **#7A5E2A** Antique Gold | Gold-coloured *text*, eyebrows, icons on light | 5.52:1 on ivory · 4.52:1 on beige |
| `--rose-ink` | **#9C5B55** Deep Rose | Rose-coloured text (e.g. "The Bride" script at small sizes) | 4.73:1 on ivory |
| `--error` | **#9E3A2F** Terracotta | Form errors | 6.16:1 on ivory |
| `--success` | = `--forest` | Confirmations | 9.57:1 |

**Contrast matrix (measured):**

| Foreground → Background | Ratio | Allowed use |
|---|---|---|
| Forest on Ivory | 9.57 | All text |
| Botanical on Ivory | 6.92 | All text |
| Botanical on Beige | 5.67 | All text |
| Forest on Beige | 7.84 | All text |
| Ivory on Forest | 9.57 | All text |
| Ivory on Botanical | 6.92 | All text |
| Gold on Forest | 4.51 | Text ≥ 14 px at weight 600, or ≥ 18.66 px; display text |
| Forest on Gold | 4.51 | Gold-button labels (600 weight) |
| Forest on Sage | 5.16 | Text on sage chips |
| Forest on Dusty Rose | 4.93 | Text on rose tags |
| Antique Gold on Ivory | 5.52 | Gold-tone text |
| Gold on Botanical | 3.26 | Large display text only (≥ 24 px) or ornaments |
| **Gold on Ivory** | **2.12** | **Ornaments, rules and borders only: never text** |
| **Ivory or white on Gold** | **2.12** | **Never** |
| **Dusty Rose on Ivory** | **1.94** | **Decoration only** |
| **Sage on Ivory** | **1.85** | **Decoration only** |

**Text over photographs:** hero and scene text must measure ≥ 4.5:1 against the *actual pixels* behind it at progress 0. Use `--forest` or `--gold-ink` on light sky areas. If a customer image breaks this, Studio applies the local scrim (§10.5) automatically and flags it.

Add `<meta name="color-scheme" content="light">` and `color-scheme: light` so that Samsung Internet, Android "force dark" and iOS Smart Invert do not recolour the palette.

### 11.3 Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Couple names, monogram, numbers | **Cormorant Garamond** | 500, 600 | Uppercase for names, tracking 0.04 em, lining numerals |
| Headings | **Playfair Display** | 400, 500, 400 italic | Sentence case |
| Body and UI | **DM Sans** | 400, 500, 600 | Optical size axis on; tabular numerals in the countdown |
| Decorative script | **Pinyon Script** (fallback: Italianno) | 400 | Only for 1–3 word accents ≥ 32 px; never the sole carrier of information |
| Devanagari (invocation) | **Tiro Devanagari Hindi** | 400 | Loaded only if the invocation is enabled; subset to the glyphs used |
| Gurmukhi (optional Punjabi lines) | **Noto Serif Gurmukhi** | 400 | Only if Punjabi text is added (P2) |

**Type scale** (fluid; rem with a 16 px root; never below 16 px for body):

| Style | Family | Size | Line height | Tracking |
|---|---|---|---|---|
| `names-hero` | Cormorant 500 caps | `clamp(3.25rem, 2rem + 9vw, 8.5rem)` | 0.95 | 0.04 em |
| `names-section` | Cormorant 500 caps | `clamp(2rem, 1.4rem + 3vw, 3.5rem)` | 1.0 | 0.06 em |
| `script-xl` | Pinyon Script | `clamp(2.75rem, 1.6rem + 5vw, 5rem)` | 1.1 | 0 |
| `script-m` | Pinyon Script | `clamp(2rem, 1.5rem + 2vw, 3rem)` | 1.1 | 0 |
| `h2` | Playfair 400 | `clamp(2rem, 1.25rem + 3.2vw, 3.5rem)` | 1.15 | -0.01 em |
| `h3` | Playfair 400 | `clamp(1.375rem, 1.1rem + 1vw, 1.75rem)` | 1.25 | 0 |
| `date-display` | Cormorant 500 caps | `clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem)` | 1.2 | 0.12 em |
| `eyebrow` | DM Sans 500 caps | `0.8125rem` (13 px) | 1.4 | 0.28 em |
| `body` | DM Sans 400 | `1.0625rem` (17 px) | 1.7 | 0 |
| `body-s` | DM Sans 400 | `0.9375rem` (15 px) | 1.6 | 0 |
| `caption` | DM Sans 500 caps | `0.75rem` (12 px) | 1.4 | 0.18 em |

**Name auto-fit (template rule):**
1. Names always stack: `JANVI` / `&` / `ROHIT`.
2. At render, measure the longest name at `names-hero` size. If it exceeds 86 % of the container width, scale both names down equally to fit (minimum `2.25rem`).
3. Names longer than 14 characters may wrap onto two lines (balanced with `text-wrap: balance`).
4. QA fixtures: "Jo", "Janvi", "Venkataraghavan", "Anne-Marie Fitzgerald".

**Loading:** self-host via `next/font` with Latin subsets; `display: swap` with size-adjusted fallbacks (prevents CLS). Preload Cormorant 500 and DM Sans 400 only; load the script font after first paint (the hero ampersand shows in Cormorant italic until it arrives).

---

## 12. Asset inventory

### 12.1 Conventions
- **Depth groups** follow the brief: **D1** Sky · **D2** Distant landscape · **D3** Cypress and garden · **D4** Foreground foliage · **D5** Flowers, decor, architecture · **D6** Couple photography, text, UI.
- **Orientation sets:** every scene layer has a **desktop (landscape 16:9)** and a **mobile (portrait 9:19.5)** art-directed version, unless marked "shared".
- **Masters:** desktop 3840 × 2160, mobile 1440 × 3120 (16-bit PNG or PSD, never shipped). Layers that extend past the frame for parallax travel are larger, per the overscan rule (§12.4).
- **Delivery:** AVIF (primary) and WebP (fallback). Desktop widths 1280 / 1920 / 2560; mobile widths 720 / 1080 / 1440. Alpha layers use AVIF with alpha quality 70.
- **Budget** is the largest delivered variant in AVIF.

### 12.2 Inventory

**1 · Sky backgrounds**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| SKY-01 | Morning summer sky, deep blue to pale horizon, soft high cumulus | S01, S02 | D1 | No | 120 KB |
| SKY-02 | Clear midday sky, few clouds | S05, S06, S08 | D1 | No | 100 KB |
| SKY-03 | Golden-hour sky, warm peach to apricot, sun glow upper left | S15 | D1 | No | 120 KB |
| SKY-04 | Cloud sprites ×3 (soft, separable) for drift | S01, S02, S06 | D1 | Yes | 40 KB each |
| SKY-05 | Sun-glow sprite (radial, additive) | S15 | D1 | Yes | 20 KB |

**2 · Distant Tuscan landscapes**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| LND-01 | Rolling green-gold hills with a distant tree line and soft haze (top edge transparent) | S01, S08 | D2 | Yes | 160 KB |
| LND-02 | Hills with a hilltop farmhouse at the end of the avenue | S06 beat 1 | D2 | Yes | 160 KB |
| LND-03 | Golden-hour hills with layered silhouettes | S15 | D2 | Yes | 140 KB |
| LND-04 | Wide villa-garden panorama, 3:1 desktop / 4:1 mobile: villa, parterre, cypress, hills | S06 beat 2 | D2–D3 | No | 450 KB |

**3 · Cypress tree layers**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| CYP-01 | Cypress row, left side (receding into depth) | S01 | D3 | Yes | 180 KB |
| CYP-02 | Cypress row, right side | S01 | D3 | Yes | 180 KB |
| CYP-03 | Avenue far rows L / R (2 files) | S06 | D3 | Yes | 140 KB each |
| CYP-04 | Avenue near pairs L / R (2 files, large, sharp) | S06 | D3–D4 | Yes | 200 KB each |
| CYP-05 | Single cypress sprites ×4 (heights 60–100 % of the viewport height) | S06 pan, S08, S12 | D3 | Yes | 60 KB each |
| CYP-06 | Golden-hour cypress silhouettes, avenue | S15 | D3 | Yes | 120 KB |

**4 · Botanical garden backgrounds**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| BOT-01 | Lawn, low stone walls and box hedges (hero mid-ground) | S01 | D3 | Yes (top) | 220 KB |
| BOT-02 | Formal parterre or courtyard, soft focus | S07, S09 | D3 | No | 160 KB |
| BOT-03 | Rose-garden walk, dappled light, soft focus | S04 | D3 | No | 160 KB |
| BOT-04 | Mandap lawn with an aisle of petals | S08 | D3 | Yes (top) | 200 KB |
| BOT-05 | Ivory paper texture tile, 512 × 512, seamless, with a faint botanical watermark | Panels, shared | — | No | 25 KB |

**5 · Foreground transparent foliage**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| FOL-01 | Top-left branch cluster: leaves, vine, light through leaves | S01 | D4 | Yes | 150 KB |
| FOL-02 | Top-right branch cluster | S01 | D4 | Yes | 150 KB |
| FOL-03 | Side ivy and vine strips L / R (tall) | S02, S07, S13 | D4 | Yes | 90 KB each |
| FOL-04 | Bottom foreground leaves, shallow depth of field (pre-blurred, no CSS blur) | S04, S12 | D4 | Yes | 80 KB |
| FOL-05 | Olive branch sprigs ×3 | Decor, shared | D4 | Yes | 30 KB each |
| FOL-06 | Box-hedge and balustrade foreground strip (wall rise) | S02→S03 | D4 | Yes | 120 KB |

**6 · Hanging pink flowers and florals**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| WIS-01 | Long pink wisteria strands ×4 variants (separate files, so each can sway) | S01, S03, S05 | D4–D5 | Yes | 50 KB each |
| WIS-02 | Short wisteria clusters ×3 | S01, S03 | D5 | Yes | 35 KB each |
| FLR-01 | Blush hydrangea and garden-rose bush, bottom left | S01 | D5 | Yes | 120 KB |
| FLR-02 | The same, bottom right (not a mirror) | S01 | D5 | Yes | 120 KB |
| FLR-03 | Rose-petal sprites ×6 plus dust-mote sprite ×2 | Ambient, S08, S13, S15 | D5 | Yes | 8 KB each |
| FLR-04 | White and blush flower clusters (peony, garden rose) ×4 | S02, S03, S10 | D5 | Yes | 60 KB each |
| FLR-05 | Jasmine (mogra) strands ×3 | S08, DIV-02 | D5 | Yes | 40 KB each |

**7 · Garden pathways**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| PTH-01 | Pale stone path with scattered petals (hero) | S01 | D3 | Yes | 120 KB |
| PTH-02 | Gravel avenue road, strong perspective | S06 | D3 | Yes | 150 KB |
| PTH-03 | Petal-strewn aisle to the mandap | S08 | D3 | Yes | 120 KB |

**8 · Tuscan villa architecture**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| VIL-01 | Villa facade: honey stone, arched loggia, terracotta roof, climbing roses (sky cut out) | S02 | D5 (arch.) | Yes | 260 KB |
| VIL-02 | Stone-and-timber pergola arch frame with wisteria, transparent centre | S01 | D4 | Yes | 220 KB |
| VIL-03 | Tuscan-arch window shape (SVG; mask for the portal and the RSVP card) | S01→S02, S13 | — | SVG | 1 KB |
| VIL-04 | Stone balustrade foreground | S02→S03, S05 | D4 | Yes | 90 KB |
| VIL-05 | Terrace with terracotta urns, lemon trees and flowers | S05, S12 | D5 | Yes | 200 KB |
| VIL-06 | Villa courtyard with garden dining tables | S12 | D3 | No | 180 KB |
| VIL-07 | Stone garden wall segments L / R | S07, S13 | D5 | Yes | 80 KB each |

**9 · Wedding mandap**

| ID | Asset | Used in | Depth | Alpha | Budget |
|---|---|---|---|---|---|
| MND-01 | Mandap: four carved ivory-and-gold pillars, scalloped arch canopy, jasmine and rose garlands | S08 | D5 | Yes | 300 KB |
| MND-02 | Brass havan kund with a small fire; the flame is a separate sprite (MND-02f) | S08 | D5 | Yes | 40 KB + 15 KB |
| MND-03 | Brass diyas ×5 (sprites) plus glow sprite | S08 | D5 | Yes | 10 KB each |
| MND-04 | Brass urli with floating flowers; brass kalash | S08 | D5 | Yes | 40 KB each |
| MND-05 | Guest seating: ivory chairs with blush runners | S08 | D5 | Yes | 120 KB |
| MND-06 | Jasmine-strand curtain halves L / R (dense, translucent edges) | S08 | D4 | Yes | 140 KB each |
| MND-07 | (P2) Flame loop: 2 s, 480 px, WebM and MP4, muted | S08 | D5 | — | 250 KB |

**10 · Couple photography** (template placeholders; customers replace them)

| ID | Asset | Used in | Alpha | Budget |
|---|---|---|---|---|
| CPL-01 | Hero: seated garland exchange (Jaimala). Cut-out, a separate contact-shadow layer, and the full composite | S01, OG image | Yes + No | 260 KB |
| CPL-02 | Walking hand in hand down the cypress avenue | S04, S06 | No | 200 KB |
| CPL-03 | Laughing close-up, foreheads touching | S11 | No | 180 KB |
| CPL-04 | Twirl or dance (Sangeet look) | S11 | No | 180 KB |
| CPL-05 | At the mandap, during the pheras | S08, S11 | No | 200 KB |
| CPL-06 | Golden-hour silhouette walking away (cut-out) | S15 | Yes | 90 KB |
| CPL-07…11 | Love-story milestones ×5 (4:5), each in a distinct setting | S04 | No | 160 KB each |

**11 · Bride portraits**

| ID | Asset | Used in | Budget |
|---|---|---|---|
| BRD-01 | Hero portrait 3:4: blush lehenga, dupatta over head, kundan jewellery, wisteria behind | S03 | 200 KB |
| BRD-02 | Detail: hands with blush-and-ivory chooda and gold kaleeren, mehendi | S11, S07 detail | 140 KB |
| BRD-03 | Dupatta flowing among the wisteria | S11 | 180 KB |

**12 · Groom portraits**

| ID | Asset | Used in | Budget |
|---|---|---|---|
| GRM-01 | Hero portrait 3:4: ivory sherwani, ivory safa with pearl kalgi, blush dupatta | S03 | 200 KB |
| GRM-02 | Detail: kalgi and turban, mojari, sherwani buttons | S11 | 140 KB |
| GRM-03 | In the villa loggia, natural light | S11 | 180 KB |

**13 · Traditional wedding decorations and icons** (SVG unless noted)

| ID | Asset | Used in |
|---|---|---|
| DEC-01 | Ganesha invocation line icon | S02 (top only) |
| DEC-02 | Jasmine-and-rose toran (door hanging), PNG with alpha | S07, S09 |
| DEC-03 | Kalash, diya and lotus icons | S08 ritual guide |
| DEC-04 | Event icon set ×12: henna leaf, haldi bowl, dholak, agni/havan, chandelier, chooda, Jaggo (decorated pot with lamps), ghodi (Baraat), Milni embrace, cocktail glasses, brunch, custom star | S07, S10 |
| DEC-05 | Monogram: olive-wreath frame, with letters as live text | Nav, S01, S03, S15, favicon |
| DEC-06 | Cypress-and-hills location icon; DEC-06b lotus-sprig ornament | S01, dividers |
| DEC-07 | Ritual icons ×6 (Baraat, Jaimala, Kanyadaan, Pheras, Sindoor, Vidaai) | S08 |

**14 · Floral section dividers**

| ID | Asset | Used in | Format | Budget |
|---|---|---|---|---|
| DIV-01 | Horizontal wisteria garland (scene-top overlap) | S05, S10 | AVIF alpha | 70 KB |
| DIV-02 | Jasmine strand divider | S08, S09 | AVIF alpha | 40 KB |
| DIV-03 | Olive sprig line divider (draws on scroll) | Global | SVG | 2 KB |
| DIV-04 | Rose-and-leaf frame corners ×4 | S02, S09, S13 | AVIF alpha | 30 KB each |
| DIV-05 | Pressed-flower card corners ×6 variants | S14 | AVIF alpha | 15 KB each |

**15 · Wedding gallery images** (placeholders)

| ID | Category | Count | Format | Budget |
|---|---|---|---|---|
| GAL-P01…06 | Couple portraits | 6 | 3:4 and 4:5 | 300 KB each (lightbox 2048 px), 50 KB thumbnail |
| GAL-W01…06 | Pre-wedding | 6 | Mixed | Same |
| GAL-M01…06 | Wedding moments (Jaimala, pheras, Milni, Vidaai, details) | 6 | Mixed | Same |
| GAL-D01…06 | Destination (avenue, villa, terrace, hills, mandap set-up, table settings) | 6 | 3:2 | Same |

**16 · System assets**

| ID | Asset |
|---|---|
| FBK-S01…S15 | Flattened static composite per scene and orientation, for reduced motion and Tier C. Exported from the same layer stack at rest (≤ 280 KB mobile). |
| OG-01 | Open Graph template, 1200 × 630, generated dynamically (couple, names, date, "Tuscany, Italy"). |
| FAV-01 | Favicon, apple-touch-icon, and maskable PWA icon from the monogram. |
| LDR-01 | Loader: the monogram wreath as SVG (draw animation). |
| MAP-01 | Map facade illustration (villa plus pin), desktop and mobile. |

**Total unique raster assets:** ≈ 120 files × 2 orientations, which produces ≈ 1,400 delivered variants after the build.

### 12.3 Visual consistency bible (all generators and photographers follow it)

**Place.** A generic, non-identifiable Tuscan estate:
- Honey travertine and sandstone, terracotta roofs and urns, box-hedge parterres, pale gravel paths.
- Potted lemon trees and Italian cypress (narrow, columnar, deep green).
- Rolling hills with a soft haze.
- No real, recognisable villa.

**Florals:**
- Pink wisteria (blush to soft pink, *not* lilac).
- White and blush garden roses, blush hydrangea, peony, jasmine (mogra).
- *Realism note:* wisteria blooms in spring, so in an August scene it is treated as styled floral décor on the pergola and arches (common at destination weddings). Keep it on built structures, not on wild trees.

**Light by scene:**

| Scene | Time | Colour temperature | Sun |
|---|---|---|---|
| S01–S03 | ~10:00 | 5600 K | Upper left |
| S04–S07 | 11:00–14:00 | 5800 K | Higher, upper left |
| S08 | 10:30 | 5600 K, warm bounce from brass | |
| S09–S14 | 16:00–18:00 | 5000 K | |
| S15 | ~19:45 golden hour | 3200 K | Low left |

**Camera:**
- Eye level (~1.6 m).
- Lenses: 35 mm for environments, 50 mm for couple-in-scene, 85 mm for portraits.
- Apertures: f/4 for environments, f/2.8 for portraits.
- Level horizon and straight verticals. No fisheye, no tilt.

**Grade:**
- Greens toward `#405A43` and `#294535`; pinks toward `#D9A5A0` and `#E8B9B4`.
- Natural deep-blue sky.
- Warm ivory highlights that never clip; lifted but not milky shadows; 2 % fine grain.

**Couple identity:**
- Generate an **identity sheet** for each person first (front, three-quarter and profile, neutral light). Use it as the character reference in every later generation.
- The same faces, hairline, beard shape, skin tone, height ratio and jewellery appear across all ≥ 25 couple images.

**Wardrobe: ceremony look (S01, S03, S08, hero gallery)**
- *Janvi:* blush-pink lehenga with gold zari and sequin floral embroidery; sheer blush dupatta with a scalloped border, draped over the head; kundan and polki jewellery (choker plus rani haar, maang tikka, jhumkas, optional nath); blush-and-ivory chooda with gold kaleeren; mehendi on the hands.
- *Rohit:* ivory sherwani with gold tone-on-tone embroidery; blush dupatta with a gold border; ivory churidar; ivory safa with a pearl kalgi and a small plume; ivory and gold mojari; optional floral sehra for the Baraat image only.
- Pre-wedding looks for S04 and S11 only: Janvi in an ivory anarkali or pastel saree; Rohit in a linen suit or bandhgala. Keep the same jewellery family.

**Cultural accuracy checks:**
- The safa is properly tied and symmetrical.
- Garlands are roses and jasmine.
- The mandap has four pillars and a central havan kund.
- The bride's dupatta is over the head in ceremony images.
- Sacred imagery (Ganesha, Om) appears only at the top invocation. Never in footers, on floors, or near feet or shoes in any composition.

### 12.4 Layer production pipeline: "generate → decompose → inpaint"
Parallax layers cannot be generated separately and then glued together, because the lighting would never match. Each scene is produced as follows:

1. **Master composite.** Generate or shoot the full scene per orientation at the master size. Iterate until the composition, light and couple are approved. This is the *look of record*.
2. **Mark the layers.** On the master, draw cut lines for D1–D6, mark the **title safe zone**, and mark the travel direction for each layer (from §13.2).
3. **Decompose.** Segment each depth band (SAM or Photoshop Select Subject, plus manual refinement on foliage and wisteria).
4. **Inpaint behind.** Fill every region hidden by a nearer layer, so moving layers never reveal holes. Extend each layer past the frame by its overscan:
   - `overscan = |travel| + 4 %` of the frame on each edge it moves away from.
   - Layers that exit the frame (foreground) need no overscan on the exit side.
   - Layers that only scale up need none.
5. **Edges.** Defringe; apply a 1–2 px feather on foliage; inspect over `#000` and `#FFF` for halos.
6. **Shadows.** Export contact shadows (couple on lawn, mandap on grass, urns on terrace) as separate multiply layers that move with their object.
7. **Export.** Masters as 16-bit PNG or PSD. A build script (sharp) produces AVIF (q 52, alpha q 70) and WebP (q 78) at the breakpoint widths, plus a 24 px blurred placeholder (base64) for each layer.
8. **Fallback.** Export the flattened FBK composite from the same stack at progress 0.
9. **Engine test.** Load into the scene at progress 0 / 0.25 / 0.5 / 0.75 / 1 on both orientations. Check for gaps, halos and seams; reject and repeat if any appear.

### 12.5 Naming and folders
```
/public/scenes/{scene}/{orient}/{scene}_{assetId}_{slug}_{width}.{avif|webp}
  e.g. /public/scenes/s01/mob/s01_cyp-01_cypress-left_1080.avif
/public/scenes/{scene}/manifest.json   ← layer list, depth, speeds, sizes (see §18.4)
/assets-src/{scene}/master_{orient}.psd   ← not deployed
```

### 12.6 Prompt templates (for AI image generation)
Base suffix for every prompt:
> *photorealistic editorial wedding photograph, natural late-morning sunlight from upper left, soft atmospheric haze, Tuscan countryside estate, natural colour grade with olive-forest greens and dusty-rose pinks, deep blue summer sky, full-frame camera, {lens} lens, f/{aperture}, high detail, realistic textures*

Negative or avoid list for every prompt:
> *fantasy, cartoon, illustration, 3D render, CGI, plastic skin, oversaturated, neon green, magenta, lilac wisteria, text, watermark, logo, extra fingers, deformed hands, asymmetrical jewellery, duplicated people, mountains, snow, alpine*

Note that "mountains, snow, alpine" is in the avoid list because the opening reference reads "Switzerland".

| Category | Prompt core |
|---|---|
| Hero master | *a Punjabi Hindu bride and groom seated on an ivory upholstered bench on a pale stone garden path, exchanging rose-and-jasmine garlands, beneath a weathered stone-and-timber pergola draped with hanging pink wisteria, tall Italian cypress trees lining a green lawn with low stone walls, rolling hills beyond; {wardrobe: ceremony look}* |
| Cypress avenue | *symmetrical gravel road lined by tall Italian cypress trees, perfectly straight, leading to a stone farmhouse on a gentle rise, green fields, deep blue sky, centred one-point perspective* |
| Villa | *honey-stone Tuscan villa with an arched loggia, terracotta roof, climbing white roses, potted lemon trees in terracotta urns on a gravel terrace* |
| Mandap | *a traditional Indian wedding mandap with four carved ivory-and-gold pillars and a scalloped arch canopy, draped with jasmine strands and blush roses, brass diyas and a brass havan kund, standing on a manicured lawn in a Tuscan garden with cypress trees behind* |
| Golden hour | *the same cypress avenue at golden hour, warm low sun from the left, long shadows, the couple walking away hand in hand in silhouette* |
| Foliage and florals (for extraction) | *close-up of {hanging pink wisteria strands / blush hydrangea bush / olive branch}, in the same garden, same light; shallow depth of field, clean separation from the background* |

### 12.7 Image rejection checklist
Reject any image that has:
- Hands with the wrong finger count or fused fingers.
- Mismatched earrings or jhumkas.
- A turban that is melting or asymmetrical.
- Garlands that pass *through* hands.
- Gibberish text or signage.
- Duplicated cypress trees (copy-paste repetition).
- Inconsistent sun direction between layers of one scene.
- A face that differs from the identity sheet.
- Lilac or purple wisteria.
- Mountains, snow or alpine features.
- Plastic or waxy skin.
- Over-sharpening halos.

---

## 13. Parallax animation specifications

### 13.1 Engine model
- **Native scrolling only.** No scroll-jacking, no wheel interception, no ScrollSmoother. Feel comes from ScrollTrigger `scrub` smoothing, not from a virtual scroller.
- **Stage + content.** Every scene has a **stage** (`position: sticky; top: 0; height: 100lvh; overflow: clip`) that holds the image layers, and a **content track** that scrolls through it. Scenes with choreographed beats use a GSAP **pin** instead of sticky (§14.3).
- **One timeline per scene.** All layers of a scene are tweened inside *one* `gsap.timeline({ scrollTrigger: { … scrub } })`. There is never one ScrollTrigger per layer: this keeps the triggers under 40 for the whole page.
- **Transforms only.** Layers move with `transform` (`x`, `y`, `scale`, `rotation`) and `opacity`. No `top`, `left`, `width`, `height`, `filter` or `backdrop-filter` is animated. `clip-path` is allowed in two named places only (A04.3 and A11.3), and only one instance at a time.
- **Scrubbed motion is linear.** Every scroll-linked layer tween uses `ease: "none"`, so that movement stays proportional to finger movement (physical depth). Easing is applied only to time-based reveals and inside choreographed beats where noted.

### 13.2 Depth speed system
Speed is expressed as **travel over a scene's full progress** (from scene top meeting the viewport bottom, to scene bottom meeting the viewport top, or over the pin duration). Negative y means up. Content (D6 text) scrolls natively at speed 1.0.

| Depth | Brief layer | Relative speed | Desktop travel (y) | Mobile travel (y) | Extra motion |
|---|---|---|---|---|---|
| D1 | Sky and distant landscape | 0.08 | −4 vh | −2 vh | Cloud drift x (time-based) |
| D2 | Distant hills and mountains | 0.18 | −8 vh | −5 vh | Scale 1→1.04 in pinned scenes |
| D3 | Cypress trees and garden | 0.38 | −16 vh | −10 vh | Lateral spread in dolly scenes |
| D5a | Garden architecture (villa, walls, urns) | 0.55 | −24 vh | −14 vh | None |
| D6 | Couple photography, text, UI | 1.00 | native | native | Reveals (§14) |
| D5b | Flowers, decorative elements | 1.10 | +6 → −36 vh | +4 → −22 vh | Independent x drift ±2 vw and rotation ±3° |
| D4 | Foreground leaves and hanging branches | 1.30 | +10 → −50 vh | +6 → −30 vh | Scale up and outward x when exiting |

**Why these numbers:** the spread between the slowest (0.08) and fastest (1.30) layer creates strong depth without motion sickness. Mobile travel is ~60 % of desktop because a phone's viewport is narrower and the eye is closer.

**Independent flower motion (D5b).** Each flower or wisteria sprite has a seeded random `xDrift ∈ [−2, 2] vw`, `rot ∈ [−3°, 3°]` and `speedJitter ∈ [−0.05, +0.05]` applied in its scene timeline, so no two flowers move in lockstep. The seed is the asset ID, so motion is deterministic across visits.

### 13.3 Rendering order versus motion depth
The brief numbers layers by **speed**. The **z-order** differs where physics demands it:
1. Sky (D1)
2. Hills (D2)
3. **Title block (DOM)**: placed behind the cypress trees so they can rise in front of it (S01 only)
4. Cypress and garden (D3)
5. Architecture (D5a)
6. **Couple (D6 photography)**: physically sits on the lawn, so it is *behind* the foreground flowers
7. Contact shadows sit just beneath the couple
8. Flowers (D5b)
9. Foreground foliage (D4)
10. **Interactive UI and section text (D6)**: always on top, always legible

### 13.4 Device tiers (motion quality levels)

| Tier | Detection | Behaviour |
|---|---|---|
| **A: Full** | Desktop, iPhone 12 or newer, Android with `deviceMemory ≥ 6` and `hardwareConcurrency ≥ 6` | All layers, pins, clip reveals, ambient motion |
| **B: Lite** | Android with `deviceMemory ≤ 4` or `hardwareConcurrency ≤ 4`, *or* a runtime FPS probe showing an average frame time > 22 ms over the first 90 frames of scrolling | Max 4 layers per scene (D1 + D2 merged; D5b secondary sprites dropped); travel ×0.6; clip-path reveals replaced by counter-scale masks; ambient sprites ≤ 4; pins shortened 30 % |
| **C: Static** | `prefers-reduced-motion: reduce`, in-site "Pause animations", `navigator.connection.saveData`, or a hard probe failure (> 40 ms) | Flattened FBK composites; no pins; no scrub; content appears with a 200 ms opacity fade only; countdown digits change without rolling |

Tier is decided on load. It can be **downgraded** at runtime (A→B), never upgraded within a session, and is stored in `sessionStorage`.

### 13.5 Scene-by-scene parallax specifications

Each spec below follows the same six fields required by the brief. *Progress* `p` means scene timeline progress from 0 to 1.

---

#### A01.1 · Hero intro: "the garden breathes in"
- **Trigger:** time-based, on load. Starts when all S01 layers resolve `img.decode()` for the current orientation, or after 2.5 s, whichever is first. The loader (GL-01) exits first.
- **Elements:** D1 sky, D2 hills, D3 cypress L / R and lawn, couple, D5b flowers, D4 pergola and wisteria.
- **Movement:** each layer starts zoomed and offset, then settles to rest:
  - Back layers (D1–D3): from `scale: 1.08, y: 3vh, opacity: 0` (opacity 0 only for D1) to rest.
  - Couple: from `scale: 1.04, y: 2vh, opacity: 0` to rest.
  - Foreground (D4, D5b): from `scale: 1.15` and `x: ∓6vw` (outward) to rest.
- **Duration and easing:** 1.8 s, `expo.out`; stagger 0.12 s from back to front (sky first, foliage last). Total ≈ 2.5 s.
- **Mobile:** 1.4 s; `scale` from 1.05; foreground x offset ∓4 vw.
- **Performance:** `will-change: transform` is added before the intro and removed on complete. Images are decoded before animating (no decode jank). Scrolling is not blocked: if the user scrolls during the intro, the intro timeline jumps to its end (`progress(1)`) and A01.4 takes over.

#### A01.3 · Hero ambient motion
- **Trigger:** time-based. Starts after A01.1. Runs only while S01 is ≥ 10 % visible (IntersectionObserver); paused by "Pause animations".
- **Elements:** WIS-01/02 strands (each separately), SKY-04 clouds, scroll cue.
- **Movement:**
  - Wisteria: `rotation: ±1.2°` around the top-centre origin, plus `x: ±4px`.
  - Clouds: `x: 0 → −6vw`.
  - Scroll cue arrow: `y: 0 → 8px`.
- **Duration and easing:**
  - Wisteria: 4–7 s per strand (seeded), `sine.inOut`, yoyo, infinite.
  - Clouds: 80 s, linear, infinite, implemented as a CSS keyframe for zero JS cost.
  - Cue: 1.6 s `sine.inOut` yoyo.
- **Mobile:** wisteria ±0.8°; clouds identical.
- **Performance:** ≤ 7 tweening sprites. Small, separate layers each have their own compositor layer. Paused when off-screen.

#### A01.4 · Hero scroll: "step through the arch"
- **Trigger:** S01 pinned. `start: "top top"`, `end: "+=180%"` (mobile `+=140%`); `scrub: 0.8` (touch: `0.35`); `anticipatePin: 1`.
- **Elements and movement** (all `ease: "none"`, positions as timeline progress `p`):

| Element | p 0 → 0.6 | p 0.6 → 1.0 |
|---|---|---|
| Title block | `y: 0 → −14vh`, `scale: 1 → 0.96`; opacity 1 → 0 between p 0.12 and 0.45 | Gone |
| D1 sky | `y: 0 → −3vh`, `scale: 1 → 1.04` (whole range) | Continues |
| D2 hills | `y: 0 → −6vh`, `scale: 1 → 1.06` | Continues |
| D3 cypress L / R | `scale: 1 → 1.14`, `x: 0 → ∓4vw` (spreading as we approach); rises **in front of** the title | Continues to `scale: 1.2` |
| Lawn and path | `scale: 1 → 1.18`, transform-origin bottom centre | Continues |
| Couple | `scale: 1 → 1.22`, `y: 0 → 4vh` (we walk towards them) | Fades to 0.3 under the portal |
| D5b bottom flowers | `scale: 1 → 1.5`, `y: 0 → 22vh`, `x: ∓10vw` | Out of frame |
| D4 pergola and wisteria | `scale: 1 → 1.6`, `x: ∓18vw`, `y: −10vh` (passing overhead) | Out of frame |

- **Duration and easing:** scroll-linked over 1.8 viewports, linear.
- **Mobile:** pin 1.4 viewports; scale ranges reduced by 30 % (for example pergola 1 → 1.42).
- **Performance:** about 9 transformed layers in one timeline. All layers are `<img>` elements with `decoding="async"` and explicit `width` and `height`. The pergola and foreground layers are the heaviest; they are clipped by the stage (`overflow: clip`) so scaled pixels outside the viewport are not painted.

#### A01.5 · Hero to Welcome: "villa window" portal
- **Trigger:** inside the A01.4 timeline, p 0.6 → 1.0.
- **Elements:** an overlay `.arch-window` (VIL-03 shape) inside the S01 stage, containing S02's first-frame layers (SKY-01 continuation and VIL-01 villa) at their S02 rest positions.
- **Movement:**
  1. The window rises from `y: 40vh` to centre (p 0.6 → 0.7).
  2. It then scales from `1` to `S_cover` (p 0.7 → 1.0), where `S_cover = max(100vw / w, 100lvh / h) × 1.35`, so the arch's curved top also clears the corners.
  3. The inner content is **counter-scaled** (`1 / s`) so the villa scene stays fixed while the window grows.
- **Duration and easing:** scroll-linked; `power2.inOut` inside the 0.7 → 1.0 segment (this is the one eased scrub, to make the "through" moment feel intentional).
- **Hand-off rule:** at p = 1 the overlay is pixel-identical to S02's stage at its progress 0. The pin releases, the overlay hides (`autoAlpha: 0`), and S02 continues. There is no visible jump (QA item Q-MOT-04).
- **Mobile:** window base width 64 vw (desktop 34 vw).
- **Performance:** compositor-only (transform scale on the outer and inner elements; `border-radius` on a scaled layer is rasterised once). Tier B uses the same technique; Tier C crossfades to FBK-S02.

#### A01.6 · Scroll cue exit
- **Trigger:** first 2 % of the A01.4 progress.
- **Element:** "SCROLL TO EXPLORE" and its arrow.
- **Movement:** `opacity: 1 → 0`, `y: 0 → 12px`.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** identical.
- **Performance:** trivial.

#### A02.1 · Welcome parallax
- **Trigger:** S02 stage (sticky). `start: "top bottom"`, `end: "bottom top"`, `scrub: 0.8` (touch 0.35).
- **Elements and movement:**
  - SKY-01: `y: 0 → −4vh`.
  - VIL-01 villa (D5a): `y: 6vh → −18vh`.
  - FLR-04 flowers (D5b): `y: 10vh → −30vh` plus seeded x drift and rotation.
  - FOL-03 side vines (D4): `y: 20vh → −45vh`, `rotation: 0 → −3°` (left) and `+3°` (right).
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** the travel table's mobile column. FOL-03 is reduced to a single strip on the right.
- **Performance:** 4 layers, one timeline.

#### A03.1 · Welcome to Couple: "wall rise"
- **Trigger:** S02's last 40 %. `start: "bottom 140%"`, `end: "bottom top"`, scrub.
- **Elements:** FOL-06 hedge and VIL-04 balustrade strip (a D4 overlay at the bottom of S02); S03's ivory panel.
- **Movement:**
  - Hedge strip: `y: 100% → −10%`. It rises over the villa and fills the lower 60 % of the screen.
  - S03 panel: slides under it (native scroll); its top edge is hidden behind the hedge, so there is no hard section seam.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** identical, using a hedge strip at 70 % of the viewport height.
- **Performance:** one large alpha layer (≤ 120 KB). Scrolled past, it is unloaded with `content-visibility: auto` on S02.

#### A03.3 · Portrait inner parallax
- **Trigger:** each portrait frame. `start: "top bottom"`, `end: "bottom top"`, scrub.
- **Element:** the `<img>` inside each arched frame (the frame itself scrolls natively).
- **Movement:** `yPercent: −8 → 8`. The image is 116 % of the frame height, so no edge is ever visible.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** `yPercent: −5 → 5`.
- **Performance:** a single transform per image.

#### A03.4 · Couple botanical surroundings
- **Trigger:** S03 scroll (scrub) plus time-based sway.
- **Elements:** WIS strands over the arch tops (D4–D5); FLR-04 rose clusters at the portrait bases (D5b).
- **Movement:**
  - Wisteria: `y: 0 → −12vh` with the A01.3 sway parameters.
  - Roses: `y: 8vh → −20vh`, `x` drift ±1.5 vw.
- **Duration and easing:** scroll-linked, linear; sway 4–7 s `sine.inOut`.
- **Mobile:** roses only (wisteria sway retained).
- **Performance:** ≤ 6 sprites.

#### A04.5 · Love story accent parallax
- **Trigger:** S04 scroll, scrub.
- **Elements:** FOL-04 foreground leaves (bottom), FLR-03 scattered petals (3), BOT-03 background (desktop only, 12 % opacity behind the columns).
- **Movement:**
  - Leaves: `y: 10vh → −40vh`.
  - Petals: `y: 20vh → −60vh`, `rotation: 0 → 90–180°` (seeded).
  - Background: `y: 0 → −6vh`.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** petals only.
- **Performance:** S04 is tall (~5 viewports desktop). Layers are inside a sticky stage, so their count does not grow with height.

#### A05.3 · Save-the-date terrace parallax
- **Trigger:** S05 stage, scrub.
- **Elements and movement:**
  - SKY-02: `y: 0 → −4vh`.
  - VIL-05 urns and terrace: `y: 8vh → −20vh`.
  - DIV-01 wisteria garland on the card top: `y: 4vh → −10vh`, plus sway.
  - VIL-04 balustrade (bottom, D4): `y: 15vh → −35vh`.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** the balustrade is dropped.
- **Performance:** 4 layers.

#### A06.1 · Destination beat 1: "cypress avenue dolly-in"
- **Trigger:** S06 pinned. `start: "top top"`, `end: "+=300%"` (mobile `+=220%`); `scrub: 0.8` (touch 0.35). Beat 1 occupies p 0 → 0.45.
- **Elements and movement** (all from rest at p 0, linear):

| Layer | To (at p 0.45) |
|---|---|
| CYP-04 near pairs L / R | `scale: 1.9`, `x: −30vw / +30vw`: they sweep past the camera and leave the frame |
| CYP-03 far rows L / R | `scale: 1.35`, `x: −8vw / +8vw` |
| PTH-02 avenue road | `scale: 1.5`, transform-origin `50% 100%`, `y: +10vh` |
| LND-02 hills and farmhouse | `scale: 1.12` |
| SKY-02 | `scale: 1.03` |

  The differential scale *is* the forward walk: near objects grow fastest and slide outward, far ones barely change.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** near pairs `scale: 1.7`, `x: ∓26vw`. Same structure (portrait crops place the avenue's vanishing point at 42 % of the viewport height).
- **Performance:** 7 layers. Tier B merges the far rows into the hills layer (5 layers).

#### A06.3 · Destination beat 2: "panorama pan"
- **Trigger:** inside the S06 timeline, p 0.45 → 0.78.
- **Elements:** LND-04 panorama (D2–D3), CYP-05 foreground cypress sprites ×3 (D4), FOL-06 hedge strip (D5).
- **Movement:**
  - Panorama: `x: 0 → −(panoramaWidth − 100vw)`.
  - Foreground cypress: `x` at 1.6× the panorama distance.
  - Hedges: 1.2×.
  - The beat 1 layers fade out (`autoAlpha 1 → 0`) during p 0.45 → 0.5 while the panorama fades in.
- **Duration and easing:** scroll-linked, linear (`power1.inOut` on the crossfade only).
- **Mobile:** the panorama is 4:1, so the pan is longer, which suits the narrow screen. Two foreground sprites instead of three.
- **Performance:** the panorama is the largest single image (≤ 450 KB desktop, ≤ 320 KB mobile). It is preloaded when S06 enters `rootMargin: 150%`.

#### A07.0 · Events background parallax
- **Trigger:** S07 stage, scrub.
- **Elements and movement:**
  - BOT-02 parterre (at 18 % opacity over ivory): `y: 0 → −8vh`.
  - VIL-07 wall segments L / R: `y: 10vh → −25vh`.
  - FOL-03 side vines: `y: 20vh → −45vh`.
  - DEC-02 toran at the section top: sways ±1°.
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** walls are dropped; one vine strip is kept.
- **Performance:** 4 layers.

#### A08.1 · Ceremony: "jasmine curtain parting"
- **Trigger:** S08 pinned. `start: "top top"`, `end: "+=220%"` (mobile `+=170%`), scrub. Beat occupies p 0 → 0.35.
- **Elements:** MND-06 left and right curtain halves (D4), FLR-05 single strands.
- **Movement:**
  - Left half: `x: 0 → −60vw`, `rotation: 0 → −2°`, `y: 0 → −4vh`.
  - Right half: mirrored.
  - Individual strands keep a time-based sway (±1°, 3–5 s).
- **Duration and easing:** scroll-linked; `power1.in` (the curtain accelerates as it is drawn apart, like fabric).
- **Mobile:** `x: ∓70vw` (the curtain must fully clear a narrow screen).
- **Performance:** 2 large alpha layers. Jasmine strands are pre-baked into the halves except 3 sway sprites.

#### A08.2 · Mandap settle
- **Trigger:** S08 timeline, p 0.1 → 0.55.
- **Elements and movement:**
  - MND-01 mandap with MND-02, MND-04 and MND-05 grouped: `scale: 1.12 → 1`, `y: 4vh → 0`.
  - Cypress backdrop: `scale: 1.05 → 1`.
  - SKY-02 and LND-01: `y: 0 → −3vh`.
- **Duration and easing:** scroll-linked; `power2.out` within the segment (an arrival feel).
- **Mobile:** identical ranges.
- **Performance:** grouped layers transform as one element.

#### A15.1 · Thank you: "golden-hour rise"
- **Trigger:** S15 entering. `start: "top bottom"`, `end: "top top"`, scrub.
- **Elements and movement:**
  - SKY-03 golden sky: from `opacity: 0.4` to 1.
  - SKY-05 sun glow: `scale: 0.8 → 1.2`, `opacity: 0 → 1`.
  - LND-03 hills: `y: 10vh → 0`.
  - CYP-06 silhouettes: `y: 20vh → 0` (they rise from below).
  - CPL-06 couple silhouette: `y: 6vh → 0`, `scale: 0.95 → 1`.
  - A warm gradient overlay on the *bottom of S14*: `opacity: 0 → 1`, so the previous section warms into the golden light (the "day ends" moment).
- **Duration and easing:** scroll-linked, linear.
- **Mobile:** identical, with a shorter range (`start: "top 90%"`).
- **Performance:** the sun glow uses a pre-rendered radial sprite (no CSS gradients animated, no `mix-blend-mode` on large layers; additive feel baked into the PNG).

#### A09.0 / A10.0 / A13.0 / A14.0 · Remaining scene backgrounds
All four are sticky-stage parallax, using `start: "top bottom"`, `end: "bottom top"`, scrub, linear easing, and the §13.2 mobile travel column.

| ID | Scene | Layers and travel (desktop) | Mobile | Performance |
|---|---|---|---|---|
| A09.0 | S09 Family | BOT-02 courtyard (soft focus, 30 % opacity under ivory) `y: 0 → −8vh`; DEC-02 toran sways ±1°; FLR-04 corner clusters `y: 8vh → −24vh` | Courtyard only | 3 layers |
| A10.0 | S10 Dress Code | DIV-01 wisteria garland at the scene top `y: 4vh → −12vh` with sway; FOL-05 olive sprigs ×2 `y: 10vh → −30vh`, rotation ±3° | Garland only | 3 layers |
| A13.0 | S13 RSVP | SKY-02 `y: 0 → −4vh`; VIL-07 walls L / R `y: 6vh → −20vh`; FOL-03 vines `y: 20vh → −45vh`; FLR-04 clusters `y: 10vh → −30vh` | Sky plus one vine | 4 layers; the card itself scrolls natively |
| A14.0 | S14 Wishes | BOT-05 paper (static); FOL-05 olive sprigs at the margins `y: 10vh → −30vh` | None (static) | Cards are not parallaxed, to keep reading stable |

### 13.6 Animation index
- **§13.5 (parallax specs):** A01.1, A01.3–A01.6, A02.1, A03.1, A03.3, A03.4, A04.5, A05.3, A06.1, A06.3, A07.0, A08.1, A08.2, A09.0, A10.0, A13.0, A14.0, A15.1.
- **§14.4 (reveals and interactions):** GL-01 to GL-05, R-TXT, A01.2, A02.2, A02.3, A03.2, A03.5, A04.1–A04.4, A05.1, A05.2, A06.2, A06.4, A07.1–A07.5, A08.3–A08.5, A09.1–A09.3, A10.1–A10.4, A11.1–A11.5, A12.1–A12.3, A13.1–A13.4, A14.1–A14.3, A15.2–A15.4.

---

## 14. Scroll interaction specifications

### 14.1 Global configuration
```ts
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Flip, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });   // no recalculation on URL-bar show/hide
gsap.defaults({ ease: "power3.out", duration: 0.9 });
const mm = gsap.matchMedia();                           // tier and breakpoint branches
```
- **Stage height** uses `100lvh` (stable when browser bars collapse); critical text positions use `svh`. Fallback is `100vh` where `lvh` is unsupported.
- **Refresh** `ScrollTrigger.refresh()` runs after: fonts loaded (`document.fonts.ready`), each scene's images decoded, section visibility changes, orientation change, and gallery filter changes. Refreshes are debounced to 150 ms.
- **No CSS `scroll-behavior: smooth`** on `html` (it conflicts with pins). Anchor scrolling is handled in JS (§14.5).
- **Scroll snapping** is never used on the main page. It is used only inside horizontal carousels (`scroll-snap-type: x mandatory`).

### 14.2 Motion tokens

| Token | Value | Use |
|---|---|---|
| `ease.parallax` | `none` | All scrubbed layer travel |
| `ease.reveal` | `power3.out` | Text and image entrances |
| `ease.title` | `power4.out` | Large name and title character reveals |
| `ease.settle` | `expo.out` | Intro settle |
| `ease.cinematic` | `power2.inOut` | Eased segments inside scrubbed beats |
| `ease.pop` | `back.out(1.7)` | Medallions and buds (small elements only) |
| `ease.sway` | `sine.inOut` | Idle foliage |
| `spring.ui` | Motion `{ type: "spring", stiffness: 260, damping: 30 }` | Interface (cards, toggles, modals) |
| `dur.micro` | 0.2 s | Hovers, focus |
| `dur.ui` | 0.35 s | Toggles, menus |
| `dur.reveal` | 0.9 s | Default reveal |
| `dur.title` | 1.2 s | Name and title reveals |
| `dur.intro` | 1.8 s | Hero settle |
| `stagger.char` | 0.035 s | SplitText chars |
| `stagger.word` | 0.06 s | SplitText words |
| `stagger.line` | 0.12 s | SplitText lines |
| `stagger.card` | 0.1 s | Card groups |
| `scrub.pointer` | 0.8 | Mouse and trackpad |
| `scrub.touch` | 0.35 | Touch (less lag under the finger) |
| `reveal.start` | `"top 78%"` | Default reveal trigger point |

**Reveal rule:** time-based reveals play **once** (`once: true`). Scrolling back up does not replay them; scrubbed parallax always reverses. This keeps re-reading calm.

### 14.3 Pin budget

| Scene | Desktop pin | Mobile pin | Why |
|---|---|---|---|
| S01 Hero | +180 % | +140 % | Step through the arch + portal |
| S03 Couple (convergence, P1) | +80 % | **none** | Portraits meet |
| S06 Destination | +300 % | +220 % | Dolly, pan, cards |
| S08 Ceremony | +220 % | +170 % | Curtain, mandap, diyas |
| S11 Gallery | + track width (capped at +250 %, ≈ 10–14 images) | **none** (swipe carousel) | Horizontal reel |
| S15 Thank You | +100 % | +80 % | Line-by-line finale |
| S07 (Card Stack variant only) | n/a | + (N − 1) × 60 % | Event cards |

**Rules:**
- **Total pinned distance:** ≤ 11.5 viewports desktop; ≤ 6.5 mobile, or ≤ 9 with the Card Stack variant.
- **No single pin is longer than 3 viewports.**
- **Something must visibly change in every 15 % of a pin's progress**, so the guest never thinks the page is stuck.
- All other scenes use sticky stages (no pin spacers, cheaper).

### 14.4 Reveal and interaction specifications

#### GL-01 · Loader
- **Trigger:** first paint, before hero assets are decoded.
- **Element:** LDR-01 monogram wreath on ivory.
- **Movement:**
  - Wreath stroke: DrawSVG `0% → 100%`.
  - Letters: opacity `0 → 1`.
  - Exit: the loader fades (`autoAlpha → 0`) while the wreath scales `1 → 0.9`.
- **Duration and easing:** draw 1.2 s `power2.inOut`; exit 0.5 s `power2.out`. It exits as soon as the hero is decoded, with a minimum of 0.8 s (to avoid a flash) and a maximum of 2.5 s (then it exits regardless).
- **Mobile:** identical.
- **Performance:** inline SVG with no external requests. The loader is shown **only on first visit in the session** (`sessionStorage`); repeat visits go straight to A01.1.

#### GL-02 · Top bar hide and show
- **Trigger:** scroll direction after the S01 pin ends (ScrollTrigger `onUpdate` with `self.direction`).
- **Element:** the top bar.
- **Movement:** scrolling down: `yPercent: 0 → −100`. Scrolling up: `→ 0`. Background changes from transparent to ivory 94 % with a hairline border once past S01.
- **Duration and easing:** 0.35 s `power2.out`.
- **Mobile:** identical. The bar stays visible whenever the menu is open or focus is inside it.
- **Performance:** a single transform.

#### GL-03 · Progress vine (desktop)
- **Trigger:** page scroll. `start: 0`, `end: "max"`, `scrub: true`.
- **Element:** an SVG vine at the right edge, with a leaf marker per visible section.
- **Movement:** DrawSVG `0% → 100%`. Each marker leaf scales `0.6 → 1` and fills gold when its section is active (`toggleClass`).
- **Duration and easing:** scroll-linked; leaf 0.3 s `back.out(2)`.
- **Mobile:** replaced by a 2 px gold progress bar at the top (`scaleX`).
- **Performance:** a single path; markers are 15 small elements.

#### GL-04 · Floating RSVP pill (mobile)
- **Trigger:** shows after S01's pin end; hides while S13 is ≥ 20 % visible.
- **Element:** an RSVP pill at the bottom-right (56 px tall, safe-area inset aware).
- **Movement:** `y: 80px → 0`, `opacity: 0 → 1`.
- **Duration and easing:** 0.35 s `power3.out`.
- **Mobile only.** Desktop uses the top-bar RSVP button.

#### GL-05 · Ambient petals
- **Trigger:** time-based. Runs in S08, S13 (after success) and S15 while visible.
- **Element:** FLR-03 petal sprites: desktop ≤ 12, mobile ≤ 6, Tier B ≤ 4, Tier C 0.
- **Movement:** fall `y: −10vh → 110vh`, sway `x: ±6vw` (sine), `rotation: 0 → 360°` (randomised), and `rotationX` flutter of ±60° for depth.
- **Duration and easing:** 9–16 s per petal (seeded), `none` on y and `sine.inOut` on x; recycled at the bottom.
- **Performance:** DOM sprites with transforms (not canvas) to keep it simple at this count. Paused when off-screen and by "Pause animations".

#### R-TXT · Standard text reveal (used by every section heading and body)
- **Trigger:** the element's top reaches 78 % of the viewport; `once: true`.
- **Elements:** eyebrow, script heading, heading, body, ornament.
- **Movement:**
  - Eyebrow: `opacity 0 → 1`, `letterSpacing 0.5em → 0.28em`.
  - Script heading: `opacity 0 → 1`, `y: 16px → 0`, plus a mask wipe from left to right using a gradient mask on a small element.
  - Heading: SplitText `lines`, each line masked (`overflow: clip`), `yPercent: 105 → 0`.
  - Body: SplitText `lines`, `y: 24px → 0`, `opacity 0 → 1`.
  - Ornament: DrawSVG `0 → 100%`, or `scaleX 0 → 1` for rules.
- **Duration and easing:**
  - Eyebrow 0.8 s `power3.out`.
  - Heading 1.0 s `power4.out`, `stagger.line`.
  - Body 0.9 s `power3.out`, `stagger.line`, starting 0.15 s after the heading.
  - Ornament 1.0 s `power2.inOut`.
- **Mobile:** same, with durations ×0.85.
- **Performance:** SplitText runs after fonts load. Splits are reverted (`split.revert()`) on resize and rebuilt. Lines are cached so there is no reflow on scroll.

#### A01.2 · Hero title reveal
- **Trigger:** time-based, 0.6 s into A01.1.
- **Elements and movement:**
  1. Monogram wreath: DrawSVG `0 → 100%` (1.4 s `power2.inOut`); then the letters J | R fade in (0.6 s).
  2. `THE WEDDING OF`: the side rules grow `scaleX 0 → 1` from the inner ends (0.8 s); the text fades in with letter-spacing `0.5em → 0.28em` (1.0 s).
  3. `JANVI` and `ROHIT`: SplitText `chars` in masked lines, `yPercent: 110 → 0` (1.2 s `power4.out`, stagger 0.04, ROHIT starting 0.25 s after JANVI).
  4. The script `&`: `opacity 0 → 1`, `scale 0.9 → 1`, `rotation −4° → 0` (1.0 s `power3.out`), at the midpoint between the names.
  5. Date line and olive sprigs: sprigs DrawSVG (0.9 s); date `opacity` and `y 12 → 0` (0.8 s).
  6. Location icon and `TUSCANY, ITALY`: fade-up (0.8 s).
  7. Scroll cue: fade in (0.6 s), then A01.3 bob starts.
- **Total:** ≈ 3.2 s; it never delays interaction.
- **Mobile:** char stagger 0.03; total ≈ 2.8 s.
- **Performance:** about 14 character elements per name. Text is real DOM text (selectable, readable by screen readers through an `aria-label` on the h1).

#### A02.2 · Welcome text and A02.3 frame bloom
- **Trigger:** text block top at 78 %; `once`.
- **Elements and movement:**
  - Ganesha icon: DrawSVG (1.2 s).
  - Invocation line: R-TXT body.
  - "Welcome" script: R-TXT script.
  - Message: R-TXT lines.
  - Personal greeting (if present): appears first, with `y: 12 → 0`.
  - **Frame bloom** (scrubbed, `start: "top 85%"`, `end: "top 40%"`): DIV-04 corners `scale: 0.9 → 1`, `rotation: ±4° → 0`, `opacity 0 → 1`.
- **Duration and easing:** as R-TXT; frame scroll-linked.
- **Mobile:** identical.

#### A03.2 · Arch portrait reveal
- **Trigger:** each portrait frame. `start: "top 85%"`, `end: "top 35%"`, scrub.
- **Element:** the portrait frame (outer, Tuscan arch, `overflow: clip`), its inner slider, and the image.
- **Movement:** a mask slide:
  - Inner slider: `yPercent: 100 → 0`, while the image inside counter-moves `yPercent: −100 → 0`, so the picture appears to be uncovered from the bottom rather than sliding.
  - At the same time, the image `scale: 1.25 → 1`.
  - Then the name (SplitText chars, 1.0 s `power4.out`, `once`) and the "The Bride" / "The Groom" script (R-TXT script) follow when the frame reaches 50 %.
- **Duration and easing:** mask and scale are scroll-linked, linear; text is time-based.
- **Mobile:** `start: "top 90%"`, `end: "top 45%"`.
- **Performance:** transform-only mask (no clip-path).

#### A03.5 · "Meet" convergence (desktop, P1)
- **Trigger:** S03 desktop only. Pin `+=80%`, scrub.
- **Elements:** both portrait frames and the central monogram.
- **Movement:**
  - Bride frame: `x: −6vw → 0`; groom frame: `x: +6vw → 0`.
  - Monogram: `scale 0.8 → 1`, `opacity 0 → 1` between them.
  - At the end, the bride portrait `scale: 1 → 1.06` as a hand-off into S04.
- **Duration and easing:** scroll-linked, `power2.inOut`.
- **Mobile:** not used (stacked layout).

#### A04.1 · Love-story vine draw and A04.2 node bloom
- **Trigger:**
  - Vine: S04, `start: "top 60%"`, `end: "bottom 60%"`, `scrub: true`.
  - Nodes: each milestone at `"top 55%"` (`toggleActions: "play none none reverse"`).
- **Elements:** a vine SVG path (gold-ink 1.5 px) with leaf-bud nodes.
- **Movement:**
  - Vine: DrawSVG `0% → 100%`.
  - Bud: `scale 0.4 → 1`, `rotation −20° → 0`, fill `--sage → --rose`, and two small leaves unfurl (`rotation ±40° → 0`).
- **Duration and easing:** vine linear; bud 0.6 s `back.out(1.6)`.
- **Mobile:** the vine sits at the left; nodes align to each milestone image's top.
- **Performance:** a single path; ≤ 8 nodes.

#### A04.3 · Sticky photo swap (desktop)
- **Trigger:** each milestone text block crossing the viewport centre (`onEnter` and `onEnterBack`).
- **Element:** the sticky arched stage holding 5 stacked images.
- **Movement:**
  - The incoming image: `clip-path: inset(100% 0 0 0) → inset(0% 0 0 0)` (revealing from the bottom), with `scale 1.12 → 1`.
  - The outgoing image: `scale 1 → 1.04`, then hidden.
  - A caption plate under the stage updates with a crossfade.
- **Duration and easing:** 0.9 s `power3.inOut`.
- **Mobile:** not used. Inline images use A03.2's mask reveal instead.
- **Performance:** one active clip-path at a time. Images are preloaded when S04 enters `rootMargin: 100%`.

#### A04.4 · Milestone text
R-TXT, plus the date label animating `letterSpacing 0.4em → 0.22em`.

#### A05.1 · Date reveal and A05.2 countdown
- **Trigger:** S05 card top at 75%; `once`.
- **Elements and movement:**
  - "Save the Date" script: R-TXT script.
  - `15` / `AUGUST` / `2027`: three masked spans, `yPercent 110 → 0`, stagger 0.15 s, 1.1 s `power4.out`.
  - Gold rules: `scaleX 0 → 1`.
  - Countdown tiles: `y: 40 → 0`, `opacity 0 → 1`, stagger 0.1, 0.8 s `power3.out`.
  - **Digit roll:** when a value changes, its digit column `yPercent: 0 → −100` (the next digit below slides up), 0.45 s `power2.inOut`. Only changed digits animate (seconds every second, minutes every minute).
  - Add to Calendar button: fade-up last.
- **Mobile:** identical.
- **Performance:** a `setInterval` aligned to the second boundary. The interval stops when S05 is off-screen and re-syncs on return (no drift). Digit roll uses transforms on small elements only. In Tier C, digits swap with no roll.

#### A06.2 · Destination title and A06.4 highlight cards
- **Trigger:** inside the S06 timeline.
- **Movement:**
  - Title `Tuscany, Italy` (Cormorant): chars `opacity 0 → 1` and `y 30 → 0` at p 0.02 → 0.15; it exits `y: 0 → −8vh` and `opacity → 0` at p 0.32 → 0.42.
  - Script `Benvenuti in Toscana`: in at p 0.08 → 0.18 and out with the title.
  - Highlight cards: at p 0.78 → 0.92, three cards `y: 60 → 0`, `opacity 0 → 1`, staggered 0.04 of progress each. They hold until p 1.
- **Duration and easing:** scroll-linked; `power2.out` inside the segments.
- **Mobile:** cards are stacked vertically and smaller (one visible at a time, swapping at p 0.78 / 0.84 / 0.9).

#### A07.1 · Event connector draw and A07.2 node pop
- **Trigger:**
  - Connector: S07 track, `start: "top 70%"`, `end: "bottom 70%"`, `scrub: true`.
  - Nodes: driven by the connector timeline. Node *i* activates when the drawn length reaches its cumulative path position `L_i / L_total` (computed with `getTotalLength()` and per-segment lengths).
- **Elements:** the generated SVG connector path; N medallions.
- **Movement:**
  - Path: DrawSVG `0% → 100%`.
  - Node at activation: `scale 0.6 → 1`, `opacity 0 → 1` (0.7 s `back.out(1.7)`). Then the icon DrawSVG runs (0.8 s `power2.inOut`), and the name, date and time fade up with stagger 0.08 (0.6 s).
  - Nodes deactivate (reverse) if the guest scrolls back above them.
- **Mobile:** vertical path; same logic.
- **Performance:** a single path element for all connectors. Node activations are callbacks, not extra ScrollTriggers. Geometry is recomputed only on resize, through a ResizeObserver debounced to 150 ms.

#### A07.3 · Garland beads
- **Trigger:** follows A07.1.
- **Element:** a second path, identical to the connector, with `stroke-dasharray: 0 12` and round caps (jasmine beads), in `--ivory` with a `--gold` outline.
- **Movement:** draws 4 % behind the main line.
- **Duration and easing:** linear.
- **Performance:** zero extra DOM.

#### A07.4 · Event detail expand
- **Trigger:** tap or click (or Enter or Space) on a medallion.
- **Elements:** the medallion and the detail card (Motion `layoutId={event.id}`).
- **Movement:**
  - The card morphs out of the medallion into a centred panel (mobile: a bottom sheet at 86 % of the viewport height).
  - The backdrop goes from ivory 0 → 92 % opacity.
  - Content fades in staggered (0.05 s).
- **Duration and easing:** `spring.ui` (≈ 0.45 s settle). Close reverses.
- **Mobile:** bottom sheet with drag-down to close (Motion `drag="y"` with a 120 px threshold).
- **Performance:** no `backdrop-filter` blur (it is expensive on mobile); a solid overlay is used instead. Page scroll is locked while the card is open (`overflow: hidden` on html, with scrollbar-gutter compensation).

#### A07.5 · Event card stack (mobile variant)
- **Trigger:** S07 pinned. `end: "+=" + (N − 1) × 60 + "%"`, scrub, with `snap: 1 / (N − 1)` (`duration 0.3`, `power1.inOut`). Snap is allowed here because it is local to this pin.
- **Elements:** N cards stacked in the centre.
- **Movement:** for each step, the current card goes `y: 0 → −110%`, `rotation: 0 → −4°`, `opacity → 0`. The next card scales `0.94 → 1` and moves from `y: 3%` to 0. Cards behind peek at `scale 0.94` / `0.88`.
- **Rule:** the number of cards equals the number of published events. When N = 1 there is no pin; when N = 0 the section is hidden.
- **Performance:** ≤ 10 cards; only 3 are rendered with transforms at any time.

#### A08.3 · Diya ignition, A08.4 petal shower, A08.5 ritual reveal
- **Trigger:** S08 timeline, p 0.4 → 0.55 (diyas) and p 0.4 → 0.75 (petals). The ritual guide (after the pin) uses `"top 78%"` with `once`.
- **Elements and movement:**
  - **Diyas** (MND-03 glow sprites ×5): `opacity 0 → 1`, `scale 0.8 → 1`, staggered 0.03 progress from the centre outward. Then a time-based flicker: `opacity 0.85 ↔ 1` and `scale 1 ↔ 1.03`, with random 0.12–0.3 s steps (CSS keyframes with seeded `animation-delay`).
  - **Petal shower:** 10 petal sprites, scroll-linked: `y: −10vh → 100vh`, `rotation` 0 → 270° (seeded), x sway ±5 vw. Because it is scrubbed, it reverses.
  - **Ritual cards:** `y: 40 → 0`, `opacity 0 → 1`, `stagger.card`, 0.8 s `power3.out`; each icon draws with DrawSVG (0.8 s).
- **Mobile:** 6 petals; diyas ×3.
- **Performance:** the flicker is pure CSS on 5 small sprites. The havan flame (MND-02f) uses the same flicker; the optional P2 video loop plays only while visible.

#### A09.1 · Family frame draw, A09.2 names reveal, A09.3 garland link
- **Trigger:** each frame's top at 78 %; `once`. The garland is scrubbed with `start: "top 70%"`, `end: "center 50%"`.
- **Movement:**
  - Frame: SVG botanical frame stroke DrawSVG `0 → 100%` (1.4 s `power2.inOut`). Corner florals fade and scale `0.9 → 1` after it.
  - Names: SplitText chars `yPercent 110 → 0` (1.0 s `power4.out`, stagger 0.03). The bride's family frame enters from `x: −24px` and the groom's from `x: +24px` (0.9 s).
  - Garland link: two paths draw from each frame toward the centre (DrawSVG, scroll-linked, linear). When both complete, a centre knot flower goes `scale 0 → 1` (0.6 s `back.out(1.7)`).
- **Mobile:** the frames stack; the garland runs vertically between them.

#### A10.1–A10.4 · Dress code
- **Trigger:** the card group's top at 78 % (`once`) for the reveal; per-card scrub for the fabric parallax; tap or click for the expand.
- **Movement:**
  - **Reveal:** cards `y: 50 → 0`, `rotation: ±2° → 0` (alternating), `opacity 0 → 1` (0.9 s `power3.out`, `stagger.card`).
  - **Fabric parallax:** the image inside each arch, `yPercent −6 → 6` (scroll-linked).
  - **Palette chips:** `scale 0 → 1`, stagger 0.05, `back.out(2)`, 0.2 s after the card lands.
  - **Expand:** Motion `layoutId` morph from card to modal (desktop) or full-screen sheet (mobile), using `spring.ui`. The illustration crossfades from the fabric.
- **Mobile:** the carousel uses native scroll-snap. The reveal runs on the first 2 visible cards only; offscreen cards are already at rest.
- **Performance:** fabric parallax runs only on cards in view (desktop row, or the 2–3 visible carousel cards).

#### A11.1–A11.5 · Gallery
- **A11.1 Horizontal track (desktop):** S11 pinned, `end: () => "+=" + (track.scrollWidth − innerWidth)`, `scrub: 0.8`, `invalidateOnRefresh: true`. The track moves `x: 0 → −(scrollWidth − innerWidth)`, `ease: "none"`.
- **A11.2 Inner parallax:** each image `xPercent: −8 → 8`, using `containerAnimation: trackTween` (`start: "left right"`, `end: "right left"`). Images are 116 % of the frame width.
- **A11.3 Reel reveal:** each frame `clip-path: inset(0 100% 0 0) → inset(0)` and caption fade-up, with `containerAnimation` at `start: "left 85%"`; 0.9 s `power3.inOut`; `once`.
- **A11.4 Image expansion:** on click or tap, GSAP **Flip** moves the thumbnail to the fullscreen lightbox position (0.6 s `power3.inOut`). The backdrop goes `ivory 0 → 96 %`. The UI (counter, arrows, close) fades in after 0.25 s. Close reverses to the originating thumbnail (scrolling it into view first if needed).
- **A11.5 Grid filter:** Motion `AnimatePresence` plus `layout`. Items leave with `scale 0.95` and `opacity 0`; the rest re-flow (0.4 s `spring.ui`).
- **Mobile:**
  - No pin. A native horizontal swipe carousel (scroll-snap).
  - Reveal: cards rise `y: 30 → 0` when the carousel enters (`once`).
  - Lightbox: swipe left and right (Motion `drag="x"`), pinch-zoom (native, via an `<img>` with `touch-action: pinch-zoom` inside a zoom container), drag down to close.
- **Performance:**
  - Thumbnails at 640 / 960 w and lightbox at 1600 / 2048 w.
  - Next and previous lightbox images are preloaded.
  - The full grid overlay uses `loading="lazy"` and is rendered only when opened.

#### A12.1–A12.3 · Venue
- **A12.1 Terrace parallax:** VIL-05 and VIL-06 backgrounds, using D5a and D3 speeds; scroll-linked.
- **A12.2 Cards:** venue, map, info and hotel cards `y: 40 → 0`, `opacity 0 → 1`, `stagger.card`, 0.8 s, `once`.
- **A12.3 Map facade:** on click, a "Loading map…" shimmer, then the facade crossfades to the iframe (0.3 s). The iframe is mounted only on click (no Google requests before consent by action).
- **Mobile:** identical, except hotel cards are in a swipe carousel.

#### A13.1–A13.4 · RSVP
- **A13.1 Card rise:** card `y: 80 → 0`, `scale 0.96 → 1`, `opacity 0 → 1` (1.0 s `power3.out`, `once`). The garden side layers use D4 and D5 speeds.
- **A13.2 Choice and conditional fields:** the selected choice card uses a Motion `layoutId` highlight. Conditional fields (guest count, events, dietary) use `AnimatePresence` with height `0 → auto` and opacity (0.35 s `spring.ui`). Focus moves to the first revealed field only on keyboard interaction.
- **A13.3 Submit and success:**
  - The button label crossfades to a spinner (0.2 s); the button is disabled while submitting.
  - On success, the form content crossfades out and the success state crossfades in (0.4 s).
  - The heading `Grazie, {firstName}!` gets the R-TXT heading treatment.
  - A one-shot petal burst: 12 sprites from the button centre, radial, `y` with gravity, 1.4 s `power2.out`. Tier C has no burst.
  - The card height animates to the new content (Motion `layout`).
- **A13.4 Errors:**
  - Inline messages fade in (0.2 s); the field border colour changes.
  - **No shake animation** (vestibular safety).
  - Focus moves to the first invalid field, and an `aria-live="assertive"` summary announces "2 fields need attention".

#### A14.1–A14.3 · Wishing wall
- **A14.1 Batch reveal:** `ScrollTrigger.batch(".wish-card", { start: "top 85%", once: true })`. Cards `y: 40 → 0`, `rotation: (card rot ± 1.5°) → card rot`, `opacity 0 → 1` (0.8 s `power3.out`, stagger 0.08). Newly loaded cards ("Read more") use the same batch.
- **A14.2 Hover and focus (desktop):** `y: 0 → −4px`, shadow lifts (0.25 s `power2.out`).
- **A14.3 Pending seal:** after the guest's own submission, their local card appears with a wax-seal "Pending" stamp: `scale 1.4 → 1`, `rotation −12° → −6°`, `opacity 0 → 1` (0.5 s `back.out(1.6)`).
- **Drifting-rows style (optional):** each row `x: 0 → −50%`, linear, 60 s per loop (CSS), with duplicated content for a seamless loop. Paused on hover, focus-within and the global Pause. Off in Tier C.
- **Mobile:** single column, the same batch reveal; drifting rows are not offered.

#### A15.2–A15.4 · Thank-you finale
- **A15.2 Line sequence:** S15 pinned `+=100%` (mobile 80 %), scrub. The three lines `TWO HEARTS.` / `ONE JOURNEY.` / `FOREVER IN BLOOM.` enter at p 0.05 / 0.3 / 0.55. Each is a SplitText word mask, `yPercent 110 → 0` and `opacity` (eased `power3.out` within a 0.15-progress segment). Earlier lines remain visible. At p 0.75 → 0.95, `JANVI & ROHIT` enters (chars, same treatment) with the date below.
- **A15.3 Ambient motes:** GL-05 with dust-mote sprites (≤ 10, slow upward drift, 12–20 s).
- **A15.4 Monogram finale:** after the pin, the monogram wreath draws (DrawSVG 1.4 s) and the footer actions fade up (`once`).
- **Mobile:** identical, with smaller type.
- **Performance:** the pin is short; the motes pause off-screen.

### 14.5 Navigation and anchors with pins
- Anchor targets are computed with pins in mind. For a pinned scene, the target is that trigger's `start` (`ScrollTrigger.getById(id).start`); for others, it is `element.getBoundingClientRect().top + scrollY − navHeight`.
- Scrolling is done with `window.scrollTo({ top, behavior })`, where `behavior` is `"smooth"` unless reduced motion is on (then `"auto"`).
- After jumping, focus moves to the section heading (`tabindex="-1"`) so screen-reader and keyboard users land in the right place.
- Deep links (`/#rsvp`) work on load: wait for `ScrollTrigger.refresh()`, then scroll.
- Time-based reveals for all sections *above* a jump target are instantly completed (so scrolling back up does not show half-revealed text).

### 14.6 Reduced motion (detailed)
With `prefers-reduced-motion: reduce` **or** the in-site toggle:
- Tier C is used: FBK static composites, with no pins, scrub or parallax.
- Reveals become 200 ms opacity fades (no movement).
- No ambient sway, clouds, petals, flicker or marquee.
- The countdown updates without rolling.
- Lightbox and detail cards open with a 150 ms fade (no morph).
- Anchor navigation jumps instantly.
- **All content and functionality remain identical.**

The toggle is stored in `localStorage` (wrapped in try/catch) and applied before first paint through an inline script, so there is no flash of motion.

---

## 15. Mobile and desktop responsive requirements

### 15.1 Strategy
**Mobile-first and art-directed.** The phone in portrait is the primary canvas: it is how most guests open a WhatsApp link. Desktop is a *recomposed* landscape experience, not a stretched phone layout. Every scene has two layer sets (§12.1), selected with `<picture><source media="(orientation: portrait) and (max-width: 1023px)">`.

### 15.2 Breakpoint behaviour

| Area | Mobile < 768 | Tablet 768–1023 | Desktop ≥ 1024 |
|---|---|---|---|
| Scene art | Portrait set | Portrait set when portrait, landscape set when landscape | Landscape set |
| Navigation | Hamburger, full-screen botanical menu, floating RSVP pill | Hamburger plus RSVP button | Inline links plus RSVP button, progress vine |
| Hero | Title upper 45 %, couple lower 40 % | As mobile, scaled | Title centred upper half, couple lower centre |
| Couple | Stacked portraits | Side by side at 40 vw each | Side by side at 30 vw each, plus convergence (A03.5) |
| Love story | Inline image + text, left vine | Inline, centred vine | Sticky stage + scrolling text |
| Events | Vertical alternating timeline (or card stack) | Horizontal, ≤ 3 per row | Horizontal serpentine, ≤ 5 per row |
| Dress code | Swipe carousel, 78 vw cards | 2–3 per row | ≤ 5 per row; carousel if 6 or more |
| Gallery | Swipe carousel (no pin) | Swipe carousel | Pinned horizontal reel |
| Venue | Stacked; hotels as a carousel | 2 columns | 2 columns plus a 3-column hotel grid |
| RSVP | Full-width card | 560 px card | 560 px card with garden side layers |
| Wishes | 1 column | 2 columns | 3-column masonry |

### 15.3 Mobile specifics
- **Viewport units:** stages use `100lvh`; text that must stay visible uses `svh` (`100svh` safe areas). `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **Safe areas:** `viewport-fit=cover`. The floating pill, top bar and lightbox controls respect `env(safe-area-inset-*)`.
- **Touch:**
  - Touch targets are ≥ 44 × 44 px (WCAG 2.5.8 minimum is 24 px; we exceed it).
  - Carousels use native momentum and `overscroll-behavior-x: contain`.
  - No hover-only information.
- **Inputs:** 16 px or larger (no iOS zoom on focus). `inputmode` and `autocomplete` are set (`name`, `tel`, `email`).
- **Orientation:**
  - Phone landscape (height < 500 px) gets **reduced pins**: hero +80 % and other pins halved.
  - Text panels become scrollable cards rather than overlays.
  - The layer set switches to landscape.
- **In-app browsers:** WhatsApp (iOS and Android), Instagram and Facebook in-app browsers must work fully, including the RSVP POST and the `.ics` download. On Android WebViews, where `.ics` downloads can fail, fall back to the Google Calendar link.
- **Low-power mode / Save-Data:** Tier C.

### 15.4 Desktop specifics
- **Wide screens (≥ 1920 px):** layers are served at 2560 w. Content stays inside 1320 px; scenes stay full-bleed. Ultra-wide (> 21:9) adds side foliage extension layers rather than scaling up.
- **Pointer:** hover states on cards and buttons. Arrow keys move the gallery and lightbox.
- **Scroll input:** wheel, trackpad, keyboard (Space, Page Up / Page Down, Home / End) and scrollbar drag all drive the same native scroll. The scrub (0.8) absorbs wheel steps.

---

## 16. Customer customisation functionality

### 16.1 Principle
**Everything that differs between weddings is data.** The site renders from one validated content document (`WeddingContent`, §18.3). Editing in the Studio and pressing **Publish** regenerates the site within 60 seconds. Customers can never break layout, contrast or motion, because the template owns those.

### 16.2 Editable content and what updates automatically

| Customer edits | Field(s) | Automatically updates |
|---|---|---|
| Bride and groom names | `couple.bride.name`, `couple.groom.name`, optional surnames and display order | Hero names (auto-fit), monogram letters (initials), page `<title>`, meta description, OG image, couple cards, thank-you names, RSVP success copy, hashtag suggestion |
| Wedding date, time and time zone | `wedding.date`, `wedding.time`, `wedding.timezone` (default `Europe/Rome`) | Hero date, Save the Date, countdown target, guest-local time line, `.ics` files, ceremony detail, "Just married" switch-over date |
| Parent names | `families.bride.{father, mother}`, `families.groom.{father, mother}`, honorifics, surnames, grandparents, siblings | Welcome message tokens, family section |
| Destination | `wedding.destination.{label, region, country}` | Hero location line, Destination heading, OG image |
| Event details and count | `events[]` (add, edit, reorder, remove, hide) | Timeline geometry, nodes, connectors, nav visibility, dress-code entries, RSVP event checkboxes, per-event `.ics` |
| Couple images | Hero cut-out *or* hero photo, portraits, story images, silhouette | Scenes S01, S03, S04, S15; OG image |
| Dress code | Per event: theme, palette, illustration, notes | S10 cards and expands; event detail chips |
| Outfit colour palettes | 2–6 swatches (presets or custom hex plus name) | Card swatches; automatic label contrast |
| Gallery photographs | Up to 60, category, caption, alt, focal point, featured | Reel, grid, lightbox |
| RSVP information | Deadline, default max guests, field toggles, events selectable, notification emails, invite codes | Form fields, closed state, personalised links |
| Venue and travel | Name, address, coordinates, map toggle, travel blocks, hotels, shuttles | S12 states (including "to be announced") |
| Section visibility | Per-section toggle (§7.4) | DOM, menu, progress vine, ScrollTrigger refresh |
| Copy | Welcome, invocation, story, ritual guide, notes, thank-you lines | The respective sections |

### 16.3 Event editor
- **Add:** from the event library (preset name, icon and default palette) or Custom.
- **Edit:** name, type and icon, date, start and end time, venue or area, description, dress code link, RSVP inclusion, visibility.
- **Reorder:** drag and drop (dnd-kit with keyboard support). Default order is chronological; manual order wins. A warning appears if the manual order isn't chronological.
- **Remove:** a confirm dialog with undo (10 s toast). Linked dress-code entries are archived, not deleted, so re-adding the event restores them.
- **Validation:** an event is *published* only if it has a name, date and start time. Otherwise it is a draft, shown greyed in Studio and **never rendered** on the site.
- **Limit:** 1–10 published events (with 11 or more, Studio suggests grouping).
- **Preview:** the timeline preview updates live in Studio as events change (the same component as the site).

### 16.4 Media handling
- **Upload:**
  - Formats: JPG, PNG, HEIC, WebP.
  - Limits: ≤ 25 MB per file; minimum dimensions per slot (for example hero 2400 px on the long edge, portraits 1600 px, gallery 1600 px).
  - Images are converted server-side to AVIF and WebP at all widths, with EXIF stripped (location privacy) and orientation normalised.
- **Focal point:** click to set. Used for `object-position` in every crop and orientation. Default is face-aware; manual adjustment always wins.
- **Alt text:** required before publishing (Studio suggests a draft; the customer confirms).
- **Hero couple modes:**
  1. **Layered** (best): upload a transparent cut-out, or use **auto background removal** with a manual mask-touch-up brush. The couple sits in layer D6 between the cypress trees and the foreground florals, with a generated contact shadow.
  2. **Photo**: a full photo replaces layers D2–D3 and the couple. The foreground pergola and florals still overlay it and parallax, with reduced travel. Use this when the customer's photo can't be cut out cleanly.
- **Dress-code illustrations:** PNG or WebP (transparent recommended) or JPG; shown inside the arch with `object-fit: contain` on an ivory plate.

### 16.5 Palette picker
- **Presets:** Mehendi Greens, Haldi Yellows, Sangeet Jewels, Wedding Reds & Gold, Reception Champagne & Midnight, Pastel Garden, Ivory & Blush.
- **Custom:** hex input plus colour wheel plus name field; 2–6 swatches; drag to reorder.
- **Auto label colour:** Forest or Ivory, whichever gives ≥ 4.5:1.
- **The site palette itself (§11) is locked** in v1 to protect contrast and brand. Theme variants are P2.

### 16.6 Publish workflow
- **Draft vs live:** Studio edits a *draft*; guests see *published*.
- **Preview:** phone, tablet and desktop frames, plus "Open preview link" (an unlisted URL with a token).
- **Pre-publish validation:**
  - **Blocking:** names, date, time and time zone missing; required alt text missing; an event with an invalid date.
  - **Warnings:** venue placeholder still set; RSVP deadline unset; hero contrast scrim applied; fewer than 3 gallery images (the gallery will be hidden).
- **Publish:** writes the published snapshot and triggers on-demand revalidation (`revalidateTag("wedding:" + id)`). The site is updated in ≤ 60 s (target ≤ 10 s).
- **History:** the last 30 publishes, each with one-click restore.

### 16.7 Roles
**Owner** (couple), **Collaborator** (planner or family member: edit content and view RSVPs; cannot delete the site or change owners), **Operator** (template business: all weddings, support access read-only by default).

---

## 17. Functional requirements

Priority: **P0** = launch-blocking · **P1** = launch target · **P2** = post-launch.

### 17.1 Guest site

| ID | Requirement | Pri |
|---|---|---|
| FR-SITE-01 | Render all visible sections from the published `WeddingContent` | P0 |
| FR-SITE-02 | Hide sections per §7.4 and remove them from menu, progress vine and timelines | P0 |
| FR-SITE-03 | Personalised links `/i/{code}` show a greeting and prefill RSVP (name, max guests, allowed events). Codes are opaque (≥ 10 characters, unguessable); no personal data appears in URLs | P1 |
| FR-SITE-04 | Share: WhatsApp share (`https://wa.me/?text=` with URL and message), native `navigator.share` where available, copy link with a toast | P0 |
| FR-SITE-05 | Dynamic OG image and meta per wedding; `noindex` by default (private invitation), with a Studio toggle to allow indexing | P0 |
| FR-SITE-06 | "Pause animations" control (stored preference) | P0 |
| FR-SITE-07 | Optional background music: off by default, starts only on a user tap, with a visible toggle and a ≤ 1.5 MB file | P2 |
| FR-SITE-08 | Optional secondary language lines (Hindi or Punjabi) for the invocation and welcome | P2 |

### 17.2 Countdown and calendar

| ID | Requirement | Pri |
|---|---|---|
| FR-CD-01 | Countdown target = `wedding.date + wedding.time` in `wedding.timezone` (IANA), converted to UTC (for this wedding: 2027-08-15T08:00:00Z) | P0 |
| FR-CD-02 | Shows days, hours, minutes and seconds; correct in any visitor time zone and across DST changes | P0 |
| FR-CD-03 | States: counting → "Today is the day" (on the wedding date, local to the venue) → "Just married" (after 23:59 on that day) | P0 |
| FR-CD-04 | Guest-local time line using `Intl.DateTimeFormat().resolvedOptions().timeZone` (hidden if it equals the venue zone) | P1 |
| FR-CAL-01 | `.ics` per event and for all events (RFC 5545): `UID`, `DTSTAMP`, `DTSTART`/`DTEND` in UTC, `SUMMARY` ("Janvi & Rohit · Wedding Ceremony"), `LOCATION` (venue or "Tuscany, Italy"), `DESCRIPTION` with the site URL, and a `VALARM` 1 day before | P0 |
| FR-CAL-02 | Google Calendar and Outlook.com / Office 365 deep links with the same data | P0 |
| FR-CAL-03 | Default end time when unset: ceremony +3 h, other events +4 h | P1 |

### 17.3 Events

| ID | Requirement | Pri |
|---|---|---|
| FR-EVT-01 | CRUD, reorder and visibility in Studio (§16.3) | P0 |
| FR-EVT-02 | Order: manual if set, else chronological | P0 |
| FR-EVT-03 | Auto-generated geometry: N nodes and N − 1 curved connectors; serpentine on desktop (≤ 5 per row), alternating vertical on mobile; recomputed on resize | P0 |
| FR-EVT-04 | Detail card per event, with Add to Calendar and dress-code link | P0 |
| FR-EVT-05 | **Never render an empty node or card:** drafts and incomplete events are excluded; 0 events hides the section; 1 event shows no connector | P0 |
| FR-EVT-06 | Card-stack mobile variant (Studio option) | P2 |

### 17.4 RSVP

| ID | Requirement | Pri |
|---|---|---|
| FR-RSVP-01 | Form per S13 with client and server validation (shared Zod schema) | P0 |
| FR-RSVP-02 | Stored in the database with `wedding_id`, a timestamp, an optional `invite_id`, and a hashed IP (rate limiting only) | P0 |
| FR-RSVP-03 | Spam protection: honeypot, Cloudflare Turnstile, rate limit (5 submissions per IP-hash per hour per wedding) | P0 |
| FR-RSVP-04 | Success state with summary and edit link; the edit token is random (≥ 128-bit) and stored hashed | P0 |
| FR-RSVP-05 | Duplicates: the same invite code, or the same name plus contact, **updates** the existing RSVP (with confirmation) instead of duplicating it | P1 |
| FR-RSVP-06 | Email notification to the couple (per RSVP, or a daily digest, configurable) and an optional confirmation to the guest if an email was given | P1 |
| FR-RSVP-07 | Deadline: after it, the form is replaced by the closed message; Studio can extend it | P0 |
| FR-RSVP-08 | Studio: table, search, filters (attending, event, dietary), totals per event, CSV export (UTF-8 with BOM, so Excel opens Devanagari and Gurmukhi correctly) | P0 |
| FR-RSVP-09 | Offline-tolerant: if the network fails, the input is kept and a retry is offered; no data is lost on a back or forward navigation (`sessionStorage` draft) | P1 |

### 17.5 Wishing wall

| ID | Requirement | Pri |
|---|---|---|
| FR-WISH-01 | Submit with validation, consent, honeypot, Turnstile and rate limit (3 per IP-hash per hour) | P0 |
| FR-WISH-02 | Moderation: new wishes are `pending`; the couple approves, hides or deletes them in Studio; there is an optional auto-approve setting with a profanity filter | P0 |
| FR-WISH-03 | Only `approved` wishes are publicly readable (database row-level security) | P0 |
| FR-WISH-04 | Pagination of 12; newest first; up to 3 pinned wishes first | P0 |
| FR-WISH-05 | Approved wishes appear on the live site in ≤ 60 s (tag revalidation) | P1 |
| FR-WISH-06 | Drifting-rows display option | P2 |

### 17.6 Gallery, venue, dress code

| ID | Requirement | Pri |
|---|---|---|
| FR-GAL-01 | Reel (featured), grid overlay with category filters, lightbox (keyboard, swipe, pinch, focus trap) | P0 |
| FR-GAL-02 | Gallery hidden if there are fewer than 3 images | P0 |
| FR-VEN-01 | Venue placeholder state; map only when an address or coordinates exist; click-to-load embed | P0 |
| FR-VEN-02 | Google Maps and Apple Maps links built from coordinates (preferred) or an encoded address | P0 |
| FR-VEN-03 | Hotels, transport and essentials blocks with show and hide | P1 |
| FR-DRS-01 | Entries linked to events; palettes; illustration upload; expand view | P0 |

### 17.7 Studio and admin

| ID | Requirement | Pri |
|---|---|---|
| FR-STU-01 | Magic-link authentication; roles per §16.7 | P0 |
| FR-STU-02 | Form editors per §8 sitemap with autosave (every 3 s idle) and live preview | P0 |
| FR-STU-03 | Media library with upload pipeline, focal point and alt text | P0 |
| FR-STU-04 | Publish with validation, revalidation and history | P0 |
| FR-STU-05 | Invite codes: create individually or by CSV import (name, max guests, events); copy link; WhatsApp share per guest | P1 |
| FR-ADM-01 | Operator: create a wedding from the template (seeded with this PRD's defaults), list all weddings, view usage, read-only support view | P1 |

### 17.8 Privacy and data

| ID | Requirement | Pri |
|---|---|---|
| FR-PRV-01 | A privacy notice page covering what is collected, why, retention and contact | P0 |
| FR-PRV-02 | No tracking cookies. Cookieless analytics (Plausible or Vercel Web Analytics), so no consent banner is needed | P0 |
| FR-PRV-03 | Retention: RSVPs and wishes are auto-deleted 180 days after the wedding (configurable). The owner can export or delete at any time | P1 |
| FR-PRV-04 | No third-party requests before interaction (maps on click; fonts self-hosted; Turnstile loads only when the form is in view) | P0 |

---

## 18. Technical architecture

### 18.1 Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js (App Router, current stable), React, TypeScript** | SSG + ISR for speed, Server Actions and Route Handlers for forms, `next/og` for OG images, `next/font` |
| Scroll motion | **GSAP 3.13+**: ScrollTrigger, SplitText, DrawSVGPlugin, Flip; `@gsap/react` `useGSAP` | Industry-standard scrubbed timelines, pins and containerAnimation; all plugins are free since 3.13 |
| UI motion | **Motion** (formerly Framer Motion, `motion/react`) | Layout morphs, AnimatePresence, drag for sheets and lightbox |
| Styling | Tailwind CSS v4 with CSS custom-property tokens (§10–11) | Token-driven, purge-friendly |
| Forms | React Hook Form + Zod (shared client and server schema) | Validation parity |
| Data and auth | **Supabase**: Postgres with row-level security, Auth (magic link), Storage | Multi-tenant, RLS for public reads of approved wishes |
| Image processing | `sharp` worker on upload (Route Handler or Supabase Edge Function) → AVIF and WebP variants | Pre-generated variants and predictable cost |
| Email | Resend (transactional) | RSVP notifications and digests |
| Anti-spam | Cloudflare Turnstile + honeypot + rate limit (Upstash Redis or a Postgres counter) | Low-friction for guests |
| Hosting | Vercel (edge CDN, ISR, on-demand revalidation) | Fast globally, including India, the UK, North America and the Gulf |
| Reorder UI | dnd-kit | Accessible drag and drop |
| Analytics | Plausible or Vercel Web Analytics (cookieless) | Privacy |
| Testing | Vitest, Playwright (visual and flow tests), Lighthouse CI, axe-core | §23 |

### 18.2 Application structure
```
src/
  app/
    (site)/[slug]/page.tsx                 ← guest site (SSG + ISR, tag "wedding:{id}")
    (site)/[slug]/i/[code]/page.tsx        ← personalised variant
    (site)/[slug]/rsvp/edit/[token]/page.tsx
    (site)/[slug]/calendar/[eventId]/route.ts   ← .ics
    (site)/[slug]/opengraph-image.tsx
    api/rsvp/route.ts  api/wishes/route.ts  api/upload/route.ts
    studio/(auth)/...  studio/[weddingId]/...
    admin/...
  scenes/                                  ← one folder per scene
    s01-hero/{Hero.tsx, timeline.ts, manifest.json}
    ... s15-thank-you/
  engine/
    Stage.tsx  Layer.tsx  SceneProvider.tsx
    useSceneTimeline.ts   useReveal.ts   useAmbient.ts
    tiers.ts  (device tier + FPS probe)
    presets/  portal.ts  wallRise.ts  curtain.ts  drawPath.ts  splitReveal.ts  maskReveal.ts
    tokens.ts (§14.2)
  components/
    Countdown  AddToCalendar  EventTimeline  EventDetail  RsvpForm  WishWall
    Gallery/{Reel, Grid, Lightbox}  DressCodeCard  VenueMap  Nav  ProgressVine  Monogram
  content/
    schema.ts (Zod WeddingContent)   defaults/janvi-rohit.json
  lib/ supabase/  ics.ts  dates.ts  images.ts  contrast.ts  geometry/timeline.ts
  styles/ tokens.css  globals.css
```

### 18.3 Content schema (abridged)
```ts
WeddingContent = {
  couple:   { bride: Person; groom: Person; order: "bride-first" | "groom-first" };
  wedding:  { date: "2027-08-15"; time: "10:00"; timezone: "Europe/Rome";
              destination: { label: "Tuscany, Italy"; region: "Tuscany"; country: "Italy" };
              hashtag?: string };
  families: { bride: { father: "Kapoor"; mother: "Lalitha"; surname?: string; honorifics?: boolean };
              groom: { father: "Vasu";   mother: "Jansi";   surname?: string; honorifics?: boolean };
              grandparents?: string[]; siblings?: string[] };
  welcome:  { invocation?: { enabled: boolean; text: string; script: "devanagari" | "latin" };
              message: string /* supports {bride} {groom} {brideParents} {groomParents} tokens */ };
  story:    Milestone[];                          // 0–8
  events:   Event[];                              // 0–10 published
  ceremony: { enabled: boolean; title: string; rituals: Ritual[]; note?: string };
  dressCode: DressCodeEntry[];                    // linked by eventId
  gallery:  GalleryImage[];                       // 0–60
  venue:    { name?: string; address?: string; lat?: number; lng?: number; showMap: boolean;
              travel: TravelBlock[]; hotels: Hotel[]; shuttles: Shuttle[]; essentials: TextBlock[] };
  rsvp:     { deadline?: string; maxGuestsDefault: number; fields: {...toggles}; notify: string[] };
  sections: Record<SectionId, { visible: boolean }>;
  media:    { hero: { mode: "layered" | "photo"; cutout?: MediaRef; photo?: MediaRef };
              bridePortrait?: MediaRef; groomPortrait?: MediaRef; silhouette?: MediaRef };
}
Event = { id; type: EventType; name; date; start; end?; area?; description?; icon;
          dressCodeId?; includeInRsvp: boolean; visible: boolean; order?: number }
```

### 18.4 Scene manifest (per scene, drives the engine)
```json
{
  "scene": "s01",
  "pin": { "desktop": "+=180%", "mobile": "+=140%" },
  "layers": [
    { "id": "SKY-01", "depth": "D1", "z": 1,  "src": { "desk": "...", "mob": "..." },
      "to": { "y": "-3vh", "scale": 1.04 }, "tier": ["A", "B"] },
    { "id": "CYP-01", "depth": "D3", "z": 4,
      "to": { "scale": 1.14, "x": "-4vw" }, "tier": ["A", "B"] },
    { "id": "VIL-02", "depth": "D4", "z": 9,
      "to": { "scale": 1.6, "x": "-18vw", "y": "-10vh" }, "mobileFactor": 0.7 }
  ],
  "fallback": { "desk": "fbk-s01-desk", "mob": "fbk-s01-mob" }
}
```
The engine reads the manifest, mounts `<Layer>`s with `srcset`, builds one timeline from the `to` values, applies `mobileFactor` and tier filters, and attaches the scene-specific choreography from `timeline.ts`. **Re-skinning for Project 06 means new manifests and assets, not new engine code.**

### 18.5 Data model (Postgres)

| Table | Key columns | RLS |
|---|---|---|
| `weddings` | `id, slug, owner_id, draft jsonb, published jsonb, published_at, status` | Members read and write the draft; the public reads only `published` through the server |
| `wedding_members` | `wedding_id, user_id, role` | Members only |
| `content_versions` | `id, wedding_id, snapshot jsonb, created_by, created_at` | Members |
| `media` | `id, wedding_id, slot, path, width, height, focal_x, focal_y, alt, variants jsonb` | Members write; public reads variants through the CDN |
| `invites` | `id, wedding_id, code, display_name, max_guests, allowed_event_ids[]` | Members; the server resolves codes |
| `rsvps` | `id, wedding_id, invite_id?, name, attending, guest_count, event_ids[], dietary?, contact?, message?, edit_token_hash, ip_hash, created_at, updated_at` | Insert only through the server route (service role); members read |
| `wishes` | `id, wedding_id, name, relation?, message, status, pinned, ip_hash, created_at` | Public select `where status = 'approved'`; insert through the server route |

### 18.6 Rendering and caching
- **Guest site:** statically generated per wedding, cached at the edge, revalidated on publish or approve (`revalidateTag`). Scenes are client components (GSAP); content is passed as props from server components. Above-the-fold HTML includes the hero text, so it is visible before JS.
- **Progressive enhancement:** without JS, all sections render statically (FBK images, full text, a working RSVP form posting to the route handler).
- **Code splitting:** each scene's timeline module is dynamically imported when the scene comes within 1.5 viewports. The lightbox, grid overlay, detail cards and Studio are separate chunks.
- **Image loading:** the hero layers for the detected orientation are `fetchpriority="high"` (the couple and D1 + D3 only; the rest are high but not preloaded). Every other scene's layers start loading at `rootMargin: 150%` through IntersectionObserver, with blurred placeholders. Explicit `width` and `height` everywhere (CLS).

---

## 19. Performance requirements

| Metric | Target (mobile, 4G, mid-range Android) | Target (desktop) | How measured |
|---|---|---|---|
| LCP (hero names or couple layer) | ≤ 2.5 s (stretch ≤ 2.0 s) | ≤ 1.5 s | Lighthouse CI, WebPageTest (Moto G Power, "4G" profile), RUM |
| INP | ≤ 200 ms | ≤ 100 ms | RUM (web-vitals) |
| CLS | ≤ 0.05 | ≤ 0.05 | Lighthouse, RUM |
| Lighthouse Performance | ≥ 85 | ≥ 95 | CI on every PR |
| Scroll frame rate | ≥ 50 fps sustained (Tier A/B), no frame > 50 ms | 60 fps (120 fps on ProMotion where possible) | Chrome Performance panel, Safari Timelines, in-app FPS probe |
| Initial JS (gzip) | ≤ 180 KB (framework + GSAP core + ScrollTrigger + hero scene) | Same | Bundle analyser in CI |
| Hero image weight | ≤ 650 KB total for the first view | ≤ 1.2 MB | Asset budget check in CI |
| Single layer | ≤ 250 KB | ≤ 450 KB | CI |
| Page total (scrolled fully) | ≤ 7 MB | ≤ 12 MB | WebPageTest |
| Decoded image memory, mounted at once | ≤ 120 MB (iOS Safari reloads tabs above ~300 MB) | ≤ 300 MB | Safari Web Inspector memory |
| ScrollTrigger instances | ≤ 40 per page | Same | Dev overlay |
| Time to interactive RSVP (from tap on the nav item) | ≤ 1.0 s | ≤ 0.5 s | Playwright trace |

**Rules:**
- Animate only `transform` and `opacity`; clip-path appears in two scoped places (§13.1).
- `will-change` only during active motion; never on more than 12 elements at once.
- No `backdrop-filter`, no CSS `filter: blur()` on layers, no animated `box-shadow`. Foreground blur is baked into the assets.
- Offscreen scenes: `content-visibility: auto` with `contain-intrinsic-size` on non-pinned scenes; ambient loops paused; far layers (more than 3 scenes away) have `src` swapped to a placeholder on Tier B to free decoded memory.
- `img.decode()` before any layer becomes visible in an animation.
- Fonts: 4 preloaded files maximum.
- Third parties: none at load (Turnstile, maps and video load on demand).

---

## 20. Accessibility requirements

**Standard: WCAG 2.2 Level AA**, tested with axe-core, plus manual testing with VoiceOver (iOS and macOS), TalkBack (Android) and NVDA (Windows).

| Area | Requirement |
|---|---|
| Structure | One `<h1>` (the couple names, with `aria-label="The wedding of Janvi and Rohit"`); sections are `<section aria-labelledby>`; logical h2 → h3 order; landmarks (`header`, `nav`, `main`, `footer`) |
| Navigation | Skip link; full keyboard operability; visible focus (§10.7); focus never hidden behind the sticky header (`scroll-margin-top`); menu is a dialog with a focus trap and Esc to close |
| Motion | `prefers-reduced-motion` honoured (§14.6); a **Pause animations** control for anything moving > 5 s (WCAG 2.2.2); no flashing; no parallax-only information |
| Images | Decorative layers have `alt=""` and `aria-hidden`; content images (portraits, gallery, story, dress-code illustrations) require alt text (enforced at publish) |
| Script and decorative text | Script words also exist as accessible text (`aria-label` or visually hidden text); the Devanagari invocation has `lang="hi"`, and Gurmukhi lines `lang="pa"` |
| Colour | Contrast per §11.2; information never conveyed by colour alone (selected states also show a check icon; errors also show an icon and text) |
| Text | Supports 200 % zoom and large system fonts without loss of content; `rem` units; no text inside images; line height ≥ 1.5 for body |
| Countdown | The visual tiles are `aria-hidden`; visually hidden text "285 days to go" is updated on load and once per minute; there is no live region that ticks every second |
| Forms | Visible labels; `aria-describedby` for hints and errors; errors announced; required fields marked in text; `autocomplete` attributes; Turnstile has an accessible fallback |
| Dialogs | Lightbox, event detail and dress-code expand: `role="dialog"`, `aria-modal`, labelled, focus trap, Esc, focus returns to the trigger |
| Carousels | Buttons for previous and next (not swipe-only); `aria-roledescription="carousel"`; slide labels "3 of 8"; no auto-advance |
| Target size | ≥ 44 × 44 px for touch (exceeds the 24 × 24 minimum of 2.5.8) |
| Pins | Pinned scenes never trap keyboard focus; tabbing into a pinned scene scrolls to show the focused element |
| Language | `<html lang="en-GB">`; dates formatted with `Intl` (en-GB: "15 August 2027") |

---

## 21. Acceptance criteria

Format: **Given / When / Then.** All P0 criteria must pass for launch.

**Experience and motion**

| ID | Criterion |
|---|---|
| AC-01 | **Given** a first visit on an iPhone 13 and a Samsung Galaxy A-series phone over 4G, **when** the page loads, **then** the hero names are visible ≤ 2.5 s and the intro completes without dropped frames visible to the eye. |
| AC-02 | **Given** S01, **when** the guest scrolls through the pin, **then** at least 6 hero layers move at visibly different speeds, the cypress trees pass in front of the title, the pergola scales past the camera, and the villa window opens into S02 **with no visible jump at hand-off** (frame-by-frame screen recording). |
| AC-03 | **Given** any scene with layers, **when** captured at progress 0, 0.5 and 1 on both orientations, **then** no gaps, halos, seams or unfilled regions are visible. |
| AC-04 | **Given** `prefers-reduced-motion: reduce` or Pause enabled, **when** browsing the whole page, **then** there are no pins, parallax or ambient motion, and all content and functions remain available. |
| AC-05 | **Given** the Chrome Performance panel on a mid-range Android, **when** scrolling the full page at normal speed, **then** the median frame time is ≤ 20 ms and no long frame exceeds 50 ms outside image decode. |
| AC-06 | **Given** a jump from the menu to any section (including past pins), **when** it completes, **then** the section heading is at the top below the nav, has focus, and its content is fully revealed. |

**Content and template**

| ID | Criterion |
|---|---|
| AC-10 | **Given** Studio, **when** the couple names change to "Venkataraghavan" and "Anne-Marie", **then** the hero names auto-fit without overflow on a 320 px wide screen, the monogram shows "V \| A", and the title, meta and OG image update after publish. |
| AC-11 | **Given** 0, 1, 2, 5, 6 and 10 published events, **when** S07 renders on mobile and desktop, **then** the node count equals the event count, connectors = max(0, N − 1), there are no empty circles, and 0 events hides the section and its menu item. |
| AC-12 | **Given** an event saved without a date, **when** the site is published, **then** that event does not appear anywhere on the guest site. |
| AC-13 | **Given** the date changes to 20 June 2028 at 17:30 in `Asia/Kolkata`, **when** published, **then** the hero, Save the Date, countdown, `.ics` and ceremony details all show the new values, and the countdown is correct for a visitor in Toronto. |
| AC-14 | **Given** the venue address is empty, **when** S12 renders, **then** "Venue details coming soon" shows, with no map, no direction buttons and no console errors. |
| AC-15 | **Given** a customer uploads a dress-code illustration and a custom palette with a dark-navy swatch, **when** published, **then** the illustration shows in the card arch and the swatch label switches to ivory with ≥ 4.5:1 contrast. |

**Functional**

| ID | Criterion |
|---|---|
| AC-20 | **Given** a valid RSVP, **when** submitted, **then** it is stored within 2 s, the success state shows a summary and edit link, the couple's email is notified (or digested), and it appears in the Studio table and CSV. |
| AC-21 | **Given** the same invite code submits twice, **when** the second submission happens, **then** the existing RSVP is updated, not duplicated. |
| AC-22 | **Given** the RSVP deadline has passed, **when** the form loads, **then** the closed message is shown instead. |
| AC-23 | **Given** a wish is submitted, **when** it is still pending, **then** it is invisible to other visitors (verified with an anonymous database query) and visible within ≤ 60 s of approval. |
| AC-24 | **Given** the guest opens the site in WhatsApp's in-app browser (iOS and Android), **when** they RSVP and tap Add to Calendar, **then** both succeed (the `.ics` downloads, or the Google Calendar fallback opens). |
| AC-25 | **Given** the countdown, **when** viewed from the Asia/Kolkata, Europe/London and America/Toronto zones, **then** the days and hours match a server-computed reference, and the guest-local line reads 1:30 PM, 9:00 AM and 4:00 AM respectively. |
| AC-26 | **Given** the `.ics` for the ceremony, **when** imported into Apple Calendar, Google Calendar and Outlook, **then** it shows 15 Aug 2027, 10:00 in Italy time (08:00 UTC) with the correct title and URL. |

**Quality bars**

| ID | Criterion |
|---|---|
| AC-30 | Lighthouse mobile scores: Performance ≥ 85, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 90 (where indexing is allowed). |
| AC-31 | axe-core reports 0 serious or critical issues on the site and Studio. |
| AC-32 | Every image passes the §12.7 rejection checklist, signed off by the creative director. |
| AC-33 | No text anywhere in the UI uses Champagne Gold, Dusty Rose or Sage on ivory (automated contrast lint on tokens and components). |

---

## 22. Development phases

Durations are indicative for one senior creative developer and one designer or art director, overlapping where possible.

| Phase | Weeks | Scope | Exit criteria / deliverables |
|---|---|---|---|
| **0 · Discovery and content lock** | 0.5 | Confirm open questions (§24); final copy; event schedule; legal and privacy text | Signed PRD; content sheet; placeholders list |
| **1 · Creative direction and prototypes** | 1.5 | Moodboard; identity sheets for the couple; **hero master composite** (both orientations); motion prototype of S01 with grey-box layers (ScrollTrigger) | Approved hero master; approved S01 motion feel on real devices |
| **2 · Asset production** | 2.5 (parallel with 3) | All masters → decompose → inpaint → export (§12.4); icons and SVGs; FBK composites | All assets pass §12.7 and the engine gap test (AC-03) |
| **3 · Design system and static build** | 1.5 | Tokens, typography, components, all 15 sections static and responsive with real content; content schema and defaults | Pixel-reviewed static site; schema tests |
| **4 · Motion engine and scenes** | 3 | Stage, Layer, manifests, tiers, presets; scenes S01–S15 per §13–14; reduced-motion path | AC-01 to AC-06 passing on the device lab |
| **5 · Backend** | 1.5 | Supabase schema and RLS; RSVP and wishes routes; Turnstile; rate limits; email; `.ics`; OG image | AC-20 to AC-26 passing |
| **6 · Customer Studio** | 3 | Auth, editors, media pipeline, event editor, palette picker, preview, validation, publish and history, RSVP table and export, moderation, invites | AC-10 to AC-15 passing; set-up of a new wedding ≤ 60 min in a moderated test |
| **7 · QA, performance and accessibility hardening** | 1.5 | Full §23 checklist; device lab; in-app browsers; performance budget tuning | All P0 acceptance criteria pass |
| **8 · Launch and template packaging** | 0.5 | Production deploy; demo site; operator docs; "create from template" seed | Live demo; Project 06 re-skin guide |

**Total:** ≈ 12–14 weeks elapsed with phases 2/3 and 5/6 overlapping.

**Milestone gates:**
- **G1:** hero master and motion prototype approved (end of phase 1). This is the main creative risk gate.
- **G2:** full scroll journey on real devices (end of phase 4).
- **G3:** feature complete (end of phase 6).
- **G4:** launch.

---

## 23. Quality assurance checklist

### 23.1 Device and browser matrix

| Device | Browser(s) |
|---|---|
| iPhone SE (2nd/3rd gen, small screen) | Safari, WhatsApp in-app |
| iPhone 13 / 15 / 16 Pro (ProMotion) | Safari, Chrome iOS, WhatsApp, Instagram in-app |
| Samsung Galaxy A14 / A15 (low-mid Android) | Chrome, Samsung Internet, WhatsApp in-app |
| Redmi Note-class (mid Android) | Chrome, WhatsApp in-app |
| Google Pixel 7 / 8 | Chrome |
| iPad (10th gen) portrait and landscape | Safari |
| MacBook (Retina) | Safari, Chrome, Firefox |
| Windows laptop (1366 × 768 and 1920 × 1080) | Chrome, Edge, Firefox |
| Large display 2560 px+ and ultra-wide | Chrome |

### 23.2 Checklist

**Visual and creative**
- [ ] All scenes match the consistency bible (light direction, grade, couple identity, wardrobe).
- [ ] "TUSCANY, ITALY" everywhere; no Switzerland, mountain or alpine content; no real venue named.
- [ ] Gap, halo and seam test at progress 0 / 0.25 / 0.5 / 0.75 / 1 for every scene and both orientations (AC-03).
- [ ] Title safe zone respected in S01 at rest.
- [ ] Sacred imagery placement rule respected (§12.3).
- [ ] Every image passes the §12.7 rejection list.

**Motion**
- [ ] Each A-spec in §13–14 is verified against its trigger, element, movement, duration and easing, and mobile behaviour.
- [ ] Hand-offs: S01→S02 portal, S02→S03 wall rise, S14→S15 warm transition. No jumps.
- [ ] Pins: lengths per §14.3; something changes every 15 %; no pin traps.
- [ ] Fast flick-scroll, scroll-back-up, and mid-intro scrolling: no broken states.
- [ ] Resize, orientation change and iOS address-bar collapse: no jumps; triggers refreshed.
- [ ] Tier B forced (DevTools CPU 4× slowdown + `deviceMemory` override) and Tier C forced: both correct.
- [ ] Reduced motion (OS setting) and the Pause toggle: §14.6 fully applied with no flash of motion.

**Content and template**
- [ ] Event count fixtures 0, 1, 2, 5, 6, 10: geometry correct; no empty circles (AC-11).
- [ ] Long, short and hyphenated name fixtures (AC-10).
- [ ] Missing media in every slot shows a graceful placeholder; there are no empty frames.
- [ ] Section visibility toggles remove sections from menu, vine and timeline.
- [ ] Venue placeholder state (AC-14); hotels hidden when empty.
- [ ] Custom palette label contrast (AC-15).
- [ ] Date, time and time-zone change propagates everywhere (AC-13).

**Functional**
- [ ] RSVP: happy path, decline path, validation errors, max guests, events, duplicate update, edit link, deadline closed, network failure and retry, double-click submit (no duplicates), honeypot and Turnstile, rate limit.
- [ ] Wishes: submit, pending invisibility (anonymous database query), approve → live ≤ 60 s, hide, pin, pagination, consent required.
- [ ] Countdown across time zones and states (AC-25); the "Today" and "Just married" states are simulated by mocking the clock.
- [ ] `.ics` import into Apple, Google and Outlook (AC-26); Google and Outlook links.
- [ ] Gallery: reel, grid filter, lightbox (keyboard, swipe, pinch, close-to-origin).
- [ ] Map facade loads only on click; Google Maps and Apple Maps links are correct.
- [ ] Share: WhatsApp share text and URL; `navigator.share`; copy link.
- [ ] Personalised invite link greeting and prefill; an invalid code falls back to the generic page.
- [ ] OG preview renders correctly in WhatsApp, iMessage and Instagram DMs.

**Performance**
- [ ] Lighthouse CI budgets (§19) on every PR.
- [ ] WebPageTest mobile 4G: LCP, CLS, total bytes.
- [ ] Safari memory under 120 MB of decoded images during the full scroll on iPhone SE.
- [ ] No third-party requests before interaction (network log).

**Accessibility**
- [ ] axe-core: 0 serious or critical issues.
- [ ] Keyboard-only full journey including RSVP, lightbox and menus.
- [ ] VoiceOver iOS, TalkBack and NVDA: names, sections, countdown text, form errors, dialogs.
- [ ] 200 % zoom and the largest system font on iOS and Android: no clipped or overlapping text.
- [ ] Contrast lint (AC-33); forced-colours mode (Windows High Contrast) readable.
- [ ] `color-scheme: light` holds in Samsung Internet dark mode and Android force-dark.

**Security and privacy**
- [ ] RLS policies tested: anonymous users cannot read RSVPs, pending wishes, drafts or invites.
- [ ] Rate limits and input sanitisation (wishes rendered as text, never HTML).
- [ ] Edit tokens and invite codes are unguessable; no personal data in URLs or logs.
- [ ] EXIF stripped from uploads.
- [ ] Privacy page published; retention job scheduled.

---

## 24. Open questions, placeholders and risks

### 24.1 Placeholders to confirm (all editable; nothing invented)

| # | Item | Current value |
|---|---|---|
| 1 | Venue name and address | **[PLACEHOLDER] "Venue to be announced"** |
| 2 | Dates and times of Mehendi, Haldi, Sangeet and Reception | **[PLACEHOLDER]**, taken from the visual reference (12 Aug 4 PM; 13 Aug 10 AM; 13 Aug 7 PM; 15 Aug 7 PM) |
| 3 | Parents' display names. "Kapoor" reads like a family surname. Confirm the father's full name and preferred format (e.g. "Mr. & Mrs. ___ Kapoor" vs "Kapoor & Lalitha") | Shown as given: *Kapoor & Lalitha*, *Vasu & Jansi* |
| 4 | Love-story content (5 milestones) and images | **[PLACEHOLDER]** |
| 5 | RSVP deadline, default max guests, which events guests RSVP to | **[PLACEHOLDER]**; max guests default 6 |
| 6 | Hashtag | **[PLACEHOLDER]**, e.g. #JanviWedsRohit |
| 7 | Invocation line (`॥ श्री गणेशाय नमः ॥`) on or off; any Hindi or Punjabi lines | On (editable) |
| 8 | Real couple photography vs AI placeholders at launch | AI placeholders, following §12.3 |
| 9 | Domain or subdomain | **[PLACEHOLDER]** |
| 10 | Notification emails for RSVPs | **[PLACEHOLDER]** |

### 24.2 Planning notes worth raising with the couple
- **15 August is Ferragosto**, Italy's peak national holiday. Expect higher hotel prices, fully booked transport and some closures around the date. Guests should book early; the Venue & Stay section should say so.
- **15 August is also India's Independence Day.** Flights from India around the date may be busier; this is worth a line in Travel essentials.
- **Mid-August heat in Tuscany** suits the 10:00 AM ceremony time. Recommend shade, water and breathable fabrics (dress-code notes).
- **Schengen visas:** many guests travelling on Indian passports will need one. Surface this prominently and early.

### 24.3 Key risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI imagery inconsistency (faces, light) across ~120 assets | Breaks realism | Identity sheets, master-composite-first pipeline (§12.4), rejection checklist, creative gate G1 |
| Layer seams or holes revealed by parallax | Looks cheap | Inpaint-behind with overscan; automated progress-sampling screenshots (AC-03) |
| Low-end Android jank | Guests abandon | Device tiers with an FPS probe, budgets in CI, transform-only rule |
| iOS Safari memory reloads with large decoded images | Page reloads mid-scroll | Decoded memory budget (§19), placeholder swapping for far scenes, size caps |
| In-app browser quirks (WhatsApp WebView) | Broken RSVP or calendar | Dedicated test pass; Google Calendar fallback; standard POST form |
| Customers upload photos that can't be layered | Hero loses depth | "Photo" hero mode with foreground layers still in parallax (§16.4) |
| Pins feel like "stuck" scrolling | Frustration | Pin budget and the "change every 15 %" rule; skip-to-RSVP; menu jumps |
| Spam on the wishes and RSVP endpoints | Moderation load | Turnstile, honeypot, rate limits, moderation queue |

---

## 25. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Product owner / template business | | ☐ Approved ☐ Changes requested | |
| Creative director | | ☐ Approved ☐ Changes requested | |
| Lead developer | | ☐ Approved ☐ Changes requested | |

*Once approved, development begins with Phase 0 (content lock) and Phase 1 (hero master composite and S01 motion prototype).*
