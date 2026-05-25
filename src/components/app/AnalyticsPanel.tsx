import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, Target, Clock, Activity } from "lucide-react";

export const AnalyticsPanel = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<{ avgWatch: number; quizAcc: number; weakest: { title: string; pct: number }[] } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: prog }, { data: attempts }] = await Promise.all([
        supabase.from("module_progress").select("watch_time_seconds, percent_watched, completed, modules!inner(title)").eq("user_id", userId),
        supabase.from("mcq_attempts").select("score, total").eq("user_id", userId),
      ]);
      const p = prog ?? [];
      const avgWatch = p.length ? Math.round(p.reduce((s: number, r: any) => s + r.watch_time_seconds, 0) / p.length / 60) : 0;
      const totalQ = (attempts ?? []).reduce((s: number, r: any) => s + r.total, 0);
      const totalC = (attempts ?? []).reduce((s: number, r: any) => s + r.score, 0);
      const acc = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
      const weakest = (p as any[])
        .filter((r) => !r.completed && r.percent_watched > 0 && r.percent_watched < 60)
        .sort((a, b) => a.percent_watched - b.percent_watched)
        .slice(0, 3)
        .map((r) => ({ title: r.modules?.title ?? "Module", pct: Math.round(Number(r.percent_watched)) }));
      setStats({ avgWatch, quizAcc: acc, weakest });
    })();
  }, [userId]);

  if (!stats) return null;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ analytics</div>
      <h2 className="font-display text-2xl mt-1 mb-5">Learning insights</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 p-4 bg-background/30">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase"><Clock className="h-3.5 w-3.5" /> Avg watch / module</div>
          <div className="font-display text-3xl mt-2">{stats.avgWatch}<span className="text-base text-muted-foreground"> min</span></div>
        </div>
        <div className="rounded-xl border border-border/60 p-4 bg-background/30">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase"><Target className="h-3.5 w-3.5" /> Quiz accuracy</div>
          <div className="font-display text-3xl mt-2">{stats.quizAcc}<span className="text-base text-muted-foreground">%</span></div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase mb-2"><TrendingDown className="h-3.5 w-3.5" /> Weakest modules</div>
        {stats.weakest.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono"><Activity className="h-3.5 w-3.5 inline mr-1" /> No struggling modules — keep going!</p>
        ) : (
          <div className="space-y-2">
            {stats.weakest.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-sm flex-1 truncate">{w.title}</div>
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/70" style={{ width: `${w.pct}%` }} />
                </div>
                <div className="text-xs font-mono text-muted-foreground w-10 text-right">{w.pct}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};