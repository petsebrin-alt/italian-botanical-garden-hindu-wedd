/**
 * The flowering creeper that grows down the Celebrations timeline (the "kodi"), built from the
 * pieces tools/build_creeper.py cuts from the illustration: the bare stem, and every leaf, bud and
 * flower on its own.
 *
 * Growth follows the scroll: the stem is revealed down to a line just past the middle of the
 * screen, and each piece unfolds from its own point as the stem reaches it. Leaves unfurl from
 * their base; buds swell on their stalks; flowers open from a bud, heart first, then each ring
 * of petals. Scrolling back folds them up again. Everything is placed by position, so it is
 * right however fast or far the page moves.
 *
 * The timeline is taller than one creeper, so the creeper continues with mirrored copies whose
 * stems meet end to end.
 */

export type CreeperPiece = { kind: "leaf" | "bud" | "flower"; x: number; y: number; w: number; h: number; px: number; py: number; ax: number; ay: number; pink?: boolean };
export type CreeperMeta = { w: number; h: number; atlas: { w: number; h: number }; line: number[]; lineStep: number; pieces: CreeperPiece[] };

type Live = {
  el: HTMLElement;
  rings?: HTMLElement[];
  piece: CreeperPiece;
  top: number;          // where it starts to grow, px down the timeline
  side: number;         // which way it leans: −1 left, 1 right
  mirror: boolean;
  big: number;          // a celebration's own flower is shown larger
  t: number;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export class Creeper {
  private pieces: Live[] = [];
  private stems: HTMLElement[] = [];
  private s = 0.5;
  private ramp = 160;
  private raf = 0;
  private ro: ResizeObserver;
  private lastFront = -1;

  constructor(
    private box: HTMLElement,          // the creeper's own layer, beside the timeline
    private list: HTMLElement,         // the timeline it grows down
    private meta: CreeperMeta,
    private urls: { stem: string; atlas: string },
    private still = false,
  ) {
    this.build();
    this.ro = new ResizeObserver(() => {
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(() => { this.build(); this.update(); });
    });
    this.ro.observe(list);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll);
    this.update();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    this.box.replaceChildren();
  }

  private onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.update());
  };

  /** The stem's x (creeper px) at a height (creeper px) of one copy. */
  private lineX(y: number) {
    const L = this.meta.line, k = y / this.meta.lineStep;
    const i = Math.max(0, Math.min(L.length - 1, Math.floor(k)));
    const j = Math.min(L.length - 1, i + 1);
    return L[i] + (L[j] - L[i]) * (k - i);
  }

  private build() {
    const m = this.meta;
    const wide = window.innerWidth >= 1024;
    this.s = wide ? 0.58 : 0.38;
    this.ramp = wide ? 170 : 130;
    const s = this.s;
    const H = this.list.offsetHeight;
    const copyH = m.h * s;
    const n = Math.max(1, Math.ceil(H / copyH));
    this.box.replaceChildren();
    this.pieces = [];
    this.stems = [];
    this.box.style.width = `${m.w * s}px`;
    this.lastFront = -1;

    // each copy is the mirror of the one above, shifted so the stems meet
    const offsets: number[] = [];
    let dx = 0;
    for (let k = 0; k < n; k++) {
      const mirror = k % 2 === 1;
      const top = mirror ? m.w - m.line[0] : m.line[0];
      if (k > 0) {
        const prevMirror = (k - 1) % 2 === 1;
        const prevBottom = (prevMirror ? m.w - m.line[m.line.length - 1] : m.line[m.line.length - 1]) + offsets[k - 1];
        dx = prevBottom - top;
      }
      offsets.push(dx);
    }
    const atlasBg = `url(${this.urls.atlas})`;
    const bgSize = `${m.atlas.w * s}px ${m.atlas.h * s}px`;
    const frag = document.createDocumentFragment();

    for (let k = 0; k < n; k++) {
      const mirror = k % 2 === 1;
      const top = k * copyH;
      const stem = document.createElement("div");
      stem.className = "ev-cr-stem";
      Object.assign(stem.style, {
        top: `${top}px`, left: `${offsets[k] * s}px`, width: `${m.w * s}px`, height: `${copyH}px`,
        backgroundImage: `url(${this.urls.stem})`, transform: mirror ? "scaleX(-1)" : "",
      });
      stem.style.setProperty("--top", `${top}px`);
      frag.appendChild(stem);
      this.stems.push(stem);

      for (const p of m.pieces) {
        const y = top + p.y * s;
        if (y > H + 40) continue;
        const left = (offsets[k] + (mirror ? m.w - p.x - p.w : p.x)) * s;
        const px = mirror ? p.w - p.px : p.px;
        const live = this.makePiece(p, left, y, px, mirror, atlasBg, bgSize, 1);
        // leaves lean away from the stem; buds and flowers face the side they grow on
        const lx = this.lineX(p.y + p.py);
        const cx = p.x + p.w / 2;
        live.side = (cx >= lx ? 1 : -1) * (mirror ? -1 : 1);
        live.top = y + p.py * s;
        frag.appendChild(live.el);
        this.pieces.push(live);
      }
    }

    // a larger flower opening on the stem at each celebration
    const pinks = m.pieces.filter((p) => p.kind === "flower" && p.pink).sort((a, b) => b.w * b.h - a.w * a.h);
    const items = Array.from(this.list.querySelectorAll<HTMLElement>(".ev-item"));
    items.forEach((item, i) => {
      const p = pinks[i % Math.min(3, pinks.length)];
      if (!p) return;
      const y = item.offsetTop + 14;
      const k = Math.min(n - 1, Math.floor(y / copyH));
      const mirror = k % 2 === 1;
      const ly = (y - k * copyH) / s;
      const sx = (offsets[k] + (mirror ? m.w - this.lineX(ly) : this.lineX(ly))) * s;
      const big = 1.25;
      const w = p.w * s * big, h = p.h * s * big;
      const live = this.makePiece(p, sx - p.px * s * big, y - p.py * s * big, p.px, false, atlasBg, `${m.atlas.w * s * big}px ${m.atlas.h * s * big}px`, big);
      live.el.classList.add("ev-cr-mark");
      live.top = y - 30;
      live.side = -1;
      void w; void h;
      frag.appendChild(live.el);
      this.pieces.push(live);
    });
    this.box.appendChild(frag);
  }

  private makePiece(p: CreeperPiece, left: number, top: number, px: number, mirror: boolean, bg: string, bgSize: string, big: number): Live {
    const s = this.s * big;
    const el = document.createElement("div");
    el.className = `ev-cr ev-cr--${p.kind}`;
    const pos = `${-p.ax * s}px ${-p.ay * s}px`;
    Object.assign(el.style, {
      left: `${left}px`, top: `${top}px`, width: `${p.w * s}px`, height: `${p.h * s}px`,
      transformOrigin: `${px * s}px ${p.py * s}px`,
    });
    const live: Live = { el, piece: p, top: 0, side: 1, mirror, big, t: -1 };
    if (p.kind === "flower") {
      // a flower is its heart, its middle and its outer petals (and, once open, the whole)
      const R = Math.max(p.w, p.h) * s * 0.5;
      const at = `circle at ${px * s}px ${p.py * s}px`;
      const masks = [
        `radial-gradient(${at}, #000 ${R * 0.34}px, transparent ${R * 0.42}px)`,
        `radial-gradient(${at}, transparent ${R * 0.34}px, #000 ${R * 0.42}px, #000 ${R * 0.64}px, transparent ${R * 0.72}px)`,
        `radial-gradient(${at}, transparent ${R * 0.64}px, #000 ${R * 0.72}px)`,
        "",
      ];
      live.rings = masks.map((mask) => {
        const r = document.createElement("div");
        r.className = "ev-cr-ring";
        Object.assign(r.style, { backgroundImage: bg, backgroundSize: bgSize, backgroundPosition: pos, transformOrigin: `${px * s}px ${p.py * s}px` });
        if (mask) { r.style.maskImage = mask; r.style.setProperty("-webkit-mask-image", mask); }
        if (mirror) r.style.transform = "scaleX(-1)";
        el.appendChild(r);
        return r;
      });
    } else {
      Object.assign(el.style, { backgroundImage: bg, backgroundSize: bgSize, backgroundPosition: pos });
    }
    return live;
  }

  /** Grow (or fold back) everything down to the front line. */
  update() {
    const rect = this.list.getBoundingClientRect();
    const front = this.still ? 1e6 : window.innerHeight * 0.62 - rect.top + 40;
    if (Math.abs(front - this.lastFront) < 0.5) return;
    this.lastFront = front;
    this.box.style.setProperty("--grow", `${Math.max(0, front)}px`);
    for (const lv of this.pieces) {
      // each piece waits until the stem has fully grown past its point (the tip fades in over 34px)
      const t = clamp01((front - 40 - lv.top) / (this.ramp * (lv.piece.kind === "flower" ? 1.25 : 1)));
      if (t === lv.t) continue;
      lv.t = t;
      this.pose(lv, t);
    }
  }

  private pose(lv: Live, t: number) {
    const st = lv.el.style;
    const flip = lv.mirror && lv.piece.kind !== "flower" ? "scaleX(-1) " : "";
    if (t <= 0) { st.opacity = "0"; st.visibility = "hidden"; return; }
    st.visibility = "visible";
    const e = easeOut(t);
    if (lv.piece.kind === "leaf") {
      // a leaf unfurls from its base: tucked against the stem, it opens out and turns into place
      st.opacity = `${Math.min(1, t * 2.4)}`;
      st.transform = `${flip}rotate(${(1 - e) * -38 * lv.side}deg) scale(${0.06 + 0.94 * e}, ${0.06 + 0.94 * Math.pow(e, 0.8)})`;
      return;
    }
    if (lv.piece.kind === "bud") {
      st.opacity = `${Math.min(1, t * 2.4)}`;
      st.transform = `${flip}rotate(${(1 - e) * 18 * lv.side}deg) scale(${0.12 + 0.88 * e})`;
      return;
    }
    // a flower: first a closed bud, then the heart, the middle and the outer petals open
    const [core, mid, outer, whole] = lv.rings!;
    st.opacity = `${Math.min(1, t * 3)}`;
    const g = easeOut(span(t, 0, 0.55));
    st.transform = `rotate(${(1 - g) * -24 * lv.side}deg) scale(${0.22 + 0.78 * g})`;
    const c = easeOut(span(t, 0, 0.4)), mI = easeOut(span(t, 0.22, 0.72)), o = easeOut(span(t, 0.42, 1));
    const mir = lv.mirror ? "scaleX(-1) " : "";
    core.style.opacity = `${c}`;
    core.style.transform = `${mir}scale(${0.55 + 0.45 * c})`;
    mid.style.opacity = `${mI}`;
    mid.style.transform = `${mir}rotate(${(1 - mI) * 24}deg) scale(${0.42 + 0.58 * mI})`;
    outer.style.opacity = `${o}`;
    outer.style.transform = `${mir}rotate(${(1 - o) * -30}deg) scale(${0.32 + 0.68 * o})`;
    // fully open: one flower again, no seams between its rings
    const done = t >= 0.999;
    whole.style.opacity = done ? "1" : "0";
    if (done) { core.style.opacity = mid.style.opacity = outer.style.opacity = "0"; }
  }
}
