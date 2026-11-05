import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Pinyon_Script, Playfair_Display, Tiro_Devanagari_Hindi } from "next/font/google";
import { wedding } from "@/content/wedding";
import { longDate } from "@/lib/dates";
import { MotionProvider } from "@/lib/motion";
import heroManifest from "../../public/scenes/hero/manifest.json";
import { heroAsset } from "@/lib/heroAsset";
import "./globals.css";

const names = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-names", display: "swap" });
const head = Playfair_Display({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-head", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap", preload: false });
const deva = Tiro_Devanagari_Hindi({ subsets: ["devanagari"], weight: "400", variable: "--font-deva", display: "swap", preload: false });

const { bride, groom } = wedding.couple;
const title = `${bride.name} & ${groom.name} · ${longDate(wedding.date)} · ${wedding.destination.label}`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3127"),
  title,
  description: `You are invited to the wedding of ${bride.name} and ${groom.name}, ${longDate(wedding.date)}, ${wedding.destination.label}.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${bride.name} & ${groom.name}`,
    description: `${longDate(wedding.date)} · ${wedding.destination.label}`,
    images: [{ url: heroAsset("fallback.webp"), width: heroManifest.canvas.srcW, height: heroManifest.canvas.h }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8F4E9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${names.variable} ${head.variable} ${body.variable} ${script.variable} ${deva.variable}`}>
      <body>
        <a className="skip-link" href="#rsvp">Skip to RSVP</a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
