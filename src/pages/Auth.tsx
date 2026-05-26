import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import zvertsLogo from "@/assets/zverts-logo.png";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const signInGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard", { replace: true });
  };

  return (
    <AppShell>
      <section className="container py-10 md:py-16 min-h-[calc(100vh-4rem)] grid place-items-center">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-8 font-mono transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>

          <div className="relative rounded-3xl border border-border/60 bg-card/95 p-8 md:p-12 shadow-elevated backdrop-blur-xl overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-lime opacity-20 blur-3xl" aria-hidden />

            {/* Logo */}
            <div className="relative flex flex-col items-center text-center">
              <img
                src={zvertsLogo}
                alt="ZverTs"
                width={64}
                height={64}
                className="h-16 w-auto drop-shadow-[0_0_16px_hsl(var(--primary)/0.55)]"
              />
              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> One-tap sign in
              </div>
              <h1 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Welcome to ZverTs
              </h1>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xs">
                Learn smarter with AI-powered courses, gamified progress, and personalized guidance.
              </p>
            </div>

            {/* Google button */}
            <div className="relative mt-10">
              <Button
                onClick={signInGoogle}
                disabled={busy}
                size="lg"
                className="group w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <p className="mt-6 text-center text-[11px] text-muted-foreground/80 font-mono leading-relaxed">
                By continuing, you agree to our{" "}
                <button onClick={() => navigate("/info/terms")} className="underline-offset-2 hover:underline hover:text-foreground">Terms</button>
                {" & "}
                <button onClick={() => navigate("/info/privacy")} className="underline-offset-2 hover:underline hover:text-foreground">Privacy Policy</button>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Auth;
