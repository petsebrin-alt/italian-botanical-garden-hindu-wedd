import Gate from "@/scenes/gate/Gate";
import Hero from "@/scenes/hero/Hero";
import Nav from "@/components/Nav";
import Welcome from "@/sections/Welcome";
import Couple from "@/sections/Couple";
import SaveTheDate from "@/sections/SaveTheDate";
import Destination from "@/sections/Destination";
import Events from "@/sections/Events";
import Ceremony from "@/sections/Ceremony";
import Family from "@/sections/Family";
import DressCode from "@/sections/DressCode";
import Gallery from "@/sections/Gallery";
import Wishes from "@/sections/Wishes";
import ThankYou from "@/sections/ThankYou";

/** The invitation: one continuous walk through the garden, morning to golden hour. */
export default function Page() {
  return (
    <>
      <Gate />
      <Nav />
      <main>
        <Hero />
        <Welcome />
        <Couple />
        <Events />
        <SaveTheDate />
        <Destination />
        <Ceremony />
        <Family />
        <DressCode />
        <Gallery />
        <Wishes />
        <ThankYou />
      </main>
    </>
  );
}
