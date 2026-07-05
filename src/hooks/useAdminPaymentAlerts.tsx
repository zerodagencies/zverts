import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Polls for new pending payment submissions (admins only) and pops a toast.
 * Realtime broadcast on payments was removed for security — admins poll instead.
 */
export function useAdminPaymentAlerts(isAdmin: boolean) {
    const navigate = useNavigate();
    const lastSeenRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isAdmin) return;
        let cancelled = false;

        // Seed the cursor so we don't toast pre-existing payments on mount
        (async () => {
            const { data } = await supabase
                .from("payments")
                .select("created_at")
                .order("created_at", { ascending: false })
                .limit(1);
            lastSeenRef.current = (data?.[0] as { created_at?: string })?.created_at ?? new Date().toISOString();
        })();

        const tick = async () => {
            if (!lastSeenRef.current) return;
            const { data } = await supabase
                .from("payments")
                .select("id,user_id,amount,method,trx_id,package_type,status,created_at")
                .eq("status", "pending")
                .gt("created_at", lastSeenRef.current)
                .order("created_at", { ascending: true })
                .limit(10);
            const rows = data ?? [];
            if (rows.length === 0) return;
            lastSeenRef.current = rows[rows.length - 1].created_at;
            for (const row of rows) {
                let label = "New payment request";
                try {
                    const { data: p } = await supabase
                        .from("profiles")
                        .select("name,email")
                        .eq("id", row.user_id)
                        .maybeSingle();
                    if (p) label = `${p.name ?? p.email} · ${row.amount} Tk (${row.method})`;
                } catch { /* profile fetch is best-effort */ }
                if (cancelled) return;
                toast(`💸 ${label}`, {
                    description: `trx: ${row.trx_id} · ${row.package_type}`,
                    duration: 12000,
                    action: { label: "Review", onClick: () => navigate("/admin/payments") },
                });
            }
        };

        const interval = setInterval(tick, 20000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [isAdmin, navigate]);
}
