import Gate from "@/scenes/gate/Gate";
import Hero from "@/scenes/hero/Hero";
import Nav from "@/components/Nav";
import Couple from "@/sections/Couple";
import SaveTheDate from "@/sections/SaveTheDate";
import Events from "@/sections/Events";
import Memories from "@/sections/Memories";
import Ceremony from "@/sections/Ceremony";
import Family from "@/sections/Family";
import Venue from "@/sections/Venue";
import Wishes from "@/sections/Wishes";
import Help from "@/sections/Help";
import ThankYou from "@/sections/ThankYou";

/** The invitation: one continuous walk through the garden, morning to golden hour. */
export default function Page() {
  return (
    <>
      <Gate />
      <Nav />
      <main>
        <Hero />
        <SaveTheDate />
        <Couple />
        <Memories />
        <Events />
        <Ceremony />
        <Family />
        <Wishes />
        <Venue />
        <Help />
        <ThankYou />
      </main>
    </>
  );
}
