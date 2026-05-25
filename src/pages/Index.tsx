import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import {
  ArrowRight,
  Youtube,
  Layers,
  LineChart,
  Lock,
  Brain,
  Gem,
  CalendarCheck,
  BarChart3,
  Flame,
  Trophy,
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* subtle background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="container py-20 md:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Built for disciplined learners
              </div>
              <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
                Turn any YouTube playlist into a{" "}
                <span className="text-primary">structured course</span>.
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
                Create disciplined learning paths from YouTube playlists with
                modules, tracking, streaks, gems, and progress analytics.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="rounded-full bg-primary text-primary-foreground hover:opacity-90 px-6"
                  >
                    Create Course
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
                {["Playlist-based learning", "Progress tracking", "Gamified system"].map(
                  (s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {s}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="lg:col-span-6 animate-fade-in">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-primary">
            How it works
          </div>
          <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold tracking-tight">
            Three steps to a real course.
          </h2>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: Youtube,
              title: "Paste YouTube Playlist",
              body: "Drop any public playlist URL. We import every video automatically.",
            },
            {
              n: "02",
              icon: Layers,
              title: "Auto Generate Modules",
              body: "Each video becomes a sequential module — locked until the previous is done.",
            },
            {
              n: "03",
              icon: LineChart,
              title: "Learn With Tracking",
              body: "Watch time, quizzes, gems, XP and streaks — all measured server-side.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border/60 bg-card/30 p-8 transition-all duration-300 hover:border-primary/40 hover:bg-card/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground/70">{p.n}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-24 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-primary">
            Features
          </div>
          <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold tracking-tight">
            Everything you need to finish.
          </h2>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Lock, title: "Sequential Modules", body: "Each lesson unlocks only after the previous is completed." },
            { icon: BarChart3, title: "Smart Tracking", body: "Real watch time recorded server-side every few seconds." },
            { icon: Brain, title: "MCQ System", body: "Pass a quiz at the end of every module to lock progress." },
            { icon: Gem, title: "Gems & XP", body: "Earn rewards for every completed module and quiz." },
            { icon: CalendarCheck, title: "Attendance", body: "Build a daily streak by showing up to learn." },
            { icon: LineChart, title: "Analytics Dashboard", body: "Visualize your progress, streaks and completion rate." },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-background p-8 transition-colors hover:bg-card/40"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-5 font-display text-lg font-semibold">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="container py-24 md:py-32 border-t border-border/40">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary">
              Your learning, measured
            </div>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold tracking-tight">
              A dashboard that respects your time.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
              Track streaks, XP, completion rate and weekly watch time in one
              calm, focused view. No noise — just signal.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { k: "12", v: "Day streak" },
                { k: "1.4k", v: "XP earned" },
                { k: "78%", v: "Completion" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-border/60 bg-card/30 p-4"
                >
                  <div className="font-display text-2xl text-primary">
                    {s.k}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in">
            <AnalyticsMockup />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24 md:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/30 px-8 py-20 md:py-28 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>
          <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-5xl font-semibold tracking-tight">
            Build Your Personal Learning System
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">
            One link. One structured path. Real progress you can prove.
          </p>
          <Link to="/auth" className="mt-10 inline-block">
            <Button
              size="lg"
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90 px-7"
            >
              Start Creating Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </AppShell>
  );
};

/* ---------- mockups ---------- */

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur p-5 shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="text-[10px] text-muted-foreground">
            zvert.app / dashboard
          </div>
          <div className="w-8" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: Flame, k: "12", v: "Streak", color: "text-orange-400" },
            { icon: Gem, k: "248", v: "Gems", color: "text-primary" },
            { icon: Trophy, k: "1.4k", v: "XP", color: "text-yellow-400" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-xl border border-border/50 bg-background/50 p-3"
            >
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div className="mt-2 font-display text-xl">{s.k}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* progress ring + list */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          <div className="col-span-2 rounded-xl border border-border/50 bg-background/50 p-4 flex flex-col items-center justify-center">
            <ProgressRing value={78} />
            <div className="mt-3 text-xs text-muted-foreground">Course progress</div>
          </div>
          <div className="col-span-3 rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
            {[
              { t: "React Fundamentals", p: 100 },
              { t: "Advanced Hooks", p: 64 },
              { t: "State Management", p: 32 },
            ].map((m) => (
              <div key={m.t}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="truncate">{m.t}</span>
                  <span className="text-muted-foreground">{m.p}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${m.p}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [40, 65, 50, 80, 45, 90, 70];
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">This week</div>
            <div className="mt-1 font-display text-2xl">8h 24m watched</div>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            +18%
          </div>
        </div>

        <div className="mt-8 flex h-40 items-end gap-3">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-gradient-to-t from-primary/60 to-primary"
                style={{ height: `${h}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {["M", "T", "W", "T", "F", "S", "S"][i]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/50 pt-5">
          {[
            { k: "24", v: "Modules" },
            { k: "6", v: "Quizzes" },
            { k: "3", v: "Certificates" },
          ].map((s) => (
            <div key={s.v}>
              <div className="font-display text-lg">{s.k}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          strokeWidth="6"
          className="stroke-border/60"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          strokeWidth="6"
          className="stroke-primary"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-lg">
        {value}%
      </div>
    </div>
  );
}

export default Index;
