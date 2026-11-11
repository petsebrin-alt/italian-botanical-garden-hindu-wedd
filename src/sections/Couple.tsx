"use client";

import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { LotusDivider, Sprig } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./couple.css";

const PEOPLE = [
  { key: "bride", photo: "/assets/img/portrait-bride", alt: "Janvi in a blush-pink lehenga with kundan jewellery and a sheer dupatta" },
  { key: "groom", photo: "/assets/img/portrait-groom", alt: "Rohit in an ivory embroidered sherwani with a maroon velvet dupatta and a jewelled safa" },
] as const;

/** A small gold five-petal blossom, the full stop under each name. */
function Blossom() {
  return (
    <svg className="person-blossom" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
      {[0, 72, 144, 216, 288].map((r) => (
        <path key={r} d="M13 13 C 10 9, 10.5 4.5, 13 2.5 C 15.5 4.5, 16 9, 13 13 Z" transform={`rotate(${r} 13 13)`} />
      ))}
      <circle cx="13" cy="13" r="2" fill="var(--ivory)" />
    </svg>
  );
}

/**
 * The swing of a frame hanging from a hook that glides `dist` px along the rail (ease sine.inOut,
 * `glide` s) and stops: a damped pendulum (of length L px, the cord and the frame's centre)
 * driven by the hook's acceleration. It lags behind while
 * the hook speeds up, swings ahead as it slows, then rocks to rest. Returns degrees at time t (s).
 */
function swing(dist: number, glide: number, total: number, L: number) {
  const dt = 1 / 240;
  const w2 = (2 * Math.PI / 1.3) ** 2;   // a 1.3 s swing
  const drag = 2.4;
  const out: number[] = [];
  let th = 0, w = 0;
  for (let t = 0; t <= total + dt; t += dt) {
    const s = t / glide;
    const a = s >= 1 ? 0 : (dist / 2) * (Math.PI / glide) ** 2 * Math.cos(Math.PI * s);
    // (a CSS rotation is clockwise: a frame lagging behind a hook moving right turns positive)
    w += (-w2 * Math.sin(th) + 0.7 * (a / L) * Math.cos(th) - drag * w) * dt;
    th += w * dt;
    out.push(th * 180 / Math.PI);
  }
  // eased out at the very end so it comes to rest exactly level
  return (t: number) => out[Math.min(out.length - 1, Math.round(t / dt))] * Math.min(1, (total - t) / 0.4);
}

/** The gold cord from the rail hook to the frame's shoulders, with the hook ring. */
function Cord() {
  return (
    <svg className="person-cord" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">
      <path className="cord-line" d="M14.6 42 L50 3.2 L85.4 42" />
      <circle className="cord-ring" cx="50" cy="1.3" r="2.1" />
      <circle className="cord-eye" cx="14.6" cy="42" r="1.3" />
      <circle className="cord-eye" cx="85.4" cy="42" r="1.3" />
    </svg>
  );
}

/**
 * S03 · Couple: two arched portraits hanging side by side from a gold picture rail, in a garden
 * frame (arbour vines above, hydrangeas below, the photographed Tuscan fields on the horizon).
 * The rail draws itself, the bride's frame glides in along it from the left and the groom's from
 * the right, each swinging on its cord until it settles; then the photographs come up in them.
 * While scrolling, the layers move at their own depths: the vines come down, the hills lag,
 * the frames float a little ahead and the hydrangeas rise.
 */
export default function Couple() {
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const mobile = window.innerWidth < 768;
    const v = window.innerHeight * (mobile ? 0.6 : 1);

    // the garden frame closes in around them as the section arrives
    const enter = { trigger: root, start: "top bottom", end: "top 20%", scrub: scrub() };
    gsap.fromTo(q(".cpl-vine--l"), { x: "-5vw", rotation: -3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".cpl-vine--r"), { x: "5vw", rotation: 3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".cpl-bed--l"), { x: "-6vw" }, { x: 0, ease: "power2.out", scrollTrigger: { ...enter, start: "top 70%", end: "bottom bottom" } });
    gsap.fromTo(q(".cpl-bed--r"), { x: "6vw" }, { x: 0, ease: "power2.out", scrollTrigger: { ...enter, start: "top 70%", end: "bottom bottom" } });

    // the depth layers, across the whole pass of the section (none ever uncovers an edge)
    const pass = { trigger: root, start: "top bottom", end: "bottom top", scrub: scrub() };
    const layer = (sel: string, from: number, to: number) =>
      gsap.fromTo(q(sel), { y: from * v }, { y: to * v, ease: "none", scrollTrigger: pass });
    layer(".cpl-horizon", -0.07, 0.07);
    layer(".cpl-vine", -0.17, 0.02);
    layer(".couple-head", -0.05, 0.05);
    layer(".couple-grid", 0.07, -0.07);
    layer(".cpl-bed", 0.22, -0.01);

    // the hanging frames
    const rail = q(".couple-rail")[0];
    const hangs = q(".person-hang") as HTMLElement[];
    const photos = q(".person-photo picture") as HTMLElement[];
    gsap.set(rail, { scaleX: 0 });
    gsap.set(photos, { autoAlpha: 0, filter: "blur(14px)", scale: 1.12 });
    const GLIDE = 1.9, TOTAL = 4.6;
    const tl = gsap.timeline({ paused: true });
    tl.to(rail, { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0);
    hangs.forEach((h, i) => {
      const side = i === 0 ? -1 : 1;
      const r = h.getBoundingClientRect();
      // from just beyond its own edge of the screen
      const dist = side < 0 ? r.right + 30 : window.innerWidth - r.left + 30;
      // the frame turns about its hook, on the rail above it
      const hook = parseFloat(getComputedStyle(h).marginTop) || 0;
      gsap.set(h, { x: side * dist, transformOrigin: `50% ${-hook}px` });
      const rot = swing(-side * dist, GLIDE, TOTAL, hook + r.height * 0.55);
      // the bride first, the groom a moment after her (so they never swing into each other)
      const at = 0.35 + i * 0.6;
      const clock = { t: 0 };
      tl.to(h, { x: 0, duration: GLIDE, ease: "sine.inOut" }, at)
        .to(clock, { t: TOTAL, duration: TOTAL, ease: "none", onUpdate: () => { gsap.set(h, { rotation: rot(clock.t) }); } }, at)
        // then the photograph comes up in its frame, like a print developing
        .to(photos[i], { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: 1.5, ease: "power2.out", clearProps: "filter" }, at + GLIDE + 0.15);
    });
    const st = ScrollTrigger.create({ trigger: q(".couple-grid")[0], start: "top 78%", once: true, onEnter: () => tl.play() });
    return () => { tl.kill(); st.kill(); };
  });
  const { bride, groom } = wedding.couple;
  const info = { bride, groom };

  return (
    <section ref={ref} id="couple" className="couple section paper" aria-labelledby="couple-title" data-stage>
      <div className="cpl-frame" aria-hidden="true">
        {/* the real Tuscan fields: vineyard hills, the far mountains and the lawn (tools/build_fields.py) */}
        <div className="cpl-horizon"><Pic src="/assets/img/fields-hills" alt="" className="cpl-fields" /></div>
        <Sprite name="canopy-l" className="cpl-vine cpl-vine--l" />
        <Sprite name="canopy-r" className="cpl-vine cpl-vine--r" />
        <Sprite name="bed-l" className="cpl-bed cpl-bed--l" />
        <Sprite name="bed-r" className="cpl-bed cpl-bed--r" />
      </div>

      <header className="container center couple-head">
        <h2 id="couple-title" className="script" data-reveal="up">The Couple</h2>
        <LotusDivider className="couple-ornament" />
      </header>

      <div className="container couple-grid">
        <span className="couple-rail" aria-hidden="true" />
        {PEOPLE.map((p) => {
          const person = info[p.key];
          return (
            <article key={p.key} className={`person person--${p.key}`}>
              <div className="person-hang">
                <Cord />
                <figure className="person-arch">
                  <div className="person-photo arch">
                    <Pic src={p.photo} alt={p.alt} inner />
                  </div>
                </figure>
              </div>
              <h3 className="person-name names" data-reveal="chars">{person.name}</h3>
              <p className="person-role script" data-reveal="up" data-delay="0.15">{person.role}</p>
              <p className="person-line body-s" data-reveal="fade" data-delay="0.25">{person.line}</p>
              <div className="person-flourish" data-reveal="fade" data-delay="0.35" aria-hidden="true">
                <Sprig /><Blossom /><Sprig flip />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
