/**
 * The satin bow on the garden gate, drawn as two continuous ribbons (one per leaf) so it can be
 * pulled, untied and dropped like real fabric. All coordinates are gate-canvas px
 * (public/assets/gate/manifest.json: the photo plus 144 px of mirrored pillar each side).
 *
 * Each ribbon runs stile → strap → knot → loop → knot → tail. While the bow is tied its shape is
 * a function of how far each loop has been pulled through the knot (`loop` 1 → 0): a loop's
 * length is fed into its tail, so pulling a loop closed draws the tail down. Once the knot gives,
 * the ribbons become verlet ropes: gravity, a little air, and the stiffness of satin.
 */

type P = { x: number; y: number };
/** the part of the gate canvas the screen shows, in canvas px */
export type View = { x0: number; y0: number; x1: number; y1: number };
type Section = 0 | 1 | 2; // strap, loop, tail

const X0 = 660.5; // the gate's centre line (between the meeting posts)
const KNOT: P = { x: 642, y: 846 };

/** The left ribbon, tied (the right one is its mirror image). */
const STRAP: P[] = [{ x: 310, y: 846 }, { x: 470, y: 846 }, { x: 628, y: 846 }];
const LOOP: P[] = [
  { x: 640, y: 832 }, { x: 604, y: 808 }, { x: 560, y: 800 }, { x: 526, y: 810 }, { x: 512, y: 846 },
  { x: 526, y: 882 }, { x: 560, y: 892 }, { x: 604, y: 886 }, { x: 642, y: 862 },
];
const TAIL: P[] = [
  { x: 645, y: 872 }, { x: 633, y: 918 }, { x: 608, y: 996 }, { x: 575, y: 1086 }, { x: 542, y: 1158 }, { x: 512, y: 1212 },
];
const WIDTH: Record<Section, number> = { 0: 94, 1: 68, 2: 80 };
const H = 7; // rest spacing between ribbon points

const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);

/** A dense Catmull-Rom polyline through the control points. */
function spline(pts: P[], per = 10): P[] {
  if (pts.length < 3) {
    const out: P[] = [];
    for (let i = 0; i < pts.length - 1; i++)
      for (let k = 0; k < per; k++) {
        const t = k / per;
        out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });
      }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const length = (poly: P[]) => poly.reduce((s, p, i) => (i ? s + dist(poly[i - 1], p) : 0), 0);

const STRAP_POLY = spline(STRAP), LOOP_POLY = spline(LOOP, 14), TAIL_POLY = spline(TAIL, 12);
const L_STRAP = length(STRAP_POLY), L_LOOP = length(LOOP_POLY), L_TAIL = length(TAIL_POLY);
const L_TOTAL = L_STRAP + L_LOOP + L_TAIL;
const N = Math.round(L_TOTAL / H) + 1;

/** Evenly spaced points along strap + loop + tail, with each point's section. */
function sampleTied(side: -1 | 1, loop: number, sway: number) {
  const r = Math.max(0, Math.min(1, loop));
  const scale = (pts: P[], o: P, f: number) => pts.map((p) => ({ x: o.x + (p.x - o.x) * f, y: o.y + (p.y - o.y) * f }));
  const loopPoly = scale(LOOP_POLY, KNOT, r);
  // the loop's length goes into the tail: the tail grows along its own line
  const tailLen = L_TAIL + (1 - r) * L_LOOP;
  const t0 = TAIL_POLY[0];
  let tailPoly = scale(TAIL_POLY, t0, tailLen / L_TAIL);
  // a breath of air through the gate stirs the tail (more towards its end)
  if (sway) tailPoly = tailPoly.map((p) => ({ x: p.x + sway * ((p.y - t0.y) / 340) ** 1.5 * 14, y: p.y }));
  const parts: [P[], Section][] = [[STRAP_POLY, 0], [loopPoly, 1], [tailPoly, 2]];
  const pts: P[] = [], sec: Section[] = [];
  let want = 0, acc = 0;
  for (const [poly, s] of parts) {
    for (let i = 1; i < poly.length; i++) {
      const a = poly[i - 1], b = poly[i], d = dist(a, b);
      while (want <= acc + d + 1e-6 && pts.length < N) {
        const t = d ? (want - acc) / d : 0;
        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        sec.push(s);
        want += H;
      }
      acc += d;
    }
  }
  while (pts.length < N) { pts.push({ ...pts[pts.length - 1] }); sec.push(2); }
  if (side === 1) for (const p of pts) p.x = 2 * X0 - p.x;
  return { pts, sec };
}

/** The satin's tilt across its width at each point while tied: loops turn their face away. */
function tiedTwist(sec: Section[], i0: number[]) {
  return sec.map((s, i) => {
    if (s === 1) {
      // the ribbon turns a little edge-on where it folds back at the loop's tip
      return 0.18 + 0.5 * Math.sin(Math.PI * i0[i]) ** 2;
    }
    return s === 2 ? 0.16 : 0.06;
  });
}

class Rope {
  x = new Float32Array(N); y = new Float32Array(N);
  px = new Float32Array(N); py = new Float32Array(N);
  tw = new Float32Array(N); tw0 = new Float32Array(N);
  w = new Float32Array(N);
  sec: Section[] = [];
  pinned = true;
  pin = { x: 0, y: 0 };
  constructor(public side: -1 | 1) {}

  setTied(loop: number, sway: number) {
    const { pts, sec } = sampleTied(this.side, loop, sway);
    this.sec = sec;
    // where each loop point lies around its loop (for the face-turn)
    let first = sec.indexOf(1), last = sec.lastIndexOf(1);
    if (first < 0) { first = 0; last = 0; }
    const u = sec.map((_, i) => (last > first ? (i - first) / (last - first) : 0));
    const tw = tiedTwist(sec, u);
    for (let i = 0; i < N; i++) {
      this.px[i] = this.x[i]; this.py[i] = this.y[i];
      this.x[i] = pts[i].x; this.y[i] = pts[i].y;
      this.tw[i] = this.tw0[i] = tw[i];
      this.w[i] = WIDTH[sec[i]] * (sec[i] === 2 ? 1 - 0.12 * Math.min(1, (i - sec.indexOf(2)) / 60) : 1);
    }
  }

  /** The knot gives: velocities come from the last two tied frames, plus a push to the side. */
  release(push: number) {
    for (let i = 0; i < N; i++) {
      const out = this.sec[i] === 0 ? (i / Math.max(1, this.sec.indexOf(1))) : 1;
      // keep the downward pull the ribbon already had, and send it out towards its own side
      this.px[i] = this.x[i] - this.side * push * out;
    }
  }

  bend = 0;
  step(dt: number, t: number, air: number) {
    const g = 1500, damp = Math.pow(0.975, dt * 60);
    if (this.pinned) {
      this.px[0] = this.x[0]; this.py[0] = this.y[0];
      this.x[0] = this.pin.x; this.y[0] = this.pin.y;
    }
    for (let i = 0; i < N; i++) {
      if (i === 0 && this.pinned) continue;
      const vx = (this.x[i] - this.px[i]) * damp, vy = (this.y[i] - this.py[i]) * damp;
      this.px[i] = this.x[i]; this.py[i] = this.y[i];
      const gust = air * Math.sin(t * 2.3 + i * 0.04) * 340;
      this.x[i] += vx + (gust + this.side * air * 180) * dt * dt;
      this.y[i] += vy + g * dt * dt;
    }
    for (let it = 0; it < 14; it++) {
      for (let i = 0; i < N - 1; i++) this.link(i, i + 1, H, 1);
      for (let i = 0; i < N - 2; i++) this.link(i, i + 2, H * 1.9, this.bend, true);
    }
  }

  private link(a: number, b: number, rest: number, k: number, onlyPush = false) {
    const dx = this.x[b] - this.x[a], dy = this.y[b] - this.y[a];
    const d = Math.hypot(dx, dy) || 1e-4;
    if (onlyPush && d >= rest) return; // satin bends, but not sharply
    const diff = ((d - rest) / d) * 0.5 * k;
    const fa = a === 0 && this.pinned ? 0 : 1;
    const fb = fa ? 1 : 2;
    this.x[a] += dx * diff * fa; this.y[a] += dy * diff * fa;
    this.x[b] -= dx * diff * fb; this.y[b] -= dy * diff * fb;
  }

  /** Free-fall twist: rolling waves run along the ribbon as it drops. */
  spin(t: number, amount: number) {
    for (let i = 0; i < N; i++) this.tw[i] = this.tw0[i] * (1 - amount) + amount * (1.1 * Math.sin(i * 0.085 - t * 4.2) + t * 0.5);
  }

  /** true once every point is well outside the visible rectangle */
  gone(v: View) {
    const m = 120;
    for (let i = 0; i < N; i++)
      if (this.x[i] > v.x0 - m && this.x[i] < v.x1 + m && this.y[i] > v.y0 - m && this.y[i] < v.y1 + m) return false;
    return true;
  }
}

/* ------------------------------------------------------------------ drawing */
// satin colours sampled from the photographed bow
const FRONT = { hi: [254, 252, 247], mid: [242, 237, 228], lo: [229, 222, 210] };
const BACK = { hi: [233, 226, 213], mid: [221, 213, 199], lo: [208, 199, 184] };
const rgb = (c: number[], f: number) => `rgb(${Math.min(255, c[0] * f) | 0},${Math.min(255, c[1] * f) | 0},${Math.min(255, c[2] * f) | 0})`;

function edges(r: Rope) {
  const ex = new Float32Array(N * 2), ey = new Float32Array(N * 2), c = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    let tx = r.x[b] - r.x[a], ty = r.y[b] - r.y[a];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const cs = Math.cos(r.tw[i]);
    c[i] = cs;
    const hw = (r.w[i] / 2) * (Math.abs(cs) < 0.06 ? 0.06 * Math.sign(cs || 1) : cs);
    ex[2 * i] = r.x[i] - ty * hw; ey[2 * i] = r.y[i] + tx * hw;
    ex[2 * i + 1] = r.x[i] + ty * hw; ey[2 * i + 1] = r.y[i] - tx * hw;
  }
  return { ex, ey, c };
}

function drawRope(ctx: CanvasRenderingContext2D, r: Rope, pass: Section | "shadow", E: ReturnType<typeof edges>) {
  const { ex, ey, c } = E;
  const last = N - 1;
  if (pass === "shadow") {
    ctx.beginPath();
    for (let i = 0; i < last; i++) {
      ctx.moveTo(ex[2 * i], ey[2 * i]); ctx.lineTo(ex[2 * i + 1], ey[2 * i + 1]);
      ctx.lineTo(ex[2 * i + 3], ey[2 * i + 3]); ctx.lineTo(ex[2 * i + 2], ey[2 * i + 2]); ctx.closePath();
    }
    ctx.fill();
    return;
  }
  for (let i = 0; i < last; i++) {
    if (r.sec[i] !== pass) continue;
    const cs = (c[i] + c[i + 1]) / 2;
    const face = cs >= 0 ? FRONT : BACK;
    // satin catches the light by how squarely it faces you, and in long soft folds
    const lit = 0.9 + 0.1 * Math.min(1, Math.abs(cs)) + 0.035 * Math.sin(i * 0.07 + r.tw[i] * 2);
    // the sheen wanders across the width as the ribbon turns and folds
    const sheen = 0.4 + 0.2 * Math.sin(r.tw[i] * 1.6 + i * 0.05);
    const g = ctx.createLinearGradient(ex[2 * i], ey[2 * i], ex[2 * i + 1], ey[2 * i + 1]);
    g.addColorStop(0, rgb(face.lo, lit));
    g.addColorStop(0.035, rgb(face.mid, lit));
    g.addColorStop(Math.max(0.15, Math.min(0.85, sheen)), rgb(face.hi, lit));
    g.addColorStop(0.965, rgb(face.mid, lit * 0.99));
    g.addColorStop(1, rgb(face.lo, lit * 0.98));
    ctx.fillStyle = g;
    ctx.beginPath();
    // overlap neighbours a hair so no seam shows between quads
    const ox = (r.x[i + 1] - r.x[i]) * 0.08, oy = (r.y[i + 1] - r.y[i]) * 0.08;
    ctx.moveTo(ex[2 * i] - ox, ey[2 * i] - oy);
    ctx.lineTo(ex[2 * i + 1] - ox, ey[2 * i + 1] - oy);
    if (i === last - 1 && r.sec[i] === 2) {
      // the tail's end is cut in a dovetail
      const tx = r.x[last] - r.x[last - 1], ty = r.y[last] - r.y[last - 1];
      const tl = Math.hypot(tx, ty) || 1;
      ctx.lineTo(ex[2 * last + 1], ey[2 * last + 1]);
      ctx.lineTo(r.x[last] - (tx / tl) * r.w[last] * 0.32, r.y[last] - (ty / tl) * r.w[last] * 0.32);
      ctx.lineTo(ex[2 * last], ey[2 * last]);
    } else {
      ctx.lineTo(ex[2 * i + 3] + ox, ey[2 * i + 3] + oy);
      ctx.lineTo(ex[2 * i + 2] + ox, ey[2 * i + 2] + oy);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ the bow */
export type BowState = {
  /** 1 tied … 0 pulled through, per loop (left, right) */
  loopL: number; loopR: number;
  /** a breath of air on the tails while tied */
  sway: number;
};

export class Bow {
  ropes: [Rope, Rope] = [new Rope(-1), new Rope(1)];
  free = false;
  done = false;
  private t = 0;
  private freeAt = 0;
  private pinFrom: P[] = [];
  /** when each half starts being drawn away (s after the knot gives), and for how long */
  private draw0: [number, number] = [0.28, 0];
  private drawFor = 2.4;

  constructor(state: BowState = { loopL: 1, loopR: 1, sway: 0 }) {
    this.tie(state);
    this.tie(state); // twice, so the "previous" positions match (no initial velocity)
  }

  tie(s: BowState) {
    if (this.free) return;
    this.ropes[0].setTied(s.loopL, s.sway);
    this.ropes[1].setTied(s.loopR, -s.sway);
  }

  /** The knot gives way: from here the ribbons fall by themselves. */
  release() {
    if (this.free) return;
    this.free = true;
    this.freeAt = this.t;
    this.ropes.forEach((r) => {
      r.release(0.6);
      this.pinFrom.push({ x: r.x[0], y: r.y[0] });
    });
  }

  /** Advance the falling ribbons by dt seconds (scaled by the caller for a hurried opening). */
  advance(dt: number, view: View) {
    this.t += dt;
    if (!this.free || this.done) return;
    const since = this.t - this.freeAt;
    const air = Math.min(1, since / 0.6);
    this.ropes.forEach((r, k) => {
      // the stile end slides out past the pillar, slowly at first, then away
      const u = Math.max(0, (since - this.draw0[k]) / this.drawFor);
      if (u >= 1) r.pinned = false;
      else {
        const e = u * u * (1.6 - 0.6 * u);
        const o = this.pinFrom[k];
        r.pin.x = o.x + r.side * 2600 * e;
        r.pin.y = o.y - 50 * Math.sin(Math.PI * u) + 160 * e;
      }
      // the fold at the knot eases open instead of snapping
      r.bend = 0.1 * Math.min(1, since / 0.5);
      const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let s = 0; s < sub; s++) r.step(dt / sub, this.t, air);
      r.spin(since, Math.min(1, since / 0.9));
    });
    if (this.ropes.every((r) => r.gone(view))) this.done = true;
  }

  /** Draws both ribbons, with a soft shadow on the gate behind them. */
  draw(ctx: CanvasRenderingContext2D, k: number) {
    const E = this.ropes.map(edges);
    ctx.save();
    // the shadow: drawn far off-canvas, cast back by the shadow offset
    ctx.shadowColor = "rgba(46, 40, 28, 0.17)";
    ctx.shadowBlur = 9 * k;
    ctx.shadowOffsetX = 10000 * k + 4 * k;
    ctx.shadowOffsetY = 6 * k;
    ctx.translate(-10000, 0);
    ctx.fillStyle = "#000";
    this.ropes.forEach((r, i) => drawRope(ctx, r, "shadow", E[i]));
    ctx.restore();
    // tails behind, then the straps, then the loops on top
    for (const pass of [2, 0, 1] as Section[]) this.ropes.forEach((r, i) => drawRope(ctx, r, pass, E[i]));
  }
}
