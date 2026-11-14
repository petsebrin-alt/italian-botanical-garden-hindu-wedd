import { wedding } from "@/content/wedding";
import arch from "../../../public/assets/arch/arch.json";

/**
 * The flower arch of the opening screen (tools/build_arch.py), standing on the lawn of the
 * cypress avenue where the garden ends. The couple's photograph stands inside it as a portrait in
 * a gold-framed arch of its own: below the bells and between the hanging jasmine strands, so no
 * flower or bell ever covers them, and whole (nothing fades), so any ordinary photo works. It is
 * cropped to the portrait by itself, round the point `focus`, and can come closer with `zoom`
 * (wedding.ts, `archPhoto`). Behind it, the avenue beyond: its villa just above the portrait.
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

/** The arch's proportions (width / height). */
export const ARCH_RATIO = arch.w / arch.h;

/** The couple's portrait inside the arch (fractions of the arch): in the clear space between the
 *  hanging jasmine strands and below the bells, standing on the arch's floor. */
export const PORTRAIT = { x: 0.29, w: 0.43, top: 0.29, foot: 0.935 };

/** The avenue beyond the arch (canvas px): a straight cypress avenue with a grass path, whose far
 *  end (the villa) stands just above the portrait's arch. Its villa is a set share of the arch's
 *  height, and it is shown smaller than its photograph, so it stays sharp. */
const VILLA_H = 0.14;   // the villa's height, as a share of the arch's
const VILLA_PX = 170;   // the villa's height in the avenue photograph
export function backdropBox(upright: boolean): ArchBox {
  const a = archBox(upright);
  const k = (VILLA_H * a.h) / VILLA_PX;
  const w = arch.backdrop.w * k, h = arch.backdrop.h * k;
  const vanish = a.y + (PORTRAIT.top - 0.005) * a.h;
  return { x: MID - w / 2, y: vanish - arch.backdrop.vanish * h, w, h };
}

/** The avenue beyond the arch, closing the far end of the opening scene's own avenue. */
export function ArchBackdrop({ srcW }: { srcW: number }) {
  const v = (b: ArchBox, sfx: string) => ({
    [`--fx${sfx}`]: b.x / srcW, [`--fy${sfx}`]: b.y / srcW, [`--fw${sfx}`]: b.w / srcW, [`--fh${sfx}`]: b.h / srcW,
  });
  const style = { ...v(backdropBox(false), ""), ...v(backdropBox(true), "-u") } as React.CSSProperties;
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
    "--px": PORTRAIT.x, "--pw": PORTRAIT.w, "--pt": PORTRAIT.top, "--pf": PORTRAIT.foot,
    "--zoom": p.zoom ?? 1,
    "--focus": p.focus ?? "50% 45%",
  } as React.CSSProperties;
  return (
    <div className="hl hl--world hero-arch" data-layer="couple" style={style}>
      {/* (one piece: the arch and the couple in it grow and settle together, so the flowers never pass over them) */}
      <div className="hero-arch-inner">
        <span className="hero-arch-shadow" aria-hidden="true" />
        {/* the couple's portrait: the whole photo, in a gold-framed arch of its own, inside the
            flowers and below the bells (nothing fades, so nothing of them is lost) */}
        <figure className="hero-arch-portrait">
          <div className="hero-arch-portrait-photo">
            <div className="hero-arch-pan">
              <img src={p.src} alt={p.alt} decoding="async" draggable={false} />
            </div>
          </div>
        </figure>
        <img className="hero-arch-hang" src={file("hang.webp")} alt="" aria-hidden="true" decoding="async" draggable={false} />
        <img className="hero-arch-ring" src={file("ring.webp")} alt="" aria-hidden="true" decoding="async" draggable={false} />
      </div>
    </div>
  );
}
