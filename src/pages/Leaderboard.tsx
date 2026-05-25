import { useEffect, useState } from "react";
import { AppShell } from "@/components/zerod/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";

const Leaderboard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (supabase.rpc as any)("list_public_profiles", { _limit: 50 }).then(({ data }: any) => setRows(data ?? []));
  }, []);
  return (
    <AppShell>
      <section className="container py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-8 inline-flex items-center gap-3"><Trophy className="h-8 w-8 text-primary" />{t("leaderboard.title")}</h1>
        <div className="rounded-2xl border border-border bg-gradient-card shadow-card overflow-hidden">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3 border-b border-border/40 last:border-0">
              <span className="font-mono text-xs w-8 text-muted-foreground">#{i+1}</span>
              <div className="h-9 w-9 rounded-full bg-muted overflow-hidden">{r.avatar_url && <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
              <span className="flex-1 font-medium truncate">{r.name ?? "—"}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.total_xp} XP</span>
              <span className="font-mono text-xs text-primary">💎 {r.total_gems}</span>
              <span className="font-mono text-xs text-accent">🔥 {r.current_streak}</span>
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No rankings yet</div>}
        </div>
      </section>
    </AppShell>
  );
};
export default Leaderboard;