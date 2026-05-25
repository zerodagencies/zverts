import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BookOpen, User as UserIcon, Trophy, Shield, Compass, Menu, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { ThemeToggle, LanguageToggle } from "./ThemeToggle";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import zvertLogo from "@/assets/zvert-logo.png";
import { SiteFooter } from "./SiteFooter";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);
  const { theme } = useTheme();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/courses", icon: BookOpen, label: t("nav.courses") },
    { to: "/explore", icon: Compass, label: t("nav.explore") },
    { to: "/leaderboard", icon: Trophy, label: t("nav.leaderboard") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: t("nav.admin") }] : []),
  ];

  return (
    <div className={cn("min-h-screen flex flex-col", theme !== "dark" && "bg-[radial-gradient(ellipse_at_top,_hsl(75_70%_50%_/_0.06),_transparent_60%)]")}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
            <img src={zvertLogo} alt="ZverT" className="h-9 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            <span className="font-display text-xl font-bold tracking-[0.15em] bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              ZverT
            </span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((n) => (
                <NavLink key={n.to} to={n.to} className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <n.icon className="inline h-4 w-4 mr-1.5 -mt-0.5" />{n.label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
              {user ? (
                <>
                  <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => navigate("/settings")}>
                    <UserIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={() => navigate("/auth")}>{t("nav.signin")}</Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <>
            <div className="md:hidden fixed inset-0 top-16 z-30 bg-background/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
            <div className="md:hidden absolute left-3 right-3 top-[68px] z-40 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-3 animate-fade-in">
              {user && (
                <nav className="flex flex-col gap-1">
                  {navItems.map((n) => (
                    <NavLink key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"}`}>
                      <n.icon className="h-4 w-4" />{n.label}
                    </NavLink>
                  ))}
                  <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"}`}>
                    <UserIcon className="h-4 w-4" />{t("nav.profile")}
                  </NavLink>
                </nav>
              )}
              <div className="mt-2 flex items-center justify-between rounded-lg border border-border/60 px-2 py-1.5">
                <span className="text-xs text-muted-foreground px-1">Preferences</span>
                <div className="flex items-center gap-1">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
              <div className="mt-2">
                {user ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}>
                    <LogOut className="h-4 w-4 mr-2" />{t("nav.signout")}
                  </Button>
                ) : (
                  <Button variant="default" size="sm" className="w-full" onClick={() => { setMobileOpen(false); navigate("/auth"); }}>
                    {t("nav.signin")}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
};
