export type EventCategory =
  | "buli"
  | "koncert"
  | "fesztival"
  | "konferencia"
  | "meetup"
  | "workshop"
  | "sport"
  | "kultura"
  | "gasztronomia"
  | "gyerek"
  | "egyeb";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  buli: "Buli / Nightlife",
  koncert: "Koncert / Zene",
  fesztival: "Fesztivál",
  konferencia: "Konferencia",
  meetup: "Meetup / Networking",
  workshop: "Workshop / Képzés",
  sport: "Sport / Szabadtér",
  kultura: "Kultúra / Kiállítás",
  gasztronomia: "Gasztronómia",
  gyerek: "Gyerekprogram",
  egyeb: "Egyéb",
};

export const EVENT_CATEGORIES = Object.keys(EVENT_CATEGORY_LABELS) as EventCategory[];

export const HUNGARIAN_REGIONS: { value: string; label: string }[] = [
  { value: "budapest", label: "Budapest" },
  { value: "pest-megye", label: "Pest megye" },
  { value: "balaton", label: "Balaton" },
  { value: "debrecen", label: "Debrecen / Észak-Alföld" },
  { value: "miskolc", label: "Miskolc / Észak-Magyarország" },
  { value: "gyor", label: "Győr / Észak-Dunántúl" },
  { value: "pecs", label: "Pécs / Dél-Dunántúl" },
  { value: "kecskemet", label: "Kecskemét / Dél-Alföld" },
  { value: "szekesfehervar", label: "Székesfehérvár / Közép-Dunántúl" },
  { value: "veszprem", label: "Veszprém" },
  { value: "eger", label: "Eger / Tokaj" },
  { value: "egyeb", label: "Egyéb" },
];

export type Event = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  city: string | null;
  region: string | null;
  country: string;
  priceInfo: string | null;
  ticketUrl: string | null;
  coverImageUrl: string | null;
  organizerName: string | null;
  category: EventCategory | null;
  tags: string[];
  isFeatured: boolean;
  sourceUrl: string | null;
  status: "draft" | "published" | "archived";
  createdAt: string;
};
