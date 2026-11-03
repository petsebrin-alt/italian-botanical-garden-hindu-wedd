import type { EventType } from "@/content/wedding";

/** Line icons (1.25 px at 48 px), one continuous stroke where possible so they draw well. */
const PATHS: Record<EventType, string[]> = {
  mehendi: ["M24 42 C 12 34, 10 20, 24 6 C 38 20, 36 34, 24 42 Z", "M24 42 V 14", "M24 30 L 17 23 M24 24 L 31 17 M24 35 L 30 29"],
  haldi: ["M8 26 H 40 C 40 36, 33 42, 24 42 C 15 42, 8 36, 8 26 Z", "M14 26 C 16 20, 22 18, 26 21 C 29 17, 34 19, 34 26", "M22 12 C 22 9, 26 9, 26 12 C 26 15, 22 15, 22 12 Z"],
  sangeet: ["M10 16 C 10 12, 38 12, 38 16 V 32 C 38 36, 10 36, 10 32 Z", "M10 16 C 10 20, 38 20, 38 16", "M16 18 L 14 34 M24 19 V 35 M32 18 L 34 34", "M6 8 L 14 14 M42 8 L 34 14"],
  ceremony: ["M24 6 C 30 14, 32 20, 28 26 C 27 22, 25 20, 24 18 C 23 22, 20 24, 20 28 C 16 22, 18 14, 24 6 Z", "M12 30 H 36 L 33 40 H 15 Z", "M8 44 H 40"],
  reception: ["M24 4 V 10", "M12 10 H 36 L 32 20 H 16 Z", "M16 20 C 16 28, 32 28, 32 20", "M20 28 V 36 M28 28 V 36 M24 26 V 40", "M18 40 C 18 43, 30 43, 30 40"],
  jaggo: ["M14 22 C 14 36, 34 36, 34 22 Z", "M12 22 H 36", "M18 22 V 14 M24 22 V 10 M30 22 V 14", "M18 12 C 17 10, 19 8, 18 6 M24 8 C 23 6, 25 4, 24 2 M30 12 C 29 10, 31 8, 30 6", "M20 40 H 28"],
  chooda: ["M24 10 C 36 10, 42 18, 42 24 C 42 30, 36 38, 24 38 C 12 38, 6 30, 6 24 C 6 18, 12 10, 24 10 Z", "M24 16 C 31 16, 35 20, 35 24 C 35 28, 31 32, 24 32 C 17 32, 13 28, 13 24 C 13 20, 17 16, 24 16 Z", "M24 38 V 44"],
  baraat: ["M10 40 L 14 26 C 16 18, 26 16, 30 20 L 36 14 L 40 18 L 36 24 C 38 30, 34 36, 28 36 L 30 40", "M18 26 C 22 24, 26 24, 30 26", "M36 14 C 34 10, 38 8, 40 10"],
  cocktail: ["M12 8 H 36 L 24 24 Z", "M24 24 V 40", "M16 40 H 32", "M30 6 L 34 2"],
  brunch: ["M8 30 H 40", "M12 30 C 12 20, 36 20, 36 30", "M24 14 V 20", "M10 36 H 38"],
  custom: ["M24 6 L 28 18 L 40 18 L 30 26 L 34 38 L 24 31 L 14 38 L 18 26 L 8 18 L 20 18 Z"],
};

export default function EventIcon({ type, size = 44 }: { type: EventType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      {(PATHS[type] ?? PATHS.custom).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
