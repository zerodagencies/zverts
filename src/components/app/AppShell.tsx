import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    LayoutDashboard,
    BookOpen,
    User as UserIcon,
    Shield,
    Menu,
    X,
    Sparkles,
    Bot,
    TrendingUp,
    CreditCard,
    Settings,
} from "lucide-react";
import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { ThemeToggle} from "./ThemeToggle";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAdminPaymentAlerts } from "@/hooks/useAdminPaymentAlerts";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

const SiteFooter = lazy(() => import("./SiteFooter").then((m) => ({ default: m.SiteFooter })));
const NotificationCenter = lazy(() =>
    import("./NotificationCenter").then((m) => ({ default: m.NotificationCenter })),
);
const InstallPrompt = lazy(() =>
    import("./InstallPrompt").then((m) => ({ default: m.InstallPrompt })),
);
const SupportContactPopup = lazy(() =>
    import("./SupportContactPopup").then((m) => ({ default: m.SupportContactPopup })),
);

export const AppShell = ({ children }: { children: ReactNode }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [isAdmin, setIsAdmin] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const attendanceMarkedFor = useRef<string | null>(null);

    useEffect(() => {
        if (!user) { setIsAdmin(false); return; }
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })
            .then(({ data }) => setIsAdmin(!!data));
    }, [user]);

    // Mark today's attendance once per user per browser session.
    // The RPC is idempotent (ON CONFLICT DO NOTHING) so calling it every
    // app load is safe — it won't create duplicate rows or reset the streak.
    useEffect(() => {
        if (!user || attendanceMarkedFor.current === user.id) return;
        attendanceMarkedFor.current = user.id;
        supabase.rpc("mark_attendance").then(({ error }) => {
            if (error) console.error("mark_attendance failed:", error.message);
        });
    }, [user]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useAdminPaymentAlerts(isAdmin);
    useBrowserNotifications();

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev || "";
            };
        }
    }, [mobileOpen]);

    // Restore scroll on route change (PWA safety)
    useEffect(() => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.documentElement.style.overflow = "";
        document.body.removeAttribute("data-scroll-locked");
    }, [location.pathname]);

    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const displayName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        user?.email?.split("@")[0] ??
        "You";

    // Core nav items (no Upgrade — that's a CTA button)
    const navItems = [
        { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
        { to: "/courses", icon: BookOpen, label: t("nav.courses") },
        // { to: "/ai", icon: Bot, label: "Vert AI" },
        { to: "/growth", icon: TrendingUp, label: "Growth" },
        { to: "/payments", icon: CreditCard, label: "Payments" },
        ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
    ];

    return (
        <div
            className={cn(
                "min-h-screen flex flex-col",
                theme !== "dark" &&
                    "bg-[radial-gradient(ellipse_at_top,_hsl(245_78%_56%_/_0.06),_transparent_60%)]",
            )}
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
                <div className="container flex h-14 items-center gap-3">
                    {/* Logo */}
                    <Link
                        to={user ? "/dashboard" : "/"}
                        className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    >
                        <img
                            src={theme === "dark" ? "/hero-light.svg" : "/hero-dark.svg"}
                            alt="ZverTs"
                            className="h-8 w-auto object-contain"
                            loading="eager"
                            decoding="async"
                        />
                    </Link>

                    {/* Desktop nav */}
                    {user && (
                        <nav className="hidden md:flex items-center gap-0.5 ml-2">
                            {navItems.map((n) => (
                                <NavLink
                                    key={n.to}
                                    to={n.to}
                                    className={({ isActive }) =>
                                        cn(
                                            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "text-primary bg-primary/8"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                                            // Admin gets a subtle shield tint
                                            n.to === "/admin" &&
                                                "text-amber-500 hover:text-amber-400",
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <n.icon className="h-3.5 w-3.5 shrink-0" />
                                            <span>{n.label}</span>
                                            {isActive && (
                                                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Desktop right actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* <LanguageToggle /> */}
                        <ThemeToggle />
                        {user ? (
                            <>
                                <Suspense fallback={null}>
                                    <NotificationCenter />
                                </Suspense>

                                {/* Upgrade CTA */}
                                <Link to="/buy">
                                    <Button
                                        size="sm"
                                        className="bg-gradient-lime text-primary-foreground shadow-glow ml-1 gap-1.5"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" /> Upgrade
                                    </Button>
                                </Link>

                                {/* Avatar / profile */}
                                <button
                                    onClick={() => navigate("/settings")}
                                    aria-label="Settings"
                                    className="ml-1 flex items-center justify-center h-8 w-8 rounded-full overflow-hidden ring-1 ring-border hover:ring-primary transition-all"
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={async () => {
                                        await signOut();
                                        navigate("/");
                                    }}
                                    aria-label="Sign out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" onClick={() => navigate("/auth")}>
                                {t("nav.signin")}
                            </Button>
                        )}
                    </div>

                    {/* Mobile right: notifications + hamburger */}
                    <div className="flex items-center gap-1 md:hidden">
                        {user && (
                            <Suspense fallback={null}>
                                <NotificationCenter />
                            </Suspense>
                        )}
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            className={cn(
                                "flex items-center justify-center h-9 w-9 rounded-lg border transition-colors",
                                mobileOpen
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-foreground hover:bg-muted",
                            )}
                        >
                            {mobileOpen ? (
                                <X className="h-4.5 w-4.5" />
                            ) : (
                                <Menu className="h-4.5 w-4.5" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Mobile drawer ──────────────────────────────────────────────── */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 top-14 z-30 bg-background/70 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Panel */}
                    <div className="md:hidden fixed left-0 right-0 top-14 z-40 border-b border-border/60 bg-card/98 backdrop-blur-xl shadow-2xl animate-fade-in max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
                        {/* User identity */}
                        {user && (
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60">
                                <div className="h-10 w-10 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-mono uppercase px-2 py-0.5 border border-amber-500/30">
                                        Admin
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Nav items */}
                        {user && (
                            <nav className="px-3 py-3 grid grid-cols-2 gap-1.5">
                                {navItems.map((n) => (
                                    <NavLink
                                        key={n.to}
                                        to={n.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted/40 text-foreground/80 hover:bg-muted hover:text-foreground",
                                                n.to === "/admin" &&
                                                    !{ isActive: false }.isActive &&
                                                    "text-amber-500",
                                            )
                                        }
                                    >
                                        <n.icon className="h-4 w-4 shrink-0" />
                                        <span>{n.label}</span>
                                    </NavLink>
                                ))}

                                {/* Profile */}
                                <NavLink
                                    to="/profile"
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted/40 text-foreground/80 hover:bg-muted hover:text-foreground",
                                        )
                                    }
                                >
                                    <UserIcon className="h-4 w-4 shrink-0" />
                                    <span>{t("nav.profile")}</span>
                                </NavLink>

                                {/* Settings */}
                                <NavLink
                                    to="/settings"
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted/40 text-foreground/80 hover:bg-muted hover:text-foreground",
                                        )
                                    }
                                >
                                    <Settings className="h-4 w-4 shrink-0" />
                                    <span>Settings</span>
                                </NavLink>
                            </nav>
                        )}

                        {/* Upgrade CTA */}
                        {user && (
                            <div className="px-3 pb-3">
                                <Link to="/buy" onClick={() => setMobileOpen(false)}>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-lime text-primary-foreground shadow-glow">
                                        <Sparkles className="h-4 w-4 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">Upgrade to Pro</p>
                                            <p className="text-xs opacity-80">
                                                Unlock credits &amp; AI Tutor
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Preferences + sign out */}
                        <div className="px-3 pb-4 pt-1 border-t border-border/60 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                                {/* <LanguageToggle /> */}
                                <ThemeToggle />
                            </div>
                            {user ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        setMobileOpen(false);
                                        await signOut();
                                        navigate("/");
                                    }}
                                    className="gap-2"
                                >
                                    <LogOut className="h-3.5 w-3.5" /> {t("nav.signout")}
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setMobileOpen(false);
                                        navigate("/auth");
                                    }}
                                >
                                    {t("nav.signin")}
                                </Button>
                            )}
                        </div>
                    </div>
                </>
            )}

            <main className="flex-1">{children}</main>
            <Suspense fallback={null}>
                <SiteFooter />
            </Suspense>
            <Suspense fallback={null}>
                <InstallPrompt />
            </Suspense>
            {user && (
                <Suspense fallback={null}>
                    <SupportContactPopup />
                </Suspense>
            )}
        </div>
    );
};
