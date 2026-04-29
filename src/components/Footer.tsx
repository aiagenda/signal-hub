import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A weekly briefing for people who want to stay ahead globally and move smarter locally — from Budapest, for everyone who lives, works or builds here.
          </p>
        </div>

        <FooterCol title="Read">
          <FooterLink to="/archive">Archive</FooterLink>
          <FooterLink to="/about">About</FooterLink>
        </FooterCol>

        <FooterCol title="Partner">
          <FooterLink to="/advertise">Advertise</FooterLink>
          <FooterLink to="/advertise" hash="lead">Become a partner</FooterLink>
        </FooterCol>

        <FooterCol title="Internal">
          <FooterLink to="/admin">Admin</FooterLink>
          <FooterLink to="/admin/edition-builder">Edition builder</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Budapest Signal. Curated in Budapest, read everywhere.</p>
          <p className="font-mono">v1.0 · weekly · Wednesdays 07:00 CET</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h4>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, hash, children }: { to: string; hash?: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} hash={hash} className="text-sm text-foreground/80 transition-colors hover:text-signal">
        {children}
      </Link>
    </li>
  );
}
