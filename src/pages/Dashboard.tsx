import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { StatCard } from "@/components/app/StatCard";
import { ContinueWatching } from "@/components/app/ContinueWatching";
import { TodayMissionCard } from "@/components/app/TodayMissionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
    Clock,
    CheckSquare,
    Flame,
    Calendar,
    ArrowRight,
    Gem,
    Zap,
    BookOpen,
    Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WeeklyActivityChart = lazy(() =>
    import("@/components/app/WeeklyActivityChart").then((m) => ({
        default: m.WeeklyActivityChart,
    })),
);
const DailyChallenge = lazy(() =>
    import("@/components/app/DailyChallenge").then((m) => ({ default: m.DailyChallenge })),
);
const AnalyticsPanel = lazy(() =>
    import("@/components/app/AnalyticsPanel").then((m) => ({ default: m.AnalyticsPanel })),
);
const BadgesGrid = lazy(() =>
    import("@/components/app/BadgesGrid").then((m) => ({ default: m.BadgesGrid })),
);

interface CourseRow {
    id: string;
    title: string;
}
interface ModuleRow {
    id: string;
    course_id: string;
    position: number;
    title: string;
    duration_seconds: number;
}
interface ProgressRow {
    module_id: string;
    watch_time_seconds: number;
    percent_watched: number;
    completed: boolean;
    updated_at: string;
    completed_at: string | null;
}
interface UserStats {
    xp: number;
    gems: number;
    streak: number;
}

const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [modules, setModules] = useState<ModuleRow[]>([]);
    const [progress, setProgress] = useState<ProgressRow[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async (uid: string, opts: { silent?: boolean } = {}) => {
        if (!opts.silent) setLoading(true);
        setError(null);
        try {
            const [{ data: ownCourses, error: cErr }, { data: upData }] = await Promise.all([
                supabase
                    .from("courses")
                    .select("id,title")
                    .eq("user_id", uid)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("user_progress")
                    .select("total_xp,total_gems,current_streak")
                    .eq("user_id", uid)
                    .maybeSingle(),
            ]);
            if (cErr) throw cErr;

            if (upData)
                setUserStats({
                    xp: upData.total_xp ?? 0,
                    gems: upData.total_gems ?? 0,
                    streak: upData.current_streak ?? 0,
                });

            const courseIds = (ownCourses ?? []).map((c) => c.id);
            const [{ data: mods, error: mErr }, { data: prog, error: pErr }] = await Promise.all([
                courseIds.length
                    ? supabase
                          .from("modules")
                          .select("id,course_id,position,title,duration_seconds")
                          .in("course_id", courseIds)
                          .order("position")
                    : Promise.resolve({ data: [] as ModuleRow[], error: null } as {
                          data: ModuleRow[];
                          error: null;
                      }),
                supabase
                    .from("module_progress")
                    .select(
                        "module_id,watch_time_seconds,percent_watched,completed,updated_at,completed_at",
                    )
                    .eq("user_id", uid),
            ]);
            if (mErr) throw mErr;
            if (pErr) throw pErr;

            setCourses(ownCourses ?? []);
            setModules(mods ?? []);
            setProgress(prog ?? []);
        } catch (e: unknown) {
            setError((e as Error)?.message ?? "Failed to load dashboard");
        } finally {
            if (!opts.silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        void load(user.id);
        const channel = supabase
            .channel(`dashboard:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "module_progress",
                    filter: `user_id=eq.${user.id}`,
                },
                () => void load(user.id, { silent: true }),
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "user_progress",
                    filter: `user_id=eq.${user.id}`,
                },
                () => void load(user.id, { silent: true }),
            )
            .subscribe();
        return () => {
            void supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const visibleModuleIds = new Set(modules.map((m) => m.id));
    const visibleProgress = progress.filter((e) => visibleModuleIds.has(e.module_id));
    const progByMod = new Map(visibleProgress.map((p) => [p.module_id, p]));
    const completedCount = visibleProgress.filter((p) => p.completed).length;
    const totalWatch = visibleProgress.reduce((s, p) => s + p.watch_time_seconds, 0);

    const courseSections = useMemo(
        () => {
            const map = new Map(visibleProgress.map((p) => [p.module_id, p]));
            return courses.map((course) => {
                const courseModules = modules
                    .filter((m) => m.course_id === course.id)
                    .sort((a, b) => a.position - b.position);
                const cards = courseModules.map((module, idx) => {
                    const p = map.get(module.id);
                    const prev = idx === 0 ? null : courseModules[idx - 1];
                    const prevDone = !prev || map.get(prev.id)?.completed;
                    let state: "locked" | "available" | "in_progress" | "completed" = "locked";
                    if (p?.completed) state = "completed";
                    else if (prevDone && p && p.percent_watched > 0) state = "in_progress";
                    else if (prevDone) state = "available";
                    return { ...module, state, percent: p?.percent_watched ?? 0 };
                });
                return { course, cards };
            });
        },
        [courses, modules, visibleProgress],
    );

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    const nextModule = courseSections
        .flatMap((s) => s.cards)
        .find((m) => m.state === "available" || m.state === "in_progress");
    const displayName =
        (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
        (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
        user.email?.split("@")[0] ??
        "there";

    const today = new Date();
    const weekly = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const minutes = visibleProgress
            .filter((p) => {
                const u = new Date(p.updated_at);
                return u >= d && u < next;
            })
            .reduce((s, p) => s + Math.round(p.watch_time_seconds / 60), 0);
        return { day: DAYS[d.getDay()], minutes };
    });

    const level = userStats ? Math.floor(userStats.xp / 500) + 1 : 1;
    const activeDays = weekly.filter((d) => d.minutes > 0).length;

    return (
        <AppShell>
            <section className="container py-8 md:py-12 max-w-6xl space-y-6">
                {/* ── Hero ─────────────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            / dashboard
                        </div>
                        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                            Welcome back, <span className="italic text-primary">{displayName}</span>
                        </h1>
                        {/* Quick stats chips */}
                        {userStats ? (
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border",
                                        userStats.streak > 0
                                            ? "bg-accent/10 border-accent/25 text-accent"
                                            : "bg-muted border-border text-muted-foreground",
                                    )}
                                >
                                    <Flame className="h-3 w-3" />
                                    {userStats.streak > 0
                                        ? `${userStats.streak}-day streak`
                                        : "No streak yet"}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
                                    <Gem className="h-3 w-3" /> {userStats.gems.toLocaleString()}{" "}
                                    gems
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-mono text-yellow-500">
                                    <Zap className="h-3 w-3" /> {userStats.xp.toLocaleString()} XP
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-mono text-muted-foreground">
                                    Lv {level}
                                </span>
                            </div>
                        ) : (
                            <div className="flex gap-2 mt-3">
                                {[72, 60, 56, 40].map((w, i) => (
                                    <Skeleton
                                        key={i}
                                        className={`h-7 rounded-full`}
                                        style={{ width: w }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {nextModule && (
                        <Link to={`/learn/${nextModule.id}`}>
                            <Button
                                size="lg"
                                className="bg-gradient-lime text-primary-foreground shadow-glow gap-2 font-semibold"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>

                {error ? (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive p-5 text-sm font-mono">
                        {error}
                    </div>
                ) : loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* ── Continue Watching ────────────────────────────────────── */}
                        <ContinueWatching userId={user.id} />

                        {/* ── Mission + Daily Challenge ────────────────────────────── */}
                        <div className="grid lg:grid-cols-1 gap-5">
                            <TodayMissionCard userId={user.id} />
                            {/* <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
                                <DailyChallenge userId={user.id} />
                            </Suspense> */}
                        </div>

                        {/* ── Stats + Activity ─────────────────────────────────────── */}
                        <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card space-y-6">
                            <div>
                                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                    / overview
                                </div>
                                <h2 className="font-display text-2xl mt-1">Your progress</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={CheckSquare}
                                    label="Completed"
                                    value={completedCount}
                                    sub={`of ${modules.length} modules`}
                                />
                                <StatCard
                                    icon={Clock}
                                    label="Watch time"
                                    value={fmtTime(totalWatch)}
                                    sub="across all modules"
                                />
                                <StatCard
                                    icon={Flame}
                                    label="Streak"
                                    value={userStats?.streak ?? 0}
                                    sub={(userStats?.streak ?? 0) > 0 ? "Keep it going" : "Open the app daily"}
                                />
                                <StatCard
                                    icon={Calendar}
                                    label="Active days"
                                    value={activeDays}
                                    sub="this week"
                                />
                            </div>
                            <div>
                                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                                    Minutes watched · last 7 days
                                </div>
                                <Suspense fallback={<div className="h-[160px]" />}>
                                    <WeeklyActivityChart data={weekly} />
                                </Suspense>
                            </div>
                        </div>

                        {/* ── Analytics + Badges ───────────────────────────────────── */}
                        <div className="grid lg:grid-cols-2 gap-5">
                            <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
                                <AnalyticsPanel userId={user.id} />
                            </Suspense>
                            <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
                                <BadgesGrid userId={user.id} />
                            </Suspense>
                        </div>

                        {/* ── Courses CTA ──────────────────────────────────────────── */}
                        <div className="rounded-2xl border border-border bg-gradient-card p-6 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                    / curriculum
                                </div>
                                <h2 className="font-display text-xl mt-1">
                                    {courses.length
                                        ? `${courses.length} course${courses.length !== 1 ? "s" : ""} imported`
                                        : "No courses yet"}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {courses.length
                                        ? `${completedCount} of ${modules.length} module${modules.length !== 1 ? "s" : ""} completed`
                                        : "Import a YouTube playlist to get started"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link to="/leaderboard">
                                    <Button variant="ghost" size="sm" className="gap-1.5">
                                        <Trophy className="h-3.5 w-3.5" /> Leaderboard
                                    </Button>
                                </Link>
                                <Link to="/courses">
                                    <Button variant="outline" className="gap-2">
                                        <BookOpen className="h-4 w-4" /> Browse courses
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

const DashboardSkeleton = () => (
    <div className="space-y-5">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-5">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-5">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
        </div>
    </div>
);

export default Dashboard;
