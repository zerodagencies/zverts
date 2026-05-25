import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { CreditCard, Users as UsersIcon, ShieldCheck } from "lucide-react";

const Admin = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const loadPending = async () => {
    const { count } = await supabase
      .from("payments" as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(async ({ data }) => {
      setIsAdmin(!!data);
      if (data) {
        const [{ data: u }, { data: l }, { data: s }] = await Promise.all([
          supabase.from("profiles").select("id,name,email,total_gems,total_xp,current_streak,last_active").order("last_active", { ascending: false }),
          supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }),
        ]);
        setUsers(u ?? []); setLogs(l ?? []); setIsSuper(!!s);
        loadPending();
        const ch = supabase.channel("admin-overview-payments")
          .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => loadPending())
          .subscribe();
        return () => { supabase.removeChannel(ch); };
      }
    });
  }, [user]);

  if (loading || isAdmin === null) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell>
      <section className="container py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-6">{t("admin.title")}</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/payments" className="group rounded-2xl border border-border bg-gradient-card p-5 shadow-card hover:border-primary/60 transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div className="font-display text-lg">Payments</div>
              {pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-primary text-primary-foreground text-xs font-mono px-2 py-0.5 animate-pulse">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2">Review &amp; approve user payments</p>
          </Link>
          <Link to="/admin/users" className="group rounded-2xl border border-border bg-gradient-card p-5 shadow-card hover:border-primary/60 transition-colors">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-primary" />
              <div className="font-display text-lg">Users</div>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2">Credits, AI, lock/unlock</p>
          </Link>
          {isSuper && (
            <Link to="/admin/management" className="group rounded-2xl border border-border bg-gradient-card p-5 shadow-card hover:border-primary/60 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="font-display text-lg">Admins</div>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-2">Grant or revoke admin roles</p>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card mb-6">
          <h2 className="font-display text-2xl mb-4">{t("admin.users")} ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left font-mono text-xs text-muted-foreground border-b border-border"><th className="py-2">Name</th><th>Email</th><th>{t("admin.gems")}</th><th>{t("admin.xp")}</th><th>🔥</th><th>{t("admin.lastActive")}</th></tr></thead>
              <tbody>{users.map(u => <tr key={u.id} className="border-b border-border/40"><td className="py-2">{u.name}</td><td className="text-muted-foreground">{u.email}</td><td>{u.total_gems}</td><td>{u.total_xp}</td><td>{u.current_streak}</td><td className="font-mono text-xs">{new Date(u.last_active).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <h2 className="font-display text-2xl mb-4">{t("admin.emailLogs")} ({logs.length})</h2>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground font-mono">No emails sent yet. Email infrastructure activates after a domain is configured.</p> :
            <div className="space-y-1 text-sm">{logs.map(l => <div key={l.id} className="flex justify-between border-b border-border/40 py-1.5"><span className="font-mono text-xs">{l.email_type}</span><span className="text-muted-foreground">{l.recipient_email}</span><span className={l.status === "sent" ? "text-primary" : "text-destructive"}>{l.status}</span></div>)}</div>}
        </div>
      </section>
    </AppShell>
  );
};
export default Admin;