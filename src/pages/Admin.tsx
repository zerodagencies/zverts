import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, Users as UsersIcon, ShieldCheck, Megaphone,
  Phone, ArrowRight, Flame, Gem, Zap, Clock, Mail,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "—"; }
};

const initials = (name: string | null, email: string | null) => {
  if (name?.trim()) return name.trim().charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
};

const avatarColor = (id: string) => {
  const colors = [
    "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-cyan-500",
    "bg-teal-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % colors.length;
  return colors[h];
};

const Admin = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const loadPending = async () => {
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    const init = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) return;
      const [{ data: u }, { data: l }, { data: s }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,email,last_active,user_progress(total_gems,total_xp,current_streak)")
          .order("last_active", { ascending: false }),
        supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }),
      ]);
      setUsers(u ?? []);
      setLogs(l ?? []);
      setIsSuper(!!s);
      await loadPending();
      setDataLoading(false);
      ch = supabase
        .channel(`admin:overview-payments:${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => loadPending())
        .subscribe();
    };
    init();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [user]);

  if (loading || isAdmin === null) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const navCards = [
    {
      to: "/admin/payments",
      icon: CreditCard,
      label: "Payments",
      desc: "Review & approve payment requests",
      badge: pendingCount > 0 ? `${pendingCount} pending` : null,
      badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      to: "/admin/users",
      icon: UsersIcon,
      label: "Users",
      desc: "Manage credits, AI access, lock/unlock",
      badge: null,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      to: "/admin/support-contacts",
      icon: Phone,
      label: "Support Contacts",
      desc: "Phone numbers from student pop-ups",
      badge: null,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      to: "/admin/broadcast",
      icon: Megaphone,
      label: "Broadcast",
      desc: "Push notifications to all users",
      badge: null,
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    ...(isSuper
      ? [{
          to: "/admin/management",
          icon: ShieldCheck,
          label: "Admin Management",
          desc: "Grant or revoke admin roles",
          badge: "Super Admin",
          badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        }]
      : []),
  ];

  return (
    <AppShell>
      <section className="container py-8 md:py-12 max-w-6xl space-y-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ admin</div>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5">
                {isSuper ? "Super Admin" : "Admin"}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-1.5">
              Admin Panel
            </h1>
          </div>
          {/* Summary stats */}
          {!dataLoading && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-display text-2xl font-semibold">{users.length}</div>
                <div className="text-xs font-mono text-muted-foreground">total users</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <div className={cn("font-display text-2xl font-semibold", pendingCount > 0 ? "text-amber-500" : "text-muted-foreground")}>
                  {pendingCount}
                </div>
                <div className="text-xs font-mono text-muted-foreground">pending payments</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navCards.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-elevated transition-all duration-200 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
                  <card.icon className="h-5 w-5" />
                </div>
                {card.badge && (
                  <span className={cn("rounded-full border text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 shrink-0", card.badgeStyle ?? "bg-primary/10 text-primary border-primary/20")}>
                    {card.badge}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  {card.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Users table ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ users</div>
              <h2 className="font-display text-xl mt-0.5">All members</h2>
            </div>
            {dataLoading ? (
              <Skeleton className="h-6 w-16 rounded-full" />
            ) : (
              <span className="text-xs font-mono text-muted-foreground">{users.length} total</span>
            )}
          </div>

          {dataLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-20 hidden sm:block" />
                  <Skeleton className="h-3 w-16 hidden md:block" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No users yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left text-xs font-mono uppercase tracking-wider text-muted-foreground px-5 py-2.5">User</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 py-2.5 hidden lg:table-cell">Email</th>
                    <th className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-accent" />Streak</span>
                    </th>
                    <th className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 py-2.5 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1"><Gem className="h-3 w-3 text-primary" />Gems</span>
                    </th>
                    <th className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 py-2.5 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" />XP</span>
                    </th>
                    <th className="text-right text-xs font-mono uppercase tracking-wider text-muted-foreground px-5 py-2.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" />Last active</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((u) => {
                    const prog = u.user_progress as Record<string, unknown> | null;
                    const streak = prog?.current_streak ?? 0;
                    const gems = prog?.total_gems ?? 0;
                    const xp = prog?.total_xp ?? 0;
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0", avatarColor(u.id))}>
                              {initials(u.name, u.email)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-[140px]">{u.name ?? "—"}</div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[140px] lg:hidden">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs hidden lg:table-cell max-w-[180px]">
                          <span className="truncate block">{u.email}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn("font-mono text-xs font-semibold", streak > 0 ? "text-accent" : "text-muted-foreground")}>
                            {streak}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center hidden sm:table-cell">
                          <span className="font-mono text-xs text-primary">{gems.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3 text-center hidden sm:table-cell">
                          <span className="font-mono text-xs text-yellow-600 dark:text-yellow-400">{xp.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">
                            {u.last_active ? fmtDate(u.last_active) : "Never"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Email logs ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ email logs</div>
            <h2 className="font-display text-xl mt-0.5 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> Sent emails
              {!dataLoading && <span className="text-sm font-sans font-normal text-muted-foreground">({logs.length})</span>}
            </h2>
          </div>

          {dataLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground font-mono">
              No emails sent yet.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {logs.map((l) => {
                const sent = l.status === "sent";
                const Icon = sent ? CheckCircle2 : l.status === "failed" ? XCircle : AlertCircle;
                return (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                    <Icon className={cn("h-4 w-4 shrink-0", sent ? "text-emerald-500" : l.status === "failed" ? "text-destructive" : "text-amber-500")} />
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-2">
                        {l.email_type}
                      </span>
                      <span className="text-sm truncate">{l.recipient_email}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {l.created_at ? fmtDate(l.created_at) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>
    </AppShell>
  );
};

export default Admin;
