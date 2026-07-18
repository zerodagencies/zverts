import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Coins, Sparkles, ShoppingCart, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Payment = {
    id: string;
    credits: number;
    amount: number;
    method: string;
    trx_id: string;
    status: "pending" | "approved" | "rejected";
    admin_note: string | null;
    created_at: string;
};

const STATUS_META = {
    pending: {
        label: "Pending",
        icon: Clock,
        cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        cls: "text-destructive bg-destructive/10 border-destructive/30",
    },
};

const PaymentHistory = () => {
    const { user, loading } = useAuth();
    const ent = useEntitlements();
    const [rows, setRows] = useState<Payment[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!user) return;
        supabase
            .from("payments")
            .select("id,credits,amount,method,trx_id,status,admin_note,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                setRows((data as Payment[]) ?? []);
                setFetching(false);
            });
    }, [user]);

    if (loading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    const used = ent.playlist_conversions_left;

    return (
        <AppShell>
            <section className="container py-10 md:py-14 max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            / payments
                        </div>
                        <h1 className="font-display text-4xl font-semibold tracking-tight mt-1">
                            My payments
                        </h1>
                    </div>
                    <Link to="/buy">
                        <Button className="bg-gradient-lime text-primary-foreground shadow-glow gap-2">
                            <ShoppingCart className="h-4 w-4" /> Buy a pack
                        </Button>
                    </Link>
                </div>

                {/* Entitlement cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                    {/* Free conversions */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                                Conversions
                            </span>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-3xl">{ent.free_left}</span>
                            <span className="text-muted-foreground text-sm">remaining</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Use for converting YouTube playlists to courses.
                            </p>
                        </div>
                    </div>

                    {/* Convert credits */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                                Convert credits
                            </span>
                            <Coins className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-display text-3xl text-primary">
                            {ent.convert_credits}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {ent.convert_credits === 0
                                ? "Buy a pack to get credits"
                                : `${ent.convert_credits} conversion${ent.convert_credits !== 1 ? "s" : ""} available`}
                        </p>
                    </div>

                    {/* AI Tutor */}
                    <div
                        className={`rounded-2xl border p-5 space-y-3 ${ent.ai_enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                                AI Tutor
                            </span>
                            <Sparkles
                                className={`h-4 w-4 ${ent.ai_enabled ? "text-primary" : "text-muted-foreground"}`}
                            />
                        </div>
                        <div
                            className={`font-display text-2xl ${ent.ai_enabled ? "text-primary" : "text-muted-foreground"}`}
                        >
                            {ent.ai_enabled ? "Unlocked" : "Locked"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {ent.ai_enabled
                                ? "Lifetime access active"
                                : "Unlocked with first purchase"}
                        </p>
                    </div>
                </div>

                {/* Payment history */}
                <div>
                    <h2 className="font-display text-2xl font-semibold mb-4">Payment history</h2>
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        {fetching ? (
                            <div className="p-10 flex justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="p-10 text-center space-y-3">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground">No payments yet.</p>
                                <Link to="/buy">
                                    <Button variant="outline" size="sm">
                                        Buy your first pack
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {rows.map((r) => {
                                    const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                                    const Icon = meta.icon;
                                    return (
                                        <div
                                            key={r.id}
                                            className="p-4 sm:p-5 flex flex-wrap items-start gap-4"
                                        >
                                            <div className="flex-1 min-w-[180px] space-y-1">
                                                <div className="font-medium">
                                                    Premium · {r.credits} credit
                                                    {r.credits !== 1 ? "s" : ""}
                                                </div>
                                                <div className="text-xs font-mono text-muted-foreground">
                                                    {new Date(r.created_at).toLocaleString()} ·{" "}
                                                    {r.method}
                                                </div>
                                                <div className="text-xs font-mono text-muted-foreground/70">
                                                    TXN: {r.trx_id}
                                                </div>
                                                {r.admin_note && (
                                                    <div className="text-xs text-destructive mt-1 rounded-md bg-destructive/10 px-2 py-1 border border-destructive/20">
                                                        {r.admin_note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-display text-xl font-semibold">
                                                    {r.amount} Tk
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono uppercase tracking-wider ${meta.cls}`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                    {meta.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </AppShell>
    );
};
export default PaymentHistory;
