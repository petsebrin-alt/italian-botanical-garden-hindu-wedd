"use client";

import { useSyncExternalStore } from "react";
import { wedding } from "@/content/wedding";

/**
 * The guest an invitation is for, from their personal link: https://<site>/?to=Kapoor%20Family
 * (or ?guest=). It is read after hydration, so the static page stays the same for everyone.
 * Without a name in the link it is `wedding.greeting.fallback` ("Family & Friends").
 *
 * The opening screen greets them under the monogram ("Dear Kapoor Family"), the invitation card in
 * the ceremony window opens with it, and both thank-yous begin with it.
 */
const noSubscribe = () => () => {};
export const readGuest = () => {
  const p = new URLSearchParams(window.location.search);
  return (p.get("to") ?? p.get("guest") ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 48);
};

/** The guest's name from their link, or "Family & Friends". */
export function useGuest() {
  return useSyncExternalStore(noSubscribe, readGuest, () => "") || wedding.greeting.fallback;
}
