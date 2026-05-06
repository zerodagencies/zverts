import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BookOpen, User as UserIcon, Trophy, Shield, Compass } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { ThemeToggle, LanguageToggle } from "./ThemeToggle";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);
  const { theme } = useTheme();

  return (
    <div className={cn("min-h-screen flex flex-col", theme !== "dark" && "bg-[radial-gradient(ellipse_at_top,_hsl(75_70%_50%_/_0.06),_transparent_60%)]")}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-lime grid place-items-center shadow-glow">
              <span className="font-display text-primary-foreground font-bold text-lg leading-none">0</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">ZeroD<span className="text-primary">.</span></span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutDashboard className="inline h-4 w-4 mr-1.5 -mt-0.5" />{t("nav.dashboard")}
              </NavLink>
              <NavLink to="/courses" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <BookOpen className="inline h-4 w-4 mr-1.5 -mt-0.5" />{t("nav.courses")}
              </NavLink>
              <NavLink to="/explore" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Compass className="inline h-4 w-4 mr-1.5 -mt-0.5" />{t("nav.explore")}
              </NavLink>
              <NavLink to="/leaderboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Trophy className="inline h-4 w-4 mr-1.5 -mt-0.5" />{t("nav.leaderboard")}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <Shield className="inline h-4 w-4 mr-1.5 -mt-0.5" />{t("nav.admin")}
                </NavLink>
              )}
            </nav>
          )}
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" size="icon" aria-label="Profile" onClick={() => navigate("/profile")}>
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
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-8">
        <div className="container text-xs text-muted-foreground font-mono flex items-center justify-between">
          <span>© ZeroD Academy</span>
          <a
            href="https://tauhidrana.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            {t("footer.credit")}
          </a>
        </div>
      </footer>
    </div>
  );
};
