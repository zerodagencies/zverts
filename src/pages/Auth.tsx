import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/zerod/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const signInGoogle = async () => {
    setGoogleBusy(true);
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
    if (error) {
      toast.error(error.message || "Sign-in failed");
      setGoogleBusy(false);
    }
  };

  const signInPasswordUser = async () => {
    if (!signInEmail.trim() || !signInPassword) return toast.error("Enter your email and password");
    setEmailBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail.trim(),
      password: signInPassword,
    });
    setEmailBusy(false);
    if (error) return toast.error(error.message || "Login failed");
    toast.success("Welcome back");
    navigate("/dashboard");
  };

  const signUpPasswordUser = async () => {
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) return toast.error("Fill in all sign up fields");
    if (signUpPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (signUpPassword !== confirmPassword) return toast.error("Passwords do not match");
    setEmailBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail.trim(),
      password: signUpPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signUpName.trim() },
      },
    });
    setEmailBusy(false);
    if (error) return toast.error(error.message || "Sign up failed");
    toast.success("Account created. Check your email to verify your account.");
    setSignUpPassword("");
    setConfirmPassword("");
  };

  const sendReset = async () => {
    const email = signInEmail.trim() || signUpEmail.trim();
    if (!email) return toast.error("Enter your email first");
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (error) return toast.error(error.message || "Could not send reset link");
    toast.success("Password reset link sent");
  };

  return (
    <AppShell>
      <section className="container py-16 md:py-24">
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-8 font-mono">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="rounded-3xl border border-border/60 bg-gradient-card p-8 md:p-10 shadow-elevated">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-mono text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> ZverT access
            </div>
            <h1 className="mt-5 font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">Manual login, manual signup, and Google in one place.</h1>
            <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">Create your account with email and password or continue with Google. Your courses, modules, notes, progress, and Vert AI stay tied to your personal learning space.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                "Your own private courses",
                "Server-tracked learning progress",
                "Google + email sign in",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-background/40 px-4 py-4 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/95 p-6 md:p-8 shadow-elevated backdrop-blur-xl">
            <Tabs defaultValue="signin" className="space-y-6">
              <TabsList className="grid h-auto grid-cols-2 border border-border/60 bg-background/60 p-1">
                <TabsTrigger value="signin">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-5">
                <div>
                  <div className="font-display text-3xl font-semibold tracking-tight">Welcome back</div>
                  <p className="mt-2 text-sm text-muted-foreground">Log in to continue your courses and modules.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" />
                  </div>
                  <Button onClick={signInPasswordUser} disabled={emailBusy} className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">
                    {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login with email"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={sendReset} disabled={resetBusy} className="w-full text-muted-foreground hover:text-foreground">
                    {resetBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Forgot password? Send reset link"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-5">
                <div>
                  <div className="font-display text-3xl font-semibold tracking-tight">Create your account</div>
                  <p className="mt-2 text-sm text-muted-foreground">Sign up once, verify your email, then start building personal courses.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Full name</Label>
                    <Input value={signUpName} onChange={(e) => setSignUpName(e.target.value)} className="mt-1.5" placeholder="Your name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} className="mt-1.5" placeholder="Minimum 8 characters" />
                    </div>
                    <div>
                      <Label>Confirm password</Label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5" placeholder="Repeat password" />
                    </div>
                  </div>
                  <Button onClick={signUpPasswordUser} disabled={emailBusy} className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">
                    {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </div>
              </TabsContent>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                  <span className="bg-card px-3">or</span>
                </div>
              </div>

              <Button onClick={signInGoogle} disabled={googleBusy} variant="outline" size="lg" className="w-full border-border bg-background/60 hover:bg-secondary hover:border-primary/40 font-medium">
                <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/></svg>
                {googleBusy ? "Redirecting..." : "Continue with Google"}
              </Button>

              <p className="text-xs text-muted-foreground/80 font-mono leading-relaxed">
                Your dashboard only shows your own courses, your own modules, and your own progress.
              </p>
            </Tabs>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Auth;
