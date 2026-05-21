import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Egy hely. Egy ország. Minden este. — bulik, fesztiválok, meetupok, workshopok és minden
            más program Magyarországon, egy helyen.
          </p>
        </div>

        <FooterCol title="Programok">
          <FooterLink
            to="/events"
            search={{ region: undefined, category: undefined, from: undefined }}
          >
            Események
          </FooterLink>
          <FooterLink to="/events/submit">Esemény beküldése</FooterLink>
        </FooterCol>

        <FooterCol title="Olvasás">
          <FooterLink to="/archive">Archívum</FooterLink>
          <FooterLink to="/about">Rólunk</FooterLink>
        </FooterCol>

        <FooterCol title="Partner">
          <FooterLink to="/advertise">Hirdetés</FooterLink>
          <FooterLink to="/advertise" hash="lead">
            Legyél partner
          </FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Happn — Események Magyarországon.</p>
          <p className="font-mono shrink-0">happn.hu</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  hash,
  search,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to: any;
  hash?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search?: any;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        hash={hash}
        search={search}
        className="text-sm text-foreground/70 transition-colors hover:text-signal"
      >
        {children}
      </Link>
    </li>
  );
}
