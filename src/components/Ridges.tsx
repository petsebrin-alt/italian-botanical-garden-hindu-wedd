/** Distant Tuscan ridges as vectors (crisp at any size). Each ridge is its own parallax layer. */
const RIDGES = [
  { d: "M0 230 C80 214 160 200 250 206 C340 212 400 190 480 178 C560 166 640 186 720 196 C800 206 880 184 960 172 C1040 160 1120 176 1200 188 C1280 200 1360 186 1440 178 C1520 170 1570 180 1600 186 L1600 400 L0 400 Z", from: "#bccbd8", to: "#d6dfe3" },
  { d: "M0 270 C90 258 180 246 280 252 C380 258 460 240 560 236 C660 232 740 256 840 262 C940 268 1020 248 1120 242 C1220 236 1300 252 1400 258 C1480 262 1560 250 1600 246 L1600 400 L0 400 Z", from: "#a9bda8", to: "#c2cdb3" },
  { d: "M0 312 C150 300 300 296 450 302 C600 308 750 316 900 310 C1050 304 1200 296 1350 300 C1450 303 1540 308 1600 306 L1600 400 L0 400 Z", from: "#a3be73", to: "#7f9e54" },
];
/** Little cypresses standing on the middle ridge: [x, base y, height]. */
const FAR_CYPRESS = [[300, 254, 30], [316, 255, 22], [980, 266, 26], [996, 265, 34], [1012, 266, 24], [1240, 244, 28]];

export default function Ridges({ id, className, depths, count = 3 }: {
  /** unique per section (gradient ids) */ id: string;
  className: string;
  /** data-depth per ridge, far to near */ depths: number[];
  /** how many ridges, from the farthest */ count?: number;
}) {
  return (
    <>
      {RIDGES.slice(0, count).map((r, i) => (
        <svg key={i} className={`${className} ${className}--${i + 1}`} viewBox="0 0 1600 400" preserveAspectRatio="none"
          data-depth={depths[i]} aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-ridge-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={r.from} />
              <stop offset="1" stopColor={r.to} />
            </linearGradient>
          </defs>
          <path d={r.d} fill={`url(#${id}-ridge-${i})`} />
          {i === 1 && FAR_CYPRESS.map(([x, y, h]) => (
            <path key={x} d={`M${x} ${y} C${x - 5} ${y - h * 0.4} ${x - 4} ${y - h * 0.8} ${x} ${y - h} C${x + 4} ${y - h * 0.8} ${x + 5} ${y - h * 0.4} ${x} ${y} Z`} fill="#5f7d52" opacity="0.85" />
          ))}
        </svg>
      ))}
    </>
  );
}
