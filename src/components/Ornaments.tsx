import { useId } from "react";
import { initials } from "@/content/wedding";

/** Leaf positions along an open olive wreath (left half; the right half mirrors it). */
function wreathLeaves(cx: number, cy: number, r: number) {
  const leaves: { x: number; y: number; rot: number; s: number }[] = [];
  const from = 102, to = 252, n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = ((from + (to - from) * t) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy - r * Math.sin(a);
    const tangent = (Math.atan2(-Math.cos(a), -Math.sin(a)) * 180) / Math.PI;
    const s = 1 - t * 0.35;
    leaves.push({ x, y, rot: tangent + (i % 2 ? 38 : -38), s });
  }
  return leaves;
}

const LEAF = "M0 0 C 3.6 -4.2, 10.4 -4.4, 15 0 C 10.4 4.4, 3.6 4.2, 0 0 Z";

export function Monogram({ size = 140, className = "" }: { size?: number; className?: string }) {
  const [a, b] = initials();
  const circleD = "M 100 50 A 50 50 0 1 1 99.9 50 Z";

  return (
    <svg
      className={`monogram ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${a} and ${b} monogram`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="mono-gold-rope" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2C886" />
          <stop offset="35%" stopColor="#FFF4D0" />
          <stop offset="65%" stopColor="#C4A66A" />
          <stop offset="100%" stopColor="#7A5E2A" />
        </linearGradient>
      </defs>

      {/* Circular golden flower rope: draws from one end to the other to make a complete circle */}
      <g className="mono-stems">
        <path
          className="mono-draw"
          d={circleD}
          fill="none"
          stroke="url(#mono-gold-rope)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>

      {/* Grand floral rope with blooming pink roses, blossoms & leaves */}
      <g className="mono-wreath mono-leaves">
        <image
          href="/assets/img/monogram-wreath.webp"
          x="0"
          y="0"
          width="200"
          height="200"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>

      {/* Grand golden metallic 3D initials J | R */}
      <g className="mono-letters">
        {a === "J" && b === "R" ? (
          <image
            href="/assets/img/monogram-letters.webp"
            x="0"
            y="0"
            width="200"
            height="200"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <g fontFamily="var(--font-names), serif" fontSize="48" fontWeight="500" fill="url(#mono-gold-rope)" textAnchor="middle">
            <text x="75" y="116">{a}</text>
            <line x1="100" y1="76" x2="100" y2="128" stroke="url(#mono-gold-rope)" strokeWidth="1.6" />
            <text x="127" y="116">{b}</text>
          </g>
        )}
      </g>
    </svg>
  );
}

export function Sprig({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg className={`sprig ${className}`} width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path className="sprig-stem" d="M 36 40 C 26 32, 18 22, 14 6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      {[[30, 34, -20], [24, 27, -34], [19, 19, -48], [16, 11, -62], [34, 31, 40], [28, 23, 26], [22, 15, 14]].map(([x, y, r], i) => (
        <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r + 180}) scale(0.62)`} fill="currentColor" />
      ))}
    </svg>
  );
}

export function CypressIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="58" height="26" viewBox="0 0 58 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M2 24 C 14 14, 22 13, 30 18 C 38 12, 46 13, 56 22" />
      <path d="M2 24 H 56" opacity="0.6" />
      <path d="M22 24 C 19.5 18, 19.5 9, 22 2 C 24.5 9, 24.5 18, 22 24 Z" fill="currentColor" opacity="0.85" />
      <path d="M30 24 C 28 19, 28 11, 30 6 C 32 11, 32 19, 30 24 Z" fill="currentColor" opacity="0.7" />
      <path d="M37 24 C 35.6 20, 35.6 15, 37 11 C 38.4 15, 38.4 20, 37 24 Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function LotusDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`ornament ${className}`} aria-hidden="true">
      <span className="rule" />
      <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor">
        <path d="M15 2 C 18 6, 18 11, 15 15 C 12 11, 12 6, 15 2 Z" />
        <path d="M15 15 C 10 13, 6 9, 5 4 C 10 6, 13 10, 15 15 Z" opacity="0.8" />
        <path d="M15 15 C 20 13, 24 9, 25 4 C 20 6, 17 10, 15 15 Z" opacity="0.8" />
        <path d="M15 16 C 9 16, 4 14, 1 11 C 6 11, 11 13, 15 16 Z" opacity="0.55" />
        <path d="M15 16 C 21 16, 26 14, 29 11 C 24 11, 19 13, 15 16 Z" opacity="0.55" />
      </svg>
      <span className="rule" />
    </div>
  );
}

/** Lotus and diya: the invocation ornament above the welcome blessing. */
export function InvocationIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="58" viewBox="0 0 64 58" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path className="draw" d="M32 4 C 35 9, 35 14, 32 18 C 29 14, 29 9, 32 4 Z" />
      <path className="draw" d="M32 18 C 32 22, 32 24, 32 26" />
      <path className="draw" d="M12 34 C 18 46, 46 46, 52 34 Z" />
      <path className="draw" d="M8 34 H 56" />
      <path className="draw" d="M32 34 C 27 30, 24 26, 23 21 C 28 23, 31 27, 32 34 C 33 27, 36 23, 41 21 C 40 26, 37 30, 32 34" />
      <path className="draw" d="M24 46 C 26 51, 38 51, 40 46" />
      <path className="draw" d="M20 54 H 44" />
    </svg>
  );
}

/** Realistic blooming watercolor flower with soft unfurling leaves and staggered petals. */
export function BloomingFlower({
  size = 40,
  className = "",
  idPrefix = "bf",
}: {
  size?: number | string;
  className?: string;
  idPrefix?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const pId = `${idPrefix}-${uid}`;

  return (
    <svg
      className={`blooming-flower ${className}`}
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      role="img"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${pId}-petal`} cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#913d44" />
          <stop offset="18%" stopColor="#b6575e" />
          <stop offset="45%" stopColor="#dd9893" />
          <stop offset="75%" stopColor="#f0c2bd" />
          <stop offset="100%" stopColor="#fae4e1" />
        </radialGradient>
        <linearGradient id={`${pId}-leaf`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3d4928" />
          <stop offset="50%" stopColor="#556639" />
          <stop offset="100%" stopColor="#7a8d56" />
        </linearGradient>
        <radialGradient id={`${pId}-center`} cx="45%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff5b8" />
          <stop offset="35%" stopColor="#e8c252" />
          <stop offset="70%" stopColor="#b58728" />
          <stop offset="100%" stopColor="#541b20" />
        </radialGradient>
        <filter id={`${pId}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#4a1a1e" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Leaves group */}
      <g className="bf-leaves">
        <g className="bf-leaf bf-leaf-0" transform="rotate(-130) translate(0, -8)" style={{ transformOrigin: "0px 0px" }}>
          <path d="M 0 0 C -12 -15, -20 -35, 0 -62 C 20 -35, 12 -15, 0 0 Z" fill={`url(#${pId}-leaf)`} stroke="#343e22" strokeWidth="0.8" />
          <line x1="0" y1="0" x2="0" y2="-56" stroke="#2a321b" strokeWidth="0.8" opacity="0.6" />
          <path d="M 0 -18 Q -7 -25, -12 -28 M 0 -30 Q -6 -37, -10 -40 M 0 -18 Q 7 -25, 12 -28 M 0 -30 Q 6 -37, 10 -40" stroke="#2a321b" strokeWidth="0.6" fill="none" opacity="0.5" />
        </g>
        <g className="bf-leaf bf-leaf-1" transform="rotate(120) translate(0, -8)" style={{ transformOrigin: "0px 0px" }}>
          <path d="M 0 0 C -10 -12, -18 -28, 0 -52 C 18 -28, 10 -12, 0 0 Z" fill={`url(#${pId}-leaf)`} stroke="#343e22" strokeWidth="0.8" />
          <line x1="0" y1="0" x2="0" y2="-46" stroke="#2a321b" strokeWidth="0.8" opacity="0.6" />
        </g>
        <g className="bf-leaf bf-leaf-2" transform="rotate(55) translate(0, -6)" style={{ transformOrigin: "0px 0px" }}>
          <path d="M 0 0 C -11 -14, -19 -32, 0 -58 C 19 -32, 11 -14, 0 0 Z" fill={`url(#${pId}-leaf)`} stroke="#343e22" strokeWidth="0.8" />
          <line x1="0" y1="0" x2="0" y2="-52" stroke="#2a321b" strokeWidth="0.8" opacity="0.6" />
        </g>
      </g>

      {/* 5 Botanical Petals */}
      <g className="bf-petals" filter={`url(#${pId}-shadow)`}>
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <g
            key={i}
            className={`bf-petal bf-petal-${i}`}
            transform={`rotate(${angle})`}
            style={{ transformOrigin: "0px 0px" }}
          >
            <path
              d="M 0 0 C -14 -16, -26 -30, -22 -46 C -19 -54, -6 -56, 0 -50 C 6 -56, 19 -54, 22 -46 C 26 -30, 14 -16, 0 0 Z"
              fill={`url(#${pId}-petal)`}
              stroke="#8e3d44"
              strokeWidth="0.6"
            />
            <path
              d="M 0 -8 Q -6 -24, -9 -42 M 0 -8 Q 0 -28, 0 -48 M 0 -8 Q 6 -24, 9 -42"
              stroke="#7e2b32"
              strokeWidth="0.5"
              fill="none"
              opacity="0.35"
            />
          </g>
        ))}
      </g>

      {/* Golden Floral Center */}
      <g className="bf-center" style={{ transformOrigin: "0px 0px" }}>
        <circle cx="0" cy="0" r="14" fill="#4d171d" />
        <circle cx="0" cy="0" r="10.5" fill={`url(#${pId}-center)`} />
        <circle cx="-5" cy="-5" r="1.6" fill="#fffbe0" />
        <circle cx="5" cy="-5" r="1.6" fill="#fffbe0" />
        <circle cx="6" cy="3" r="1.6" fill="#fffbe0" />
        <circle cx="-1" cy="7" r="1.6" fill="#fffbe0" />
        <circle cx="-6" cy="2" r="1.6" fill="#fffbe0" />
        <circle cx="0" cy="0" r="2.4" fill="#350f13" />
      </g>
    </svg>
  );
}
