"use client";

import { useEffect, useRef, useState } from "react";
import { publishedEvents, wedding } from "@/content/wedding";
import { useMotion } from "@/lib/motion";
import { Monogram } from "@/components/Ornaments";
import "./nav.css";

const LINKS = [
  { href: "#couple", label: "The Couple" },
  { href: "#memories", label: "Memories" },
  { href: "#events", label: "Celebrations", needs: "events" },
  { href: "#dress-code", label: "Dress Code" },
  { href: "#venue", label: wedding.venue.name || "The Villa" },
  { href: "#wishes", label: "Wishes" },
  { href: "#help", label: "Help" },
];

function go(href: string, reduced: boolean) {
  const el = document.querySelector<HTMLElement>(href);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (href === "#top" ? 0 : 8);
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  const heading = el.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    window.setTimeout(() => heading.focus({ preventScroll: true }), reduced ? 0 : 700);
  }
}

export default function Nav() {
  const { tier, paused, togglePaused } = useMotion();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const links = LINKS.filter((l) => l.needs !== "events" || publishedEvents().length > 0);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const hero = document.getElementById("save-the-date")?.getBoundingClientRect().top ?? 0;
        const past = hero < window.innerHeight * 0.2;
        setSolid(past);
        setHidden(past && y > last + 4);
        if (y < last - 4) setHidden(false);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        last = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href")!;
    if (!href.startsWith("#")) return;
    e.preventDefault();
    dlg.current?.close();
    go(href, tier === "C");
  };

  return (
    <>
      <header className={`nav${solid ? " nav--solid" : ""}${hidden && !menu ? " nav--hidden" : ""}`}>
        <div className="nav-inner">
          <a className="nav-mono" href="#top" onClick={click} aria-label={`${wedding.couple.bride.name} and ${wedding.couple.groom.name}, back to top`}>
            <Monogram size={44} />
          </a>
          <nav className="nav-links" aria-label="Sections">
            {links.map((l) => <a key={l.href} href={l.href} onClick={click}>{l.label}</a>)}
          </nav>
          <div className="nav-end">
            <button type="button" className="nav-burger" aria-label="Open menu" aria-haspopup="dialog" onClick={() => { setMenu(true); dlg.current?.showModal(); }}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        <div className="nav-progress" aria-hidden="true"><div ref={bar} className="nav-progress-bar" /></div>
      </header>

      <dialog ref={dlg} className="menu paper" aria-label="Menu" onClose={() => setMenu(false)}>
        <button type="button" className="ev-close menu-close" onClick={() => dlg.current?.close()} aria-label="Close menu">×</button>
        <Monogram size={84} className="menu-mono" />
        <nav className="menu-links" aria-label="Sections">
          <a href="#top" onClick={click}>Home</a>
          {links.map((l) => <a key={l.href} href={l.href} onClick={click}>{l.label}</a>)}
        </nav>
        <button type="button" className="rsvp-link" onClick={togglePaused} aria-pressed={paused}>{paused ? "Resume animations" : "Pause animations"}</button>
      </dialog>
    </>
  );
}
