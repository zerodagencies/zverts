import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Trophy, Flame, Gem, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { rankRows, medalColor, type RankRow, type RankedRow } from "@/lib/ranking";

const Leaderboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [rows, setRows] = useState<RankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        const { data, error } = await supabase.rpc("list_public_profiles", { _limit: 100 });
        if (error) setError(error.message);
        setRows((data ?? []) as RankRow[]);
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
                () => {
                    void load();
                },
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "profiles" },
                () => {
                    void load();
                },
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [load]);

    const ranked = useMemo(() => rankRows(rows), [rows]);
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
                    Ranked by <span className="text-accent font-medium">streak</span> →{" "}
                    <span className="text-primary font-medium">gems</span> →{" "}
                    <span className="text-foreground font-medium">XP</span>. Updates in real time.
                </p>

                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-14 w-14 rounded-full" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton
                                        className={cn(
                                            "w-full rounded-t-xl",
                                            i === 1 ? "h-32" : i === 0 ? "h-24" : "h-20",
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl border border-border bg-gradient-card shadow-card divide-y divide-border/60">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    <Skeleton className="h-6 w-6 rounded" />
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 flex-1 max-w-[60%]" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
                        Couldn’t load rankings: {error}
                    </div>
                ) : ranked.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-gradient-card shadow-card p-12 text-center text-muted-foreground text-sm">
                        No public profiles yet. Make your profile public from Settings to appear
                        here.
                    </div>
                ) : (
                    <>
                        {/* Podium */}
                        {podium.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                                {[1, 0, 2].map((idx) => {
                                    const p = podium[idx];
                                    if (!p) return <div key={idx} />;
                                    const heights = ["h-24", "h-32", "h-20"];
                                    const order = [1, 0, 2].indexOf(idx);
                                    const ringColor =
                                        p.rank === 1
                                            ? "ring-yellow-400/70"
                                            : p.rank === 2
                                              ? "ring-slate-300/60"
                                              : "ring-amber-600/60";
                                    return (
                                        <div key={p.id} className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    "h-14 w-14 rounded-full bg-muted overflow-hidden ring-2 mb-2",
                                                    ringColor,
                                                )}
                                            >
                                                {p.avatar_url && (
                                                    <img
                                                        src={p.avatar_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="text-sm font-semibold truncate max-w-full px-1">
                                                {p.name ?? "—"}
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                                                <span className="inline-flex items-center gap-0.5 text-accent">
                                                    <Flame className="h-3 w-3" />
                                                    {p.streak}
                                                </span>
                                                <span className="inline-flex items-center gap-0.5 text-primary">
                                                    <Gem className="h-3 w-3" />
                                                    {p.gems}
                                                </span>
                                            </div>
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
                                const isTop3 = r.rank <= 3;
                                return (
                                    <div
                                        key={r.id}
                                        className={cn(
                                            "flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-border/40 last:border-0 transition-colors",
                                            isMe &&
                                                "bg-primary/10 ring-1 ring-inset ring-primary/40",
                                            !isMe && isTop3 && "bg-accent/5",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "font-mono text-xs w-8 sm:w-10 font-semibold shrink-0",
                                                medalColor(r.rank),
                                            )}
                                        >
                                            #{r.rank}
                                        </span>
                                        <div className="h-9 w-9 rounded-full bg-muted overflow-hidden shrink-0">
                                            {r.avatar_url && (
                                                <img
                                                    src={r.avatar_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-sm">
                                                {r.name ?? "—"}
                                                {isMe && (
                                                    <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">
                                                        you
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-foreground">
                                                Lv {r.level}
                                            </div>
                                        </div>
                                        <span
                                            className="font-mono text-xs text-accent inline-flex items-center gap-1 tabular-nums w-12 justify-end"
                                            title="Streak"
                                        >
                                            <Flame className="h-3 w-3" />
                                            {r.streak}
                                        </span>
                                        <span
                                            className="font-mono text-xs text-primary inline-flex items-center gap-1 tabular-nums w-12 justify-end"
                                            title="Gems"
                                        >
                                            <Gem className="h-3 w-3" />
                                            {r.gems}
                                        </span>
                                        <span
                                            className="font-mono text-xs text-muted-foreground tabular-nums hidden sm:inline-block w-20 text-right"
                                            title="XP"
                                        >
                                            {r.xp.toLocaleString()} XP
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sticky "your rank" footer when not in viewport-top */}
                        {user && !myRow && (
                            <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
                                You're not on the leaderboard yet. Turn on a public profile in
                                Settings → Privacy and earn some XP!
                            </div>
                        )}
                        {myRow && myRow.rank > 10 && (
                            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 px-5 py-3 flex items-center gap-3 sm:gap-4">
                                <span className="font-mono text-xs w-10 font-semibold text-primary">
                                    #{myRow.rank}
                                </span>
                                <span className="flex-1 font-medium truncate">
                                    You · Lv {myRow.level}
                                </span>
                                <span className="font-mono text-xs text-accent inline-flex items-center gap-1">
                                    <Flame className="h-3 w-3" />
                                    {myRow.streak}
                                </span>
                                <span className="font-mono text-xs text-primary inline-flex items-center gap-1">
                                    <Gem className="h-3 w-3" />
                                    {myRow.gems}
                                </span>
                                <span className="font-mono text-xs hidden sm:inline">
                                    {myRow.xp.toLocaleString()} XP
                                </span>
                            </div>
                        )}
                    </>
                )}
            </section>
        </AppShell>
    );
};

export default Leaderboard;
