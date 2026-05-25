import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes admins to realtime new payment submissions and pops a toast.
 * Click on toast jumps to /admin/payments.
 */
export function useAdminPaymentAlerts(isAdmin: boolean) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin:payments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "payments" },
        async (payload: any) => {
          const row = payload.new;
          if (!row || row.status !== "pending") return;
          let label = "New payment request";
          try {
            const { data: p } = await supabase
              .from("profiles")
              .select("name,email")
              .eq("id", row.user_id)
              .maybeSingle();
            if (p) label = `${p.name ?? p.email} · ${row.amount} Tk (${row.method})`;
          } catch {}
          toast(`💸 ${label}`, {
            description: `trx: ${row.trx_id} · ${row.package_type}`,
            duration: 12000,
            action: { label: "Review", onClick: () => navigate("/admin/payments") },
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, navigate]);
}
