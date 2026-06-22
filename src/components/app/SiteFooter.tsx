import { Link } from "react-router-dom";
import {
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Apple,
    Play,
    ArrowUpRight,
} from "lucide-react";
import { OfficialEmail } from "@/components/OfficialEmail";
import { useTheme } from "next-themes";

type NavLink = { label: string; to: string; external?: boolean };

const platform: NavLink[] = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Courses", to: "/courses" },
    { label: "Growth", to: "/growth" },
    { label: "Leaderboard", to: "/leaderboard" },
    // { label: "Vert AI", to: "/ai" },
    { label: "Buy Credits", to: "/buy" },
];

const company: NavLink[] = [
    { label: "About Us", to: "/info/about" },
    { label: "Help Center", to: "/info/help" },
    { label: "FAQ", to: "/info/faq" },
    { label: "Contact", to: "/info/contact" },
    { label: "Blog", to: "/info/blog" },
    { label: "Careers", to: "/info/careers" },
];

const legal: NavLink[] = [
    { label: "Terms & Conditions", to: "/terms-of-service" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Refund Policy", to: "/refund-policy" },
];

const socials = [
    { Icon: Facebook, href: "#", label: "Facebook" },
    { Icon: Twitter, href: "#", label: "X / Twitter" },
    { Icon: Instagram, href: "#", label: "Instagram" },
    { Icon: Youtube, href: "#", label: "YouTube" },
];

const LinkColumn = ({ title, items }: { title: string; items: NavLink[] }) => (
    <div>
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-foreground/70 mb-4">
            {title}
        </h4>
        <ul className="space-y-2.5">
            {items.map((item) => (
                <li key={item.label}>
                    <Link
                        to={item.to}
                        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                        {item.label}
                        {item.external && (
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

export const SiteFooter = () => {
    const year = new Date().getFullYear();
    const { theme } = useTheme();

    return (
        <footer className="relative mt-16 border-t border-border/60 overflow-hidden">
            {/* Gradient */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-background/95" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.07),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--primary)/0.04),_transparent_50%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
                    {/* ── Brand ─────────────────────────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-5">
                        <Link to="/" className="inline-flex items-center gap-2.5 group">
                            <img
                                src={theme === "dark" ? "/hero-light.svg" : "/hero-dark.svg"}
                                alt="ZverTs"
                                className="h-9 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)] group-hover:drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-all"
                                loading="lazy"
                            />
                            <span className="font-display text-xl font-bold tracking-[0.15em] bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                                ZverTs
                            </span>
                        </Link>

                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            A disciplined learning platform for future leaders. Turn YouTube
                            playlists into structured courses and grow every day.
                        </p>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary/70 shrink-0" />
                                <span>Boalia, Rajshahi, Bangladesh</span>
                            </div>
                            <OfficialEmail className="text-sm" />
                        </div>

                        {/* Socials */}
                        <div className="flex items-center gap-2">
                            {socials.map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="h-8 w-8 grid place-items-center rounded-full border border-border/70 bg-muted/30 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all hover:-translate-y-0.5"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* ── Platform ──────────────────────────────────────────────── */}
                    <div className="lg:col-span-2">
                        <LinkColumn title="Platform" items={platform} />
                    </div>

                    {/* ── Company ───────────────────────────────────────────────── */}
                    <div className="lg:col-span-2">
                        <LinkColumn title="Company" items={company} />
                    </div>

                    {/* ── Legal ─────────────────────────────────────────────────── */}
                    <div className="lg:col-span-2">
                        <LinkColumn title="Legal" items={legal} />
                    </div>

                    {/* ── Get the App ───────────────────────────────────────────── */}
                    <div className="lg:col-span-2">
                        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-foreground/70 mb-4">
                            Get the App
                        </h4>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { Icon: Play, pre: "Get it on", name: "Google Play" },
                                { Icon: Apple, pre: "Download on", name: "App Store" },
                            ].map(({ Icon, pre, name }) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 opacity-60 cursor-not-allowed select-none"
                                >
                                    <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
                                    <div className="leading-tight">
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            {pre}
                                        </div>
                                        <div className="text-sm font-semibold">{name}</div>
                                    </div>
                                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        Soon
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Trust badge */}
                        <div className="mt-5 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 space-y-0.5">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                Learning made for
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                                Future leaders
                            </div>
                            <div className="flex items-center gap-1 mt-1.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className="text-yellow-400 text-xs">
                                        ★
                                    </span>
                                ))}
                                <span className="text-[10px] text-muted-foreground font-mono ml-1">
                                    5.0
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom strip ──────────────────────────────────────────────── */}
                <div className="mt-12 pt-6 border-t border-border/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span>© {year} ZverTs. All rights reserved.</span>

                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                            {legal.map((l) => (
                                <Link
                                    key={l.label}
                                    to={l.to}
                                    className="hover:text-primary transition-colors"
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>

                        <span className="font-mono">
                            A product of{" "}
                            <a
                                href="https://zerod.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                <span className="text-foreground/70">ZeroD</span>
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
