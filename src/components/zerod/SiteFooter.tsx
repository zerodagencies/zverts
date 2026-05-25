import { Link } from "react-router-dom";
import {
  Atom,
  FlaskConical,
  Palette,
  Briefcase,
  GraduationCap,
  FileText,
  Database,
  Radio,
  Sparkles,
  Trophy,
  MapPin,
  Mail,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Apple,
  Play,
} from "lucide-react";
import zvertLogo from "@/assets/zvert-logo.png";

type LinkItem = { label: string; to: string; icon?: React.ComponentType<{ className?: string }> };

const features: LinkItem[] = [
  { label: "ZverT AI", to: "/dashboard", icon: Sparkles },
];

const categories: LinkItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: Atom },
  { label: "Courses", to: "/courses", icon: FlaskConical },
  { label: "Explore", to: "/explore", icon: Palette },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
];

const support: LinkItem[] = [
  { label: "About Us", to: "/info/about" },
  { label: "FAQ", to: "/info/faq" },
  { label: "Help Center", to: "/info/help" },
  { label: "Contact", to: "/info/contact" },
  { label: "Affiliates", to: "/info/affiliates" },
  { label: "Community", to: "/info/community" },
  { label: "Blog", to: "/info/blog" },
  { label: "Careers", to: "/info/careers" },
];

const legal: LinkItem[] = [
  { label: "Terms & Conditions", to: "/" },
  { label: "Privacy Policy", to: "/" },
  { label: "Refund Policy", to: "/" },
];

const socials = [
  { Icon: Facebook, href: "#", label: "Facebook" },
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Youtube, href: "#", label: "YouTube" },
];

function Column({
  title,
  items,
}: {
  title: string;
  items: LinkItem[];
}) {
  return (
    <div>
      <h4 className="text-sm font-display font-semibold tracking-wider uppercase text-foreground/90 mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {item.icon && (
                <item.icon className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              )}
              <span className="relative">
                {item.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary group-hover:w-full transition-all duration-300" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-border/60 overflow-hidden">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background/40" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.10),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--primary)/0.06),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Company */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={zvertLogo}
                alt="ZverT"
                className="h-10 w-auto drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                loading="lazy"
              />
              <span className="font-display text-2xl font-bold tracking-[0.18em] bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                ZverT
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Disciplined Learning for Future Leaders.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-primary/80 shrink-0" />
                <span>
                  Boalia
                  <br />
                  Rajshahi, Bangladesh
                </span>
              </div>
              <a
                href="mailto:hello@zvert.app"
                className="flex items-center gap-2.5 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4 text-primary/80" />
                hello@zvert.app
              </a>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border/60 bg-background/40 backdrop-blur text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-all hover:-translate-y-0.5"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <Column title="Features" items={features} />
          </div>
          <div className="lg:col-span-2">
            <Column title="Categories" items={categories} />
          </div>
          <div className="lg:col-span-2">
            <Column title="Support" items={support} />
          </div>

          {/* App download — coming soon */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-display font-semibold tracking-wider uppercase text-foreground/90 mb-4">
              Get the App
            </h4>
            <div className="flex flex-col gap-2.5">
              <div className="relative group flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 backdrop-blur px-3 py-2.5 opacity-70 cursor-not-allowed">
                <Play className="h-5 w-5 text-primary" />
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Get it on
                  </div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  Soon
                </span>
              </div>
              <div className="relative group flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 backdrop-blur px-3 py-2.5 opacity-70 cursor-not-allowed">
                <Apple className="h-5 w-5 text-primary" />
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Download on
                  </div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal strip */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center md:justify-end text-xs">
          {legal.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} ZverT. All rights reserved.</span>
          <a
            href="https://tauhidrana.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors underline-offset-4 hover:underline font-mono"
          >
            Crafted with care
          </a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
