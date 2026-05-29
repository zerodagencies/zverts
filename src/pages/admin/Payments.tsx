import { useEffect, useState, useCallback } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

const AdminPaymentsInner = () => {
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("payments" as any).select("*").eq("status", status).order("created_at", { ascending: false }).limit(200);
    const { data } = await q;
    let list = (data as any[]) ?? [];
    if (list.length) {
      const ids = Array.from(new Set(list.map((r) => r.user_id)));
      const { data: profiles } = await supabase.from("profiles").select("id,email,name").in("id", ids);
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      list = list.map((r) => ({ ...r, profile: map.get(r.user_id) }));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((r) =>
        r.trx_id?.toLowerCase().includes(s) ||
        r.profile?.email?.toLowerCase().includes(s) ||
        r.profile?.name?.toLowerCase().includes(s) ||
        r.sender_number?.includes(s)
      );
    }
    setRows(list);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  // Realtime: new submissions, approvals, rejections all refresh the list
  useEffect(() => {
    const ch = supabase
      .channel("admin:payments-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const approve = async (id: string) => {
    setActing(id);
    const { error } = await supabase.rpc("approve_payment" as any, { _payment_id: id });
    setActing(null);
    if (error) toast.error(error.message); else { toast.success("Approved"); load(); }
  };
  const reject = async (id: string) => {
    const note = prompt("Reason (optional):") ?? null;
    setActing(id);
    const { error } = await supabase.rpc("reject_payment" as any, { _payment_id: id, _note: note });
    setActing(null);
    if (error) toast.error(error.message); else { toast.success("Rejected"); load(); }
  };

  return (
    <AppShell>
      <section className="container py-10 max-w-6xl">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ admin · payments</div>
        <h1 className="font-display text-4xl font-semibold mt-2">Payment approvals</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(["pending", "approved", "rejected"] as Status[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${status === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s} {status === s && `(${rows.length})`}
            </button>
          ))}
          <Input placeholder="Search trx, email, sender…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs ml-auto" />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> :
           rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground font-mono">No {status} payments.</div> :
           <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="font-display text-lg">{r.profile?.name ?? "—"} <span className="text-sm text-muted-foreground font-normal">{r.profile?.email}</span></div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    {r.package_type} · {r.credits} credits · {r.amount} Tk · {r.method}
                  </div>
                  <div className="text-xs font-mono mt-1">
                    sender: <span className="text-foreground">{r.sender_number}</span> · trx: <span className="text-primary">{r.trx_id}</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
                  {r.admin_note && <div className="text-xs text-destructive mt-1">Note: {r.admin_note}</div>}
                </div>
                {status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={acting === r.id} onClick={() => approve(r.id)} className="bg-primary text-primary-foreground">Approve</Button>
                    <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => reject(r.id)} className="text-destructive border-destructive/40">Reject</Button>
                  </div>
                )}
              </div>
            ))}
           </div>}
        </div>
      </section>
    </AppShell>
  );
};

const AdminPayments = () => <RequireRole role="admin"><AdminPaymentsInner /></RequireRole>;
export default AdminPayments;
