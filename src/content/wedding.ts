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
  /**
   * The couple's photograph in the flower arch of the opening screen. Any ordinary photo works:
   * there is no need to remove its background. It is cropped to the arch's opening by itself and
   * shown behind the flowers, so it never covers them. For your own photo, put it in
   * public/assets/img/ and change `src` (a landscape or square photo, 1600px wide or more, fills
   * the opening best).
   *   focus  the point that always stays in view: "50% 45%" is the middle, a little above centre;
   *          "50% 30%" keeps faces near the top of a tall photo in view
   *   zoom   1 shows as much of the photo as fits; 1.2 comes 20% closer (round `focus`)
   */
  archPhoto: {
    src: "/assets/img/gallery-garland.webp",
    alt: "Janvi and Rohit seated in the garden, exchanging garlands of roses and jasmine",
    focus: "50% 45%",
    zoom: 1,
  } as { src: string; alt: string; focus?: string; zoom?: number },
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
      { title: "Getting here", text: "Florence (FLR) and Pisa (PSA) are the closest airports; Rome (FCO) and Milan (MXP) connect from further afield." },
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
  /** S04 · Sweet Memories: the curved carousel (photos from tools/build_memories.py). */
  memories: [
    { image: "/assets/img/memory-1", title: "A Walk in the Garden", caption: "Hand in hand, the first of many", alt: "Rohit and Janvi walking hand in hand along a garden path, smiling at each other" },
    { image: "/assets/img/memory-2", title: "Our Quiet Place", caption: "Where every worry falls away", alt: "Janvi resting her head on Rohit's shoulder, eyes closed, under pink bougainvillea" },
    { image: "/assets/img/memory-3", title: "A Flower for Her", caption: "Small things, said softly", alt: "Rohit tucking a pink flower into Janvi's hair as she laughs" },
    { image: "/assets/img/memory-4", title: "Laughter on the Steps", caption: "The joke only we understand", alt: "Janvi and Rohit in maroon, sitting on garden steps and laughing together" },
    { image: "/assets/img/memory-5", title: "The Question", caption: "He knelt, she laughed, and then said yes", alt: "Rohit on one knee offering a flower to Janvi, who covers her smile with her hand" },
    { image: "/assets/img/memory-6", title: "Forehead to Forehead", caption: "A promise without words", alt: "Janvi and Rohit standing forehead to forehead beneath a flowering arch" },
    { image: "/assets/img/memory-7", title: "Long Summer Afternoons", caption: "Stories, flowers and golden light", alt: "Janvi reading to Rohit on a picnic blanket beside a basket of flowers" },
  ],
  events: [
    { id: "haldi", type: "haldi", name: "Haldi", date: "2027-08-12", start: "10:00", end: "13:00", area: "The villa courtyard", description: "A sunny morning of turmeric, marigolds, laughter and blessings for the couple." },
    { id: "mehendi", type: "mehendi", name: "Mehendi", date: "2027-08-13", start: "11:00", end: "15:00", area: "The villa garden hall", description: "Henna, music and bright cushions under the bougainvillea. Come with open palms." },
    { id: "sangeet", type: "sangeet", name: "Sangeet Night", date: "2027-08-13", start: "19:00", end: "23:00", area: "The villa lawns", description: "An evening of dance, dhol and performances by both families under the lights." },
    { id: "ceremony", type: "ceremony", name: "Wedding Ceremony", date: "2027-08-15", start: "10:00", end: "13:00", area: "The mandap lawn", description: "The baraat, the jaimala and the sacred vows under the Tuscan sun." },
    { id: "reception", type: "reception", name: "Reception Party", date: "2027-08-15", start: "19:00", end: "23:30", area: "The villa terrace", description: "Dinner, toasts and dancing beneath the string lights as the evening turns gold." },
  ] as WeddingEvent[],
  ceremony: {
    title: "Vivah Sanskar",
    /**
     * The garden window invitation: the couple's photo that appears in the window once a guest
     * accepts, and the thank-you letter under it. For your own photo, put it at `src` (or change
     * the path): any portrait photo works, it is cropped to the window; `focus` is where the faces
     * are ("50% 22%": centred, a little below the top).
     */
    windowPhoto: { src: "/assets/img/ceremony-couple.webp", alt: "Janvi and Rohit in their wedding clothes", focus: "50% 22%" },
    thanks: { title: "Thank you!", line: "We can’t wait to celebrate with you in Tuscany." },
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
    /** Every celebration's "Location" button opens maps on this (the villa's name or address once confirmed). */
    mapsQuery: "Villa La Foce, Tuscany, Italy",
    name: "Villa La Foce",
    address: "Strada della Vittoria, 2, 53042 Chianciano Terme SI, Tuscany, Italy",
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
  /**
   * S · The wishing booth. Guests' wishes stack up as cards, and "View all wishes" shows every one
   * with the count. Every guest wish waits for the couple's approval in /studio.
   *
   * Until enough guests have written, the booth is kept full by the couple's welcome card and the
   * sample wishes below: guests see them as wishes on the booth and in "View all wishes". Change
   * them to your own words (family, friends), add or remove any, or set `samples: []` to show only
   * real wishes. They step aside on their own once `samplesUntil` guest wishes have been approved.
   */
  wishBooth: {
    welcome: { message: "Every wish you leave here, we will keep, and read again on each anniversary.", name: "Janvi & Rohit" },
    samplesUntil: 12,
    samples: [
      { name: "Meera Kapoor", relation: "Janvi's cousin", message: "From building forts in Nani's garden to this day. May your life together be as full of laughter as our childhood summers." },
      { name: "Arjun Malhotra", relation: "Rohit's best friend", message: "Brother, you found the one who laughs at your terrible jokes. Hold on to her forever!" },
      { name: "Priya & Karan", relation: "Family friends", message: "Wishing you a marriage full of patience, kindness and long Sunday breakfasts." },
      { name: "Dadi", relation: "Janvi's grandmother", message: "Sada suhagan raho, beta. My blessings are with you both, today and always." },
      { name: "Sneha Iyer", relation: "College roommate", message: "To the girl who planned every trip: here is to the greatest adventure of all. So happy for you!" },
      { name: "Vikram Singh", relation: "Rohit's uncle", message: "May Lord Ganesha bless your new journey with wisdom, health and prosperity." },
      { name: "Ananya Rao", relation: "Childhood friend", message: "Watching you two together is the sweetest thing. Wishing you a lifetime of love in every language." },
      { name: "The Sharma Family", relation: "Neighbours", message: "Our street will miss your music on Sunday evenings! Love and blessings to the beautiful couple." },
      { name: "Kabir Mehta", relation: "Rohit's colleague", message: "Congratulations! May your home always be full of good food, good friends and great stories." },
      { name: "Nisha Verma", relation: "Janvi's aunt", message: "You were the most beautiful bride I have ever seen. May every day feel like this one." },
      { name: "Rahul & Divya", relation: "Cousins", message: "Two wonderful families, one big celebration. Cannot wait to dance at the sangeet with you!" },
      { name: "Tanvi Joshi", relation: "School friend", message: "Love, trust and a lot of chai. That is the recipe. Congratulations to you both!" },
      { name: "Aditya Bose", relation: "Rohit's cousin", message: "Bhaiya, you finally did it! Welcome to the family, Bhabhi. We are so lucky to have you." },
      { name: "Kavya Nair", relation: "Janvi's colleague", message: "May your marriage be as beautiful as Tuscany in August. Sending you so much love." },
      { name: "Nana & Nani", relation: "Janvi's grandparents", message: "Fifty-two years together taught us one thing: always hold hands. Our blessings, bachchon." },
      { name: "Ishaan Gupta", relation: "University friend", message: "From late-night study sessions to this. So proud of you both. Here is to forever!" },
      { name: "Pooja & Sameer", relation: "Family friends", message: "Wishing you endless adventures, quiet mornings and a love that grows deeper every year." },
      { name: "Riya Desai", relation: "Janvi's best friend", message: "My partner in crime is getting married! I love you both. Thank you for letting me be part of this." },
      { name: "Manish Kumar", relation: "Rohit's mentor", message: "Marriage is the finest partnership there is. May yours be blessed with joy and understanding." },
      { name: "Simran Kaur", relation: "Cousin", message: "May your love story be the one we all tell at family weddings for years to come." },
    ] as { name: string; relation?: string; message: string }[],
  },
  /**
   * "Need help?": three cards guests can call or message on WhatsApp, all shown together.
   * Fill in each `phone` with its country code (e.g. "+91 98765 43210"): until a card has a number
   * it says the number is on its way, and its Call and WhatsApp buttons wait. If someone's WhatsApp
   * is on a different number, put it in `whatsapp`; leave it "" to use the same `phone`.
   */
  help: {
    contacts: [
      { side: "The Groom's Family", name: "Mr. Vasu", role: "Father of the groom", phone: "97856423110", whatsapp: "" },
      { side: "The Bride's Family", name: "Mr. Kapoor", role: "Father of the bride", phone: "97856423110", whatsapp: "" },
      { side: "Event Coordinator", name: "[Coordinator's name]", role: "Wedding & event coordinator", phone: "97856423110", whatsapp: "" },
    ],
  },
  rsvp: {
    deadline: "", // [YYYY-MM-DD]
    maxGuests: 6,
    askEvents: true,
    askDiet: true,
  },
  /** The closing screen: the words on its picture (with the date, and a button back to the top). */
  thankYou: {
    title: "Thank You",
    line: "Your love, blessings and presence made our celebration even more special.",
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
