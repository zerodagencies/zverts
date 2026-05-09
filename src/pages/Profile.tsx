import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/zerod/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Camera, Gem, Flame, Sparkles, Trophy, UserCircle2 } from "lucide-react";

const Profile = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [certName, setCertName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [stats, setStats] = useState({ total_xp: 0, total_gems: 0, current_streak: 0, longest_streak: 0, profile_public: true });
  const [busy, setBusy] = useState(false);

  const firstName = useMemo(() => {
    const source = name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner";
    return source.split(" ")[0];
  }, [name, user]);

  const level = Math.floor(stats.total_xp / 500) + 1;

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,certificate_name,avatar_url,total_xp,total_gems,current_streak,longest_streak,profile_public").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.name ?? ""); setCertName(data?.certificate_name ?? ""); setAvatar(data?.avatar_url ?? null);
      setStats({
        total_xp: data?.total_xp ?? 0,
        total_gems: data?.total_gems ?? 0,
        current_streak: data?.current_streak ?? 0,
        longest_streak: data?.longest_streak ?? 0,
        profile_public: data?.profile_public ?? true,
      });
    });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async () => {
    setBusy(true);
    await supabase.from("profiles").update({ name, certificate_name: certName }).eq("id", user.id);
    setBusy(false); toast.success(t("profile.saved"));
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setAvatar(data.publicUrl); toast.success("Photo updated");
  };

  return (
    <AppShell>
      <section className="container py-10 md:py-14 max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border/60 bg-gradient-card p-8 md:p-10 shadow-elevated overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_35%)] pointer-events-none" />
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-24 w-24 rounded-3xl bg-muted overflow-hidden border border-border/60 shadow-card flex items-center justify-center">
                    {avatar ? <img src={avatar} alt="Profile avatar" className="w-full h-full object-cover" /> : <UserCircle2 className="h-14 w-14 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ profile</div>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">{firstName}</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">Your personal ZverT identity, learning rewards, and account settings.</p>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={upload} />
                  <span className="inline-flex items-center justify-center rounded-xl border border-input bg-background/70 hover:bg-accent hover:text-accent-foreground h-10 px-4 text-sm font-medium">
                    <Camera className="h-4 w-4 mr-2" /> {t("profile.upload")}
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Level", value: level, icon: Sparkles },
                  { label: "XP", value: stats.total_xp, icon: Trophy },
                  { label: "Gems", value: stats.total_gems, icon: Gem },
                  { label: "Streak", value: stats.current_streak, icon: Flame },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-card">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-mono uppercase tracking-widest">{item.label}</span>
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-3 font-display text-3xl">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Learning identity</div>
                    <div className="mt-2 text-sm text-muted-foreground">Certificate name: <span className="text-foreground font-medium">{certName || name || user.email}</span></div>
                    <div className="mt-1 text-sm text-muted-foreground">Longest streak: <span className="text-foreground font-medium">{stats.longest_streak} days</span></div>
                  </div>
                  <div className="rounded-xl border border-border/60 px-4 py-3 text-right">
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Visibility</div>
                    <div className="mt-2 font-medium text-foreground">{stats.profile_public ? "Public profile" : "Private profile"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-card p-8 shadow-card space-y-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ edit details</div>
              <h2 className="font-display text-3xl font-semibold tracking-tight mt-2">Update your profile</h2>
            </div>
            <div className="space-y-5">
              <div><Label>{t("profile.email")}</Label><Input value={user.email ?? ""} disabled className="mt-1.5" /></div>
              <div><Label>{t("profile.name")}</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" /></div>
              <div><Label>{t("profile.certificateName")}</Label><Input value={certName} onChange={e => setCertName(e.target.value)} className="mt-1.5" /></div>
              <Button onClick={save} disabled={busy} className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">{t("common.save")}</Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};
export default Profile;