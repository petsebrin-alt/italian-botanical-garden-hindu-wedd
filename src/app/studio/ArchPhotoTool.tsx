"use client";

import { useEffect, useRef, useState } from "react";
import { wedding } from "@/content/wedding";
import { ARCH_RATIO, PORTRAIT, file } from "@/scenes/hero/Arch";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** "50% 45%" → [50, 45] */
const parseFocus = (f?: string): [number, number] => {
  const m = (f ?? "").match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 45];
};

/**
 * The couple's photograph in the opening screen's flower arch: try a photo here and place it.
 * Any ordinary photo works: it is cropped to the arch's opening by itself, behind the flowers.
 * Drag the picture to choose what stays in view, and zoom in if the couple look small; then copy
 * the settings into src/content/wedding.ts (`archPhoto`). The photo never leaves this computer:
 * to publish it, put the file in public/assets/img/.
 */
export default function ArchPhotoTool() {
  const start = wedding.archPhoto;
  const [src, setSrc] = useState(start.src);
  const [name, setName] = useState(start.src.split("/").pop() ?? "");
  const [focus, setFocus] = useState<[number, number]>(parseFocus(start.focus));
  const [zoom, setZoom] = useState(start.zoom ?? 1);
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ x: number; y: number; f: [number, number] } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  // (a picked photo is shown from memory, and let go again when another is picked)
  useEffect(() => () => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); }, [src]);

  const pick = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    setSrc(URL.createObjectURL(f));
    setName(f.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"));
    setFocus([50, 45]);
    setZoom(1);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, f: focus };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, box = frame.current?.getBoundingClientRect();
    if (!d || !box) return;
    // dragging the picture right shows more of its left: the point in view moves the other way
    const k = 100 / zoom;
    setFocus([
      Math.round(clamp(d.f[0] - ((e.clientX - d.x) / box.width) * k, 0, 100)),
      Math.round(clamp(d.f[1] - ((e.clientY - d.y) / box.height) * k, 0, 100)),
    ]);
  };
  const onUp = () => { drag.current = null; };
  const nudge = (dx: number, dy: number) => setFocus(([x, y]) => [clamp(x + dx, 0, 100), clamp(y + dy, 0, 100)]);

  const settings = `archPhoto: {
    src: "/assets/img/${name}",
    alt: "${start.alt.replace(/"/g, "'")}",
    focus: "${focus[0]}% ${focus[1]}%",
    zoom: ${zoom},
  },`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* the settings stay selectable below */ }
  };

  const f = `${focus[0]}% ${focus[1]}%`;
  return (
    <section aria-labelledby="arch-h" className="studio-arch">
      <div className="studio-row">
        <h2 id="arch-h" className="h3">Couple photo in the flower arch</h2>
        <label className="btn btn--primary studio-arch-pick">
          Choose a photo
          <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </div>
      <p className="hint">
        Any ordinary photo works: there is no need to remove its background. It is cropped to the arch&rsquo;s opening by
        itself and shown behind the flowers. It stands inside the arch in a gold-framed portrait of its own, below the bells and between the jasmine strands. Drag the picture to choose what stays in view, and zoom in if you are small in it.
      </p>

      <div className="studio-arch-stage" style={{ aspectRatio: ARCH_RATIO }}>
        <figure
          className="studio-arch-portrait"
          style={{ left: `${PORTRAIT.x * 100}%`, width: `${PORTRAIT.w * 100}%`, top: `${PORTRAIT.top * 100}%`, bottom: `${(1 - PORTRAIT.foot) * 100}%` }}
        >
          <div
            ref={frame}
            className="studio-arch-frame"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="img"
            aria-label="The couple's photo in its frame inside the arch; drag to move it, or use the arrow buttons"
          >
            <img src={src} alt="" draggable={false} style={{ objectPosition: f, scale: String(zoom), transformOrigin: f }} />
          </div>
        </figure>
        <img className="studio-arch-layer" src={file("hang.webp")} alt="" />
        <img className="studio-arch-layer" src={file("ring.webp")} alt="" />
      </div>

      <div className="studio-arch-controls">
        <label className="studio-arch-zoom">
          Zoom <input type="range" min={1} max={2} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          <span>{zoom.toFixed(2)}×</span>
        </label>
        <div className="studio-actions" aria-label="Move the picture">
          <button type="button" className="btn btn--ghost" onClick={() => nudge(0, -4)} aria-label="Show more of the top">↑</button>
          <button type="button" className="btn btn--ghost" onClick={() => nudge(0, 4)} aria-label="Show more of the bottom">↓</button>
          <button type="button" className="btn btn--ghost" onClick={() => nudge(-4, 0)} aria-label="Show more of the left">←</button>
          <button type="button" className="btn btn--ghost" onClick={() => nudge(4, 0)} aria-label="Show more of the right">→</button>
          <button type="button" className="btn btn--ghost" onClick={() => { setFocus([50, 45]); setZoom(1); }}>Reset</button>
        </div>
      </div>

      <div className="card studio-arch-out">
        <p className="hint">
          To publish it: put the photo in <code>public/assets/img/</code> as <code>{name}</code>, and replace <code>archPhoto</code> in{" "}
          <code>src/content/wedding.ts</code> with:
        </p>
        <pre>{settings}</pre>
        <button type="button" className="btn btn--primary" onClick={copy}>{copied ? "Copied" : "Copy settings"}</button>
      </div>
    </section>
  );
}
