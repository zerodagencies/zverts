import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/zerod/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import zvertLogo from "@/assets/zvert-logo.png";

const emailSchema = z
  .string()
  .trim()
  .nonempty({ message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255, { message: "Email is too long" });

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [email, setEmail] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const signInGoogle = async () => {
    setGoogleBusy(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (error) {
      toast.error(error.message || "Sign-in failed");
      setGoogleBusy(false);
    }
  };

  const handleEmailLogin = async () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setEmailBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: result.data,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setEmailBusy(false);
    if (error) return toast.error(error.message || "Could not send login link");
    toast.success("Login link sent. Check your email.");
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

          <div className="rounded-3xl border border-border/60 bg-card/95 p-8 md:p-10 shadow-elevated backdrop-blur-xl">
            {/* Logo */}
            <div className="flex flex-col items-center text-center">
              <img
                src={zvertLogo}
                alt="ZverT"
                className="h-14 w-auto drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
              />
              <h1 className="mt-4 font-display text-xl md:text-2xl font-semibold tracking-tight">
                Register / Log In
              </h1>
            </div>

            {/* Email form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailLogin();
              }}
              className="mt-8 space-y-4"
            >
              <div>
                <Label htmlFor="email" className="text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="mt-1.5 h-12 transition-all focus-visible:ring-2 focus-visible:ring-primary/60"
                />
              </div>

              <Button
                type="submit"
                disabled={emailBusy}
                className="w-full h-12 bg-gradient-lime text-primary-foreground hover:opacity-95 shadow-glow transition-all hover:-translate-y-0.5 font-semibold"
              >
                {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
              </Button>
            </form>

            {/* OR divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                <span className="bg-card px-3">or</span>
              </div>
            </div>

            {/* Google */}
            <Button
              onClick={signInGoogle}
              disabled={googleBusy}
              variant="outline"
              size="lg"
              className="w-full h-12 border-border bg-background/60 hover:bg-secondary hover:border-primary/40 transition-all hover:-translate-y-0.5 font-medium"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"
                />
              </svg>
              {googleBusy ? "Redirecting..." : "Continue with Google"}
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground/80 font-mono">
              We'll email you a secure login link.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Auth;
