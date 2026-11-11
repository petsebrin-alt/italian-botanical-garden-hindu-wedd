/**
 * The satin bow on the garden gate: one continuous ivory satin ribbon, modelled and lit in 3D.
 *
 * Each half of the bow is a single ribbon: from its stile across the leaf (the strap), into the
 * knot, out round its loop and back, and down into its tail. A short band wraps the knot, and
 * the photographed posy of flowers sits on top (tools/build_gate.py cuts it from the photo).
 *
 * The ribbon is drawn with WebGL as a strip whose surface normal, thread direction and width
 * come from its real shape, so the satin catches the light the way fabric does: a soft rounded
 * cross-section, a sheen running along the threads, gathered pleats where it is pinched into
 * the knot, and a darker back where it turns over.
 *
 * Untying: while the bow is tied, its shape follows a few values (how far each loop has been
 * pulled through the knot, how far the knot has slid, how much it turns). Once the knot gives,
 * each half becomes a soft rope (gravity, air, satin's stiffness) that twists and untwists as
 * it swings away and is drawn down off the gate.
 *
 * Coordinates are gate-canvas px (manifest.json: the photo plus the mirrored pillar faces),
 * x right, y down, z towards the viewer.
 */

type V3 = [number, number, number];
export type View = { x0: number; y0: number; x1: number; y1: number };
export type Box = { x: number; y: number; w: number; h: number };

const X0 = 660.5; // the gate's centre line, between the meeting posts
const KX = 661, KY = 848; // the knot
const STILE = 318; // where the left strap is tied round the stile (the right one mirrors it)
const HALF_W = 48; // half the ribbon's width
const SPACING = 6; // rope spacing once the knot gives
const TAIL: V3[] = [[14, 16, 16], [36, 72, 4], [82, 182, -26], [128, 292, -36], [156, 372, -40]];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** One point of a ribbon strip. `b` is the width direction; tails give a twist angle instead. */
type Sample = { p: V3; b?: V3; tw?: number; hw: number; ao: number; pleat: number; puff: number; end?: number; wob: number };
type Strip = { pts: Sample[]; s0: number };

export type BowState = {
  /** 1 tied … 0 pulled through the knot, per loop */
  loopL: number; loopR: number;
  /** a breath of air on the tails */
  sway: number;
  /** how far the knot has slid down as it loosens (px) */
  drop: number;
  /** the knot turning as it loosens (radians) */
  wobble: number;
  /** a twist running down the tails */
  twist: number;
  /** the band round the knot: 1 wrapped … 0 unwrapped */
  open: number;
};
export const TIED: BowState = { loopL: 1, loopR: 1, sway: 0, drop: 0, wobble: 0, twist: 0, open: 1 };

/* ------------------------------------------------------------------ the tied bow */
function catmull(pts: V3[], per: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((c) =>
        0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3),
      ) as V3);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function strap(sgn: -1 | 1, st: BowState): Sample[] {
  const xa = sgn < 0 ? STILE : 2 * X0 - STILE;
  const xb = KX + sgn * 22;
  const n = 44, out: Sample[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const near = smooth(0.7, 1, t); // gathered into the knot
    out.push({
      p: [xa + (xb - xa) * t, KY + 2.5 * Math.sin(Math.PI * t) + st.drop * near * 0.7, -50 + 8 * near],
      b: [0, 1, 0],
      hw: HALF_W - 22 * near,
      // tucked round the stile at one end, shaded by the knot at the other
      ao: (1 - 0.3 * near) * (1 - 0.2 * smooth(0.45, 0.62, t)) * (0.55 + 0.45 * smooth(0, 0.06, t)),
      pleat: near,
      puff: 0.22,
      wob: near,
    });
  }
  return out;
}

/** Loop length shrinks as it is pulled through; its outer end lifts a little. */
function loop(sgn: -1 | 1, f: number, st: BowState): Sample[] {
  const n = 60, out: Sample[] = [];
  const lx = 6 + 160 * f, d = 2 + 40 * Math.pow(f, 0.8), hwMax = 15 + 43 * Math.pow(f, 0.6);
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = Math.PI * t, sa = Math.sin(a);
    const pinch = 1 - smooth(0, 0.22, Math.min(t, 1 - t));
    out.push({
      p: [KX + sgn * (16 + lx * Math.pow(sa, 0.75)), KY - 12 * f - 5 * sa * f + 7 * t * f + st.drop, 6 + d * Math.cos(a)],
      b: [0, 1, 0],
      hw: 15 + (hwMax - 15) * Math.pow(sa, 0.45) * (1 - 0.2 * Math.pow(sa, 6)),
      // the inside of the loop (its back layer) sits in the loop's own shadow
      ao: (0.66 + 0.34 * Math.sqrt(sa)) * (1 - 0.45 * smooth(0.5, 0.62, t)),
      pleat: pinch,
      puff: 0.55,
      wob: 1,
    });
  }
  // the loop leans outwards and up from the knot
  return rotate(out, -sgn * 0.09 * f, KX, KY + st.drop, 1);
}

function tail(sgn: -1 | 1, f: number, st: BowState): Sample[] {
  const grow = 1 + 0.3 * (1 - f); // the pulled loop feeds the tail
  const c0 = TAIL[0];
  const ctrl = TAIL.map(([dx, dy, z]) => [c0[0] + (dx - c0[0]) * grow, c0[1] + (dy - c0[1]) * grow, z] as V3);
  const curve = catmull(ctrl, 18);
  // resample by length
  const cum = [0];
  for (let i = 1; i < curve.length; i++) cum.push(cum[i - 1] + Math.hypot(curve[i][0] - curve[i - 1][0], curve[i][1] - curve[i - 1][1], curve[i][2] - curve[i - 1][2]));
  const L = cum[cum.length - 1];
  const n = 72, out: Sample[] = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * L;
    while (j < cum.length - 1 && cum[j] < s) j++;
    const u = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
    const a = curve[j - 1], b = curve[j];
    const t = i / n;
    const dx = a[0] + (b[0] - a[0]) * u, dy = a[1] + (b[1] - a[1]) * u, z = a[2] + (b[2] - a[2]) * u;
    const top = smooth(0, 70, s);
    out.push({
      p: [KX + sgn * dx + st.sway * 16 * Math.pow(t, 1.6), KY + dy + st.drop, z],
      tw: -0.4 + 0.85 * Math.sin(Math.PI * t * 1.05) + st.twist * Math.sin(Math.PI * t * 1.6 + 0.4) * t,
      hw: 20 + (HALF_W - 20) * top,
      ao: 0.6 + 0.4 * top,
      pleat: 1 - top,
      puff: 0.28,
      end: L - s,
      wob: 1 - top * 0.8,
    });
  }
  return out;
}

function knotBand(st: BowState): Sample[] {
  const n = 28, out: Sample[] = [];
  const span = 1.8 * st.open;
  for (let i = 0; i <= n; i++) {
    const ph = -span + (2 * span * i) / n;
    out.push({
      p: [KX, KY + st.drop + 25 * Math.sin(ph), 24 + 20 * Math.cos(ph)],
      b: [1, 0, 0],
      hw: 24 * (0.35 + 0.65 * st.open) * (1 - 0.1 * (ph / 1.8) ** 2),
      ao: 0.74 + 0.26 * Math.cos(ph),
      pleat: 0.5,
      puff: 0.45,
      wob: 1,
    });
  }
  return out;
}

/** Turns samples in the gate's plane about (cx, cy), each by `angle × wob`. */
function rotate(pts: Sample[], angle: number, cx: number, cy: number, weight = -1): Sample[] {
  if (!angle) return pts;
  for (const s of pts) {
    const a = angle * (weight >= 0 ? weight : s.wob), c = Math.cos(a), si = Math.sin(a);
    const x = s.p[0] - cx, y = s.p[1] - cy;
    s.p = [cx + x * c - y * si, cy + x * si + y * c, s.p[2]];
    if (s.b) s.b = [s.b[0] * c - s.b[1] * si, s.b[0] * si + s.b[1] * c, s.b[2]];
  }
  return pts;
}

/* ------------------------------------------------------------------ once the knot gives */
class Rope {
  n: number;
  x: Float32Array; y: Float32Array; z: Float32Array; px: Float32Array; py: Float32Array;
  s: Float32Array; hw: Float32Array; ao: Float32Array; pleat: Float32Array; puff: Float32Array; tw0: Float32Array; tw: Float32Array;
  pinned = true;
  pin = { x: 0, y: 0 };
  from = { x: 0, y: 0 };

  /** Resamples the tied half (strap → loop → tail) into evenly spaced rope points. */
  constructor(public side: -1 | 1, strips: Strip[]) {
    const all: (Sample & { m: number })[] = [];
    for (const st of strips) {
      let acc = st.s0;
      st.pts.forEach((p, i) => {
        if (i) acc += Math.hypot(p.p[0] - st.pts[i - 1].p[0], p.p[1] - st.pts[i - 1].p[1], p.p[2] - st.pts[i - 1].p[2]);
        all.push({ ...p, m: acc });
      });
    }
    const cum = [0];
    for (let i = 1; i < all.length; i++) cum.push(cum[i - 1] + Math.hypot(all[i].p[0] - all[i - 1].p[0], all[i].p[1] - all[i - 1].p[1], all[i].p[2] - all[i - 1].p[2]));
    const L = cum[cum.length - 1];
    this.n = Math.floor(L / SPACING) + 1;
    const n = this.n;
    this.x = new Float32Array(n); this.y = new Float32Array(n); this.z = new Float32Array(n);
    this.px = new Float32Array(n); this.py = new Float32Array(n);
    this.s = new Float32Array(n); this.hw = new Float32Array(n); this.ao = new Float32Array(n); this.pleat = new Float32Array(n); this.puff = new Float32Array(n);
    this.tw0 = new Float32Array(n); this.tw = new Float32Array(n);
    const bs: V3[] = [];
    let j = 1;
    for (let i = 0; i < n; i++) {
      const want = i * SPACING;
      while (j < all.length - 1 && cum[j] < want) j++;
      const a = all[j - 1], b = all[j], u = Math.min(1, (want - cum[j - 1]) / (cum[j] - cum[j - 1] || 1));
      const lerp = (p: number, q: number) => p + (q - p) * u;
      this.x[i] = this.px[i] = lerp(a.p[0], b.p[0]);
      this.y[i] = this.py[i] = lerp(a.p[1], b.p[1]);
      this.z[i] = lerp(a.p[2], b.p[2]);
      this.s[i] = lerp(a.m, b.m);
      this.hw[i] = lerp(a.hw, b.hw); this.ao[i] = lerp(a.ao, b.ao); this.pleat[i] = lerp(a.pleat, b.pleat); this.puff[i] = lerp(a.puff, b.puff);
      bs.push((u < 0.5 ? a : b).b ?? [NaN, (u < 0.5 ? a : b).tw ?? 0, 0]);
    }
    // each point's twist about the rope, continuous along it (B and −B are the same ribbon)
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const T = this.tangent(i);
      const B0 = norm([-T[1], T[0], 0]);
      const Zp = norm(cross(T, B0));
      const b = bs[i];
      let th = Number.isNaN(b[0]) ? b[1] : Math.atan2(dot(b, Zp), dot(b, B0));
      while (th - prev > Math.PI / 2) th -= Math.PI;
      while (th - prev < -Math.PI / 2) th += Math.PI;
      this.tw0[i] = this.tw[i] = prev = th;
    }
    this.from = { x: this.x[0], y: this.y[0] };
    this.pin = { ...this.from };
  }

  tangent(i: number): V3 {
    const a = Math.max(0, i - 1), b = Math.min(this.n - 1, i + 1);
    return norm([this.x[b] - this.x[a], this.y[b] - this.y[a], this.z[b] - this.z[a]]);
  }

  step(dt: number, t: number, air: number) {
    const g = 1150, damp = Math.pow(0.968, dt * 60);
    if (this.pinned) {
      this.px[0] = this.x[0]; this.py[0] = this.y[0];
      this.x[0] = this.pin.x; this.y[0] = this.pin.y;
    }
    for (let i = this.pinned ? 1 : 0; i < this.n; i++) {
      const vx = (this.x[i] - this.px[i]) * damp, vy = (this.y[i] - this.py[i]) * damp;
      this.px[i] = this.x[i]; this.py[i] = this.y[i];
      const gust = air * Math.sin(t * 1.9 + i * 0.03) * 260;
      this.x[i] += vx + (gust + this.side * air * 120) * dt * dt;
      this.y[i] += vy + g * dt * dt;
    }
    for (let it = 0; it < 14; it++) {
      for (let i = 0; i < this.n - 1; i++) this.link(i, i + 1, SPACING, 1);
      for (let i = 0; i < this.n - 2; i++) this.link(i, i + 2, SPACING * 1.92, 0.14, true);
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

  /** After the knot: pleats and the knot's shadow ease out, the ribbon twists and untwists. */
  relax(dt: number, tau: number) {
    const k = 1 - Math.exp(-dt * 2.6);
    // one long, slow twist that winds along each half and unwinds again, and a gentle wave
    const roll = 1.5 * Math.sin(1.25 * tau) * Math.exp(-tau / 2.8);
    const amp = 0.32 * smooth(0, 1, tau);
    const keep = Math.exp(-tau / 0.8);
    for (let i = 0; i < this.n; i++) {
      this.hw[i] += (HALF_W - this.hw[i]) * k;
      this.ao[i] += (1 - this.ao[i]) * k;
      this.pleat[i] += (0 - this.pleat[i]) * k;
      this.puff[i] += (0.07 - this.puff[i]) * k; // loose satin lies flat
      this.z[i] += (8 - this.z[i]) * k * 0.6;
      const r = i / (this.n - 1);
      this.tw[i] = this.tw0[i] * keep + roll * smooth(0.15, 1, r) + amp * Math.sin(0.011 * this.s[i] - 1.8 * tau);
    }
  }

  gone(v: View) {
    const m = 120;
    for (let i = 0; i < this.n; i++)
      if (this.x[i] > v.x0 - m && this.x[i] < v.x1 + m && this.y[i] > v.y0 - m && this.y[i] < v.y1 + m) return false;
    return true;
  }
}

/* ------------------------------------------------------------------ the bow */
type Geometry = { P: V3[]; T: V3[]; B: V3[]; hw: number[]; ao: number[]; pleat: number[]; puff: number[]; s: number[]; end: number[] };

export class Bow {
  free = false;
  done = false;
  ropes: Rope[] = [];
  private state: BowState = { ...TIED };
  private t = 0;
  private freeAt = 0;

  tie(s: BowState) {
    if (!this.free) this.state = { ...s };
  }

  /** The tied bow's strips (or, once free, nothing: the ropes are drawn instead). */
  strips(): Strip[] {
    const st = this.state;
    const out: Strip[] = [];
    for (const sgn of [-1, 1] as const) {
      const f = sgn < 0 ? st.loopL : st.loopR;
      const off = sgn < 0 ? 0 : 3000;
      const cx = KX, cy = KY + st.drop;
      out.push({ pts: rotate(strap(sgn, st), st.wobble, cx, cy), s0: off });
      out.push({ pts: rotate(loop(sgn, f, st), st.wobble, cx, cy), s0: off + 400 });
      out.push({ pts: rotate(tail(sgn, f, st), st.wobble, cx, cy), s0: off + 900 });
    }
    if (st.open > 0.02) out.push({ pts: rotate(knotBand(st), st.wobble, KX, KY + st.drop), s0: 6000 });
    return out;
  }

  /** The knot gives way: each half becomes one rope, strap through loop to tail. */
  release() {
    if (this.free) return;
    const s = this.strips();
    this.ropes = [new Rope(-1, [s[0], s[2]]), new Rope(1, [s[3], s[5]])];
    // the knot's ends part a little as it opens
    for (const r of this.ropes) {
      for (let i = 0; i < r.n; i++) {
        const near = Math.exp(-Math.abs(r.x[i] - KX) / 60);
        r.px[i] = r.x[i] - r.side * 0.5 * near;
      }
    }
    this.free = true;
    this.freeAt = this.t;
  }

  advance(dt: number, view: View) {
    this.t += dt;
    if (!this.free || this.done) return;
    const tau = this.t - this.freeAt;
    const air = smooth(0, 0.8, tau);
    for (const r of this.ropes) {
      // held at the stile while the halves swing down, then drawn down and away along it
      const u = Math.max(0, (tau - 0.55) / 2.3);
      if (u >= 1) r.pinned = false;
      else {
        const e = u * u * (3 - 2 * u);
        r.pin.x = r.from.x + r.side * 160 * e * e;
        r.pin.y = r.from.y + 1100 * e;
      }
      const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let k = 0; k < sub; k++) r.step(dt / sub, this.t, air);
      r.relax(dt, tau);
    }
    if (this.ropes.every((r) => r.gone(view))) this.done = true;
  }

  /** Strips ready to draw: points with position, thread direction, width direction and the rest. */
  geometry(): Geometry[] {
    const out: Geometry[] = [];
    if (!this.free) {
      for (const st of this.strips()) {
        const pts = st.pts, n = pts.length;
        const P = pts.map((p) => p.p), T: V3[] = [], B: V3[] = [], s: number[] = [];
        let acc = st.s0;
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(n - 1, i + 1)].p;
          const t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
          T.push(t);
          if (i) acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]);
          s.push(acc);
          const p = pts[i];
          if (p.b) B.push(p.b);
          else {
            const B0 = norm([-t[1], t[0], 0]), Zp = norm(cross(t, B0)), th = p.tw ?? 0;
            B.push(norm([B0[0] * Math.cos(th) + Zp[0] * Math.sin(th), B0[1] * Math.cos(th) + Zp[1] * Math.sin(th), B0[2] * Math.cos(th) + Zp[2] * Math.sin(th)]));
          }
        }
        out.push({ P, T, B, s, hw: pts.map((p) => p.hw), ao: pts.map((p) => p.ao), pleat: pts.map((p) => p.pleat), puff: pts.map((p) => p.puff), end: pts.map((p) => p.end ?? 1e4) });
      }
      return out;
    }
    if (this.done) return out;
    for (const r of this.ropes) {
      const P: V3[] = [], T: V3[] = [], B: V3[] = [], end: number[] = [];
      for (let i = 0; i < r.n; i++) {
        const t = r.tangent(i);
        const B0 = norm([-t[1], t[0], 0]), Zp = norm(cross(t, B0)), th = r.tw[i];
        P.push([r.x[i], r.y[i], r.z[i]]);
        T.push(t);
        B.push(norm([B0[0] * Math.cos(th) + Zp[0] * Math.sin(th), B0[1] * Math.cos(th) + Zp[1] * Math.sin(th), B0[2] * Math.cos(th) + Zp[2] * Math.sin(th)]));
        end.push((r.n - 1 - i) * SPACING);
      }
      out.push({ P, T, B, end, s: Array.from(r.s), hw: Array.from(r.hw), ao: Array.from(r.ao), pleat: Array.from(r.pleat), puff: Array.from(r.puff) });
    }
    return out;
  }
}

/* ------------------------------------------------------------------ drawing (WebGL) */
const VS = `
attribute vec3 a_p; attribute vec3 a_t; attribute vec3 a_b; attribute vec3 a_uv; attribute vec3 a_x;
uniform vec3 u_map; uniform vec2 u_size;
varying vec3 v_n; varying vec3 v_t; varying vec3 v_b; varying vec3 v_uv; varying vec3 v_x;
void main() {
  vec2 px = a_p.xy * u_map.x + u_map.yz;
  gl_Position = vec4((px / u_size * 2.0 - 1.0) * vec2(1.0, -1.0), -a_p.z / 400.0, 1.0);
  v_t = a_t; v_b = a_b; v_n = cross(a_t, a_b); v_uv = a_uv; v_x = a_x;
}`;
const FS = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform float u_alpha;
varying vec3 v_n; varying vec3 v_t; varying vec3 v_b; varying vec3 v_uv; varying vec3 v_x;
void main() {
  float u = v_uv.x, s = v_uv.y, puff = v_uv.z;
  float ao = v_x.x, pleat = v_x.y, toEnd = v_x.z;
  // the tail ends are cut in a dovetail
  float a = 1.0;
  if (toEnd < 60.0) {
    float d = toEnd - 30.0 * (1.0 - abs(u));
    a = clamp(d / max(fwidth(d), 1e-3) + 0.5, 0.0, 1.0);
    if (a <= 0.0) discard;
  }
  vec3 T = normalize(v_t), B = normalize(v_b), N0 = normalize(v_n);
  float back = N0.z < 0.0 ? 1.0 : 0.0;
  if (N0.z < 0.0) N0 = -N0;
  // satin's soft rounded cross-section, gathered pleats near the knot, and faint creases
  float bend = u * puff
    + pleat * 0.55 * sin(u * 7.5 + s * 0.015)
    + 0.08 * sin(s * 0.031 + u * 1.3) + 0.05 * sin(s * 0.073 - u * 2.1) + 0.03 * sin(s * 0.15 + u * 3.0);
  vec3 N = normalize(N0 + B * bend);
  B = normalize(B - N * dot(N, B));
  T = normalize(cross(B, N));

  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L1 = normalize(vec3(-0.42, -0.62, 0.66)); // the sun, from the upper left
  vec3 L2 = normalize(vec3(0.6, -0.05, 0.8));    // soft light off the white gate
  // ivory satin, its back a shade deeper
  vec3 alb = mix(vec3(0.975, 0.945, 0.885), vec3(0.94, 0.9, 0.835), back);
  float d1 = max(dot(N, L1), 0.0), d2 = max(dot(N, L2), 0.0);
  float sky = 0.5 - 0.5 * N.y;
  vec3 amb = mix(vec3(0.3, 0.29, 0.28), vec3(0.33, 0.35, 0.38), sky);
  vec3 col = alb * (amb * ao + d1 * vec3(0.78, 0.74, 0.66) * mix(0.5, 1.0, ao) + d2 * vec3(0.12, 0.125, 0.14));
  // the sheen: a soft lobe stretched along the threads (Ward), and a broad glow
  vec3 H = normalize(L1 + V);
  float nh = max(dot(N, H), 1e-3);
  float th = dot(H, T) / 0.5, bh = dot(H, B) / 0.3;
  float sheen = exp(-(th * th + bh * bh) / (nh * nh)) * 0.26 + pow(nh, 6.0) * 0.12;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.05;
  col += vec3(1.0, 0.975, 0.93) * (sheen * d1 + rim) * ao;
  // a hair darker at the woven edges
  col *= mix(0.9, 1.0, smoothstep(0.0, 0.06, 1.0 - abs(u)));
  col = min(col, vec3(1.0));
  gl_FragColor = vec4(col, 1.0) * a * u_alpha;
}`;
const PVS = `
attribute vec2 a_p; attribute vec2 a_uv;
uniform vec3 u_map; uniform vec2 u_size;
varying vec2 v_uv;
void main() {
  vec2 px = a_p * u_map.x + u_map.yz;
  gl_Position = vec4((px / u_size * 2.0 - 1.0) * vec2(1.0, -1.0), 0.0, 1.0);
  v_uv = a_uv;
}`;
const PFS = `
precision mediump float;
uniform sampler2D u_tex; uniform float u_alpha;
varying vec2 v_uv;
void main() { gl_FragColor = texture2D(u_tex, v_uv) * u_alpha; }`;
const STRIDE = 15; // p3 t3 b3 uv3 x3

export type Posy = { x: number; y: number; r: number; scale: number };

export class BowRenderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private pprog: WebGLProgram;
  private buf: WebGLBuffer;
  private pbuf: WebGLBuffer;
  private tex: WebGLTexture | null;
  private data = new Float32Array(0);

  static create(canvas: HTMLCanvasElement, posy: HTMLImageElement, box: Box) {
    try {
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true, depth: true });
      return gl ? new BowRenderer(gl, posy, box) : null;
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext, posy: HTMLImageElement, private box: Box) {
    this.gl = gl;
    gl.getExtension("OES_standard_derivatives");
    const program = (vs: string, fs: string) => {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
        return s;
      };
      const p = gl.createProgram()!;
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    this.prog = program(VS, FS);
    this.pprog = program(PVS, PFS);
    this.buf = gl.createBuffer()!;
    this.pbuf = gl.createBuffer()!;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, posy);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * k: device px per canvas px; ox, oy: where the gate canvas's origin is on the screen;
   * ribbon: the ribbon's opacity (it fades only if it is somehow still in view when the camera
   * walks through); posy: where the flowers are.
   */
  draw(bow: Bow, posy: Posy, k: number, ox: number, oy: number, w: number, h: number, ribbon = 1) {
    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ------------------------------------------------ the ribbon
    const strips = ribbon > 0.001 ? bow.geometry() : [];
    if (strips.length) {
      gl.useProgram(this.prog);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      let count = 0;
      for (const st of strips) count += (st.P.length - 1) * 6;
      if (this.data.length < count * STRIDE) this.data = new Float32Array(count * STRIDE * 1.5);
      const d = this.data;
      let o = 0;
      const put = (st: (typeof strips)[number], i: number, u: number) => {
        const p = st.P[i], b = st.B[i], t = st.T[i], hw = st.hw[i] * u;
        d[o++] = p[0] + b[0] * hw; d[o++] = p[1] + b[1] * hw; d[o++] = p[2] + b[2] * hw;
        d[o++] = t[0]; d[o++] = t[1]; d[o++] = t[2];
        d[o++] = b[0]; d[o++] = b[1]; d[o++] = b[2];
        d[o++] = u; d[o++] = st.s[i]; d[o++] = st.puff[i];
        d[o++] = st.ao[i]; d[o++] = st.pleat[i]; d[o++] = st.end[i];
      };
      for (const st of strips) {
        for (let i = 0; i < st.P.length - 1; i++) {
          put(st, i, -1); put(st, i, 1); put(st, i + 1, -1);
          put(st, i, 1); put(st, i + 1, 1); put(st, i + 1, -1);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, o), gl.DYNAMIC_DRAW);
      const attr = (name: string, size: number, offset: number) => {
        const l = gl.getAttribLocation(this.prog, name);
        gl.enableVertexAttribArray(l);
        gl.vertexAttribPointer(l, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
      };
      attr("a_p", 3, 0); attr("a_t", 3, 3); attr("a_b", 3, 6); attr("a_uv", 3, 9); attr("a_x", 3, 12);
      gl.uniform3f(gl.getUniformLocation(this.prog, "u_map"), k, ox, oy);
      gl.uniform2f(gl.getUniformLocation(this.prog, "u_size"), w, h);
      gl.uniform1f(gl.getUniformLocation(this.prog, "u_alpha"), ribbon);
      gl.drawArrays(gl.TRIANGLES, 0, o / STRIDE);
      for (const n of ["a_p", "a_t", "a_b", "a_uv", "a_x"]) gl.disableVertexAttribArray(gl.getAttribLocation(this.prog, n));
    }

    // ------------------------------------------------ the posy of flowers, on top
    const b = this.box;
    const cx = b.x + b.w / 2, cy = b.y + b.h * 0.5;
    const co = Math.cos((posy.r * Math.PI) / 180) * posy.scale, si = Math.sin((posy.r * Math.PI) / 180) * posy.scale;
    const v: number[] = [];
    const corner = (dx: number, dy: number, uu: number, vv: number) =>
      v.push(cx + posy.x + dx * co - dy * si, cy + posy.y + dx * si + dy * co, uu, vv);
    const hx = b.w / 2, hy = b.h / 2;
    corner(-hx, -hy, 0, 0); corner(hx, -hy, 1, 0); corner(-hx, hy, 0, 1);
    corner(hx, -hy, 1, 0); corner(hx, hy, 1, 1); corner(-hx, hy, 0, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.pprog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
    const lp = gl.getAttribLocation(this.pprog, "a_p"), lu = gl.getAttribLocation(this.pprog, "a_uv");
    gl.enableVertexAttribArray(lp); gl.enableVertexAttribArray(lu);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 16, 8);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform3f(gl.getUniformLocation(this.pprog, "u_map"), k, ox, oy);
    gl.uniform2f(gl.getUniformLocation(this.pprog, "u_size"), w, h);
    gl.uniform1f(gl.getUniformLocation(this.pprog, "u_alpha"), 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(lp); gl.disableVertexAttribArray(lu);
  }
}

/** Where the flowers come to rest: on the ground in front of the gate (or the screen's foot). */
export function posyRest(box: Box, view: View, scale: number) {
  const ground = Math.min(1500, view.y1 - 8);
  const cy = box.y + box.h * 0.5;
  return ground - cy - (box.h / 2) * scale;
}
