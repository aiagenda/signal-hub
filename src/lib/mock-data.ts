export type Edition = {
  slug: string;
  number: number;
  title: string;
  date: string;
  description: string;
  tags: string[];
  intro: string;
  sections: {
    key: "global-ai" | "tool-radar" | "builder" | "budapest" | "weekend" | "partner";
    title: string;
    items: { title: string; summary: string; source?: string; url?: string }[];
  }[];
};

export const editions: Edition[] = [
  {
    slug: "edition-024-the-agent-economy",
    number: 24,
    title: "The Agent Economy hits Budapest",
    date: "2026-04-26",
    description:
      "Anthropic's new agent SDK reshapes pricing, OpenAI ships memory v3, and Budapest's first AI-native VC opens shop in District V.",
    tags: ["Agents", "VC", "Budapest", "Spring"],
    intro:
      "This week the agent stack stopped being a demo and started being a line item. We unpack what that means for builders shipping in Budapest, plus where to actually go this weekend if the weather holds.",
    sections: [
      {
        key: "global-ai",
        title: "Global AI Signal",
        items: [
          { title: "Anthropic ships Agent SDK 1.0", summary: "First-class tool routing, durable memory, and a pricing model that punishes chat-style waste. Expect the GTM playbooks to follow within weeks.", source: "Anthropic", url: "#" },
          { title: "OpenAI memory becomes cross-product", summary: "Memory now spans ChatGPT, the API, and Operator — the first credible step toward a personal model graph.", source: "OpenAI", url: "#" },
          { title: "EU AI Act: the quiet enforcement phase", summary: "Brussels signals that the first fines will target deployers, not just model providers. Compliance budgets just shifted.", source: "Politico EU", url: "#" },
        ],
      },
      {
        key: "tool-radar",
        title: "Tool Radar",
        items: [
          { title: "Linear Agents", summary: "Native agent runs inside issues — finally a sane way to let an LLM touch your backlog without wrecking it.", source: "Linear", url: "#" },
          { title: "Vercel AI SDK 5", summary: "Streaming UI primitives that don't fight your design system. Worth the migration.", source: "Vercel", url: "#" },
        ],
      },
      {
        key: "builder",
        title: "Builder Angle",
        items: [
          { title: "The new unit economics of agents", summary: "If your product still bills per seat while costing per token, you're underwater. A short framework for repricing without breaking trust.", source: "Signal Editorial" },
        ],
      },
      {
        key: "budapest",
        title: "Budapest Tech & Business",
        items: [
          { title: "Signal Ventures opens in District V", summary: "A €40M fund led by ex-Bitrise and Wise operators, focused on AI-native B2B out of CEE.", source: "Forbes Hungary", url: "#" },
          { title: "Bánk Levente joins Starling Bank as VP Eng", summary: "Another senior Budapest operator going remote-senior at a UK fintech. The talent gravity continues.", source: "LinkedIn", url: "#" },
          { title: "Craft Conference 2026 lineup drops", summary: "Strong agents track this year. Early-bird closes Friday.", source: "Craft", url: "#" },
        ],
      },
      {
        key: "weekend",
        title: "Weekend Signal",
        items: [
          { title: "Saturday — Rosalia season at Gül Baba", summary: "The roses on Mecset utca are peaking. Go before 10am, then walk down to Bem rakpart for coffee at Espresso Embassy." },
          { title: "Sunday — Szentendre by HÉV", summary: "Skip the main drag. Head to the ArtMill and the new natural wine bar on Bogdányi. Back in town by 6." },
          { title: "Evening pick — Mazel Tov garden reopens", summary: "The summer courtyard is back. Book for 7:30, not 9." },
        ],
      },
      {
        key: "partner",
        title: "Featured Partner",
        items: [
          { title: "Bitrise — Mobile DevOps for AI-era apps", summary: "Trusted by 100,000+ mobile teams. New AI test triage cuts CI noise by ~40%.", source: "Sponsored", url: "#" },
        ],
      },
    ],
  },
  {
    slug: "edition-023-spring-reset",
    number: 23,
    title: "Spring reset: models, money, and Margit-sziget",
    date: "2026-04-19",
    description: "Gemini 3 leaks, the Hungarian SaaS funding map, and a weekend built around the first warm day of the year.",
    tags: ["Models", "Funding", "Outdoors"],
    intro: "Short edition this week. The signal is clear: capital is moving back into applied AI, and Budapest is finally outdoors again.",
    sections: [
      { key: "global-ai", title: "Global AI Signal", items: [{ title: "Gemini 3 benchmarks leak", summary: "If real, the gap on long-context reasoning narrows considerably." }] },
      { key: "tool-radar", title: "Tool Radar", items: [{ title: "Cursor 1.0 ships background agents", summary: "Worth a one-week trial even if you're a Zed loyalist." }] },
      { key: "budapest", title: "Budapest Tech & Business", items: [{ title: "Hungarian SaaS funding Q1 map", summary: "12 rounds, €68M total. Vertical AI dominates." }] },
      { key: "weekend", title: "Weekend Signal", items: [{ title: "Margit-sziget musical fountain returns", summary: "Sunset show at 8:15pm. Bring a blanket." }] },
    ],
  },
  {
    slug: "edition-022-the-quiet-quarter",
    number: 22,
    title: "The quiet quarter is over",
    date: "2026-04-12",
    description: "Q2 launch season begins, a new co-working space opens on Király utca, and where to eat lángos that isn't the market.",
    tags: ["Launches", "Spaces", "Food"],
    intro: "Three months of model releases without product follow-through. That ends this week.",
    sections: [
      { key: "global-ai", title: "Global AI Signal", items: [{ title: "Meta opens Llama 4 weights", summary: "Permissive license, real reasoning gains." }] },
      { key: "budapest", title: "Budapest Tech & Business", items: [{ title: "Loffice opens Király flagship", summary: "200 desks, rooftop, real coffee." }] },
      { key: "weekend", title: "Weekend Signal", items: [{ title: "Retró Lángos in Óbuda", summary: "Skip the market. Go here." }] },
    ],
  },
  {
    slug: "edition-021-march-debrief",
    number: 21,
    title: "March debrief & the agent backlash",
    date: "2026-04-05",
    description: "The first real critiques of agent reliability, plus a quiet shift in Budapest's startup capital flows.",
    tags: ["Agents", "Capital", "Debate"],
    intro: "Pushback is healthy. This week's signal sorts noise from substance.",
    sections: [
      { key: "global-ai", title: "Global AI Signal", items: [{ title: "Stanford agent reliability paper", summary: "78% task completion in lab, 31% in production. Read the methodology." }] },
      { key: "weekend", title: "Weekend Signal", items: [{ title: "Tavaszi Fesztivál closing weekend", summary: "Two free outdoor concerts at Vörösmarty tér." }] },
    ],
  },
];

export const sources = [
  { id: 1, name: "Anthropic Blog", url: "https://anthropic.com/news", category: "Global AI", active: true },
  { id: 2, name: "OpenAI Blog", url: "https://openai.com/blog", category: "Global AI", active: true },
  { id: 3, name: "Forbes Hungary", url: "https://forbes.hu", category: "Budapest Business", active: true },
  { id: 4, name: "HVG Tech", url: "https://hvg.hu/tech", category: "Budapest Tech", active: true },
  { id: 5, name: "We Love Budapest", url: "https://welovebudapest.com", category: "Weekend", active: true },
  { id: 6, name: "Funzine", url: "https://funzine.hu", category: "Weekend", active: false },
  { id: 7, name: "TechCrunch", url: "https://techcrunch.com", category: "Global AI", active: true },
  { id: 8, name: "Pitchbook CEE", url: "https://pitchbook.com", category: "VC / Funding", active: true },
];

export const contentItems = [
  { id: 1, title: "Anthropic ships Agent SDK 1.0", category: "Global AI", status: "approved", score: 94, source: "Anthropic Blog" },
  { id: 2, title: "Gemini 3 benchmarks leak on HN", category: "Global AI", status: "review", score: 71, source: "TechCrunch" },
  { id: 3, title: "Signal Ventures opens in District V", category: "Budapest Business", status: "approved", score: 89, source: "Forbes Hungary" },
  { id: 4, title: "Loffice Király flagship opens", category: "Budapest Tech", status: "draft", score: 62, source: "HVG Tech" },
  { id: 5, title: "Mazel Tov garden reopens for summer", category: "Weekend", status: "approved", score: 81, source: "We Love Budapest" },
  { id: 6, title: "EU AI Act enforcement primer", category: "Global AI", status: "review", score: 76, source: "TechCrunch" },
  { id: 7, title: "Margit-sziget fountain schedule", category: "Weekend", status: "approved", score: 68, source: "We Love Budapest" },
  { id: 8, title: "Craft Conference 2026 lineup", category: "Budapest Tech", status: "approved", score: 84, source: "HVG Tech" },
  { id: 9, title: "Linear Agents launch", category: "Tool Radar", status: "approved", score: 90, source: "TechCrunch" },
  { id: 10, title: "Random PR pitch from agency", category: "Global AI", status: "rejected", score: 22, source: "TechCrunch" },
];

export const sponsors = [
  { id: 1, company: "Bitrise", contact: "Anna Kovács", email: "anna@bitrise.io", category: "Premium Partner", status: "active" },
  { id: 2, company: "Tresorit", contact: "Márk Nagy", email: "mark@tresorit.com", category: "Newsletter + Social", status: "negotiating" },
  { id: 3, company: "Wise Budapest", contact: "Júlia Tóth", email: "julia@wise.com", category: "Sponsored Mention", status: "lead" },
  { id: 4, company: "Starling Bank", contact: "David Kiss", email: "david@starling.com", category: "Monthly Partner", status: "active" },
  { id: 5, company: "Loffice", contact: "Petra Szabó", email: "petra@loffice.hu", category: "Sponsored Mention", status: "won" },
  { id: 6, company: "Espresso Embassy", contact: "Bence Varga", email: "hello@embassy.coffee", category: "Sponsored Mention", status: "lost" },
];

export const agentRuns = [
  { id: 1, agent: "Source Crawler", status: "success", items: 47, time: "2h ago" },
  { id: 2, agent: "Content Scorer", status: "success", items: 47, time: "2h ago" },
  { id: 3, agent: "Weekend Curator", status: "running", items: 12, time: "now" },
  { id: 4, agent: "Edition Drafter", status: "queued", items: 0, time: "—" },
];

export const metrics = {
  subscribers: 8420,
  subscribersDelta: "+312 this week",
  draftEditions: 1,
  pendingItems: 14,
  sponsorLeads: 3,
  agentRuns: 47,
};

export const pricingTiers = [
  {
    name: "Sponsored Mention",
    price: "€450",
    cadence: "per edition",
    description: "A sharp, native paragraph inside a relevant section. Written by us, approved by you.",
    features: ["1 native paragraph", "Section-relevant placement", "Tracked link", "Same-week turnaround"],
  },
  {
    name: "Newsletter + Social",
    price: "€1,200",
    cadence: "per edition",
    description: "Featured placement plus a coordinated post on our LinkedIn and X channels.",
    features: ["Featured Partner block", "1 LinkedIn post", "1 X / Twitter post", "Performance recap"],
    highlight: true,
  },
  {
    name: "Monthly Partner",
    price: "€3,800",
    cadence: "per month",
    description: "Four consecutive editions, social amplification, and a brand mention in every footer.",
    features: ["4 Featured Partner slots", "4 social posts", "Footer brand line", "Monthly insight call"],
  },
  {
    name: "Premium Partner",
    price: "Custom",
    cadence: "quarterly",
    description: "Co-branded editorial moments, event collabs, and category exclusivity in your vertical.",
    features: ["Category exclusivity", "Co-branded editions", "Event partnership", "Dedicated lead"],
  },
];
