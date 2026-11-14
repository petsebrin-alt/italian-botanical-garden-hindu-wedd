import { wedding } from "@/content/wedding";
import arch from "../../../public/assets/arch/arch.json";

/**
 * The flower arch of the opening screen (tools/build_arch.py), standing on the lawn of the
 * cypress avenue where the garden ends. The couple's photograph is shown through its opening,
 * behind the arch and the jasmine strands and bells hanging in it, so any ordinary photo works
 * (no need to remove its background) and it never covers a flower: it is cropped to the opening
 * by itself, round the point `focus`, and can come closer with `zoom` (wedding.ts, `archPhoto`).
 *
 * Its place is in the opening scene's own canvas pixels (like the manifest's layers): its feet on
 * the lawn at FEET, centred on the avenue; a little narrower on upright screens, so it fits.
 */
const D = "/assets/arch/";
/** An arch file, with the build's content version (so a rebuilt file is never served stale). */
export const file = (n: string) => `${D}${n}?v=${arch.version}`;
/** Where the arch's feet stand, and the middle of the avenue (canvas px). */
const FEET = 1540;
const MID = 1110.5;
/** Its width: wide screens, and upright ones (phones, upright tablets). */
const WIDTH = { wide: 1240, upright: 940 };

export type ArchBox = { x: number; y: number; w: number; h: number };
/** The arch's box in canvas px. */
export function archBox(upright: boolean): ArchBox {
  const w = upright ? WIDTH.upright : WIDTH.wide;
  const h = (w * arch.h) / arch.w;
  return { x: MID - w / 2, y: FEET - arch.floor * h, w, h };
}

/** The opening the photo fills, down to the arch's feet, as fractions of the arch. */
const O = arch.opening;
export const FRAME = { x: O.x, y: O.y, w: O.w, h: arch.floor - O.y };
/** The arch's proportions (width / height). */
export const ARCH_RATIO = arch.w / arch.h;

/** The garden beyond the arch, closing the far end of the avenue (canvas px): its lawn meets the
 *  ground at LAWN, and it spans the gap between the two rows of cypresses. */
const LAWN = 1300;
const BACK_W = 960;
export const backdropBox: ArchBox = (() => {
  const h = (BACK_W * arch.backdrop.h) / arch.backdrop.w;
  return { x: MID - BACK_W / 2, y: LAWN - arch.backdrop.lawn * h, w: BACK_W, h };
})();

/** The garden beyond the arch: the view through it in the arch's own photograph, without the arch. */
export function ArchBackdrop({ srcW }: { srcW: number }) {
  const b = backdropBox;
  const style = { "--fx": b.x / srcW, "--fy": b.y / srcW, "--fw": b.w / srcW, "--fh": b.h / srcW } as React.CSSProperties;
  return (
    <div className="hl hl--world hero-backdrop" data-layer="backdrop" style={style} aria-hidden="true">
      <img src={file("backdrop.webp")} alt="" decoding="async" draggable={false} />
    </div>
  );
}

export default function Arch({ srcW }: { srcW: number }) {
  const p = wedding.archPhoto;
  const vars = (b: ArchBox, s: string) => ({
    [`--ax${s}`]: b.x / srcW, [`--ay${s}`]: b.y / srcW, [`--aw${s}`]: b.w / srcW, [`--ah${s}`]: b.h / srcW,
  });
  const style = {
    ...vars(archBox(false), ""),
    ...vars(archBox(true), "-u"),
    "--ox": FRAME.x, "--oy": FRAME.y, "--ow": FRAME.w, "--oh": FRAME.h,
    "--zoom": p.zoom ?? 1,
    "--focus": p.focus ?? "50% 45%",
    "--opening": `url(${file("opening.png")})`,
  } as React.CSSProperties;
  return (
    <div className="hl hl--world hero-arch" data-layer="couple" style={style}>
      <span className="hero-arch-shadow" aria-hidden="true" />
      {/* the couple, seen through the arch: the opening's shape, cut from the arch's own photograph */}
      <div className="hero-arch-photo">
        <div className="hero-arch-frame">
          <div className="hero-arch-pan">
            <img src={p.src} alt={p.alt} decoding="async" draggable={false} />
          </div>
        </div>
      </div>
      <img className="hero-arch-hang" src={file("hang.webp")} alt="" aria-hidden="true" decoding="async" draggable={false} />
      <img className="hero-arch-ring" src={file("ring.webp")} alt="" aria-hidden="true" decoding="async" draggable={false} />
    </div>
  );
}
