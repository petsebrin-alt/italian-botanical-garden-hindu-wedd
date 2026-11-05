/**
 * The curved-lens carousel renderer (S04 · Sweet Memories).
 *
 * The photographs sit side by side on one band; the band is seen through a soft lens, so the
 * photograph in the middle is flat and sharp while those towards the edges swell taller and
 * curve away, with a faint colour fringe like real glass. Moving the band bends the lens a
 * little more (the "liquid" feel). Everything is one full-width WebGL quad: the fragment shader
 * maps each screen pixel back through the lens onto the band.
 */

const VS = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;
const FS = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_res;      // canvas size, device px
uniform float u_offset;  // band position, in photographs
uniform vec3 u_card;     // width, height, gap (device px)
uniform float u_radius;
uniform float u_bend;    // how much taller the band grows at the edges
uniform float u_n;       // number of photographs
uniform vec2 u_grid;     // atlas columns, rows
uniform float u_fringe;

vec4 band(vec2 p) {
  vec2 d = p - u_res * 0.5;
  float nx = d.x / (u_res.x * 0.5);
  float m = 1.0 + u_bend * nx * nx;
  float wx = d.x * (1.0 - 0.14 * u_bend * nx * nx);
  float wy = d.y / m;
  float pitch = u_card.x + u_card.z;
  float f = wx / pitch + u_offset;
  float k = floor(f + 0.5);
  float lx = (f - k) * pitch;
  vec2 q = abs(vec2(lx, wy)) - vec2(u_card.x, u_card.y) * 0.5 + u_radius;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - u_radius;
  float a = clamp(0.5 - sdf, 0.0, 1.0);
  if (a <= 0.0) return vec4(0.0);
  float idx = mod(k, u_n);
  // the photograph drifts a little against its frame as it travels (depth)
  float cardX = (k - u_offset) * pitch / u_res.x;
  vec2 uv = vec2(lx / u_card.x, wy / u_card.y) * 0.9 + 0.5;
  uv.x -= cardX * 0.08;
  uv = clamp(uv, 0.003, 0.997);
  vec2 cell = vec2(mod(idx, u_grid.x), floor(idx / u_grid.x));
  vec4 c = texture2D(u_tex, (cell + uv) / u_grid);
  // light falls off softly towards the edges of the lens
  c.rgb *= 1.0 - 0.16 * nx * nx;
  return vec4(c.rgb * a, a);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float nx = (p.x - u_res.x * 0.5) / (u_res.x * 0.5);
  float sh = u_fringe * nx * nx * nx * u_res.x;
  vec4 g = band(p);
  float r = band(p + vec2(sh, 0.0)).r;
  float b = band(p - vec2(sh, 0.0)).b;
  gl_FragColor = vec4(r, g.g, b, g.a);
}`;

export type LensLayout = { cardW: number; cardH: number; gap: number; radius: number; bend: number };

export class LensCarousel {
  private gl: WebGLRenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private n: number;
  private grid: [number, number];

  static create(canvas: HTMLCanvasElement, images: HTMLImageElement[]) {
    try {
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) return null;
      return new LensCarousel(gl, images);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext, images: HTMLImageElement[]) {
    this.gl = gl;
    this.n = images.length;
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const k of ["u_res", "u_offset", "u_card", "u_radius", "u_bend", "u_n", "u_grid", "u_fringe"]) this.u[k] = gl.getUniformLocation(prog, k);

    // one atlas of all the photographs (4 across), drawn at their own size
    const cw = images[0].naturalWidth || 640, ch = images[0].naturalHeight || 800;
    const cols = Math.min(4, this.n), rows = Math.ceil(this.n / cols);
    this.grid = [cols, rows];
    const atlas = document.createElement("canvas");
    atlas.width = cw * cols; atlas.height = ch * rows;
    const ctx = atlas.getContext("2d")!;
    images.forEach((im, i) => ctx.drawImage(im, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch));
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  draw(offset: number, L: LensLayout, w: number, h: number) {
    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.u.u_res, w, h);
    gl.uniform1f(this.u.u_offset, offset);
    gl.uniform3f(this.u.u_card, L.cardW, L.cardH, L.gap);
    gl.uniform1f(this.u.u_radius, L.radius);
    gl.uniform1f(this.u.u_bend, L.bend);
    gl.uniform1f(this.u.u_n, this.n);
    gl.uniform2f(this.u.u_grid, this.grid[0], this.grid[1]);
    gl.uniform1f(this.u.u_fringe, 0.0035);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
