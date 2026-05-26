import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, Phone, Search, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  country_code: string | null;
  phone_number: string;
  whatsapp_enabled: boolean;
  source: string;
  submitted_at: string;
  joined_at: string | null;
  last_active: string | null;
  is_paid_user: boolean | null;
}

const SupportContacts = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    const { data, error } = await supabase.rpc("admin_list_support_contacts" as any, { _search: search || null, _limit: 1000 });
    if (error) return toast.error(error.message);
    setRows((data as any[]) ?? []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && new Date(r.submitted_at) < new Date(from)) return false;
      if (to && new Date(r.submitted_at) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [rows, from, to]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "WhatsApp", "Joined", "Last active", "Premium", "Submitted"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      const cells = [
        r.name, r.email ?? "",
        `${r.country_code ?? ""}${r.phone_number}`,
        r.whatsapp_enabled ? "yes" : "no",
        r.joined_at ?? "", r.last_active ?? "",
        r.is_paid_user ? "yes" : "no",
        r.submitted_at,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `support-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || isAdmin === null) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell>
      <section className="container py-10">
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4 font-mono">
          <ArrowLeft className="h-3 w-3" /> Back to Admin
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-3">
              <Phone className="h-7 w-7 text-primary" /> Support Contacts
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {filtered.length} of {rows.length} submissions
            </p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-9"
            />
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-auto" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-auto" />
          <Button onClick={load}>Search</Button>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left font-mono text-xs text-muted-foreground border-b border-border">
                <th className="py-3 px-4">Name</th>
                <th className="px-4">Email</th>
                <th className="px-4">Phone</th>
                <th className="px-4">Joined</th>
                <th className="px-4">Last active</th>
                <th className="px-4">Premium</th>
                <th className="px-4">Submitted</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground font-mono text-sm">No contacts yet.</td></tr>
              )}
              {filtered.map((r) => {
                const fullPhone = `${r.country_code ?? ""}${r.phone_number}`;
                return (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="px-4 text-muted-foreground">{r.email ?? "—"}</td>
                    <td className="px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        {fullPhone}
                        {r.whatsapp_enabled && <MessageCircle className="h-3.5 w-3.5 text-primary" aria-label="WhatsApp" />}
                      </div>
                    </td>
                    <td className="px-4 font-mono text-xs">{r.joined_at ? new Date(r.joined_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 font-mono text-xs">{r.last_active ? new Date(r.last_active).toLocaleDateString() : "—"}</td>
                    <td className="px-4">{r.is_paid_user ? <span className="text-primary font-mono text-xs">PAID</span> : <span className="text-muted-foreground font-mono text-xs">free</span>}</td>
                    <td className="px-4 font-mono text-xs">{new Date(r.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => copy(fullPhone)} className="h-8 gap-1">
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
};

export default SupportContacts;
