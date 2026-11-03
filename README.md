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
- parents, the welcome message and the story
- events, ceremony rituals and dress code
- gallery, venue, RSVP settings and the thank-you lines

On the next build, these update automatically:
- the hero, monogram initials, page title and OG data
- the countdown and calendar files
- the event timeline, including its node count and curved connectors
- the dress-code cards and RSVP event choices
- the menu

Rules:
- An event appears only when it has a name, date and start time, so the site never shows an empty circle.
- With 0 events, the Events section and its menu item disappear.
- With no venue address, the site shows "Venue to be announced" and no map.

Values in `[square brackets]` are placeholders still to confirm (PRD §24).

## Parallax layers

The opening screen has 13 separately moving layers, decomposed from `assets-src/ref-opening.webp` with no flattened background:

```bash
npm run layers                   # writes public/scenes/hero/* + manifest.json
python3 tools/build_layers.py --debug /tmp/layers   # also writes inspection composites
```

The layers are sky (CSS), clouds, distant hills, far avenue, cypress left/right, ground, couple, flowers left/right and arbour left/right. The script also cuts reusable sprites (wisteria, trees, near-flowers) that the other sections use, so the visual language stays consistent.

For final production photography, cut the new master into layers by hand and import them:

```bash
python3 tools/build_layers.py --export-cuts ~/hero-template   # today's cuts, as a template
python3 tools/import_layers.py ~/hero-layers --check          # validate the hand-cut layers
python3 tools/import_layers.py ~/hero-layers                  # write desktop + phone sets
```

The import writes a desktop set and a phone set, backs up the previous layers to `assets-src/backups/`, and versions every hero URL so the year-long cache never shows old layers. The hero reads all of its geometry from the manifest (canvas proportions, contact point, title position), so any master that follows the composition guide drops in. Full steps are in [docs/PHOTO-PROMPTS.md](docs/PHOTO-PROMPTS.md) §3.

Finished section photos (portraits, story, gallery and so on) go in with `python3 tools/import_photos.py <folder>`.

`tools/prepare_assets.py` produced the photo crops in `public/assets/img/` from the three references.

## Motion engine

- `src/scenes/hero/`: the opening scene. It has a descend-from-the-sky phase, then a step-through-the-arch phase; geometry is pure CSS, so the server render is already composed.
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

Data is stored as JSON in `./data` (gitignored). `src/lib/store.ts` is the only storage module, so it can be swapped for Supabase or Postgres in production.

## Deploying

### GitHub
This folder is its own repository, `italian-botanical-garden-wedding`, with no link to any other wedding project. Never use `git push --force`: if the GitHub repository already has commits, the push is refused instead of overwriting them.

### Vercel: not ready yet
The site builds on Vercel as it is: framework preset Next.js, build command `npm run build`, Node 20.9 or newer (set in `package.json` → `engines`). **RSVPs and wishes need a hosted database first, though.** `src/lib/store.ts` saves them as JSON files in `./data`. Vercel's servers can't keep files: the disk is read-only apart from a temporary folder that is wiped and not shared between instances. Every RSVP, wish and studio action would therefore fail or be lost.

Before the first deployment:
1. Replace `src/lib/store.ts` with a hosted store (Supabase, Neon Postgres or Upstash Redis from the Vercel Marketplace). The API routes only use `readAll` and `mutate`, so nothing else changes.
2. Move the rate limiter (`allow`) to the same store; in-memory counters reset on every serverless instance.
3. In Vercel → Project → Settings → Environment Variables, set:
   - `NEXT_PUBLIC_SITE_URL`: the site's public address.
   - `STUDIO_TOKEN`: 12+ characters; it enables `/studio`.
   - `HASH_SALT`: a random string.
   - The database's connection variables.

The Python tools in `tools/` run only on your computer; Vercel never needs them.
