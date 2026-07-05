import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rankRows, medalColor, type RankRow, type RankedRow } from "@/lib/ranking";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    Circle,
    PlayCircle,
    BrainCircuit,
    Trophy,
    Sparkles,
    Flame,
    Clock,
    Gem,
    ArrowRight,
} from "lucide-react";

// ── Domain types ────────────────────────────────────────────────────────────

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
type GrowthData = { today: DayStats; yesterday: DayStats };

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
            <Minus className="h-3.5 w-3.5" />
            0%
        </span>
    );
};

// ── Sub-components ──────────────────────────────────────────────────────────

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
    <div className="rounded-xl border border-border bg-background/40 p-4">
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

const LbMiniRow = ({ r, isMe }: { r: RankedRow; isMe: boolean }) => (
    <div
        className={cn(
            "flex items-center gap-3 px-5 py-2.5 transition-colors",
            isMe && "bg-primary/8 ring-1 ring-inset ring-primary/30",
        )}
    >
        <span
            className={cn(
                "font-mono text-xs w-8 font-semibold shrink-0 text-right",
                medalColor(r.rank),
            )}
        >
            #{r.rank}
        </span>
        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
            {r.avatar_url && (
                <img
                    src={r.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-sm">
                {r.name ?? "—"}
                {isMe && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider text-primary font-mono">
                        you
                    </span>
                )}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">Lv {r.level}</div>
        </div>
        <span
            className="font-mono text-xs text-accent inline-flex items-center gap-1 tabular-nums shrink-0"
            title="Streak"
        >
            <Flame className="h-3 w-3" />
            {r.streak}
        </span>
        <span
            className="font-mono text-xs text-primary inline-flex items-center gap-1 tabular-nums shrink-0"
            title="Gems"
        >
            <Gem className="h-3 w-3" />
            {r.gems}
        </span>
        <span
            className="font-mono text-xs text-muted-foreground tabular-nums hidden sm:block shrink-0 text-right w-20"
            title="XP"
        >
            {r.xp.toLocaleString()} XP
        </span>
    </div>
);

// ── Page ────────────────────────────────────────────────────────────────────

const Growth = () => {
    const { user, loading: authLoading } = useAuth();
    const [mission, setMission] = useState<Mission | null>(null);
    const [growth, setGrowth] = useState<GrowthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lbRows, setLbRows] = useState<RankRow[]>([]);
    const [lbLoading, setLbLoading] = useState(true);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const [m, g] = await Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                supabase.rpc("get_today_mission" as any),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                supabase.rpc("get_growth_stats" as any),
            ]);
            if (m.error) throw m.error;
            if (g.error) throw g.error;
            setMission(m.data as Mission);
            setGrowth(g.data as GrowthData);
        } catch (e: unknown) {
            setError((e as Error)?.message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadLeaderboard = useCallback(async () => {
        const { data } = await supabase.rpc("list_public_profiles", { _limit: 100 });
        setLbRows((data ?? []) as RankRow[]);
        setLbLoading(false);
    }, []);

    useEffect(() => {
        if (!user) return;
        void load();
        void loadLeaderboard();
        const ch = supabase
            .channel(`growth:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "module_progress",
                    filter: `user_id=eq.${user.id}`,
                },
                () => void load(true),
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "mcq_attempts",
                    filter: `user_id=eq.${user.id}`,
                },
                () => void load(true),
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_challenges",
                    filter: `user_id=eq.${user.id}`,
                },
                () => void load(true),
            )
            .subscribe();
        return () => {
            void supabase.removeChannel(ch);
        };
    }, [user, load, loadLeaderboard]);

    const progressPct = useMemo(() => {
        if (!mission || mission.total === 0) return 0;
        return Math.round((mission.done / mission.total) * 100);
    }, [mission]);

    const ranked = useMemo(() => rankRows(lbRows), [lbRows]);
    const top10 = useMemo(() => ranked.slice(0, 10), [ranked]);
    const myRow = useMemo(() => ranked.find((r) => r.id === user?.id), [ranked, user]);

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    // SVG ring math
    const RING_R = 26;
    const RING_C = 2 * Math.PI * RING_R;

    return (
        <AppShell>
            <SEO
                title="Your Growth · ZverTs"
                description="Today's mission and personal growth — become better than yesterday."
            />
            <section className="container py-10 md:py-14 max-w-4xl space-y-6">
                {/* ── Header ──────────────────────────────────────────────────────── */}
                <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        / your growth
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">
                        Be better than <span className="italic text-primary">yesterday</span>.
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                        No shortcuts — one day at a time. Hit today's mission, watch yourself
                        compound.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-44 rounded-2xl" />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive p-6 text-sm font-mono">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* ── Today's Mission ─────────────────────────────────────────── */}
                        <div
                            className={cn(
                                "rounded-2xl border bg-gradient-card p-6 md:p-8 shadow-card",
                                mission?.rewarded_at ? "border-primary/40" : "border-border",
                            )}
                        >
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                        / today's mission
                                    </div>
                                    <h2 className="font-display text-2xl mt-1 flex items-center gap-2">
                                        {mission?.rewarded_at ? (
                                            <>
                                                <Trophy className="h-5 w-5 text-primary" /> Mission
                                                complete!
                                            </>
                                        ) : (
                                            "Today's goal"
                                        )}
                                    </h2>
                                </div>

                                {/* Circular ring progress */}
                                <div className="relative shrink-0 h-16 w-16">
                                    <svg
                                        className="absolute inset-0 -rotate-90 w-full h-full"
                                        viewBox="0 0 64 64"
                                    >
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r={RING_R}
                                            fill="none"
                                            strokeWidth="6"
                                            stroke="currentColor"
                                            className="text-muted"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r={RING_R}
                                            fill="none"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            className="text-primary transition-all duration-500"
                                            strokeDasharray={RING_C}
                                            strokeDashoffset={RING_C * (1 - progressPct / 100)}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                        <span className="font-mono text-sm font-bold tabular-nums">
                                            {mission?.done ?? 0}/{mission?.total ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!mission?.tasks?.length ? (
                                <div className="text-sm text-muted-foreground py-5 text-center">
                                    No tasks yet — start a course to get a daily mission.
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {mission.tasks.map((t, i) => {
                                        const Icon =
                                            t.kind === "lesson" ? PlayCircle : BrainCircuit;
                                        const href =
                                            t.kind === "lesson" && t.module_id
                                                ? `/learn/${t.module_id}`
                                                : "/dashboard";
                                        return (
                                            <li
                                                key={i}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                                                    t.done
                                                        ? "border-emerald-400/30 bg-emerald-400/5"
                                                        : "border-border hover:border-primary/30",
                                                )}
                                            >
                                                {t.done ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span
                                                    className={cn(
                                                        "flex-1 text-sm truncate",
                                                        t.done &&
                                                            "line-through text-muted-foreground",
                                                    )}
                                                >
                                                    {t.title}
                                                </span>
                                                {!t.done && (
                                                    <Link to={href}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-xs shrink-0"
                                                        >
                                                            Go →
                                                        </Button>
                                                    </Link>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {mission?.rewarded_at && (
                                <div className="mt-5 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex items-center gap-3 text-sm">
                                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                                    <div>
                                        <div className="font-semibold">
                                            +50 XP &amp; +10 Gems earned
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Streak extended. Come back tomorrow to keep it alive.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Personal Growth ──────────────────────────────────────────── */}
                        {growth && (
                            <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
                                <div className="mb-5">
                                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                        / personal growth
                                    </div>
                                    <h2 className="font-display text-2xl mt-1">
                                        Yesterday vs Today
                                    </h2>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3">
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
                                <p className="mt-4 text-xs text-muted-foreground font-mono">
                                    <Flame className="h-3 w-3 inline mr-1 text-accent" />
                                    Streak grows when you complete today's mission — not by just
                                    opening the app.
                                </p>
                            </div>
                        )}

                        {/* ── Mini Leaderboard ─────────────────────────────────────────── */}
                        <div className="rounded-2xl border border-border bg-gradient-card shadow-card overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                                <div>
                                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                        / leaderboard
                                    </div>
                                    <h2 className="font-display text-2xl mt-1 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Top Players
                                    </h2>
                                </div>
                                <Link
                                    to="/leaderboard"
                                    className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                                >
                                    View all <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            {lbLoading ? (
                                <div className="p-5 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-4 w-8 rounded" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 flex-1 max-w-[50%]" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    ))}
                                </div>
                            ) : top10.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    No public profiles yet.{" "}
                                    <Link to="/settings" className="text-primary hover:underline">
                                        Make yours public
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {top10.map((r) => (
                                        <LbMiniRow key={r.id} r={r} isMe={r.id === user.id} />
                                    ))}

                                    {/* User outside top 10 */}
                                    {myRow && myRow.rank > 10 && (
                                        <>
                                            <div className="flex items-center gap-3 px-5 py-1.5">
                                                <div className="flex-1 border-t border-dashed border-border/50" />
                                                <span className="text-[10px] font-mono text-muted-foreground/60 tracking-widest">
                                                    · · ·
                                                </span>
                                                <div className="flex-1 border-t border-dashed border-border/50" />
                                            </div>
                                            <LbMiniRow r={myRow} isMe />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground font-mono hidden sm:block">
                                    Ranked by streak → gems → XP
                                </p>
                                <Link to="/leaderboard" className="ml-auto">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5"
                                    >
                                        Full leaderboard <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </AppShell>
    );
};

export default Growth;
