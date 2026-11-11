/**
 * The crystal bead curtain over the ceremony window, drawn live on one canvas.
 *
 * Every strand is built from the real crystals of the curtain photograph
 * (public/assets/img/crystal-atlas.webp, cut by tools/build_crystals.py), never stretched past
 * their own photographed size, so they stay sharp on any screen. Strands hang from a rose-gold rod
 * at the top of the section to its very foot, on fine gold wire with gold spacers between the
 * beads, a faceted pendant at the end of each and butterflies resting here and there.
 *
 * Light: each crystal glows softly and catches the light now and then in a small star of glints;
 * crystals that are moving catch it more often.
 *
 * Motion (driven by the section's scroll timeline through `state`):
 *   wave  0 → 1   ripples run across the curtain and down every strand
 *   open  0 → 1   the strands are drawn to the two sides, the lower beads trailing behind the top
 * and a gentle sway at all times, stronger while the page is being scrolled.
 */

type Sprite = { x: number; y: number; w: number; h: number; ax: number; ay: number; pad: number };
export type AtlasMeta = { scale: number; sprites: Record<string, Sprite> };

type Item = { kind: "bead" | "link"; sprite?: string; len: number; d0: number; spacer?: boolean; tall?: boolean; phase: number; rate: number };
type Strand = { b: number; shift: number; phi: number; items: Item[]; L: number };
type Butterfly = { strand: number; d: number; scale: number; flip: boolean; tilt: number; phase: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft glow and a four-pointed glint, drawn once and stamped wherever a crystal catches light. */
function makeGlint(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const halo = g.createRadialGradient(r, r, 0, r, r, r);
  halo.addColorStop(0, "rgba(255,255,255,0.95)");
  halo.addColorStop(0.12, "rgba(255,250,246,0.55)");
  halo.addColorStop(0.4, "rgba(255,236,240,0.12)");
  halo.addColorStop(1, "rgba(255,236,240,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, size, size);
  const ray = (angle: number, len: number, w: number, a: number) => {
    g.save();
    g.translate(r, r);
    g.rotate(angle);
    const lg = g.createLinearGradient(-len, 0, len, 0);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(0.5, `rgba(255,255,255,${a})`);
    lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(-len, 0); g.quadraticCurveTo(0, -w, len, 0); g.quadraticCurveTo(0, w, -len, 0);
    g.fill();
    g.restore();
  };
  ray(0, r, size * 0.035, 1);
  ray(Math.PI / 2, r, size * 0.035, 1);
  ray(Math.PI / 4, r * 0.45, size * 0.02, 0.6);
  ray(-Math.PI / 4, r * 0.45, size * 0.02, 0.6);
  return c;
}

function makeGlow(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,246,250,0.55)");
  grad.addColorStop(0.45, "rgba(255,232,240,0.2)");
  grad.addColorStop(1, "rgba(255,232,240,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeSpacer(size: number) {
  const c = document.createElement("canvas");
  c.width = size; c.height = Math.round(size * 1.5);
  const g = c.getContext("2d")!;
  const cx = size / 2, cy = c.height / 2;
  const grad = g.createRadialGradient(cx - size * 0.15, cy - size * 0.25, size * 0.05, cx, cy, size * 0.6);
  grad.addColorStop(0, "#fff1cf");
  grad.addColorStop(0.35, "#e2b977");
  grad.addColorStop(0.8, "#a8773c");
  grad.addColorStop(1, "#8a5f2c");
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(cx, cy, size * 0.42, c.height * 0.46, 0, 0, Math.PI * 2);
  g.fill();
  return c;
}

export type CurtainState = { wave: number; open: number };

export class CrystalCurtain {
  state: CurtainState = { wave: 0, open: 0 };
  private ctx: CanvasRenderingContext2D;
  private W = 0; private H = 0; private dpr = 1; private S = 1;
  private strands: Strand[] = [];
  private flies: Butterfly[] = [];
  private rodY = 0;
  private glint = makeGlint(96);
  private glow = makeGlow(64);
  private spacer = makeSpacer(16);
  private t = 0;
  private vel = 0;
  private lastY = 0;
  private visible = false;
  private raf = 0;
  private lastFrame = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(private canvas: HTMLCanvasElement, private atlas: HTMLImageElement, private meta: AtlasMeta, private still = false) {
    this.ctx = canvas.getContext("2d")!;
    this.layout();
    this.ro = new ResizeObserver(() => { this.layout(); this.draw(); });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible && !this.still) this.loop(); else cancelAnimationFrame(this.raf);
    }, { rootMargin: "80px" });
    this.io.observe(canvas);
    this.lastY = window.scrollY;
    this.draw();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
  }

  private sp(name: string) { return this.meta.sprites[name]; }
  /** CSS px per atlas px */
  private get k() { return this.S / this.meta.scale; }

  private layout() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.W = r.width; this.H = r.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    const wide = this.W >= 900;
    // the crystals' size on screen relative to the photograph (never far above 1: they stay sharp)
    this.S = wide ? Math.min(1.3, Math.max(0.95, this.W / 1250)) : Math.min(0.92, Math.max(0.72, this.W / 470));
    const S = this.S, k = this.k;
    const pitch = 52 * S;
    const margin = pitch * 0.55;
    const n = Math.max(5, Math.floor((this.W - 2 * margin) / pitch) + 1);
    const x0 = (this.W - (n - 1) * pitch) / 2;
    this.rodY = Math.max(10, 16 * S);
    const top = this.rodY + 10 * S;
    const tear = this.sp("teardrop");
    const tearLen = (tear.h - 2 * tear.pad) * k;
    // every strand reaches the foot of the section
    const target = this.H - 6 * S - tearLen - top;
    const rand = rng(20270815);
    const beadNames = ["clear-a", "clear-b", "clear-c", "clear-a", "pink-a", "clear-b", "pink-b", "clear-c", "pink-c", "small"];
    this.strands = [];
    for (let i = 0; i < n; i++) {
      const b = x0 + i * pitch;
      const items: Item[] = [];
      let d = 0, sinceDiamond = 0, beads = 0;
      while (d < target - 40 * S) {
        const link = (7 + rand() * 7) * S;
        items.push({ kind: "link", len: link, d0: d, spacer: rand() < 0.75, phase: 0, rate: 0 });
        d += link;
        let name = beadNames[Math.floor(rand() * beadNames.length)];
        if (sinceDiamond > 6 && rand() < 0.12 && d < target * 0.75) { name = "diamond"; sinceDiamond = 0; } else sinceDiamond++;
        const s = this.sp(name);
        const len = (s.h - 2 * s.pad) * k;
        items.push({ kind: "bead", sprite: name, len, d0: d, tall: name === "diamond", phase: rand() * 100, rate: 0.35 + rand() * 0.9 });
        d += len;
        beads++;
      }
      // stretch the links a hair so every pendant hangs at the same height
      const linkTotal = items.filter((it) => it.kind === "link").reduce((a, it) => a + it.len, 0);
      const f = linkTotal > 0 ? (linkTotal + (target - d)) / linkTotal : 1;
      let acc = 0;
      for (const it of items) {
        if (it.kind === "link") it.len *= f;
        it.d0 = acc;
        acc += it.len;
      }
      items.push({ kind: "link", len: 9 * S, d0: acc, spacer: true, phase: 0, rate: 0 });
      acc += 9 * S;
      items.push({ kind: "bead", sprite: "teardrop", len: tearLen, d0: acc, tall: true, phase: rand() * 100, rate: 0.3 + rand() * 0.6 });
      acc += tearLen;
      // drawn open to the nearest side, bunched into the outer tenth of the screen
      const left = b < this.W / 2;
      // (on phones the bunches tuck partly past the edges, clear of the text)
      const gatherW = wide ? Math.max(46, this.W * 0.045) : this.W * 0.085;
      const edge = wide ? -4 * S : -6 * S;
      const rel = left ? b / (this.W / 2) : (this.W - b) / (this.W / 2);
      const tx = left ? edge + rel * gatherW : this.W - edge - rel * gatherW;
      this.strands.push({ b, shift: tx - b, phi: rand() * Math.PI * 2, items, L: acc });
      void beads;
    }
    // butterflies resting on some of the strands, never two side by side at the same height
    this.flies = [];
    let last = -3;
    for (let i = 1; i < n - 1; i++) {
      if (i - last < 2 || rand() > 0.42) continue;
      const st = this.strands[i];
      const d = st.L * (0.12 + rand() * 0.62);
      this.flies.push({ strand: i, d, scale: (0.55 + rand() * 0.45) * S, flip: rand() < 0.5, tilt: (rand() - 0.5) * 0.35, phase: rand() * 10 });
      last = i;
    }
  }

  private loop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, this.lastFrame ? (now - this.lastFrame) / 1000 : 0.016);
    this.lastFrame = now;
    this.t += dt;
    const y = window.scrollY;
    const v = (y - this.lastY) / Math.max(dt, 1e-3);
    this.lastY = y;
    this.vel += (Math.abs(v) - this.vel) * Math.min(1, dt * 4);
    this.draw();
    if (this.visible) this.raf = requestAnimationFrame(this.loop);
  };

  /** Horizontal position of the strand at depth d (CSS px below its top). */
  private xAt(st: Strand, d: number, waveA: number, idleA: number) {
    const u = d / st.L;
    const open = this.state.open;
    const lag = 0.24;
    const po = clamp01((open - lag * u) / (1 - lag));
    const e = po * po * (3 - 2 * po);
    let x = st.b + st.shift * e + st.shift * 0.12 * Math.sin(Math.PI * po) * u;
    x += idleA * Math.sin(this.t * 0.85 + st.phi + u * 1.5) * Math.pow(u, 1.3);
    x += waveA * Math.sin(st.b * 0.011 - this.t * 2.2 + u * 2.8 + st.phi * 0.2) * Math.pow(u, 1.05);
    return x;
  }

  draw() {
    const ctx = this.ctx, k = this.k, S = this.S;
    if (!this.atlas.complete || !this.W) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const open = this.state.open;
    const boost = Math.min(0.9, this.vel / 2200);
    const waveA = (this.still ? 0 : 1) * (this.W < 700 ? 26 : 36) * S * Math.min(1.4, this.state.wave + boost) * (1 - 0.55 * open);
    const idleA = this.still ? 0 : 3.2 * S * (1 + 0.6 * open);
    const top = this.rodY + 10 * S;
    const A = this.atlas;
    const glints: [number, number, number, number][] = [];

    // ------------------------------------------------ strands: wire, then crystals
    for (const st of this.strands) {
      const end = this.xAt(st, st.L, waveA, idleA);
      const anchor = this.xAt(st, 0, waveA, idleA);
      const slope = (end - anchor) / st.L;
      const lift = Math.sqrt(1 - Math.min(0.45, slope * slope));
      const Y = (d: number) => top + d * lift;
      const moving = Math.min(1, Math.abs(waveA) / (20 * S) + boost);

      // the gold wire, as one line down the strand
      ctx.beginPath();
      ctx.moveTo(anchor, top - 8 * S);
      for (let d = 0; d <= st.L; d += 10 * S) ctx.lineTo(this.xAt(st, d, waveA, idleA), Y(d));
      ctx.strokeStyle = "#b8894a";
      ctx.lineWidth = 1.35 * S;
      ctx.stroke();
      // the bail where the strand hangs from the rod
      ctx.beginPath();
      ctx.arc(anchor, top - 6 * S, 2.6 * S, 0, Math.PI * 2);
      ctx.lineWidth = 1.2 * S;
      ctx.strokeStyle = "#c99b55";
      ctx.stroke();

      for (const it of st.items) {
        const dc = it.d0 + it.len / 2;
        const xc = this.xAt(st, dc, waveA, idleA);
        if (it.kind === "link") {
          if (it.spacer) {
            const w = 4.2 * S, h = 6.4 * S;
            ctx.drawImage(this.spacer, xc - w / 2, Y(dc) - h / 2, w, h);
          }
          continue;
        }
        const s = this.sp(it.sprite!);
        const yTop = Y(it.d0);
        if (it.tall) {
          const xa = this.xAt(st, it.d0, waveA, idleA), xb = this.xAt(st, it.d0 + it.len, waveA, idleA);
          const ang = Math.atan2(xb - xa, it.len * lift);
          ctx.save();
          ctx.translate(xa, yTop);
          ctx.rotate(-ang);
          ctx.drawImage(A, s.x, s.y, s.w, s.h, -s.ax * k, -s.ay * k, s.w * k, s.h * k);
          ctx.restore();
        } else {
          ctx.drawImage(A, s.x, s.y, s.w, s.h, xc - s.ax * k, yTop - s.ay * k, s.w * k, s.h * k);
        }
        // light: a steady soft glow, and now and then a glint (more often while moving)
        const size = it.len;
        const tw = Math.sin(this.t * it.rate * (1 + 1.5 * moving) + it.phase);
        const b = Math.pow(Math.max(0, tw), 14) * (0.85 + 0.6 * moving);
        glints.push([xc, Y(dc), size, b]);
      }
    }

    // ------------------------------------------------ butterflies resting on the strands
    const bf = this.sp("butterfly");
    for (const f of this.flies) {
      const st = this.strands[f.strand];
      const x = this.xAt(st, f.d, waveA, idleA);
      const end = this.xAt(st, st.L, waveA, idleA), anchor = this.xAt(st, 0, waveA, idleA);
      const lift = Math.sqrt(1 - Math.min(0.45, ((end - anchor) / st.L) ** 2));
      const y = top + f.d * lift;
      // wings breathe a little: the butterfly is alive
      const flap = 1 - 0.07 * (0.5 + 0.5 * Math.sin(this.t * 2.4 + f.phase));
      const sc = f.scale / this.meta.scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.tilt + 0.15 * Math.sin(this.t * 0.7 + f.phase));
      ctx.scale((f.flip ? -1 : 1) * flap, 1);
      ctx.drawImage(A, bf.x, bf.y, bf.w, bf.h, -bf.ax * sc, -bf.ay * sc, bf.w * sc, bf.h * sc);
      ctx.restore();
    }

    // ------------------------------------------------ the rod and its finials, over the bails
    const rod = this.sp("rod"), fin = this.sp("finial");
    const rodH = (rod.h * k) * 0.8;
    const finW = fin.w * k * 0.8, finH = fin.h * k * 0.8;
    const rx0 = Math.max(4, finW * 0.55), rx1 = this.W - rx0;
    ctx.drawImage(A, rod.x + 1, rod.y, rod.w - 2, rod.h, rx0, this.rodY - rodH / 2, rx1 - rx0, rodH);
    ctx.drawImage(A, fin.x, fin.y, fin.w, fin.h, rx0 - finW * 0.6, this.rodY - finH / 2, finW, finH);
    ctx.save();
    ctx.translate(rx1 + finW * 0.6, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(A, fin.x, fin.y, fin.w, fin.h, 0, this.rodY - finH / 2, finW, finH);
    ctx.restore();

    // ------------------------------------------------ light on the crystals
    // (bunched to the sides, the crystals stand close: their light is kept softer there)
    const soft = 1 - 0.5 * open;
    ctx.globalCompositeOperation = "lighter";
    for (const [x, y, size, b] of glints) {
      const g = size * 1.9;
      ctx.globalAlpha = 0.065 * soft;
      ctx.drawImage(this.glow, x - g / 2, y - g / 2, g, g);
      if (b > 0.02) {
        const s = size * (0.85 + 1.25 * b);
        ctx.globalAlpha = Math.min(1, b) * (0.35 + 0.65 * soft);
        ctx.drawImage(this.glint, x - size * 0.2 - s / 2, y - size * 0.22 - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
