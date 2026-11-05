/**
 * The satin bow on the garden gate: the photographed bow itself, made to move like fabric.
 *
 * tools/build_gate.py cuts the bow's satin from the photo, part by part, into one atlas
 * (bow-atlas.webp): two straps, two loops, two tails and the knot with its posy of flowers.
 * Each half of the bow is one continuous ribbon (stile → strap → knot → loop → knot → tail)
 * whose points carry the patch of photographed satin they started on. Drawn with WebGL, the
 * ribbon at rest reproduces the photo exactly; when it bends, twists and falls, the real satin
 * bends with it.
 *
 * While the bow is tied its shape follows how far each loop has been pulled through the knot
 * (`loop` 1 → 0): a loop's length is fed into its tail, so pulling a loop closed draws the
 * tail down. Once the knot gives, the ribbons are verlet ropes: gravity, air, satin's stiffness.
 * Coordinates are gate-canvas px (the photo plus the mirrored pillar faces, manifest.json).
 */

type P = { x: number; y: number };
type Section = 0 | 1 | 2; // strap, loop, tail
/** the part of the gate canvas the screen shows, in canvas px */
export type View = { x0: number; y0: number; x1: number; y1: number };
export type Cell = { x: number; y: number; w: number; h: number; ax: number; ay: number };
export type BowMeta = { atlas: { w: number; h: number }; ext: number; parts: Record<string, Cell> };

/** Each half's centre line through the photographed bow (photo px), and the strip's width. */
const GEO = {
  l: {
    strap: [{ x: 180, y: 846 }, { x: 330, y: 846 }, { x: 470, y: 846 }],
    loop: [
      { x: 479, y: 802 }, { x: 440, y: 797 }, { x: 395, y: 797 }, { x: 358, y: 806 }, { x: 343, y: 834 },
      { x: 358, y: 862 }, { x: 395, y: 870 }, { x: 440, y: 870 }, { x: 479, y: 864 },
    ],
    tail: [{ x: 452, y: 886 }, { x: 440, y: 930 }, { x: 416, y: 995 }, { x: 394, y: 1055 }, { x: 374, y: 1115 }, { x: 366, y: 1160 }, { x: 366, y: 1220 }],
    parts: ["band-l", "loop-l", "tail-l"],
  },
  r: {
    strap: [{ x: 864, y: 844 }, { x: 710, y: 844 }, { x: 560, y: 844 }],
    loop: [
      { x: 581, y: 806 }, { x: 620, y: 797 }, { x: 662, y: 793 }, { x: 692, y: 803 }, { x: 705, y: 832 },
      { x: 692, y: 860 }, { x: 660, y: 868 }, { x: 620, y: 868 }, { x: 581, y: 862 },
    ],
    tail: [{ x: 572, y: 888 }, { x: 594, y: 940 }, { x: 622, y: 1010 }, { x: 655, y: 1070 }, { x: 690, y: 1120 }, { x: 702, y: 1165 }, { x: 697, y: 1216 }],
    parts: ["band-r", "loop-r", "tail-r"],
  },
};
const WIDTH: Record<Section, number> = { 0: 116, 1: 72, 2: 128 };
const H = 6; // rest spacing between ribbon points

const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);

/** A dense Catmull-Rom polyline through the control points. */
function spline(pts: P[], per = 12): P[] {
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
const cumulative = (poly: P[]) => poly.reduce<number[]>((acc, p, i) => (acc.push(i ? acc[i - 1] + dist(poly[i - 1], p) : 0), acc), []);

/** A point and its tangent at a fraction of the way along a polyline. */
function along(poly: P[], cum: number[], f: number) {
  const L = cum[cum.length - 1];
  const s = Math.max(0, Math.min(1, f)) * L;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const a = poly[i - 1], b = poly[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (s - cum[i - 1]) / seg;
  const d = dist(a, b) || 1;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, tx: (b.x - a.x) / d, ty: (b.y - a.y) / d };
}

type Geo = { polys: P[][]; cums: number[][]; lens: number[]; parts: string[] };
function geometry(side: "l" | "r", ext: number): Geo {
  const g = GEO[side];
  const shift = (pts: P[]) => pts.map((p) => ({ x: p.x + ext, y: p.y }));
  const polys = [spline(shift(g.strap)), spline(shift(g.loop), 16), spline(shift(g.tail), 14)];
  const cums = polys.map(cumulative);
  return { polys, cums, lens: cums.map((c) => c[c.length - 1]), parts: g.parts };
}

class Rope {
  n: number;
  x: Float32Array; y: Float32Array; px: Float32Array; py: Float32Array;
  tw: Float32Array;
  /** the patch of photographed satin each point carries: centre, normal, half-width (canvas px) */
  ux: Float32Array; uy: Float32Array; unx: Float32Array; uny: Float32Array; hw: Float32Array;
  sec: Uint8Array;
  pinned = true;
  pin = { x: 0, y: 0 };
  bend = 0;

  constructor(public side: -1 | 1, public geo: Geo) {
    const total = geo.lens.reduce((a, b) => a + b, 0);
    this.n = Math.round(total / H) + 1;
    const n = this.n;
    this.x = new Float32Array(n); this.y = new Float32Array(n); this.px = new Float32Array(n); this.py = new Float32Array(n);
    this.tw = new Float32Array(n);
    this.ux = new Float32Array(n); this.uy = new Float32Array(n); this.unx = new Float32Array(n); this.uny = new Float32Array(n); this.hw = new Float32Array(n);
    this.sec = new Uint8Array(n);
  }

  /** The tied shape: loop `r` of the way out (0 = pulled through), the tails stirred by `sway`. */
  setTied(r: number, sway: number) {
    const { polys, cums, lens } = this.geo;
    r = Math.max(0, Math.min(1, r));
    const scaleAbout = (poly: P[], o: P, f: number) => poly.map((p) => ({ x: o.x + (p.x - o.x) * f, y: o.y + (p.y - o.y) * f }));
    const tailF = (lens[2] + (1 - r) * lens[1]) / lens[2];
    const t0 = polys[2][0];
    let tail = scaleAbout(polys[2], t0, tailF);
    if (sway) tail = tail.map((p) => ({ x: p.x + sway * Math.max(0, (p.y - t0.y) / 330) ** 1.5 * 12, y: p.y }));
    const cur = [polys[0], scaleAbout(polys[1], polys[1][0], r), tail];
    const curLens = [lens[0], lens[1] * r, lens[2] * tailF];
    let i = 0, want = 0, base = 0;
    for (let s = 0 as Section; s < 3; s = (s + 1) as Section) {
      const L = curLens[s];
      const cc = s === 0 ? cums[0] : cumulative(cur[s]);
      while (i < this.n && want <= base + L + 1e-6 && (L > 1e-3 || s === 2)) {
        const f = L > 1e-3 ? (want - base) / L : 0;
        const p = along(cur[s], cc, f);
        const rest = along(polys[s], cums[s], f);
        this.px[i] = this.x[i]; this.py[i] = this.y[i];
        this.x[i] = p.x; this.y[i] = p.y;
        this.sec[i] = s;
        this.ux[i] = rest.x; this.uy[i] = rest.y;
        this.unx[i] = -rest.ty; this.uny[i] = rest.tx;
        this.hw[i] = WIDTH[s] / 2;
        this.tw[i] = 0;
        i++; want += H;
      }
      base += L;
    }
    for (; i < this.n; i++) {
      this.px[i] = this.x[i]; this.py[i] = this.y[i];
      this.x[i] = this.x[i - 1]; this.y[i] = this.y[i - 1];
      this.sec[i] = 2; this.hw[i] = 0;
    }
  }

  /** The knot gives: velocities come from the last two tied frames, plus a little push outwards. */
  release(push: number) {
    const loopAt = Math.max(1, this.sec.indexOf(1));
    for (let i = 0; i < this.n; i++) {
      const out = this.sec[i] === 0 ? i / loopAt : 1;
      this.px[i] = this.x[i] - this.side * push * out;
    }
  }

  step(dt: number, t: number, air: number) {
    const g = 1500, damp = Math.pow(0.975, dt * 60);
    if (this.pinned) {
      this.px[0] = this.x[0]; this.py[0] = this.y[0];
      this.x[0] = this.pin.x; this.y[0] = this.pin.y;
    }
    for (let i = 0; i < this.n; i++) {
      if (i === 0 && this.pinned) continue;
      const vx = (this.x[i] - this.px[i]) * damp, vy = (this.y[i] - this.py[i]) * damp;
      this.px[i] = this.x[i]; this.py[i] = this.y[i];
      const gust = air * Math.sin(t * 2.3 + i * 0.035) * 340;
      this.x[i] += vx + (gust + this.side * air * 180) * dt * dt;
      this.y[i] += vy + g * dt * dt;
    }
    for (let it = 0; it < 14; it++) {
      for (let i = 0; i < this.n - 1; i++) this.link(i, i + 1, H, 1);
      for (let i = 0; i < this.n - 2; i++) this.link(i, i + 2, H * 1.9, this.bend, true);
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

  /** As it falls the ribbon turns over in slow rolling waves. */
  spin(t: number, amount: number) {
    for (let i = 0; i < this.n; i++) this.tw[i] = amount * (1.05 * Math.sin(i * 0.07 - t * 3.8) + t * 0.45);
  }

  gone(v: View) {
    const m = 140;
    for (let i = 0; i < this.n; i++)
      if (this.hw[i] && this.x[i] > v.x0 - m && this.x[i] < v.x1 + m && this.y[i] > v.y0 - m && this.y[i] < v.y1 + m) return false;
    return true;
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
  ropes: [Rope, Rope];
  free = false;
  done = false;
  private t = 0;
  private freeAt = 0;
  private pinFrom: P[] = [];
  /** when each half starts being drawn away (s after the knot gives), and for how long */
  private draw0: [number, number] = [0.28, 0];
  private drawFor = 2.4;

  constructor(public meta: BowMeta, state: BowState = { loopL: 1, loopR: 1, sway: 0 }) {
    this.ropes = [new Rope(-1, geometry("l", meta.ext)), new Rope(1, geometry("r", meta.ext))];
    this.tie(state);
    this.tie(state); // twice, so the "previous" positions match (no initial velocity)
  }

  tie(s: BowState) {
    if (this.free) return;
    this.ropes[0].setTied(s.loopL, s.sway);
    this.ropes[1].setTied(s.loopR, -s.sway);
  }

  /** The knot gives way: from here the ribbons move by themselves. */
  release() {
    if (this.free) return;
    this.free = true;
    this.freeAt = this.t;
    this.ropes.forEach((r) => {
      r.release(0.6);
      this.pinFrom.push({ x: r.x[0], y: r.y[0] });
    });
  }

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
}

/* ------------------------------------------------------------------ drawing (WebGL) */
const VS = `
attribute vec2 a_pos; attribute vec2 a_uv; attribute float a_shade; attribute vec4 a_cell;
uniform vec3 u_map; uniform vec2 u_size;
varying vec2 v_uv; varying float v_shade; varying vec4 v_cell;
void main() {
  vec2 px = a_pos * u_map.x + u_map.yz;
  gl_Position = vec4((px / u_size * 2.0 - 1.0) * vec2(1.0, -1.0), 0.0, 1.0);
  v_uv = a_uv; v_shade = a_shade; v_cell = a_cell;
}`;
const FS = `
precision mediump float;
uniform sampler2D u_tex; uniform vec2 u_atlas;
varying vec2 v_uv; varying float v_shade; varying vec4 v_cell;
void main() {
  // each strip only ever shows its own part of the atlas
  if (v_uv.x < v_cell.x || v_uv.y < v_cell.y || v_uv.x > v_cell.x + v_cell.z || v_uv.y > v_cell.y + v_cell.w) discard;
  vec4 c = texture2D(u_tex, v_uv / u_atlas);
  gl_FragColor = vec4(c.rgb * v_shade, c.a);
}`;
const STRIDE = 9; // x y u v shade cellx celly cellw cellh

export class BowRenderer {
  private gl: WebGLRenderingContext;
  private buf: WebGLBuffer;
  private data = new Float32Array(0);
  private loc: { map: WebGLUniformLocation | null; size: WebGLUniformLocation | null; atlas: WebGLUniformLocation | null };

  static create(canvas: HTMLCanvasElement, atlas: HTMLImageElement, meta: BowMeta) {
    try {
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
      return gl ? new BowRenderer(gl, atlas, meta) : null;
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext, atlas: HTMLImageElement, private meta: BowMeta) {
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    gl.useProgram(prog);
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const attr = (name: string, size: number, offset: number) => {
      const l = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
    };
    attr("a_pos", 2, 0); attr("a_uv", 2, 2); attr("a_shade", 1, 4); attr("a_cell", 4, 5);
    this.loc = {
      map: gl.getUniformLocation(prog, "u_map"),
      size: gl.getUniformLocation(prog, "u_size"),
      atlas: gl.getUniformLocation(prog, "u_atlas"),
    };
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * k: device px per canvas px; ox, oy: where the gate canvas's origin sits on the screen.
   * posy: the flowers' drop (canvas px) and turn (degrees).
   */
  draw(bow: Bow, posy: { y: number; r: number }, k: number, ox: number, oy: number, w: number, h: number) {
    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const ext = this.meta.ext;
    const verts: number[] = [];
    const push = (x: number, y: number, u: number, v: number, shade: number, c: Cell) => {
      verts.push(x, y, c.ax + (u - ext - c.x), c.ay + (v - c.y), shade, c.ax, c.ay, c.w, c.h);
    };
    if (!bow.done) {
      // tails behind, then the straps, then the loops on top
      for (const pass of [2, 0, 1] as Section[]) {
        for (const r of bow.ropes) {
          const cell = this.meta.parts[r.geo.parts[pass]];
          const n = r.n;
          // per point: the ribbon's edges now, and the same satin's edges in the photo
          const E = new Float32Array(n * 8);
          const S = new Float32Array(n);
          for (let i = 0; i < n; i++) {
            if (r.sec[i] !== pass) continue;
            let a = i - 1, b = i + 1;
            if (a < 0 || r.sec[a] !== pass) a = i;
            if (b >= n || r.sec[b] !== pass) b = i;
            let tx = r.x[b] - r.x[a], ty = r.y[b] - r.y[a];
            const tl = Math.hypot(tx, ty) || 1;
            tx /= tl; ty /= tl;
            const cs = Math.cos(r.tw[i]);
            const hw = r.hw[i] * (Math.abs(cs) < 0.04 ? 0.04 * Math.sign(cs || 1) : cs);
            const nx = -ty, ny = tx;
            E[i * 8] = r.x[i] - nx * hw; E[i * 8 + 1] = r.y[i] - ny * hw;
            E[i * 8 + 2] = r.x[i] + nx * hw; E[i * 8 + 3] = r.y[i] + ny * hw;
            E[i * 8 + 4] = r.ux[i] - r.unx[i] * r.hw[i]; E[i * 8 + 5] = r.uy[i] - r.uny[i] * r.hw[i];
            E[i * 8 + 6] = r.ux[i] + r.unx[i] * r.hw[i]; E[i * 8 + 7] = r.uy[i] + r.uny[i] * r.hw[i];
            // satin darkens a little as it turns away, more on its back
            S[i] = cs >= 0 ? 0.86 + 0.14 * cs : 0.8 + 0.1 * -cs;
          }
          for (let i = 0; i < n - 1; i++) {
            if (r.sec[i] !== pass || r.sec[i + 1] !== pass || !r.hw[i + 1]) continue;
            const A = i * 8, B = (i + 1) * 8;
            push(E[A], E[A + 1], E[A + 4], E[A + 5], S[i], cell);
            push(E[A + 2], E[A + 3], E[A + 6], E[A + 7], S[i], cell);
            push(E[B], E[B + 1], E[B + 4], E[B + 5], S[i + 1], cell);
            push(E[A + 2], E[A + 3], E[A + 6], E[A + 7], S[i], cell);
            push(E[B + 2], E[B + 3], E[B + 6], E[B + 7], S[i + 1], cell);
            push(E[B], E[B + 1], E[B + 4], E[B + 5], S[i + 1], cell);
          }
        }
      }
    }
    // the posy of flowers on the knot, on top
    const c = this.meta.parts.knot;
    const px = c.x + ext + c.w / 2, py = c.y + c.h * 0.4;
    const rot = (posy.r * Math.PI) / 180, co = Math.cos(rot), si = Math.sin(rot);
    const x0 = -c.w / 2, x1 = c.w / 2, y0 = -c.h * 0.4, y1 = c.h * 0.6;
    const quad: [number, number][] = [[x0, y0], [x1, y0], [x0, y1], [x1, y0], [x1, y1], [x0, y1]];
    for (const [dx, dy] of quad) push(px + dx * co - dy * si, py + posy.y + dx * si + dy * co, px + dx, py + dy, 1, c);

    if (this.data.length < verts.length) this.data = new Float32Array(verts.length * 2);
    this.data.set(verts);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, verts.length), gl.DYNAMIC_DRAW);
    gl.uniform3f(this.loc.map, k, ox, oy);
    gl.uniform2f(this.loc.size, w, h);
    gl.uniform2f(this.loc.atlas, this.meta.atlas.w, this.meta.atlas.h);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / STRIDE);
  }
}
