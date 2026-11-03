import Hero from "@/scenes/hero/Hero";
import Nav from "@/components/Nav";
import Welcome from "@/sections/Welcome";
import Couple from "@/sections/Couple";
import Story from "@/sections/Story";
import SaveTheDate from "@/sections/SaveTheDate";
import Destination from "@/sections/Destination";
import Events from "@/sections/Events";
import Ceremony from "@/sections/Ceremony";
import Family from "@/sections/Family";
import DressCode from "@/sections/DressCode";
import Gallery from "@/sections/Gallery";
import Venue from "@/sections/Venue";
import Rsvp from "@/sections/Rsvp";
import Wishes from "@/sections/Wishes";
import ThankYou from "@/sections/ThankYou";

/** The invitation: one continuous walk through the garden, morning to golden hour. */
export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Welcome />
        <Couple />
        <Story />
        <SaveTheDate />
        <Destination />
        <Events />
        <Ceremony />
        <Family />
        <DressCode />
        <Gallery />
        <Venue />
        <Rsvp />
        <Wishes />
        <ThankYou />
      </main>
    </>
  );
}
