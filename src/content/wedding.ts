/**
 * The whole invitation renders from this one object. Change a name, a date or
 * the event list here and every section, the countdown, the calendar files and
 * the timeline geometry update on the next build. Values in [square brackets]
 * are placeholders that are not confirmed yet (see docs/PRD.md §24).
 */

export type EventType =
  | "mehendi" | "haldi" | "sangeet" | "ceremony" | "reception"
  | "jaggo" | "chooda" | "baraat" | "cocktail" | "brunch" | "custom";

export interface WeddingEvent {
  id: string;
  type: EventType;
  name: string;
  date?: string; // YYYY-MM-DD, venue-local
  start?: string; // HH:mm, venue-local
  end?: string;
  area?: string;
  description?: string;
  visible?: boolean;
}

export interface DressCode {
  eventId: string;
  theme: string;
  note: string;
  avoid?: string;
  image?: string;
  palette: { name: string; hex: string }[];
}

export interface Milestone {
  label: string;
  title: string;
  body: string;
  image: string;
  alt: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  category: "Portraits" | "Pre-wedding" | "Moments" | "Destination";
  shape?: "arch" | "tall" | "wide" | "square";
}

export const wedding = {
  /**
   * The greeting under the monogram. Send each guest their own link with their name in it,
   * e.g. https://<site>/?to=Sharma%20Family  ("?guest=" works too). Without one, `fallback` shows.
   */
  greeting: { dear: "Dear", fallback: "Family & Friends" },
  couple: {
    bride: { name: "Janvi", role: "The Bride", line: "Daughter of Kapoor & Lalitha" },
    groom: { name: "Rohit", role: "The Groom", line: "Son of Vasu & Jansi" },
  },
  date: "2027-08-15",
  time: "10:00",
  timezone: "Europe/Rome",
  destination: {
    label: "Tuscany, Italy",
    region: "Tuscany",
    country: "Italy",
    welcome: "Benvenuti in Toscana",
    highlights: [
      { title: "The landscape", text: "Cypress avenues, rolling hills and villa gardens: the Tuscany of postcards, at the height of summer." },
      { title: "Summer in Tuscany", text: "Mid-August days are long, golden and warm. Light, breathable fabrics and sun hats are your friends." },
      { title: "Getting here", text: "Flights, transfers, stays and travel essentials are gathered in the Travel & Stay section below." },
    ],
  },
  hashtag: "[#JanviWedsRohit]",
  families: {
    bride: { title: "The Bride's Family", parents: ["Kapoor", "Lalitha"] },
    groom: { title: "The Groom's Family", parents: ["Vasu", "Jansi"] },
  },
  welcome: {
    invocation: { enabled: true, text: "॥ श्री गणेशाय नमः ॥", lang: "hi" },
    message:
      "Together with their families, Kapoor & Lalitha and Vasu & Jansi, Janvi and Rohit joyfully invite you to celebrate their wedding among the gardens of Tuscany. Your blessings and presence will make our forever begin beautifully.",
  },
  story: [
    { label: "[Spring 2021]", title: "First Meeting", body: "[Where and how Janvi and Rohit first met. A line or two, in your own words.]", image: "/assets/img/story-1.webp", alt: "Janvi and Rohit walking together through a Tuscan garden" },
    { label: "[2022]", title: "Our Relationship", body: "[The friendship that became something more: the city, the late-night calls, the first trip together.]", image: "/assets/img/story-2.webp", alt: "Janvi and Rohit smiling, foreheads close" },
    { label: "[2023 – 2024]", title: "Special Memories", body: "[A favourite memory: a festival, a family dinner, a journey that mattered.]", image: "/assets/img/story-3.webp", alt: "Rohit twirling Janvi in a garden" },
    { label: "[2025]", title: "The Proposal", body: "[How the question was asked, and how the answer was a yes.]", image: "/assets/img/story-4.webp", alt: "Janvi and Rohit exchanging flower garlands among cypress trees" },
    { label: "15 · 08 · 2027", title: "The Wedding Journey", body: "Two families, one celebration, and a garden in Tuscany where our forever begins.", image: "/assets/img/story-5.webp", alt: "Janvi and Rohit holding rose and jasmine garlands" },
  ] as Milestone[],
  events: [
    { id: "mehendi", type: "mehendi", name: "Mehendi", date: "2027-08-12", start: "16:00", end: "19:00", area: "[Garden terrace]", description: "Henna, music and marigold-bright afternoons. Come with open palms." },
    { id: "haldi", type: "haldi", name: "Haldi", date: "2027-08-13", start: "10:00", end: "12:30", area: "[Lemon-tree courtyard]", description: "A morning of turmeric, laughter and blessings for the couple." },
    { id: "sangeet", type: "sangeet", name: "Sangeet", date: "2027-08-13", start: "19:00", end: "23:30", area: "[Villa lawns]", description: "An evening of dance, dholak and performances by both families." },
    { id: "ceremony", type: "ceremony", name: "Wedding Ceremony", date: "2027-08-15", start: "10:00", end: "13:00", area: "[Mandap lawn]", description: "The Baraat, the Jaimala and the sacred pheras under the Tuscan sun." },
    { id: "reception", type: "reception", name: "Reception", date: "2027-08-15", start: "19:00", end: "23:59", area: "[Sunset terrace]", description: "Dinner, toasts and dancing as the light turns gold over the hills." },
  ] as WeddingEvent[],
  ceremony: {
    title: "Vivah Sanskar",
    rituals: [
      { name: "Baraat & Milni", text: "The groom's procession arrives with music; the families greet and embrace." },
      { name: "Jaimala", text: "Janvi and Rohit exchange garlands of roses and jasmine." },
      { name: "Kanyadaan", text: "The bride's parents bless the union and place her hand in his." },
      { name: "Pheras", text: "The couple circle the sacred fire, making seven vows to each other." },
      { name: "Sindoor & Mangalsutra", text: "The symbols of marriage are given, sealing the vows." },
      { name: "Vidaai", text: "An emotional farewell as the bride sets out with her new family." },
    ],
    note: "The ceremony lasts about three hours. Seating is shaded, water is served throughout, and we kindly ask for phones down during the pheras.",
  },
  dressCode: [
    { eventId: "mehendi", theme: "Shades of Green", note: "Mint, sage, emerald and parrot green. Light cottons and chiffons suit a summer afternoon.", image: "/assets/img/fabric-mehendi.webp", palette: [{ name: "Sage", hex: "#A9BBA0" }, { name: "Mint", hex: "#BFD8C2" }, { name: "Emerald", hex: "#2F6B4F" }, { name: "Parrot", hex: "#7FA33A" }] },
    { eventId: "haldi", theme: "Sunny Yellow", note: "Turmeric, marigold and butter yellow. Wear something you won't mind being splashed with haldi.", image: "/assets/img/fabric-haldi.webp", palette: [{ name: "Butter", hex: "#F3E1A0" }, { name: "Marigold", hex: "#E9A93B" }, { name: "Turmeric", hex: "#D99A1E" }, { name: "Ivory", hex: "#F8F4E9" }] },
    { eventId: "sangeet", theme: "Jewel Tones & Sparkle", note: "Sapphire, ruby, amethyst and a little sequin. Comfortable shoes for the dance floor.", palette: [{ name: "Sapphire", hex: "#24407A" }, { name: "Ruby", hex: "#8E1F3A" }, { name: "Amethyst", hex: "#5E3A7A" }, { name: "Gold", hex: "#C4A66A" }] },
    { eventId: "ceremony", theme: "Traditional Reds & Gold", note: "Classic festive colours with gold zari. Please keep blush and ivory for the bride.", avoid: "Blush pink & ivory", image: "/assets/img/fabric-wedding.webp", palette: [{ name: "Sindoor", hex: "#A3242A" }, { name: "Rani", hex: "#B23A62" }, { name: "Saffron", hex: "#D9822B" }, { name: "Zari Gold", hex: "#C4A66A" }] },
    { eventId: "reception", theme: "Champagne & Midnight", note: "Evening glamour: champagne, midnight blue, black tie and Indo-western welcome.", palette: [{ name: "Champagne", hex: "#E9DDCA" }, { name: "Midnight", hex: "#1E2A44" }, { name: "Forest", hex: "#294535" }, { name: "Pearl", hex: "#F2EEE4" }] },
  ] as DressCode[],
  gallery: [
    { src: "/assets/img/gallery-01.webp", alt: "Janvi and Rohit exchanging garlands on a petal path", caption: "The Jaimala", category: "Moments", shape: "wide" },
    { src: "/assets/img/gallery-02.webp", alt: "Janvi in a blush lehenga and kundan jewellery", caption: "Janvi", category: "Portraits", shape: "arch" },
    { src: "/assets/img/gallery-03.webp", alt: "A cypress avenue leading to a Tuscan farmhouse", caption: "The avenue", category: "Destination", shape: "wide" },
    { src: "/assets/img/gallery-04.webp", alt: "Rohit in an ivory sherwani and turban", caption: "Rohit", category: "Portraits", shape: "arch" },
    { src: "/assets/img/gallery-05.webp", alt: "Rohit twirling Janvi among cypress trees", caption: "First dance", category: "Pre-wedding", shape: "square" },
    { src: "/assets/img/gallery-06.webp", alt: "Tables set in a Tuscan villa courtyard", caption: "The villa courtyard", category: "Destination", shape: "wide" },
    { src: "/assets/img/gallery-07.webp", alt: "Janvi and Rohit laughing together", caption: "Us", category: "Pre-wedding", shape: "square" },
    { src: "/assets/img/gallery-08.webp", alt: "Janvi and Rohit walking hand in hand", caption: "A walk in the garden", category: "Pre-wedding", shape: "tall" },
    { src: "/assets/img/gallery-09.webp", alt: "A Tuscan villa among cypress trees", caption: "Toscana", category: "Destination", shape: "square" },
    { src: "/assets/img/gallery-10.webp", alt: "Janvi and Rohit with garlands in the cypress garden", caption: "Forever in bloom", category: "Moments", shape: "wide" },
  ] as GalleryImage[],
  venue: {
    name: "", // [Venue to be announced]
    address: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    note: "We will share the exact estate, address and map here as soon as it is confirmed.",
    travel: [
      { title: "Flying in", text: "Nearest airports are usually Florence (FLR) and Pisa (PSA); long-haul arrivals often connect via Rome (FCO) or Milan (MXP). [Confirm once the venue is set.]" },
      { title: "Getting around", text: "[Shuttle times between the hotels and the estate will be listed here.] A hire car is useful for exploring the hills." },
      { title: "Travel essentials", text: "Guests who need a Schengen visa should apply well in advance. Currency is the euro; Italy uses type C, F and L plugs. Mid-August is hot: pack sun protection." },
      { title: "Ferragosto", text: "15 August is Italy's biggest summer holiday. Book flights and rooms early: prices rise and seats go quickly." },
    ],
    hotels: [] as { name: string; distance: string; price: string; url?: string; code?: string }[],
  },
  rsvp: {
    deadline: "", // [YYYY-MM-DD]
    maxGuests: 6,
    askEvents: true,
    askDiet: true,
  },
  thankYou: {
    lines: ["Two hearts.", "One journey.", "Forever in bloom."],
  },
};

export type Wedding = typeof wedding;

/** Only complete, visible events are ever rendered: never an empty circle. */
export function publishedEvents(list: WeddingEvent[] = wedding.events): WeddingEvent[] {
  const ok = list.filter((e) => e.visible !== false && e.name?.trim() && e.date && e.start);
  return ok.sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}

export const initials = () =>
  [wedding.couple.bride.name, wedding.couple.groom.name].map((n) => n.trim()[0]?.toUpperCase() ?? "");
