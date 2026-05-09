import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/zerod/AppShell";
import { CircularProgress } from "@/components/zerod/CircularProgress";
import { ModuleCard } from "@/components/zerod/ModuleCard";
import { WeeklyActivityChart } from "@/components/zerod/WeeklyActivityChart";
import { StatCard } from "@/components/zerod/StatCard";
import { ContinueWatching } from "@/components/zerod/ContinueWatching";
import { DailyChallenge } from "@/components/zerod/DailyChallenge";
import { BadgesGrid } from "@/components/zerod/BadgesGrid";
import { AnalyticsPanel } from "@/components/zerod/AnalyticsPanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckSquare, Flame, Calendar, ArrowRight } from "lucide-react";

interface CourseRow { id: string; title: string; }
interface ModuleRow { id: string; course_id: string; position: number; title: string; duration_seconds: number; }
interface ProgressRow { module_id: string; watch_time_seconds: number; percent_watched: number; completed: boolean; updated_at: string; completed_at: string | null; }

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ownCourses } = await supabase
        .from("courses")
        .select("id,title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const courseIds = (ownCourses ?? []).map((course) => course.id);

      const [{ data: mods }, { data: prog }] = await Promise.all([
        courseIds.length
          ? supabase.from("modules").select("id,course_id,position,title,duration_seconds").in("course_id", courseIds).order("position")
          : Promise.resolve({ data: [] as ModuleRow[] } as { data: ModuleRow[] }),
        supabase.from("module_progress").select("module_id,watch_time_seconds,percent_watched,completed,updated_at,completed_at").eq("user_id", user.id),
      ]);

      setCourses(ownCourses ?? []);
      setModules(mods ?? []);
      setProgress(prog ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const visibleModuleIds = new Set(modules.map((module) => module.id));
  const visibleProgress = progress.filter((entry) => visibleModuleIds.has(entry.module_id));
  const progByMod = new Map(visibleProgress.map(p => [p.module_id, p]));
  const completedCount = visibleProgress.filter(p => p.completed).length;
  const overallPct = modules.length ? (completedCount / modules.length) * 100 : 0;
  const totalWatch = visibleProgress.reduce((sum, p) => sum + p.watch_time_seconds, 0);

  const courseSections = useMemo(() => {
    return courses.map((course) => {
      const courseModules = modules
        .filter((module) => module.course_id === course.id)
        .sort((a, b) => a.position - b.position);

      const cards = courseModules.map((module, idx) => {
        const p = progByMod.get(module.id);
        const prev = idx === 0 ? null : courseModules[idx - 1];
        const prevDone = !prev || progByMod.get(prev.id)?.completed;
        let state: "locked" | "available" | "in_progress" | "completed" = "locked";
        if (p?.completed) state = "completed";
        else if (prevDone && p && p.percent_watched > 0) state = "in_progress";
        else if (prevDone) state = "available";
        return { ...module, state, percent: p?.percent_watched ?? 0 };
      });

      return { course, cards };
    });
  }, [courses, modules, progByMod]);

  const nextModule = courseSections.flatMap((section) => section.cards).find((m) => m.state === "available" || m.state === "in_progress");

  // Weekly activity (last 7 days)
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const minutes = visibleProgress
      .filter(p => { const u = new Date(p.updated_at); return u >= d && u < next; })
      .reduce((s, p) => s + Math.round(p.watch_time_seconds / 60), 0);
    return { day: days[d.getDay()], minutes };
  });

  // Streak: consecutive days ending today with any activity
  let streak = 0;
  for (let i = weekly.length - 1; i >= 0; i--) {
    if (weekly[i].minutes > 0) streak++;
    else break;
  }

  return (
    <AppShell>
      <section className="container py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ dashboard</div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">
              Welcome back, <span className="italic text-primary">{user.user_metadata?.full_name?.split(" ")[0] ?? user.email?.split("@")[0]}</span>
            </h1>
          </div>
          {nextModule && (
            <Link to={`/learn/${nextModule.id}`}>
              <Button size="lg" className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
                Continue Module {String(nextModule.position).padStart(2,"0")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-muted-foreground font-mono text-sm">Loading your progress…</div>
        ) : (
          <>
            {/* Continue watching */}
            <ContinueWatching userId={user.id} />

            {/* Top: progress + stats */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1 rounded-2xl border border-border bg-gradient-card p-8 shadow-card flex flex-col items-center justify-center">
                <CircularProgress value={overallPct} label="Course progress" sublabel={`${completedCount} / ${modules.length} modules`} />
              </div>
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                <StatCard icon={CheckSquare} label="Completed" value={completedCount} sub={`of ${modules.length} modules`} />
                <StatCard icon={Clock} label="Watch time" value={fmtTime(totalWatch)} sub="across all modules" />
                <StatCard icon={Flame} label="Day streak" value={streak} sub={streak ? "Keep it alive" : "Start today"} />
                <StatCard icon={Calendar} label="Active this week" value={weekly.filter(d => d.minutes > 0).length} sub="of 7 days" />
              </div>
            </div>

            {/* Weekly activity */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ weekly activity</div>
                  <h2 className="font-display text-2xl mt-1">Minutes watched · last 7 days</h2>
                </div>
              </div>
              <WeeklyActivityChart data={weekly} />
            </div>

            {/* Daily challenge + Analytics */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <DailyChallenge userId={user.id} />
              <AnalyticsPanel userId={user.id} />
            </div>

            {/* Badges */}
            <div className="mb-10">
              <BadgesGrid userId={user.id} />
            </div>

            {/* Modules grid */}
            <div className="mb-6">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ curriculum</div>
              <h2 className="font-display text-3xl mt-1">Your courses and modules</h2>
            </div>
            {courseSections.length === 0 ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card text-sm text-muted-foreground">
                You have no courses yet. Import a playlist to see your private modules here.
              </div>
            ) : (
              <div className="space-y-8">
                {courseSections.map(({ course, cards }) => (
                  <div key={course.id} className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-2xl">{course.title}</div>
                        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Private course space</div>
                      </div>
                      <Link to={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm">Open course</Button>
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cards.map((m) => (
                        <ModuleCard key={m.id} id={m.id} position={m.position} title={m.title}
                          durationSeconds={m.duration_seconds} state={m.state} percent={m.percent} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
};

export default Dashboard;
