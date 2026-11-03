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

/** A transparent botanical sprite cut from the hero layers. */
export function Sprite({ name, className = "", depth, style }: {
  name: string; className?: string; depth?: number; style?: React.CSSProperties;
}) {
  return (
    <img
      className={`sprite ${className}`}
      src={heroAsset(`${name}.webp`)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={style}
      {...(depth !== undefined ? { "data-depth": depth } : {})}
    />
  );
}
