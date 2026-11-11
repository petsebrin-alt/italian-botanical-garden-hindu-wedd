# Janvi & Rohit · The Italian Botanical Garden Wedding

An immersive, scroll-driven wedding invitation built as a reusable template. It's a walk through a Tuscan garden from morning to golden hour, with real multi-layer parallax (GSAP ScrollTrigger).

- Product spec: [docs/PRD.md](docs/PRD.md)
- Opening-screen plan: [docs/OPENING-SCREEN-PLAN.md](docs/OPENING-SCREEN-PLAN.md)

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL`, `STUDIO_TOKEN` (12+ characters) and `HASH_SALT`.

## Customise a wedding

Everything a couple changes lives in **`src/content/wedding.ts`**:
- names, date, time and time zone
- parents, the blessing over Save the Date and the story
- events, ceremony rituals and dress code
- gallery, venue, RSVP settings and the thank-you lines

On the next build, these update automatically:
- the hero, monogram initials, page title and OG data
- the countdown and calendar files
- the event timeline, including its node count and curved connectors
- the RSVP event choices
- the menu

Rules:
- An event appears only when it has a name, date and start time, so the site never shows an empty circle.
- With 0 events, the Events section and its menu item disappear.
- With no venue address, the site shows "Venue to be announced" and no map.

Values in `[square brackets]` are placeholders still to confirm (PRD §24).

### Personal guest links
The opening screen greets each guest by name under the monogram ("Dear Sharma Family"). Send each guest their own link with their name in it:

```
https://<your-site>/?to=Sharma%20Family
```

(`?guest=` works too; spaces can be `%20` or `+`.) Without a name, the greeting reads "Dear Family & Friends"; change both words in `greeting` in `src/content/wedding.ts`.

## The garden gate (splash screen)

The site opens on a closed garden gate tied with an ivory satin bow, with a posy of flowers on its knot (`src/scenes/gate/`). It waits for the guest: "Tap to open" (or a scroll or key press, or six seconds of waiting).
1. The tails stir, then both loops slide slowly back through the knot as it turns and loosens, twisting and untwisting.
2. The knot band unwraps and the knot gives. The two halves of the ribbon swing down from the stiles, twist and untwist, and are drawn down and away.
3. The flowers drift slowly down, swaying, and come to rest on the ground in front of the gate.
4. The iron leaves swing inward onto open sky, the camera walks through past the flowers, and the gate dissolves into the opening screen.

The opening plays at its own unhurried pace (about eight seconds from the tap). Links to a section (`/#events`) skip it, and with reduced motion the gate simply fades out.

The bow is one continuous satin ribbon modelled and lit in 3D (`src/scenes/gate/ribbon.ts`, WebGL). Each half runs from its stile across the leaf, into the knot, round its loop and down into its tail, so there are no joins. The satin's sheen, rounded cross-section, pleats where it is gathered into the knot, and darker back when it turns over all come from its real shape and the light. Once the knot gives, each half moves as a soft rope with gravity and air.

The photographed layers (pillars and arch, the two iron leaves, the posy) are cut from `assets-src/botanical/ref-gate.webp`:

```bash
python3 tools/build_gate.py                   # writes public/assets/gate/* + manifest.json
python3 tools/build_gate.py --bow             # only re-cut the posy of flowers
GATE_DEBUG=/tmp/gate python3 tools/build_gate.py   # also writes inspection images
```

The ironwork is keyed so the sky shows between the bars. Where the bow and vines hid it, the bars are continued and the scrolls are copied from the visible repeats and from the mirror-image leaf. Wide screens see both pillars completed (the urns are symmetric) and a cypress garden beyond them.

## Page order

Gate → Opening (sky, monogram, names) → Save the Date (in the garden) → The Couple → Sweet Memories → Celebrations → Ceremony (garden window invitation) → Our Families → Wishing Wall → Venue → Need Help → Thank You.

## Sweet Memories

Seven photographs of the couple on a curved lens carousel (`src/sections/Memories.tsx`, drawn by `src/lib/lens.ts`). The photograph in the middle is flat and sharp; its neighbours swell and curve away to either side, with a faint colour fringe at the edges. It turns on its own every few seconds and follows a drag or swipe, the arrows, the dots and the arrow keys. The title and caption of each photograph are in `memories` in `src/content/wedding.ts`. The photographs are cut from `assets-src/botanical/ref-memories.webp`:

```bash
python3 tools/build_memories.py        # writes public/assets/img/memory-1..7.webp/.avif
```

## Celebrations: photographs and flowers

Each celebration's photograph shows its whole scene and its sign. `tools/build_events.py` cuts each one from `assets-src/botanical/ref-events.webp` to the exact shape of the frame's window, and widens the gold botanical frame through its plain middle (its flowers and curves are untouched) so the window fits the photographs.

The flower on the timeline is a real pink hydrangea (`bloom-hydrangea.webp`). It opens as its celebration scrolls into view and closes again going back: its heart first, then each ring of florets unfurling outward (`src/components/Bloom.tsx`). To use another flower, replace `NODE_FLOWER` in `src/sections/Events.tsx` with any flower photo on a transparent background.

## The flowering creeper (Celebrations timeline)

A flowering creeper (kodi) grows down the Celebrations timeline as the guest scrolls (`src/sections/creeper.ts`). Its stem grows down to just past the middle of the screen. As the stem reaches each piece, the leaves unfurl from their base, the buds swell on their stalks, and the flowers open from a bud: heart first, then each ring of petals. A larger pink flower opens on the stem beside each celebration, and scrolling back folds everything up again. The timeline is taller than one creeper, so mirrored copies continue it, their stems meeting end to end.

The pieces are cut from `assets-src/botanical/ref-creeper.webp`:

```bash
python3 tools/build_creeper.py         # writes public/assets/img/creeper-stem.webp, creeper-atlas.webp, creeper.json
```

To go back to the earlier design (a fine gold vine with a hydrangea opening at each celebration), set `VINE = "line"` at the top of `src/sections/Events.tsx`.

## The garden window invitation

In the ceremony section, once the crystal curtain has drawn open, the garden window plays its invitation (`src/sections/GardenWindow.tsx`). It stands on a real lawn under an open sky with drifting clouds:
1. A white wooden window, closed, with roses climbing round it and sunlight moving over it.
2. A pink butterfly flies in, leaving a faint trail of light, hovers, and lands on the handle.
3. The two shutters swing open on their hinges, and warm light fills the window.
4. Inside, an ivory envelope comes forward, its flap lifts, and the card rises out of it.
5. The card is the couple's invitation, with "Dear <guest>" when the link carries a name. A hand points to "Accept the Invitation".
6. On Accept, Janvi and Rohit appear in the window, butterflies fly across the whole section, and rose petals fall. A thank-you note appears, with Replay.

On laptops the window is larger, and the envelope and the card are a little smaller than it, so the window's frame and flowers stay in view around the card. Phones keep the smaller window, with the card in front of it.

The window, shutters, roses, butterflies and petals are cut from the asset sheet `assets-src/botanical/ref-window-sheet.webp`.

The lawn is real grass, never stretched. `tools/build_lawn.py` takes an evenly lit stretch of the sharp lawn in `ref-welcome.webp`, quilts it into a large seamless lawn, and lays that out in perspective to the horizon. Near grass is shown at its photographed size; further rows are shrunk, so they stay crisp. Soft sunlight and shade fall across it, and the far grass takes on the haze of the air, meeting the sky in a clean line with low hills beyond.

```bash
python3 tools/build_window.py          # writes public/assets/window/* (window, roses, butterflies, petals)
python3 tools/build_lawn.py            # writes public/assets/window/lawn.webp
```

## Crystal curtain

The bead curtain over the ceremony window is drawn live (`src/sections/crystal-curtain.ts`) from the real crystals of `assets-src/botanical/ref-crystal-curtain.webp`. Each crystal is cut at no more than its photographed size, so the curtain stays sharp on any screen. It hangs from the rose-gold rod at the top of the section to its foot. Each crystal glows softly and catches the light in small glints, more often while it moves. Scrolling into the section ripples the strands, then draws them open to both sides, the lower beads trailing behind the top.

```bash
python3 tools/build_crystals.py        # writes public/assets/img/crystal-atlas.webp + .json
```

## Venue, RSVP and Need Help

- **Venue:** the villa in a wide arch with a Location button, and the travel notes as tiles. Set `venue.name` and `venue.address` and the Location buttons (here and in Celebrations) point at the villa.
- **RSVP:** posts to `/api/rsvp`; replies appear in `/studio`. Guests can come back and edit theirs from the same device.
- **Need Help:** the questions in `help.faqs`. A family contact appears, with Call and WhatsApp buttons, once its `phone` is filled in under `help.contacts`.

## Celebrations

The five celebrations (Haldi, Mehendi, Sangeet Night, Wedding Ceremony, Reception Party) are listed in `events` in `src/content/wedding.ts`. Each has a date, start and end time, the part of the villa and a short description. On wide screens one arched photograph stays in view while the timeline scrolls past and changes to each celebration's photo. On phones each photo sits inline. Every celebration has a **Location** button (Google Maps) and **Add to calendar**. Until the villa is confirmed, the map opens on `venue.mapsQuery` ("Tuscany, Italy"). Set `venue.name` and `venue.address` and every Location button points at the villa.

The photographs are cut from `assets-src/botanical/ref-events.webp`:

```bash
python3 tools/build_events.py          # writes public/assets/img/event-*.webp/.avif
```

## Parallax layers

The opening screen has 13 separately moving layers, decomposed from `assets-src/ref-opening.webp` with no flattened background:

```bash
npm run layers                   # writes public/scenes/hero/* + manifest.json
python3 tools/build_layers.py --debug /tmp/layers   # also writes inspection composites
```

The layers are sky (CSS), clouds, distant hills, far avenue, cypress left/right, ground, couple, flowers left/right and arbour left/right. The script also cuts reusable sprites (wisteria, trees) that the other sections use, so the visual language stays consistent.

Wide screens are filled edge to edge at full sharpness. Nothing is blurred: the avenue, wall, lawn and flower beds continue past the photo's edges from the garden's own real pixels, and the arbour is pinned to the screen's corners.

For final production photography, cut the new master into layers by hand and import them:

```bash
python3 tools/build_layers.py --export-cuts ~/hero-template   # today's cuts, as a template
python3 tools/import_layers.py ~/hero-layers --check          # validate the hand-cut layers
python3 tools/import_layers.py ~/hero-layers                  # write desktop + phone sets
```

The import writes a desktop set and a phone set, backs up the previous layers to `assets-src/backups/`, and versions every hero URL so the year-long cache never shows old layers. The hero reads all of its geometry from the manifest (canvas proportions, contact point, title position), so any master that follows the composition guide drops in. Full steps are in [docs/PHOTO-PROMPTS.md](docs/PHOTO-PROMPTS.md) §3.

Finished section photos (portraits, story, gallery and so on) go in with `python3 tools/import_photos.py <folder>`.

The flowers and trees that dress the sections (wisteria canopy and strands, hydrangea beds, cypress groups) and the opening screen's corner flower beds are cut from in-focus photographs in `assets-src/botanical/`, never from the hero's soft foreground:

```bash
python3 tools/build_botanicals.py      # writes public/assets/botanical/* and the S06 avenue photo
python3 tools/build_welcome.py         # splits the S02 garden photo into sky, land and near layers
```

The real Tuscan fields under the Couple portraits (`fields-hills`, `fields-meadow`) are cut from the same sharp garden photograph. Its sky is keyed out, and each band is continued sideways with mirrored copies of itself:

```bash
python3 tools/build_fields.py          # writes public/assets/img/fields-*.webp/.avif
```

`tools/prepare_assets.py` produced the photo crops in `public/assets/img/` from the three references.

## Save the Date

Save the Date is set in the open sky of one photographed garden (`assets-src/botanical/ref-welcome.webp`), with no card: clouds drift behind it, and the garden's layers move at different depths. The build removes any lettering baked into the photograph, keys out the sky, separates the villa terrace and the hydrangea corner, and continues the sky upward for phones.

It opens on a dial of the wedding month. The needle sweeps from the 1st to the 15th while the day number counts up through a soft blur. Then the month and year rise in, followed by the hour. A small bead runs along the dial with the seconds, and Add to Calendar comes last.

The countdown is four tear-off calendar pads on gold rings: days, hours, minutes and seconds (`src/components/CalendarCountdown.tsx`). Each time a number changes, its page is crumpled into a paper ball and tossed away, and the page underneath already shows the next number. The crumpling is drawn live in WebGL (`src/lib/crumple.ts`): the page is folded in from its corners into a creased ball, lit so the folds read, then thrown up and away so it falls into the garden. With reduced motion, the pages simply change.

## The Couple

As the section scrolls in, the bride's arched portrait comes in from the left edge of the screen and the groom's from the right, to meet in the middle (`src/sections/Couple.tsx`). Every layer moves at its own depth at the same time: the vines come down, the hills lag, the portraits float a little ahead and the hydrangeas rise. It is tied to the scroll, so scrolling back up plays it in reverse.

## Our Families

The parents' portraits, in oval beaded frames joined by a drawn garland, are set in layers on the ivory paper, like the opening (`src/sections/Family.tsx`): wisteria overhead, the families, and hydrangeas in front. As the section scrolls up into view, every layer rises at its own speed, and the bride's family's frame comes in from the left edge while the groom's comes in from the right. The section then holds on screen while the camera comes closer: the wisteria and the hydrangeas grow and part to the sides, the frames come nearer and the garland draws itself between them. Both parts follow the scroll, so scrolling back up plays them in reverse. On phones the two frames sit side by side.

The frames are cut from `assets-src/family/ref-parents.webp`: each oval is found from its green frame and cut cleanly on it, leaving the white sheet and its shadow behind (the page draws its own soft shadow).

```bash
python3 tools/build_parents.py         # writes public/assets/img/family-bride.webp, family-groom.webp
```

## The wishing booth

The booth sits on a soft garden green (`src/sections/Wishes.tsx`), with "Wishing Booth" written large across the screen and a "Scroll down" hint above it. As the section scrolls, it holds on screen while the guests' wish cards come up one by one over the title and settle into a deck, each at its own small tilt. Then the form comes up beneath it, with just two fields: name and wish.

Each card is the scalloped green frame with painted flowers (`public/assets/img/wish-frame.webp`, cut from `assets-src/wishes/ref-frame.webp` by `python3 tools/build_wish_frame.py`), with the wish written in the cream space inside it.

Sending draws a little paper plane, line by line, just above the button ("Folding…"). It loops once, then flies up beside the deck and over its top, drawing a pencil line behind it, and dips into the top of the deck. The new card is slipped in on top, and the button turns green: "Delivered". On a phone, the booth first glides back into full view. "View all wishes" opens every wish in a pop-up at the centre of the screen.

The booth holds the latest 25 wishes. Every guest wish waits for the couple's approval in `/studio` before anyone else sees it. Until five guests have written, the couple's own cards keep the booth company (`wishBooth.prompts` in `src/content/wedding.ts`).

A guest's own wishes are kept in their browser (`localStorage`, key `wb-mine`), so they see their cards on the booth until they are approved. If the booth can't be reached when they send (no connection, or no database yet), the wish still flies in and is sent again quietly: every minute while the page is open, and on their next visit. Only a wish the server refuses outright (too short, or too many from one place in an hour) shows a message.

## Motion engine

- `src/scenes/hero/`: the opening scene. The camera opens on the sky with the J|R monogram; scrolling writes in the names, descends as every layer rises at its own speed, then steps through the arch. Geometry is pure CSS, so the server render is already the opening frame.
- `src/lib/scene.ts`: the shared engine. Sections opt in with `data-depth` (parallax), `data-inner` (inner image drift) and `data-reveal="lines|chars|up|fade|draw|mask|stagger"`.
- Motion levels:
  - **A**: full motion.
  - **B**: lite, for low-end devices.
  - **C**: no scroll motion at all, for `prefers-reduced-motion`.
- "Pause animations" (in the menu and footer) stops ambient motion such as sway, clouds and flicker.

## RSVP, wishes and studio

- `POST /api/rsvp` validates the response, filters unknown events, and applies a honeypot and rate limit. It returns a private edit token, which the guest's device keeps so they can update their reply.
- `GET/POST /api/wishes`: new wishes are pending; only approved wishes are ever public.
- `/calendar/<eventId>` and `/calendar/all`: RFC 5545 `.ics` files in UTC (the ceremony is 08:00Z, which is 10:00 in Italy).
- `/studio`: after signing in with `STUDIO_TOKEN`, shows totals per celebration, the response table, CSV export, and approve / hide / pin / delete for wishes.

### Storage
RSVPs, wishes and rate limits go through one interface (`src/lib/stores/types.ts`) with two implementations. `src/lib/store.ts` picks one:

| Where | Storage |
|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) is set | **Postgres** ([`src/lib/stores/postgres.ts`](src/lib/stores/postgres.ts)): Neon, Supabase or any host. The three tables (`rsvps`, `wishes`, `rate_limits`) are created automatically on the first request; the same SQL can be run by hand. |
| On Vercel without a database | Nothing is saved on the server, and the log names the missing variable. RSVPs get a polite "try again"; a wish is kept in the guest's browser and sent again later (see "The wishing booth"). |
| Locally without a database | JSON files in `./data` (gitignored), for development. |

```bash
npm test          # the same storage checks against the file store and a real Postgres engine (PGlite)
npm run db:local  # an in-memory Postgres on port 5433, to try the database path locally:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres npm run dev
```

## Deploying

### GitHub
This folder is its own repository, `italian-botanical-garden-wedding`, with no link to any other wedding project. Never use `git push --force`: if the GitHub repository already has commits, the push is refused instead of overwriting them.

### Vercel
1. In Vercel, choose **Add New → Project** and import `italian-botanical-garden-wedding` from GitHub. The defaults are right: framework Next.js, build `npm run build`, and Node 20.9 or newer (from `package.json` → `engines`).
2. Add a Postgres database, using either option:
   - **Neon (simplest):** in the project's **Storage** tab, create a Neon Postgres database and connect it to the project. Vercel adds `DATABASE_URL` for you.
   - **Supabase:** create a project, then copy the **Transaction pooler** connection string (Project Settings → Database, port 6543). Add it in Vercel as `DATABASE_URL`, with your database password filled in. Add `?sslmode=require` to the end if it isn't there already.
3. In **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`: the site's public address, for example `https://italian-botanical-garden-wedding.vercel.app`, or your own domain later.
   - `STUDIO_TOKEN`: a long secret, 12+ characters; it enables `/studio`.
   - `HASH_SALT`: any random string.
4. Deploy, or redeploy after adding variables. Then sign in at `/studio`: it should show no "local files" storage line and no database warning. Send one test RSVP and one wish, check they appear in the studio, then delete the wish there.

The Python tools in `tools/` run only on your computer; Vercel never needs them.
