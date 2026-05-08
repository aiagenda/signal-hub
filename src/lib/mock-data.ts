import type { Edition } from "./edition-types";

export type { Edition, EditionSectionKey } from "./edition-types";

export const editions: Edition[] = [
  {
    slug: "edition-024-az-ugynok-gazdasag",
    number: 24,
    title: "Az ügynök-gazdaság megérkezett Budapestre",
    date: "2026-04-26",
    description:
      "Az Anthropic új agent SDK-ja átszabja az árazást, az OpenAI memóriája v3-ra ugrik, és Budapest első MI-natív kockázati alapja megnyit az V. kerületben.",
    tags: ["Ügynökök", "VC", "Budapest", "Tavasz"],
    intro:
      "Ezen a héten az ügynök-stack megszűnt demó lenni — sortételé vált. Megnézzük, mit jelent ez a Budapesten építő csapatoknak, és hogy hová érdemes menni hétvégén, ha kitart az időjárás.",
    sections: [
      {
        key: "global-ai",
        title: "Globális MI jel",
        items: [
          {
            title: "Anthropic Agent SDK 1.0",
            summary:
              "Beépített eszköz-routing, tartós memória és olyan árazási modell, ami bünteti a chat-szerű pazarlást. Hetek múlva jönnek az új GTM-playbookok.",
            source: "Anthropic",
            url: "#",
          },
          {
            title: "Az OpenAI memóriája átível a termékeken",
            summary:
              "A memória most már a ChatGPT-t, az API-t és az Operatort is összeköti — ez az első hihető lépés egy személyes modellgráf felé.",
            source: "OpenAI",
            url: "#",
          },
          {
            title: "EU AI Act: a csendes végrehajtás szakasza",
            summary:
              "Brüsszel jelzi, hogy az első bírságok a felhasználókat célozzák, nem csak a modellszállítókat. Most költődik át a megfelelőségi büdzsé.",
            source: "Politico EU",
            url: "#",
          },
        ],
      },
      {
        key: "tool-radar",
        title: "Eszköz-radar",
        items: [
          {
            title: "Linear Agents",
            summary:
              "Natív ügynök-futtatások az issue-kon belül — végre épelméjű módon engedhetsz LLM-et a backlogodhoz anélkül, hogy szétverné.",
            source: "Linear",
            url: "#",
          },
          {
            title: "Vercel AI SDK 5",
            summary:
              "Streaming UI primitívek, amik nem harcolnak a design rendszereddel. Megéri a migrációt.",
            source: "Vercel",
            url: "#",
          },
        ],
      },
      {
        key: "builder",
        title: "Építő-szemszög",
        items: [
          {
            title: "Az ügynökök új unit economicsa",
            summary:
              "Ha a terméked még mindig per fő számláz, miközben tokenenként költ, víz alatt vagy. Rövid keretrendszer az újraárazáshoz a bizalom megsértése nélkül.",
            source: "Signal Editorial",
          },
        ],
      },
      {
        key: "budapest",
        title: "Budapesti tech & üzlet",
        items: [
          {
            title: "Signal Ventures nyit az V. kerületben",
            summary:
              "40 millió eurós alap ex-Bitrise és Wise operátorok vezetésével, B2B MI-natív CEE startupokra fókuszálva.",
            source: "Forbes Hungary",
            url: "#",
          },
          {
            title: "Bánk Levente a Starling Bank új VP Engineering-je",
            summary:
              "Egy újabb senior budapesti operátor megy remote-senior pozícióba egy UK fintechhez. A tehetség-gravitáció folytatódik.",
            source: "LinkedIn",
            url: "#",
          },
          {
            title: "Megjött a Craft Conference 2026 line-up",
            summary: "Idén erős ügynök-track. Az early-bird pénteken zár.",
            source: "Craft",
            url: "#",
          },
        ],
      },
      {
        key: "weekend",
        title: "Hétvégi jel",
        items: [
          {
            title: "Szombat — Rózsaszezon a Gül Babánál",
            summary:
              "A Mecset utcai rózsák most a csúcson vannak. Menj 10 előtt, aztán sétálj le a Bem rakpartra egy kávéért az Espresso Embassybe.",
          },
          {
            title: "Vasárnap — Szentendre HÉV-vel",
            summary:
              "Hagyd a fő utcát. Indulj az ArtMillbe és a Bogdányin az új naturbor-bárba. 6-ra otthon.",
          },
          {
            title: "Esti tipp — A Mazel Tov kert újra nyit",
            summary: "Visszatért a nyári udvar. Foglalj 7:30-ra, ne 9-re.",
          },
        ],
      },
      {
        key: "partner",
        title: "Kiemelt partner",
        items: [
          {
            title: "Bitrise — Mobil DevOps az MI-korszak appjaihoz",
            summary:
              "Több mint 100 000 mobilcsapat bízik benne. Az új MI-alapú teszt-triázs ~40%-kal csökkenti a CI-zajt.",
            source: "Szponzorált",
            url: "#",
          },
        ],
      },
    ],
  },
  {
    slug: "edition-023-tavaszi-reset",
    number: 23,
    title: "Tavaszi reset: modellek, pénz és Margit-sziget",
    date: "2026-04-19",
    description:
      "Gemini 3 szivárgások, a magyar SaaS-finanszírozási térkép, és egy hétvége az év első igazán meleg napja köré építve.",
    tags: ["Modellek", "Finanszírozás", "Szabadtér"],
    intro:
      "Rövid kiadás ezen a héten. A jel tiszta: a tőke visszamozdul az alkalmazott MI-be, és Budapest végre újra kint van.",
    sections: [
      {
        key: "global-ai",
        title: "Globális MI jel",
        items: [
          {
            title: "Kiszivárogtak a Gemini 3 benchmarkok",
            summary: "Ha igazak, a hosszú-kontextusú érvelésben jelentősen csökken a lemaradás.",
          },
        ],
      },
      {
        key: "tool-radar",
        title: "Eszköz-radar",
        items: [
          {
            title: "Cursor 1.0: háttér-ügynökök",
            summary: "Megér egy hetes próbát, akkor is, ha Zed-fanatikus vagy.",
          },
        ],
      },
      {
        key: "budapest",
        title: "Budapesti tech & üzlet",
        items: [
          {
            title: "Magyar SaaS-finanszírozási térkép Q1",
            summary: "12 kör, összesen 68 millió euró. A vertikális MI dominál.",
          },
        ],
      },
      {
        key: "weekend",
        title: "Hétvégi jel",
        items: [
          {
            title: "Visszatér a Margit-szigeti zenélő szökőkút",
            summary: "Naplemente-show 20:15-kor. Vigyél pokrócot.",
          },
        ],
      },
    ],
  },
  {
    slug: "edition-022-vege-a-csendes-negyedevnek",
    number: 22,
    title: "Vége a csendes negyedévnek",
    date: "2026-04-12",
    description:
      "Indul a Q2-es launch-szezon, új coworking nyit a Király utcán, és hol egyél lángost, ami nem a piacon van.",
    tags: ["Launchok", "Helyek", "Étel"],
    intro: "Három hónap modellbejelentés érdemi termék-követés nélkül. Ennek ezen a héten vége.",
    sections: [
      {
        key: "global-ai",
        title: "Globális MI jel",
        items: [
          {
            title: "Meta megnyitja a Llama 4 súlyokat",
            summary: "Megengedő licenc, valódi reasoning-előrelépés.",
          },
        ],
      },
      {
        key: "budapest",
        title: "Budapesti tech & üzlet",
        items: [
          {
            title: "Loffice Király flagship nyit",
            summary: "200 íróhely, tetőterasz, valódi kávé.",
          },
        ],
      },
      {
        key: "weekend",
        title: "Hétvégi jel",
        items: [{ title: "Retró Lángos Óbudán", summary: "Hagyd a piacot. Ide menj." }],
      },
    ],
  },
  {
    slug: "edition-021-marciusi-debrief",
    number: 21,
    title: "Márciusi debrief és az ügynök-ellencsapás",
    date: "2026-04-05",
    description:
      "Az első valódi kritikák az ügynökök megbízhatóságáról, és egy csendes elmozdulás Budapest startup-tőkeáramlásában.",
    tags: ["Ügynökök", "Tőke", "Vita"],
    intro: "Az ellenkezés egészséges. E heti jel szétválasztja a zajt a lényegtől.",
    sections: [
      {
        key: "global-ai",
        title: "Globális MI jel",
        items: [
          {
            title: "Stanford ügynök-megbízhatósági paper",
            summary:
              "78% feladatteljesítés laborban, 31% éles környezetben. Olvasd el a módszertant.",
          },
        ],
      },
      {
        key: "weekend",
        title: "Hétvégi jel",
        items: [
          {
            title: "Tavaszi Fesztivál záró hétvége",
            summary: "Két ingyenes szabadtéri koncert a Vörösmarty téren.",
          },
        ],
      },
    ],
  },
];

export const sources = [
  {
    id: 1,
    name: "Anthropic Blog",
    url: "https://anthropic.com/news",
    category: "Globális MI",
    active: true,
  },
  {
    id: 2,
    name: "OpenAI Blog",
    url: "https://openai.com/blog",
    category: "Globális MI",
    active: true,
  },
  {
    id: 3,
    name: "Forbes Hungary",
    url: "https://forbes.hu",
    category: "Budapesti üzlet",
    active: true,
  },
  { id: 4, name: "HVG Tech", url: "https://hvg.hu/tech", category: "Budapesti tech", active: true },
  {
    id: 5,
    name: "We Love Budapest",
    url: "https://welovebudapest.com",
    category: "Hétvége",
    active: true,
  },
  { id: 6, name: "Funzine", url: "https://funzine.hu", category: "Hétvége", active: false },
  {
    id: 7,
    name: "TechCrunch",
    url: "https://techcrunch.com",
    category: "Globális MI",
    active: true,
  },
  {
    id: 8,
    name: "Pitchbook CEE",
    url: "https://pitchbook.com",
    category: "VC / Finanszírozás",
    active: true,
  },
];

export const contentItems = [
  {
    id: 1,
    title: "Anthropic Agent SDK 1.0 érkezik",
    category: "Globális MI",
    status: "approved",
    score: 94,
    source: "Anthropic Blog",
  },
  {
    id: 2,
    title: "Gemini 3 benchmarkok kiszivárogtak a HN-en",
    category: "Globális MI",
    status: "review",
    score: 71,
    source: "TechCrunch",
  },
  {
    id: 3,
    title: "Signal Ventures nyit az V. kerületben",
    category: "Budapesti üzlet",
    status: "approved",
    score: 89,
    source: "Forbes Hungary",
  },
  {
    id: 4,
    title: "Loffice Király flagship nyit",
    category: "Budapesti tech",
    status: "draft",
    score: 62,
    source: "HVG Tech",
  },
  {
    id: 5,
    title: "Mazel Tov kert újra nyit nyárra",
    category: "Hétvége",
    status: "approved",
    score: 81,
    source: "We Love Budapest",
  },
  {
    id: 6,
    title: "EU AI Act végrehajtási alapok",
    category: "Globális MI",
    status: "review",
    score: 76,
    source: "TechCrunch",
  },
  {
    id: 7,
    title: "Margit-szigeti szökőkút menetrend",
    category: "Hétvége",
    status: "approved",
    score: 68,
    source: "We Love Budapest",
  },
  {
    id: 8,
    title: "Craft Conference 2026 line-up",
    category: "Budapesti tech",
    status: "approved",
    score: 84,
    source: "HVG Tech",
  },
  {
    id: 9,
    title: "Linear Agents launch",
    category: "Eszköz-radar",
    status: "approved",
    score: 90,
    source: "TechCrunch",
  },
  {
    id: 10,
    title: "Random PR-pitch egy ügynökségtől",
    category: "Globális MI",
    status: "rejected",
    score: 22,
    source: "TechCrunch",
  },
];

export const sponsors = [
  {
    id: 1,
    company: "Bitrise",
    contact: "Kovács Anna",
    email: "anna@bitrise.io",
    category: "Prémium partner",
    status: "active",
  },
  {
    id: 2,
    company: "Tresorit",
    contact: "Nagy Márk",
    email: "mark@tresorit.com",
    category: "Hírlevél + Social",
    status: "negotiating",
  },
  {
    id: 3,
    company: "Wise Budapest",
    contact: "Tóth Júlia",
    email: "julia@wise.com",
    category: "Szponzorált említés",
    status: "lead",
  },
  {
    id: 4,
    company: "Starling Bank",
    contact: "Kiss Dávid",
    email: "david@starling.com",
    category: "Havi partner",
    status: "active",
  },
  {
    id: 5,
    company: "Loffice",
    contact: "Szabó Petra",
    email: "petra@loffice.hu",
    category: "Szponzorált említés",
    status: "won",
  },
  {
    id: 6,
    company: "Espresso Embassy",
    contact: "Varga Bence",
    email: "hello@embassy.coffee",
    category: "Szponzorált említés",
    status: "lost",
  },
];

export const agentRuns = [
  { id: 1, agent: "Forrás-feltáró", status: "success", items: 47, time: "2 órája" },
  { id: 2, agent: "Tartalom-pontozó", status: "success", items: 47, time: "2 órája" },
  { id: 3, agent: "Hétvégi kurátor", status: "running", items: 12, time: "most" },
  { id: 4, agent: "Kiadás-író", status: "queued", items: 0, time: "—" },
];

export const metrics = {
  subscribers: 8420,
  subscribersDelta: "+312 ezen a héten",
  draftEditions: 1,
  pendingItems: 14,
  sponsorLeads: 3,
  agentRuns: 47,
};

export const pricingTiers = [
  {
    name: "Szponzorált említés",
    price: "180 000 Ft",
    cadence: "kiadásonként",
    description: "Egy éles, natív bekezdés egy releváns szekcióban. Mi írjuk, te jóváhagyod.",
    features: [
      "1 natív bekezdés",
      "Szekció-releváns elhelyezés",
      "Követett link",
      "Heten belüli átfutás",
    ],
  },
  {
    name: "Hírlevél + Social",
    price: "480 000 Ft",
    cadence: "kiadásonként",
    description: "Kiemelt elhelyezés és egy összehangolt poszt a LinkedIn- és X-csatornáinkon.",
    features: [
      "Kiemelt partner blokk",
      "1 LinkedIn poszt",
      "1 X / Twitter poszt",
      "Teljesítmény-összegzés",
    ],
    highlight: true,
  },
  {
    name: "Havi partner",
    price: "1 500 000 Ft",
    cadence: "havi díj",
    description: "Négy egymást követő kiadás, social-erősítés, és márkaemlítés minden footerben.",
    features: ["4 kiemelt partner slot", "4 social poszt", "Footer márkasor", "Havi insight-call"],
  },
  {
    name: "Prémium partner",
    price: "Egyedi",
    cadence: "negyedéves",
    description:
      "Co-branded szerkesztőségi pillanatok, eseménykollabok és kategória-exkluzivitás a vertikálodban.",
    features: [
      "Kategória-exkluzivitás",
      "Co-branded kiadások",
      "Eseménypartnerség",
      "Dedikált kontakt",
    ],
  },
];
