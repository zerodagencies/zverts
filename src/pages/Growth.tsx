import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, CheckCircle2, Circle,
  PlayCircle, BrainCircuit, Trophy, Sparkles, Flame, Clock,
} from "lucide-react";

type Task = {
  kind: "lesson" | "quiz";
  title: string;
  done: boolean;
  module_id?: string;
  course_id?: string;
};

type Mission = {
  date: string;
  tasks: Task[];
  total: number;
  done: number;
  completed_at: string | null;
  rewarded_at: string | null;
};

type DayStats = { lessons: number; quizzes: number; minutes: number };
type Growth = { today: DayStats; yesterday: DayStats };

const pct = (today: number, yest: number) => {
  if (yest === 0 && today === 0) return 0;
  if (yest === 0) return 100;
  return Math.round(((today - yest) / yest) * 100);
};

const Trend = ({ today, yest }: { today: number; yest: number }) => {
  const p = pct(today, yest);
  if (p > 0)
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-xs">
        <TrendingUp className="h-3.5 w-3.5" />+{p}%
      </span>
    );
  if (p < 0)
    return (
      <span className="inline-flex items-center gap-1 text-red-400 font-mono text-xs">
        <TrendingDown className="h-3.5 w-3.5" />
        {p}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-xs">
      <Minus className="h-3.5 w-3.5" />0%
    </span>
  );
};

const Growth = () => {
  const { user, loading: authLoading } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [m, g] = await Promise.all([
        (supabase as any).rpc("get_today_mission"),
        (supabase as any).rpc("get_growth_stats"),
      ]);
      if (m.error) throw m.error;
      if (g.error) throw g.error;
      setMission(m.data as Mission);
      setGrowth(g.data as Growth);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const ch = supabase
      .channel(`growth:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_progress", filter: `user_id=eq.${user.id}` },
        () => void load(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mcq_attempts", filter: `user_id=eq.${user.id}` },
        () => void load(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_challenges", filter: `user_id=eq.${user.id}` },
        () => void load(true),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user?.id, load]);

  const progressPct = useMemo(() => {
    if (!mission || mission.total === 0) return 0;
    return Math.round((mission.done / mission.total) * 100);
  }, [mission]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppShell>
      <SEO
        title="Your Growth · ZverTs"
        description="Today's mission and personal growth — become better than yesterday."
      />
      <section className="container py-10 md:py-14 max-w-4xl">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            / your growth
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">
            Be better than <span className="italic text-primary">yesterday</span>.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl">
            No more ranking against strangers. Hit today's mission, watch yourself grow.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive p-6 text-sm font-mono">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Mission */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    / today's mission
                  </div>
                  <h2 className="font-display text-2xl mt-1 flex items-center gap-2">
                    {mission?.rewarded_at ? (
                      <>
                        <Trophy className="h-6 w-6 text-primary" /> Mission complete
                      </>
                    ) : (
                      <>Today's goal</>
                    )}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-3xl font-semibold tabular-nums">
                    {mission?.done ?? 0}/{mission?.total ?? 0}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{progressPct}%</div>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-lime transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {!mission?.tasks?.length ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No tasks yet — start a course to get a daily mission.
                </div>
              ) : (
                <ul className="space-y-2">
                  {mission.tasks.map((t, i) => {
                    const Icon = t.kind === "lesson" ? PlayCircle : BrainCircuit;
                    const href = t.kind === "lesson" && t.module_id ? `/learn/${t.module_id}` : "/dashboard";
                    return (
                      <li
                        key={i}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          t.done
                            ? "border-emerald-400/30 bg-emerald-400/5"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        {t.done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span
                          className={cn(
                            "flex-1 text-sm truncate",
                            t.done && "line-through text-muted-foreground",
                          )}
                        >
                          {t.title}
                        </span>
                        {!t.done && (
                          <Link to={href}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              Start
                            </Button>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {mission?.rewarded_at && (
                <div className="mt-6 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex items-center gap-3 text-sm">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">+50 XP, +10 Gems unlocked</div>
                    <div className="text-xs text-muted-foreground">
                      Streak extended. Come back tomorrow to keep it alive.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Growth: Yesterday vs Today */}
            {growth && (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      / personal growth
                    </div>
                    <h2 className="font-display text-2xl mt-1">Yesterday vs Today</h2>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <GrowthCell
                    icon={PlayCircle}
                    label="Lessons"
                    today={growth.today.lessons}
                    yest={growth.yesterday.lessons}
                  />
                  <GrowthCell
                    icon={BrainCircuit}
                    label="Quizzes"
                    today={growth.today.quizzes}
                    yest={growth.yesterday.quizzes}
                  />
                  <GrowthCell
                    icon={Clock}
                    label="Minutes"
                    today={growth.today.minutes}
                    yest={growth.yesterday.minutes}
                  />
                </div>

                <div className="mt-6 text-xs text-muted-foreground font-mono">
                  <Flame className="h-3 w-3 inline mr-1 text-accent" />
                  Streak grows when you complete today's mission — not by just opening the app.
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
};

const GrowthCell = ({
  icon: Icon,
  label,
  today,
  yest,
}: {
  icon: typeof PlayCircle;
  label: string;
  today: number;
  yest: number;
}) => (
  <div className="rounded-xl border border-border bg-background/40 p-5">
    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="font-display text-4xl font-semibold tabular-nums">{today}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-1">
          yesterday: <span className="tabular-nums">{yest}</span>
        </div>
      </div>
      <Trend today={today} yest={yest} />
    </div>
  </div>
);

export default Growth;
