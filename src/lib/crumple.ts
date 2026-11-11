/**
 * Crumpling paper (WebGL). A page, drawn into a canvas, is laid on a fine mesh; to crumple it,
 * every point of the mesh is drawn in towards a lumpy ball, the corners first, with random folds
 * that are strongest half-way, so it creases like real paper. The light falls on each little
 * facet of the folds, which is what makes the creases read. The ball is then tossed away: up, out
 * and down, spinning and tumbling, and fades.
 *
 * One canvas draws any number of pages at once; it only draws while one is moving.
 */

const VS = `
attribute vec2 a_uv;
uniform vec2 u_res;
uniform vec4 u_rect;
uniform float u_t;
uniform vec4 u_off;     // x, y (css px), spin, tumble (radians)
uniform float u_scale;
uniform float u_seed;
varying vec2 v_uv;
varying vec3 v_pos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed * 13.7) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 c = u_rect.xy + u_rect.zw * 0.5;
  vec2 p0 = (a_uv - 0.5) * u_rect.zw;
  float R = 0.3 * sqrt(u_rect.z * u_rect.w);
  // where this point of the page ends up on the ball
  // (the page folds over on itself many times, so neighbouring bits land in jumbled places)
  float th = (a_uv.x - 0.5) * 5.2 + (noise(a_uv * 3.0) - 0.5) * 1.4 + (noise(a_uv * 7.0 + 2.0) - 0.5) * 1.3;
  float ph = (a_uv.y - 0.5) * 2.8 + (noise(a_uv * 3.0 + 7.0) - 0.5) * 1.1 + (noise(a_uv * 7.0 + 9.0) - 0.5) * 1.0;
  vec3 dir = vec3(sin(th) * cos(ph), sin(ph), cos(th) * cos(ph));
  // a lumpy ball with sharp ridges, the creases that stay in crumpled paper
  float ridge = 1.0 - abs(2.0 * noise(a_uv * 12.0 + 4.0) - 1.0);
  float ridge2 = 1.0 - abs(2.0 * noise(a_uv * 23.0 + 1.0) - 1.0);
  vec3 pb = dir * R * (0.66 + 0.34 * noise(a_uv * 5.0 + 3.0) + 0.26 * ridge + 0.1 * ridge2);
  // the edges and corners fold in first
  float d = length(a_uv - 0.5) * 1.414;
  float tv = clamp(u_t * 1.55 - (1.0 - d) * 0.55, 0.0, 1.0);
  tv = tv * tv * (3.0 - 2.0 * tv);
  vec3 p = mix(vec3(p0, 0.0), pb, tv);
  // the folds: sharp creases at two scales, strongest half-way
  float k = sin(3.14159 * min(1.0, tv * 1.25));
  p.z += ((noise(a_uv * 8.0) - 0.5) * 1.15 + (noise(a_uv * 19.0) - 0.5) * 0.45) * R * k;
  p.xy += (vec2(noise(a_uv * 10.0 + 1.0), noise(a_uv * 10.0 + 5.0)) - 0.5) * R * 0.55 * k;
  // tumble (about the vertical) and spin (in the page's plane)
  float ct = cos(u_off.w), st = sin(u_off.w);
  p = vec3(ct * p.x + st * p.z, p.y, -st * p.x + ct * p.z);
  float cs = cos(u_off.z), sn = sin(u_off.z);
  p.xy = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y);
  p *= u_scale;
  float persp = 900.0 / (900.0 - p.z);
  vec2 s = c + u_off.xy + p.xy * persp;
  v_uv = a_uv;
  v_pos = vec3(s, p.z);
  gl_Position = vec4((s / u_res * 2.0 - 1.0) * vec2(1.0, -1.0), -p.z / 3000.0, 1.0);
}`;

const FS = `#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_tex;
uniform float u_alpha;
uniform float u_fold;   // how far the folds' light and shade show (0 flat → 1)
varying vec2 v_uv;
varying vec3 v_pos;
void main() {
  vec3 n = normalize(cross(dFdx(v_pos), dFdy(v_pos)));
  if (n.z < 0.0) n = -n;
  vec3 L = normalize(vec3(-0.45, -0.6, 0.66));
  float diff = max(dot(n, L), 0.0);
  // flat paper is shown exactly as drawn; the folds bring out light and shade
  // (paper is matte: a soft fill, so the folds read as creases, not as foil)
  float lit = (0.62 + 0.5 * diff) / (0.62 + 0.5 * L.z);
  float shade = mix(1.0, lit, u_fold);
  vec4 tex = gl_FrontFacing ? texture2D(u_tex, v_uv) : vec4(0.95, 0.92, 0.85, 1.0) * texture2D(u_tex, v_uv).a;
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 10.0) * 0.05 * u_fold;
  vec3 col = tex.rgb * shade + spec * tex.a;
  gl_FragColor = vec4(col, tex.a) * u_alpha;
}`;

const N = 34; // mesh resolution (vertices per side)

type Rect = { x: number; y: number; w: number; h: number };
type Piece = { tex: WebGLTexture; rect: Rect; start: number; seed: number; vx: number; vy: number; spin: number; tumble: number };

export class Crumpler {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private count: number;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private pieces: Piece[] = [];
  private raf = 0;
  private dpr = 1;
  private W = 0;
  private H = 0;

  static create(canvas: HTMLCanvasElement) {
    try {
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true, depth: true });
      if (!gl || !gl.getExtension("OES_standard_derivatives")) return null;
      return new Crumpler(canvas, gl);
    } catch (e) {
      console.warn("crumple: WebGL unavailable", e);
      return null;
    }
  }

  private constructor(private canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link");
    this.prog = p;
    gl.useProgram(p);
    const uv: number[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) uv.push(i / (N - 1), j / (N - 1));
    const idx: number[] = [];
    for (let j = 0; j < N - 1; j++)
      for (let i = 0; i < N - 1; i++) {
        const a = j * N + i;
        idx.push(a, a + 1, a + N, a + 1, a + N + 1, a + N);
      }
    this.count = idx.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "a_uv");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const k of ["u_res", "u_rect", "u_t", "u_off", "u_scale", "u_seed", "u_tex", "u_alpha", "u_fold"]) this.loc[k] = gl.getUniformLocation(p, k);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // the mesh is laid out in screen space (y down) and flipped into clip space, which turns its
    // winding over: clockwise is the printed side
    gl.frontFace(gl.CW);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
  }

  /** Crumples a drawn page that sits at `rect` (css px, relative to this canvas) and tosses it away. */
  crumple(page: HTMLCanvasElement, rect: Rect) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, page);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const side = Math.random() < 0.5 ? -1 : 1;
    this.pieces.push({
      tex, rect, start: performance.now() / 1000, seed: Math.random() * 100,
      vx: side * (150 + Math.random() * 150), vy: -(250 + Math.random() * 120),
      spin: side * (2.5 + Math.random() * 2.5), tumble: (Math.random() - 0.5) * 6,
    });
    if (!this.raf) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = () => {
    const gl = this.gl;
    const now = performance.now() / 1000;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.u_res, this.W, this.H);
    const CRUMPLE = 0.5, TOSS = 0.42, END = 1.5;
    this.pieces = this.pieces.filter((pc) => {
      const age = now - pc.start;
      if (age > END) { gl.deleteTexture(pc.tex); return false; }
      const c = Math.min(1, age / CRUMPLE);
      const t = c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
      const dt = Math.max(0, age - TOSS);
      // a little lift as it is gathered up, then the toss
      const lift = -14 * Math.sin(Math.PI * Math.min(1, age / TOSS));
      const x = pc.vx * dt, y = lift + pc.vy * dt + 0.5 * 1500 * dt * dt;
      const fade = 1 - Math.max(0, (age - 1.15) / (END - 1.15));
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D, pc.tex);
      gl.uniform4f(this.loc.u_rect, pc.rect.x, pc.rect.y, pc.rect.w, pc.rect.h);
      gl.uniform1f(this.loc.u_t, t);
      // (a uniform of its own: the two shaders may not share one at different precisions)
      gl.uniform1f(this.loc.u_fold, Math.min(1, t * 2.5));
      gl.uniform4f(this.loc.u_off, x, y, pc.spin * dt + 0.25 * t * Math.sign(pc.spin), pc.tumble * dt + 0.5 * t);
      gl.uniform1f(this.loc.u_scale, 1 - 0.1 * t - 0.1 * Math.min(1, dt));
      gl.uniform1f(this.loc.u_seed, pc.seed);
      gl.uniform1f(this.loc.u_alpha, fade);
      gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
      return true;
    });
    this.raf = this.pieces.length ? requestAnimationFrame(this.frame) : 0;
    if (!this.raf) { gl.clear(gl.COLOR_BUFFER_BIT); }
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.pieces.forEach((p) => this.gl.deleteTexture(p.tex));
    this.pieces = [];
  }
}
