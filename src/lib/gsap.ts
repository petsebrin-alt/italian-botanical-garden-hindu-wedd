"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Flip, useGSAP);
  // the iOS / Android URL bar showing and hiding must not re-layout every pin
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, Flip, useGSAP };

/** PRD §14.2 motion tokens. */
export const tokens = {
  ease: {
    reveal: "power3.out",
    title: "power4.out",
    settle: "expo.out",
    cinematic: "power2.inOut",
    pop: "back.out(1.7)",
    sway: "sine.inOut",
  },
  stagger: { char: 0.035, word: 0.06, line: 0.12, card: 0.1 },
  revealStart: "top 78%",
};

export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export const scrub = () => (isTouch() ? 0.35 : 0.8);
