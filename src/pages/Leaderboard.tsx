import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Trophy, Flame, Gem, Loader2, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  total_xp: number | null;
  total_gems: number | null;
  current_streak: number | null;
  longest_streak: number | null;
};

type Ranked = Row & { rank: number; xp: number; gems: number; streak: number };

const toNumber = (v: unknown): number => {
  const n = typeof v === "string" ? parseInt(v, 10) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

// Dense ranking with tie support: equal XP → equal rank, next bucket increments by 1.
function rank(rows: Row[]): Ranked[] {
  const normalized = rows
    .filter((r) => r && r.id)
    .map<Ranked>((r) => ({
      ...r,
      xp: toNumber(r.total_xp),
      gems: toNumber(r.total_gems),
      streak: toNumber(r.current_streak),
      rank: 0,
    }))
    .sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.gems !== a.gems) return b.gems - a.gems;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

  // Ordinal ranking — every row gets a unique position (1, 2, 3, …).
  // Ties on XP are broken by gems → streak → name in the sort above.
  for (let i = 0; i < normalized.length; i++) {
    normalized[i].rank = i + 1;
  }
  return normalized;
}

const medalColor = (r: number) =>
  r === 1 ? "text-yellow-400" : r === 2 ? "text-slate-300" : r === 3 ? "text-amber-600" : "text-muted-foreground";

const Leaderboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc("list_public_profiles", { _limit: 100 });
    if (error) setError(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    // Realtime refresh whenever any profile's XP changes
    const channel = supabase
      .channel("leaderboard:profiles")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => { void load(); },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => { void load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const ranked = useMemo(() => rank(rows), [rows]);
  const myRow = useMemo(() => ranked.find((r) => r.id === user?.id), [ranked, user]);
  const podium = ranked.slice(0, 3);

  return (
    <AppShell>
      <section className="container py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-2 inline-flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          {t("leaderboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Top learners by XP — updates in real time.
        </p>

        {loading ? (
          <div className="rounded-2xl border border-border bg-gradient-card shadow-card p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading rankings…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn’t load rankings: {error}
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-2xl border border-border bg-gradient-card shadow-card p-12 text-center text-muted-foreground text-sm">
            No public profiles yet. Make your profile public from Settings to appear here.
          </div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 0, 2].map((idx) => {
                  const p = podium[idx];
                  if (!p) return <div key={idx} />;
                  const heights = ["h-24", "h-32", "h-20"];
                  const order = [1, 0, 2].indexOf(idx);
                  return (
                    <div key={p.id} className="flex flex-col items-center">
                      <div className="h-14 w-14 rounded-full bg-muted overflow-hidden ring-2 ring-primary/40 mb-2">
                        {p.avatar_url && (
                          <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-sm font-semibold truncate max-w-full px-1">{p.name ?? "—"}</div>
                      <div className="text-xs font-mono text-muted-foreground">{p.xp} XP</div>
                      <div
                        className={cn(
                          "mt-2 w-full rounded-t-lg border border-border bg-gradient-card flex items-center justify-center font-display text-2xl",
                          heights[order],
                          medalColor(p.rank),
                        )}
                      >
                        <Medal className="h-5 w-5 mr-1" />#{p.rank}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-gradient-card shadow-card overflow-hidden">
              {ranked.map((r) => {
                const isMe = r.id === user?.id;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3 border-b border-border/40 last:border-0 transition-colors",
                      isMe && "bg-primary/10",
                    )}
                  >
                    <span className={cn("font-mono text-xs w-10 font-semibold", medalColor(r.rank))}>
                      #{r.rank}
                    </span>
                    <div className="h-9 w-9 rounded-full bg-muted overflow-hidden shrink-0">
                      {r.avatar_url && (
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="flex-1 font-medium truncate">
                      {r.name ?? "—"}
                      {isMe && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">you</span>}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {r.xp.toLocaleString()} XP
                    </span>
                    <span className="font-mono text-xs text-primary inline-flex items-center gap-1 tabular-nums">
                      <Gem className="h-3 w-3" />{r.gems}
                    </span>
                    <span className="font-mono text-xs text-accent inline-flex items-center gap-1 tabular-nums">
                      <Flame className="h-3 w-3" />{r.streak}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sticky "your rank" footer when not in viewport-top */}
            {user && !myRow && (
              <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
                You're not on the leaderboard yet. Turn on a public profile in Settings → Privacy and earn some XP!
              </div>
            )}
            {myRow && myRow.rank > 10 && (
              <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 px-5 py-3 flex items-center gap-4">
                <span className="font-mono text-xs w-10 font-semibold text-primary">#{myRow.rank}</span>
                <span className="flex-1 font-medium truncate">You</span>
                <span className="font-mono text-xs">{myRow.xp.toLocaleString()} XP</span>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
};

export default Leaderboard;
