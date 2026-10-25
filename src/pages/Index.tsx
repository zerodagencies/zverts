// The public landing page. It speaks the app's own visual language (glass
// cards, Fraunces numbers, lime accent) and leads with the real action: paste
// a playlist. Impact numbers are live, from public_impact_stats().
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Clock,
    Code2,
    Flame,
    Languages,
    Lock,
    Play,
    Target,
    Trophy,
    Users,
    WifiOff,
    Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { ProgressRing } from "@/components/app/ProgressRing";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { HOME_DESCRIPTION, HOME_TITLE, PLAYLIST_FAQ, PUBLIC_PAGES, jsonLdFor } from "@/content/seo";
import { cn } from "@/lib/utils";
import { savePendingPlaylist, takePendingPlaylist } from "@/lib/pendingPlaylist";

const Index = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) {
        const pending = takePendingPlaylist();
        return (
            <Navigate
                to={pending ? `/courses?url=${encodeURIComponent(pending)}` : "/dashboard"}
                replace
            />
        );
    }

    return (
        <AppShell>
            <SEO
                title={HOME_TITLE}
                description={HOME_DESCRIPTION}
                path="/"
                jsonLd={jsonLdFor(PUBLIC_PAGES[0])}
            />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section className="container max-w-6xl pb-16 pt-10 md:pb-24 md:pt-16">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
                    <div>
                        <span className="glass-well inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Your first 3 playlists are free
                        </span>
                        <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-[68px]">
                            Turn any YouTube playlist into a course you{" "}
                            <span className="text-primary">actually finish.</span>
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                            Paste a link. ZverTs lines the videos up as lessons that unlock one at a
                            time, counts the minutes you really watch, and keeps you coming back
                            with streaks and a daily goal.
                        </p>
                        <PlaylistBox className="mt-8 max-w-xl" />
                        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            {[
                                { icon: Languages, t: "English & বাংলা" },
                                { icon: WifiOff, t: "Works offline" },
                                { icon: Code2, t: "C, C++ & Python runner" },
                            ].map((x) => (
                                <li key={x.t} className="flex items-center gap-1.5">
                                    <x.icon className="h-4 w-4 text-primary" />
                                    {x.t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <ProductPreview />
                </div>
            </section>

            {/* ── Impact ───────────────────────────────────────────────── */}
            <Impact />

            {/* ── How it works ─────────────────────────────────────────── */}
            <section className="container max-w-6xl py-16 md:py-24">
                <SectionHead
                    eyebrow="How it works"
                    title="From a playlist to a finished course"
                    sub="Three steps. The structure does the rest."
                />
                <ol className="mt-10 grid gap-3 md:grid-cols-3">
                    {[
                        {
                            title: "Paste a playlist",
                            body: "Any public YouTube playlist or video: programming, HSC and SSC chapters, languages, design.",
                            art: <PasteArt />,
                        },
                        {
                            title: "Get a course",
                            body: "Every video becomes a lesson, in order. Lesson 2 opens when you finish lesson 1.",
                            art: <LessonsArt compact />,
                        },
                        {
                            title: "Finish it",
                            body: "Real watch time, a daily goal and streaks keep you going, and a certificate waits at the end.",
                            art: <CertificateArt />,
                        },
                    ].map((s, i) => (
                        <li
                            key={s.title}
                            className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card"
                        >
                            <div className="flex-1">{s.art}</div>
                            <div className="mt-5 flex items-baseline gap-3">
                                <span className="font-display text-2xl font-semibold text-primary tabular-nums">
                                    {i + 1}
                                </span>
                                <h3 className="text-lg font-semibold">{s.title}</h3>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {s.body}
                            </p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Why it works (bento) ─────────────────────────────────── */}
            <section className="container max-w-6xl py-16 md:py-24">
                <SectionHead
                    eyebrow="Built for finishing"
                    title="Everything YouTube doesn't do for learners"
                    sub="No autoplay, no recommendations pulling you away. Just the next lesson."
                />
                <div className="mt-10 grid gap-3 md:grid-cols-6">
                    <Bento
                        className="md:col-span-4"
                        icon={Lock}
                        title="Lessons unlock in order"
                        body="You can't skip ahead, so you always know what's next and never lose your place."
                    >
                        <LessonsArt />
                    </Bento>
                    <Bento
                        className="md:col-span-2"
                        icon={Target}
                        title="A daily goal"
                        body="Genuinely watched minutes fill your ring and keep the streak alive."
                    >
                        <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
                            <ProgressRing value={72} size={72} stroke={7}>
                                <span className="text-sm font-semibold tabular-nums">14/20</span>
                            </ProgressRing>
                            <div>
                                <div className="flex items-center gap-1.5 font-semibold">
                                    <Flame className="h-4 w-4 text-orange-500" /> 6 day streak
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    6 min to go today
                                </div>
                            </div>
                        </div>
                    </Bento>
                    <Bento
                        className="md:col-span-2"
                        icon={Clock}
                        title="Real watch time"
                        body="Skipped or fast-forwarded parts don't count. A lesson is done when you've watched it."
                    >
                        <WeekArt />
                    </Bento>
                    <Bento
                        className="md:col-span-2"
                        icon={Code2}
                        title="Code next to the video"
                        body="Run C, C++ and Python with input, right beside the lesson."
                    >
                        <CodeArt />
                    </Bento>
                    <Bento
                        className="md:col-span-2"
                        icon={Trophy}
                        title="XP, gems and badges"
                        body="Every finished lesson moves you up the leaderboard."
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { icon: Flame, v: "Streak", tint: "text-orange-500" },
                                { icon: Award, v: "Badges", tint: "text-amber-500" },
                                { icon: Trophy, v: "Rank", tint: "text-yellow-500" },
                            ].map((x) => (
                                <div
                                    key={x.v}
                                    className="rounded-2xl bg-muted/50 px-2 py-3 text-center"
                                >
                                    <x.icon className={cn("mx-auto h-5 w-5", x.tint)} />
                                    <div className="mt-1 text-xs font-medium">{x.v}</div>
                                </div>
                            ))}
                        </div>
                    </Bento>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <section className="container max-w-3xl py-16 md:py-24">
                <SectionHead eyebrow="Questions" title="Good to know" />
                <div className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                    {PLAYLIST_FAQ.map((f) => (
                        <details key={f.q} className="group px-5 py-4">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                                {f.q}
                                <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                                    +
                                </span>
                            </summary>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {f.a}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────────────────────── */}
            <section className="container max-w-6xl pb-16 pt-4 md:pb-24">
                <div className="rounded-[32px] border border-border bg-card p-6 text-center shadow-card sm:p-12">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
                        Your next playlist could be a finished course.
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                        Paste it now, sign in with Google, and start lesson 1.
                    </p>
                    <PlaylistBox className="mx-auto mt-8 max-w-xl text-left" />
                </div>
            </section>
        </AppShell>
    );
};

/* ── Pieces ──────────────────────────────────────────────────────────── */

const isYouTube = (s: string) => /(youtube\.com|youtu\.be)\//i.test(s);

/** The real first step: paste a playlist link, then sign in and import it. */
const PlaylistBox = ({ className }: { className?: string }) => {
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [error, setError] = useState<string | null>(null);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const v = url.trim();
        if (v && !isYouTube(v)) {
            setError("That doesn't look like a YouTube link.");
            return;
        }
        if (v) savePendingPlaylist(v);
        navigate("/auth");
    };

    return (
        <form onSubmit={submit} className={className}>
            <div className="glass-well flex items-center gap-2 rounded-full p-1.5 pl-4">
                <Youtube className="h-5 w-5 shrink-0 text-red-500" />
                <label htmlFor="playlist-url" className="sr-only">
                    YouTube playlist link
                </label>
                <input
                    id="playlist-url"
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                    }}
                    placeholder="Paste a YouTube playlist link"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground sm:text-base"
                />
                <Button type="submit" className="h-10 shrink-0 rounded-full px-4 sm:px-5">
                    <span className="hidden sm:inline">Make it a course</span>
                    <span className="sm:hidden">Start</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
            {error ? (
                <p className="mt-2 px-4 text-xs text-destructive">{error}</p>
            ) : (
                <p className="mt-2 px-4 text-xs text-muted-foreground">
                    Sign in with Google to import it. No card needed.
                </p>
            )}
        </form>
    );
};

type Impact = {
    learners: number;
    courses: number;
    watch_seconds: number;
    videos_completed: number;
    certificates: number;
};

const compact = (n: number) =>
    n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : n.toLocaleString();

/** Live platform totals ("ZverTs so far"). Hidden if they can't be loaded. */
const Impact = () => {
    const [s, setS] = useState<Impact | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        supabase.rpc("public_impact_stats").then(({ data, error }) => {
            if (error || !data) setFailed(true);
            else setS(data as unknown as Impact);
        });
    }, []);
    if (failed) return null;

    const items = s
        ? [
              { icon: Users, value: compact(s.learners), label: "learners" },
              { icon: Youtube, value: compact(s.courses), label: "playlists turned into courses" },
              {
                  icon: Clock,
                  value: compact(Math.round(s.watch_seconds / 3600)),
                  label: "hours really watched",
              },
              { icon: CheckCircle2, value: compact(s.videos_completed), label: "lessons finished" },
          ]
        : [];

    return (
        <section className="container max-w-6xl py-6 md:py-10" aria-label="ZverTs so far">
            <div className="rounded-[32px] border border-border bg-card p-5 shadow-card sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                        ZverTs so far
                    </h2>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        Live from our learners
                    </span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
                    {s
                        ? items.map((x) => (
                              <div key={x.label}>
                                  <dt className="sr-only">{x.label}</dt>
                                  <dd>
                                      <x.icon className="h-5 w-5 text-primary" />
                                      <div className="mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                                          {x.value}
                                      </div>
                                      <div className="mt-1 text-sm text-muted-foreground">
                                          {x.label}
                                      </div>
                                  </dd>
                              </div>
                          ))
                        : [0, 1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-24 rounded-2xl" />
                          ))}
                </dl>
            </div>
        </section>
    );
};

const SectionHead = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <div className="max-w-2xl">
        <div className="text-sm font-medium text-primary">{eyebrow}</div>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">
            {title}
        </h2>
        {sub && <p className="mt-3 text-muted-foreground md:text-lg">{sub}</p>}
    </div>
);

const Bento = ({
    className,
    icon: Icon,
    title,
    body,
    children,
}: {
    className?: string;
    icon: typeof Lock;
    title: string;
    body: string;
    children: ReactNode;
}) => (
    <div
        className={cn(
            "flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6",
            className,
        )}
    >
        <div className="flex-1">{children}</div>
        <div className="mt-5 flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
);

/* Illustrations built from the app's own UI pieces (example content). */

const LESSONS = [
    { t: "Introduction & setup", d: "12:40", state: "done" as const },
    { t: "Variables and data types", d: "18:05", state: "active" as const, pct: 64 },
    { t: "If, else and loops", d: "21:30", state: "locked" as const },
    { t: "Functions", d: "16:12", state: "locked" as const },
];

const LessonsArt = ({ compact = false }: { compact?: boolean }) => (
    <ul className="space-y-1.5" aria-hidden="true">
        {LESSONS.slice(0, compact ? 3 : 4).map((l, i) => (
            <li
                key={l.t}
                className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                    l.state === "active" ? "glass-lens" : "bg-muted/40",
                    l.state === "locked" && "opacity-60",
                )}
            >
                <span
                    className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        l.state === "done" && "bg-primary text-primary-foreground",
                        l.state === "active" && "bg-primary/15 text-primary",
                        l.state === "locked" && "bg-muted text-muted-foreground",
                    )}
                >
                    {l.state === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : l.state === "locked" ? (
                        <Lock className="h-3.5 w-3.5" />
                    ) : (
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                        {i + 1}. {l.t}
                    </div>
                    {l.state === "active" ? (
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${l.pct}%` }}
                            />
                        </div>
                    ) : (
                        <div className="text-[11px] text-muted-foreground">{l.d}</div>
                    )}
                </div>
            </li>
        ))}
    </ul>
);

const PasteArt = () => (
    <div className="space-y-2" aria-hidden="true">
        <div className="glass-well flex items-center gap-2 rounded-full px-3 py-2.5 text-xs text-muted-foreground">
            <Youtube className="h-4 w-4 shrink-0 text-red-500" />
            <span className="truncate">youtube.com/playlist?list=PL…</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
            <div className="flex aspect-video w-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary/40 to-primary/10">
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
            </div>
            <div className="min-w-0 text-xs">
                <div className="truncate font-medium">C Programming in Bangla</div>
                <div className="text-muted-foreground">24 videos · 9h 12m</div>
            </div>
        </div>
    </div>
);

const CertificateArt = () => (
    <div
        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center"
        aria-hidden="true"
    >
        <Award className="mx-auto h-7 w-7 text-amber-500" />
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Certificate of completion
        </div>
        <div className="mt-1 font-display text-lg font-semibold">Your name</div>
        <div className="text-xs text-muted-foreground">C Programming in Bangla</div>
    </div>
);

const WEEK = [18, 25, 9, 31, 22, 0, 14];
const WeekArt = () => (
    <div className="flex h-24 items-end gap-1.5 rounded-2xl bg-muted/40 p-3" aria-hidden="true">
        {WEEK.map((m, i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
                <div
                    className={cn(
                        "w-full rounded-md",
                        i === WEEK.length - 1 ? "bg-primary" : "bg-primary/35",
                    )}
                    style={{ height: `${Math.max(6, (m / 31) * 100)}%` }}
                />
            </div>
        ))}
    </div>
);

const CodeArt = () => (
    <div
        className="overflow-hidden rounded-2xl bg-[#0d1117] font-mono text-[11px] leading-relaxed text-slate-300"
        aria-hidden="true"
    >
        <div className="px-3 py-2.5">
            <span className="text-sky-400">#include</span>{" "}
            <span className="text-amber-300">&lt;stdio.h&gt;</span>
            <br />
            <span className="text-violet-400">int</span> main() {"{"}
            <br />
            &nbsp;&nbsp;printf(<span className="text-emerald-300">"Hello, ZverTs!\n"</span>);
            <br />
            {"}"}
        </div>
        <div className="border-t border-white/10 px-3 py-2 text-emerald-400">› Hello, ZverTs!</div>
    </div>
);

const ProductPreview = () => (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
        <div className="rounded-[32px] border border-border bg-card p-4 pb-12 shadow-elevated sm:p-5 sm:pb-12">
            <div className="flex items-center gap-3">
                <div className="flex aspect-video w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/50 to-primary/10">
                    <Play className="h-5 w-5 fill-current text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg font-semibold">
                        C Programming in Bangla
                    </div>
                    <div className="text-xs text-muted-foreground">24 lessons · 9h 12m</div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-[38%] rounded-full bg-primary" />
                        </div>
                        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                            38%
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <LessonsArt />
            </div>
        </div>
        <div className="glass-bar glass-capsule absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-elevated sm:-left-6">
            <ProgressRing value={70} size={44} stroke={5}>
                <Target className="h-4 w-4 text-primary" />
            </ProgressRing>
            <div className="text-xs">
                <div className="font-semibold">Today's goal</div>
                <div className="text-muted-foreground">14 of 20 min</div>
            </div>
        </div>
        <div className="glass-bar glass-capsule absolute -right-2 -top-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-elevated sm:-right-4">
            <Flame className="h-4 w-4 text-orange-500" /> 6 day streak
        </div>
    </div>
);

export default Index;
