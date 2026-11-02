import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import {
    YouTubePlayer,
    type WatchReport,
    type YouTubePlayerHandle,
} from "@/components/app/YouTubePlayer";
import { NotesPanel } from "@/components/app/NotesPanel";
import { CodeRunner } from "@/components/app/code-runner/CodeRunner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { positionKey, resumePoint } from "@/lib/videoResume";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Lock,
    PlayCircle,
    ListVideo,
    Clock,
} from "lucide-react";

interface Mod {
    id: string;
    course_id: string;
    position: number;
    title: string;
    duration_seconds: number;
    youtube_video_id: string;
    courses?: { title: string } | null;
}
interface SiblingMod {
    id: string;
    position: number;
    title: string;
    duration_seconds: number;
    thumbnail_url: string | null;
}
interface SiblingProgress {
    module_id: string;
    percent_watched: number;
    completed: boolean;
}

// Lessons count as complete (and unlock the next one) at this share of the video
// actually watched — must match record_watch_progress.
const COMPLETE_PERCENT = 90;

const callRecordWatch = (args: {
    _module_id: string;
    _watched_seconds: number;
    _segments: [number, number][];
    _video_duration: number;
}) => supabase.rpc("record_watch_progress", args);

const fmt = (s: number) => {
    const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
};

const fmtWatched = (s: number) => {
    const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = Math.floor(s % 60);
    return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Sidebar module row ────────────────────────────────────────────────────────
const SidebarRow = ({
    m,
    isCurrent,
    locked,
    completed,
    percent,
    onClick,
}: {
    m: SiblingMod;
    isCurrent: boolean;
    locked: boolean;
    completed: boolean;
    percent: number;
    onClick: () => void;
}) => (
    <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        className={cn(
            "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors rounded-lg",
            isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60",
            locked && "opacity-50 cursor-not-allowed",
        )}
    >
        {/* thumbnail */}
        <div className="relative shrink-0 w-[88px] aspect-video rounded overflow-hidden bg-muted">
            {m.thumbnail_url ? (
                <img
                    src={m.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <PlayCircle className="h-5 w-5 text-muted-foreground/40" />
                </div>
            )}
            {completed && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
            )}
            {locked && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
            {isCurrent && !completed && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
            <p
                className={cn(
                    "text-xs leading-snug line-clamp-2",
                    isCurrent ? "text-foreground font-medium" : "text-foreground/80",
                )}
            >
                <span className="font-mono text-muted-foreground mr-1">
                    {String(m.position).padStart(2, "0")}.
                </span>
                {m.title}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground mt-1">
                <Clock className="h-2.5 w-2.5" />
                {fmt(m.duration_seconds)}
                {!locked && percent > 0 && !completed && <span>· {Math.round(percent)}%</span>}
            </p>
            {!locked && !completed && percent > 0 && (
                <div className="mt-1 h-0.5 rounded-full bg-muted overflow-hidden w-full">
                    <div className="h-full bg-gradient-lime" style={{ width: `${percent}%` }} />
                </div>
            )}
        </div>
    </button>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const ModulePlayer = () => {
    const { id } = useParams();
    const { user, session, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [mod, setMod] = useState<Mod | null>(null);
    const [unlocked, setUnlocked] = useState<boolean | null>(null);
    const [percent, setPercent] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [watchSeconds, setWatchSeconds] = useState(0);
    const [nextId, setNextId] = useState<string | null>(null);
    const [rewardFlash, setRewardFlash] = useState(false);
    const [loading, setLoading] = useState(true);
    // null until known: the player takes its start position only when it's created.
    const [resumeAt, setResumeAt] = useState<number | null>(null);

    const [siblings, setSiblings] = useState<SiblingMod[]>([]);
    const [siblingProg, setSiblingProg] = useState<Map<string, SiblingProgress>>(new Map());

    const playerRef = useRef<YouTubePlayerHandle>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // ── Load module ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user || !id) return;
        setMod(null);
        setUnlocked(null);
        setPercent(0);
        setCompleted(false);
        setWatchSeconds(0);
        setNextId(null);
        setRewardFlash(false);
        setSiblings([]);
        setSiblingProg(new Map());
        setLoading(true);
        setResumeAt(null);
        (async () => {
            const { data: m } = await supabase
                .from("modules")
                .select(
                    "id,course_id,position,title,duration_seconds,youtube_video_id,courses(title)",
                )
                .eq("id", id)
                .maybeSingle();
            if (!m) { setLoading(false); return; }

            const { data: visibleCourse } = await supabase
                .from("courses")
                .select("id")
                .eq("id", m.course_id)
                .maybeSingle();
            if (!visibleCourse) { setLoading(false); return; }

            setMod(m);

            const [{ data: nextMod }, { data: unlock }, { data: p }, { data: sibs }] =
                await Promise.all([
                    supabase
                        .from("modules")
                        .select("id")
                        .eq("course_id", m.course_id)
                        .eq("position", m.position + 1)
                        .maybeSingle(),
                    supabase.rpc("is_module_unlocked", { _user_id: user.id, _module_id: m.id }),
                    supabase
                        .from("module_progress")
                        .select("percent_watched,completed,watch_time_seconds,watched_ranges")
                        .eq("user_id", user.id)
                        .eq("module_id", m.id)
                        .maybeSingle(),
                    supabase
                        .from("modules")
                        .select("id,position,title,duration_seconds,thumbnail_url")
                        .eq("course_id", m.course_id)
                        .order("position"),
                ]);

            setNextId(nextMod?.id ?? null);
            setUnlocked(!!unlock);
            if (p) {
                setPercent(Number(p.percent_watched));
                setCompleted(p.completed);
                setWatchSeconds(p.watch_time_seconds);
            }
            setResumeAt(resumePoint(m.id, p?.watched_ranges, m.duration_seconds ?? 0));

            const sibList = sibs ?? [];
            setSiblings(sibList);

            if (sibList.length) {
                const { data: sp } = await supabase
                    .from("module_progress")
                    .select("module_id,percent_watched,completed")
                    .eq("user_id", user.id)
                    .in("module_id", sibList.map((s) => s.id));
                setSiblingProg(new Map((sp ?? []).map((x) => [x.module_id, x as SiblingProgress])));
            }

            setLoading(false);
        })();
    }, [user, id]);

    // ── Scroll current item into view ─────────────────────────────────────────
    useEffect(() => {
        if (!sidebarRef.current) return;
        const active = sidebarRef.current.querySelector("[data-current='true']");
        active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [siblings.length]);

    // ── Progress ──────────────────────────────────────────────────────────────
    // The player reports only genuinely watched time; the server re-checks it
    // against the clock, so seeking ahead never counts as watching.
    const recordWatch = async (report: WatchReport, urgent = false) => {
        if (!mod) return;
        const args = {
            _module_id: mod.id,
            _watched_seconds: report.watchedSeconds,
            _segments: report.segments,
            _video_duration: report.duration,
        };
        let row: Awaited<ReturnType<typeof callRecordWatch>>["data"];
        if (urgent && session) {
            // The page is being hidden or unloaded: a keepalive request is still
            // delivered if the browser freezes or closes it right after (a normal one
            // is often dropped — the watch time lost on minimise or reload).
            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/record_watch_progress`,
                {
                    method: "POST",
                    keepalive: true,
                    headers: {
                        "Content-Type": "application/json",
                        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify(args),
                },
            ).catch(() => null);
            row = res?.ok ? await res.json().catch(() => null) : null;
        } else {
            const { data, error } = await callRecordWatch(args);
            if (error) {
                toast.error(error.message);
                return;
            }
            row = data;
        }
        if (!row) return;
        setPercent(Number(row.percent_watched));
        setWatchSeconds(row.watch_time_seconds);
        setSiblingProg((prev) => {
            const next = new Map(prev);
            next.set(mod.id, {
                module_id: mod.id,
                percent_watched: Number(row.percent_watched),
                completed: row.completed,
            });
            return next;
        });
        if (row.completed && !completed) {
            setCompleted(true);
            setRewardFlash(true);
            setTimeout(() => setRewardFlash(false), 3200);
            toast.success("Lesson complete — next lesson unlocked!");
        }
    };

    // ── Sidebar module cards ──────────────────────────────────────────────────
    const siblingCards = siblings.map((m, i) => {
        const p = siblingProg.get(m.id);
        const prev = i === 0 ? null : siblings[i - 1];
        const prevRow = prev ? siblingProg.get(prev.id) : null;
        const prevDone = !prev || prevRow?.completed;
        const isCompleted = p?.completed ?? false;
        const isCur = m.id === id;
        const isLocked = !isCompleted && !prevDone && !isCur;
        return {
            m,
            isCurrent: isCur,
            locked: isLocked,
            completed: isCur ? completed : isCompleted,
            percent: isCur ? percent : (p?.percent_watched ?? 0),
        };
    });

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <AppShell>
            <div className="container max-w-[1400px] py-4 md:py-6">
                {/* Back + breadcrumb */}
                <div className="mb-4">
                    <Link
                        to={mod ? `/courses/${mod.course_id}` : "/courses"}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        {mod?.courses?.title ?? "Back to courses"}
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 space-y-4">
                            <Skeleton className="aspect-video w-full rounded-2xl" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-20 rounded-xl" />
                        </div>
                        <div className="hidden lg:block w-[340px] space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 rounded-lg" />
                            ))}
                        </div>
                    </div>
                ) : !mod ? (
                    <div className="text-muted-foreground">
                        Module not found or you do not have access.
                    </div>
                ) : !unlocked ? (
                    <div className="rounded-2xl border border-border bg-gradient-card p-8 sm:p-12 text-center shadow-elevated max-w-lg mx-auto">
                        <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <h2 className="font-display text-3xl font-semibold">Module locked</h2>
                        <p className="text-muted-foreground mt-2">
                            Watch at least 90% of the previous lesson to unlock this one.
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => navigate(mod ? `/courses/${mod.course_id}` : "/courses")}
                        >
                            Back to course
                        </Button>
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-4 lg:gap-y-4 lg:items-start">
                        {/* ── Title (col 1, row 1) ── */}
                        <div className="lg:col-start-1 lg:row-start-1">
                            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                                Lesson {String(mod.position).padStart(2, "0")}
                            </p>
                            <h1 className="font-display text-xl md:text-3xl font-semibold tracking-tight mt-0.5 leading-tight">
                                {mod.title}
                            </h1>
                        </div>

                        {/* ── Player (col 1, row 2) ── */}
                        <div className="relative mt-4 lg:mt-0 -mx-6 lg:mx-0 overflow-hidden border-y lg:border lg:rounded-2xl border-border shadow-card lg:col-start-1 lg:row-start-2">
                            {resumeAt === null ? (
                                <div className="aspect-video bg-black" />
                            ) : (
                                <YouTubePlayer
                                    ref={playerRef}
                                    videoId={mod.youtube_video_id}
                                    onWatch={recordWatch}
                                    startAt={resumeAt}
                                    positionKey={positionKey(mod.id)}
                                />
                            )}
                            {completed && nextId && (
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/learn/${nextId}`)}
                                    className="absolute right-3 bottom-14 z-10 bg-gradient-lime text-primary-foreground shadow-glow animate-in fade-in"
                                >
                                    Next lesson <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* ── Sidebar / playlist (col 2, row 2) ── */}
                        <aside className="mt-4 lg:mt-0 lg:col-start-2 lg:row-start-2 lg:self-stretch lg:relative">
                            <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[360px] lg:h-auto lg:absolute lg:inset-0">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                                    <div className="flex items-center gap-2">
                                        <ListVideo className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {mod.courses?.title ?? "Course"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {siblingCards.filter((c) => c.completed).length}/
                                        {siblings.length}
                                    </span>
                                </div>
                                <div
                                    ref={sidebarRef}
                                    className="overflow-y-auto flex-1 min-h-0 p-2 space-y-0.5"
                                >
                                    {siblingCards.map((c) => (
                                        <div
                                            key={c.m.id}
                                            data-current={c.isCurrent ? "true" : undefined}
                                        >
                                            <SidebarRow
                                                m={c.m}
                                                isCurrent={c.isCurrent}
                                                locked={c.locked}
                                                completed={c.completed}
                                                percent={c.percent}
                                                onClick={() => navigate(`/learn/${c.m.id}`)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* ── Lower content (col 1, row 3) ── */}
                        <div className="mt-4 lg:mt-0 lg:col-start-1 lg:row-start-3 space-y-4">
                            {/* Progress + actions */}
                            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                                <div>
                                    <div className="flex justify-between font-mono text-xs text-muted-foreground mb-1.5">
                                        <span>Watch progress</span>
                                        <span>
                                            {Math.round(percent)}% · {COMPLETE_PERCENT}% to complete
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-lime transition-all duration-700"
                                            style={{ width: `${Math.min(100, percent)}%` }}
                                        />
                                    </div>
                                    <p className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground mt-1.5">
                                        <Clock className="h-3 w-3" />
                                        Time watched: {fmtWatched(watchSeconds)}
                                        <span className="opacity-70">· skipped parts don't count</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {completed ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary font-mono">
                                                <CheckCircle2 className="h-4 w-4" /> Lesson complete
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                                Watch {COMPLETE_PERCENT}% of this video to unlock the next lesson
                                            </span>
                                        )}
                                    </div>
                                    {completed && nextId && (
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/learn/${nextId}`)}
                                            className="bg-gradient-lime text-primary-foreground shadow-glow"
                                        >
                                            Next lesson <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <NotesPanel
                                moduleId={mod.id}
                                getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
                                onSeek={(s) => playerRef.current?.seekTo(s)}
                            />

                            <CodeRunner moduleId={mod.id} />

                            {/* Reward flash */}
                            <div
                                className={cn(
                                    "rounded-2xl border p-4 shadow-card transition-all duration-500",
                                    rewardFlash
                                        ? "border-primary bg-primary/10 shadow-glow"
                                        : "border-border bg-card",
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                            / reward
                                        </p>
                                        <p className="font-display text-xl mt-0.5">
                                            +50 XP · +2 Gems per lesson
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Complete each module to charge your ZverTs character.
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-center min-w-[100px]">
                                        <p className="text-xs font-mono uppercase text-muted-foreground">
                                            Charge
                                        </p>
                                        <p
                                            className={cn(
                                                "font-display text-2xl mt-1 transition-colors",
                                                completed
                                                    ? "text-primary"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {completed
                                                ? "100%"
                                                : `${Math.round(Math.min(percent, 100))}%`}
                                        </p>
                                        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-lime transition-all duration-700"
                                                style={{
                                                    width: `${completed ? 100 : Math.min(percent, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default ModulePlayer;
