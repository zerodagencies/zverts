import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/zerod/AppShell";
import { ModuleCard } from "@/components/zerod/ModuleCard";
import { supabase } from "@/integrations/supabase/client";

interface CourseRow { id: string; title: string; }
interface ModuleRow { id: string; course_id: string; position: number; title: string; duration_seconds: number; }
interface ProgressRow { module_id: string; percent_watched: number; completed: boolean; }

const Learn = () => {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [mods, setMods] = useState<ModuleRow[]>([]);
  const [prog, setProg] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ownCourses } = await supabase.from("courses").select("id,title").eq("user_id", user.id).order("created_at", { ascending: false });
      const courseIds = (ownCourses ?? []).map((course) => course.id);
      const [{ data: m }, { data: p }] = await Promise.all([
        courseIds.length
          ? supabase.from("modules").select("id,course_id,position,title,duration_seconds").in("course_id", courseIds).order("position")
          : Promise.resolve({ data: [] as ModuleRow[] } as { data: ModuleRow[] }),
        supabase.from("module_progress").select("module_id,percent_watched,completed").eq("user_id", user.id),
      ]);
      setCourses(ownCourses ?? []); setMods(m ?? []); setProg(p ?? []); setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const pmap = new Map(prog.map(p => [p.module_id, p]));
  const sections = courses.map((course) => {
    const courseMods = mods.filter((m) => m.course_id === course.id).sort((a, b) => a.position - b.position);
    const cards = courseMods.map((m, i) => {
      const p = pmap.get(m.id);
      const prev = i === 0 ? null : courseMods[i - 1];
      const prevDone = !prev || pmap.get(prev.id)?.completed;
      let state: "locked" | "available" | "in_progress" | "completed" = "locked";
      if (p?.completed) state = "completed";
      else if (prevDone && p && p.percent_watched > 0) state = "in_progress";
      else if (prevDone) state = "available";
      return { ...m, state, percent: p?.percent_watched ?? 0 };
    });
    return { course, cards };
  });

  return (
    <AppShell>
      <section className="container py-10 md:py-14">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ curriculum</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">Your private modules</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">Only modules from your own courses are shown here. Each course unlocks sequentially inside its own track.</p>

        <div className="mt-12">
          {loading ? (
            <div className="text-muted-foreground font-mono text-sm">Loading…</div>
          ) : (
            sections.length === 0 ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card text-sm text-muted-foreground">
                Import a playlist first to start your personal learning dashboard.
              </div>
            ) : (
              <div className="space-y-8">
                {sections.map(({ course, cards }) => (
                  <div key={course.id} className="space-y-4">
                    <div>
                      <div className="font-display text-2xl">{course.title}</div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Course modules</div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cards.map(c => (
                        <ModuleCard key={c.id} id={c.id} position={c.position} title={c.title}
                          durationSeconds={c.duration_seconds} state={c.state} percent={c.percent} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default Learn;
