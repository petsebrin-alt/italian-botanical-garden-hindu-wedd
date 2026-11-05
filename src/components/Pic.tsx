import { heroAsset } from "@/lib/heroAsset";

/** A photo with AVIF + WebP sources. `src` is given without its extension. */
export default function Pic({
  src, alt, className, imgClassName, inner = false, eager = false, width, height,
}: {
  src: string; alt: string; className?: string; imgClassName?: string;
  inner?: boolean; eager?: boolean; width?: number; height?: number;
}) {
  const base = src.replace(/\.(webp|avif|jpg|png)$/, "");
  return (
    <picture className={className} {...(inner ? { "data-inner": "" } : {})}>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <img
        className={imgClassName}
        src={`${base}.webp`}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        width={width}
        height={height}
      />
    </picture>
  );
}

/** Sharp botanical layers cut from in-focus photographs (tools/build_botanicals.py). */
const BOTANICAL = new Set([
  "canopy-l", "canopy-r", "strand-1", "strand-2", "strand-3",
  "bed-l", "bed-r", "bed-wide", "cypress-l", "cypress-r",
]);

/** A transparent decorative sprite: a sharp botanical layer, or one cut from the hero layers. */
export function Sprite({ name, className = "", depth, style }: {
  name: string; className?: string; depth?: number; style?: React.CSSProperties;
}) {
  return (
    <img
      className={`sprite ${className}`}
      src={BOTANICAL.has(name) ? `/assets/botanical/${name}.webp` : heroAsset(`${name}.webp`)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={style}
      {...(depth !== undefined ? { "data-depth": depth } : {})}
    />
  );
}
