import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/zerod/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwd !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/dashboard");
  };

  return (
    <AppShell>
      <section className="container py-20 max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Reset password</h1>
        <p className="text-muted-foreground mb-8">Choose a new password for your account.</p>
        <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-5">
          {!ready && <p className="text-sm text-muted-foreground">Verifying reset link…</p>}
          <div><Label>New password</Label><Input type="password" className="mt-1.5" value={pwd} onChange={e => setPwd(e.target.value)} disabled={!ready} /></div>
          <div><Label>Confirm password</Label><Input type="password" className="mt-1.5" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={!ready} /></div>
          <Button onClick={submit} disabled={!ready || busy} className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">Update password</Button>
        </div>
      </section>
    </AppShell>
  );
};

export default ResetPassword;