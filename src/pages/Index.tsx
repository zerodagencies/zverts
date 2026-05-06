import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/zerod/AppShell";
import { ArrowRight, Lock, Activity, Award, ShieldCheck, Youtube, Gem, Flame, Users, BookOpen, Brain, Globe, CheckCircle2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="container relative py-24 md:py-36">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Free · Gamified · Sequential · Verified
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight text-balance">
              Turn any YouTube playlist into a <span className="italic text-primary">real course</span>.
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl text-balance">
              Paste a playlist link. ZeroD Academy converts it into a structured, locked course with watch tracking, gems, XP, streaks, quizzes and a verifiable certificate. <span className="text-foreground font-medium">No skipping. No shortcuts.</span> Just earned progress.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
                How it works ↓
              </a>
            </div>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
              {[
                { k: "∞", v: "Playlists" },
                { k: "90%", v: "Watch to pass" },
                { k: "+50", v: "XP / module" },
                { k: "0$", v: "Forever free" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-3xl text-primary">{s.k}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-24">
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">How it works</div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-balance">From playlist to certificate in 4 steps.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { n: "01", icon: Youtube, title: "Paste a playlist", body: "Drop any public YouTube playlist URL. We auto-import every video as a module." },
            { n: "02", icon: Lock, title: "Unlock sequentially", body: "Module 02 only opens after Module 01. Server-validated — no client tricks." },
            { n: "03", icon: Brain, title: "Watch + quiz", body: "Watch 90% of the video and pass the 10-question MCQ to lock in completion." },
            { n: "04", icon: Award, title: "Earn certificate", body: "Finish every module to download a branded, verifiable PDF certificate." },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-gradient-card p-6 shadow-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <p.icon className="h-5 w-5 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">{p.n}</span>
              </div>
              <h3 className="font-display text-xl mt-4">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-24 border-t border-border/60">
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Built for finishers</div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-balance">Every feature pushes you to <span className="italic text-primary">complete</span>.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Activity, title: "Real watch tracking", body: "Watch time is recorded server-side every 5 seconds. 90% auto-completes." },
            { icon: Gem, title: "Gems & XP", body: "+2 gems & +50 XP per module. +1 gem & +30 XP for every quiz you pass." },
            { icon: Flame, title: "Daily streak", body: "Check in every day to grow your streak. Miss a day and it resets to 1." },
            { icon: Users, title: "Public leaderboard", body: "Climb the global ranks by XP and gems. Compete with friends." },
            { icon: ShieldCheck, title: "Honest progress", body: "All unlocks, gems and certificates are validated server-side. No cheating." },
            { icon: Globe, title: "English & Bangla", body: "Full UI translation with one click. Learn in the language you think in." },
            { icon: BookOpen, title: "Notes per timestamp", body: "Take notes anchored to the exact second of the video for easy review." },
            { icon: CheckCircle2, title: "Distraction-free player", body: "Clean embedded player. No platform ads. No popups. Just the lesson." },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-gradient-card p-6 shadow-card hover:border-primary/30 transition-colors">
              <p.icon className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl mt-4">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For who */}
      <section className="container py-24 border-t border-border/60">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Self-learners", body: "Stop bookmarking 40-hour playlists you'll never finish. Get forced structure." },
            { title: "Bootcamp creators", body: "Curate a playlist, share the public course link, watch your students complete it." },
            { title: "Teams & study groups", body: "Track who's actually watched the onboarding videos. Leaderboard included." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card/30 p-8">
              <h3 className="font-display text-2xl">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-24 border-t border-border/60">
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">FAQ</div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">Quick answers.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {[
            { q: "Is it really free?", a: "Yes. ZeroD Academy is 100% free. No paywalls, no premium tier." },
            { q: "Do I need a YouTube API key?", a: "No. The platform handles the import for you — just paste a playlist link." },
            { q: "Can I share my course?", a: "Yes. Toggle a course public and share its link with anyone." },
            { q: "Will I see ads?", a: "The platform UI is fully ad-free. Embedded YouTube videos may still show YouTube's own ads." },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-gradient-card p-6">
              <div className="font-display text-lg">{f.q}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-32">
        <div className="rounded-2xl border border-border bg-gradient-card p-10 md:p-16 shadow-elevated text-center">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-balance">
            Ready to actually finish a course?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Sign in. Paste a playlist. Start Module 01. Earn the rest.
          </p>
          <Link to="/auth" className="inline-block mt-8">
            <Button size="lg" className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
              Create your first course <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
