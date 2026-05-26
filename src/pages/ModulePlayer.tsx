import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/app/YouTubePlayer";
import { NotesPanel } from "@/components/app/NotesPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";

const AITutorPanel = lazy(() => import("@/components/app/AITutorPanel").then(m => ({ default: m.AITutorPanel })));

interface Mod { id: string; course_id: string; position: number; title: string; duration_seconds: number; youtube_video_id: string; courses?: { title: string } | null; }

const ModulePlayer = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mod, setMod] = useState<Mod | null>(null);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [percent, setPercent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [nextId, setNextId] = useState<string | null>(null);
  const [rewardFlash, setRewardFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastSentRef = useRef(0);
  const playerRef = useRef<YouTubePlayerHandle>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: m } = await supabase.from("modules").select("id,course_id,position,title,duration_seconds,youtube_video_id,courses(title)").eq("id", id).maybeSingle();
      if (!m) { setLoading(false); return; }

      // RLS already enforces visibility (owned, public, system, or admin).
      const { data: visibleCourse } = await supabase.from("courses").select("id").eq("id", m.course_id).maybeSingle();
      if (!visibleCourse) { setLoading(false); return; }

      setMod(m);
      const { data: nextMod } = await supabase.from("modules").select("id").eq("course_id", m.course_id).eq("position", m.position + 1).maybeSingle();
      setNextId(nextMod?.id ?? null);

      const { data: unlock } = await supabase.rpc("is_module_unlocked", { _user_id: user.id, _module_id: m.id });
      setUnlocked(!!unlock);

      const { data: p } = await supabase.from("module_progress").select("percent_watched,completed,watch_time_seconds")
        .eq("user_id", user.id).eq("module_id", m.id).maybeSingle();
      if (p) {
        setPercent(Number(p.percent_watched));
        setCompleted(p.completed);
        lastSentRef.current = p.watch_time_seconds;
      }
      setLoading(false);
    })();
  }, [user, id]);

  const sendProgress = async (watch: number, force = false) => {
    if (!mod) return;
    // Only send if at least 5s of new progress, or force
    if (!force && watch - lastSentRef.current < 5) return;
    lastSentRef.current = watch;
    const { data, error } = await supabase.rpc("update_module_progress", {
      _module_id: mod.id, _watch_time: watch, _force_complete: force,
    });
    if (error) { toast.error(error.message); return; }
    if (data) {
      const row = data as any;
      setPercent(Number(row.percent_watched));
      if (row.completed && !completed) {
        setCompleted(true);
          setRewardFlash(true);
          setTimeout(() => setRewardFlash(false), 3200);
        toast.success("Module complete! 🎉", { description: "The next module is now unlocked." });
      }
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppShell>
      <section className="container py-8 md:py-10 max-w-5xl">
        <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono mb-6">
          <ArrowLeft className="h-3 w-3" /> All modules
        </Link>

        {loading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="grid sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : !mod ? (
          <div className="text-muted-foreground">Module not found or you do not have access.</div>
        ) : !unlocked ? (
          <div className="rounded-2xl border border-border bg-gradient-card p-12 text-center shadow-elevated">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-3xl font-semibold">This module is locked</h2>
            <p className="text-muted-foreground mt-2">Complete the previous module to unlock it.</p>
            <Button className="mt-6" onClick={() => navigate("/learn")}>Back to modules</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">MODULE / {String(mod.position).padStart(2,"0")}</div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2 text-balance">{mod.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Course: {mod.courses?.title ?? "Your course"}</p>
            </div>

            <YouTubePlayer ref={playerRef} videoId={mod.youtube_video_id} onProgress={(s) => sendProgress(s)} />

            {/* Progress + actions */}
            <div className="mt-6 rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center justify-between font-mono text-xs text-muted-foreground mb-2">
                    <span>WATCH PROGRESS</span>
                    <span>{Math.round(percent)}% / 90% to complete</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-lime transition-all duration-700" style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {completed ? (
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="h-5 w-5" /> Completed
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => sendProgress(lastSentRef.current, true)}>
                      Mark complete
                    </Button>
                  )}
                  {completed && nextId && (
                    <Button onClick={() => navigate(`/learn/${nextId}`)} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">
                      Next module <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground font-mono">
                Tracked server-side every 5s. Auto-completes at 90%. Manual completion is also recorded.
              </p>
            </div>

            <div className={`mt-6 rounded-2xl border p-5 shadow-card transition-all duration-500 ${rewardFlash ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-gradient-card"}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ module reward</div>
                  <h2 className="font-display text-2xl mt-1">Character charge earned</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Finish each module to charge your ZverTs character with <span className="text-primary font-medium">+50 XP</span> and <span className="text-primary font-medium">+2 Gems</span>.</p>
                </div>
                <div className="min-w-[180px] rounded-2xl border border-border/60 bg-background/60 px-5 py-4 text-center">
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">Charge state</div>
                  <div className={`mt-2 font-display text-3xl transition-colors ${completed ? "text-primary" : "text-muted-foreground"}`}>{completed ? "100%" : `${Math.round(Math.min(percent, 100))}%`}</div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-lime transition-all duration-700" style={{ width: `${completed ? 100 : Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <NotesPanel
                moduleId={mod.id}
                getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
                onSeek={(s) => playerRef.current?.seekTo(s)}
              />
              <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="font-display text-lg mb-1">Need help understanding?</div>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">Open Vert to explain concepts, summarize this lesson, answer questions about this course, or quiz you in English or Bangla.</p>
                <p className="text-xs font-mono text-muted-foreground">Tap "Chat with Vert" bottom-right →</p>
              </div>
            </div>

            <Suspense fallback={null}><AITutorPanel moduleId={mod.id} /></Suspense>
          </>
        )}
      </section>
    </AppShell>
  );
};

export default ModulePlayer;
