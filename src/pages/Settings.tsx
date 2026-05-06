import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/zerod/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Trash2, LogOut, Lock, Globe, BookOpen, Bell, User as UserIcon, Trophy, ShieldAlert, RotateCcw, Pencil } from "lucide-react";

type Profile = {
  name: string | null; email: string | null; avatar_url: string | null;
  certificate_name: string | null; preferred_language: string;
  daily_goal_minutes: number; study_reminders_enabled: boolean;
  notify_email: boolean; notify_inactivity: boolean; notify_completion: boolean;
  profile_public: boolean;
  total_gems: number; total_xp: number; current_streak: number; longest_streak: number;
};

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [courses, setCourses] = useState<{ id: string; title: string; is_public: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    setEmailInput(user.email ?? "");
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setP(data as Profile);
      const { count } = await supabase.from("module_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true);
      setCompletedCount(count ?? 0);
      const { data: cs } = await supabase.from("courses").select("id,title,is_public").eq("user_id", user.id).order("created_at", { ascending: false });
      setCourses(cs ?? []);
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!p) return <AppShell><div className="container py-20 text-muted-foreground font-mono text-sm">Loading…</div></AppShell>;

  const update = (patch: Partial<Profile>) => setP({ ...p, ...patch });

  const saveProfile = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      name: p.name, certificate_name: p.certificate_name,
      preferred_language: p.preferred_language,
      daily_goal_minutes: p.daily_goal_minutes,
      study_reminders_enabled: p.study_reminders_enabled,
      notify_email: p.notify_email, notify_inactivity: p.notify_inactivity, notify_completion: p.notify_completion,
      profile_public: p.profile_public,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success(t("profile.saved"));
    if (p.preferred_language !== i18n.language) i18n.changeLanguage(p.preferred_language);
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    update({ avatar_url: data.publicUrl });
    toast.success("Photo updated");
  };

  const changeEmail = async () => {
    if (!emailInput || emailInput === user.email) return;
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent to your new address.");
  };

  const changePassword = async () => {
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPwd(""); }
  };

  const forgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent to your email");
  };

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) toast.error(error.message);
    else { toast.success("Signed out from all devices"); window.location.href = "/"; }
  };

  const toggleCoursePublic = async (id: string, val: boolean) => {
    await supabase.from("courses").update({ is_public: val }).eq("id", id);
    setCourses(courses.map(c => c.id === id ? { ...c, is_public: val } : c));
  };
  const renameCourse = async (id: string, title: string) => {
    if (!title.trim()) return;
    await supabase.from("courses").update({ title }).eq("id", id);
    setCourses(courses.map(c => c.id === id ? { ...c, title } : c));
    toast.success("Course renamed");
  };
  const deleteCourse = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    setCourses(courses.filter(c => c.id !== id));
    toast.success("Course deleted");
  };

  const resetProgress = async () => {
    const { error } = await supabase.rpc("reset_my_progress");
    if (error) toast.error(error.message);
    else { toast.success("All progress reset"); window.location.reload(); }
  };

  const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) return toast.error(error.message);
    await signOut();
    window.location.href = "/";
  };

  const level = Math.floor(p.total_xp / 500) + 1;

  return (
    <AppShell>
      <section className="container py-10 md:py-14 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Account settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile, security, learning preferences, and privacy.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-card/60 border border-border p-1">
            <TabsTrigger value="profile"><UserIcon className="h-3.5 w-3.5 mr-1.5" />Profile</TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-3.5 w-3.5 mr-1.5" />Security</TabsTrigger>
            <TabsTrigger value="prefs"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Learning</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger value="progress"><Trophy className="h-3.5 w-3.5 mr-1.5" />Progress</TabsTrigger>
            <TabsTrigger value="courses"><BookOpen className="h-3.5 w-3.5 mr-1.5" />My courses</TabsTrigger>
            <TabsTrigger value="privacy"><Globe className="h-3.5 w-3.5 mr-1.5" />Privacy</TabsTrigger>
            <TabsTrigger value="danger" className="data-[state=active]:text-destructive"><ShieldAlert className="h-3.5 w-3.5 mr-1.5" />Danger</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-full bg-muted overflow-hidden border border-border">
                  {p.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                  <span className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-4 text-sm font-medium">{t("profile.upload")}</span>
                </label>
              </div>
              <div><Label>{t("profile.name")}</Label><Input className="mt-1.5" value={p.name ?? ""} onChange={e => update({ name: e.target.value })} /></div>
              <div><Label>{t("profile.certificateName")}</Label><Input className="mt-1.5" value={p.certificate_name ?? ""} onChange={e => update({ certificate_name: e.target.value })} /></div>
              <div>
                <Label>{t("profile.email")}</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} type="email" />
                  <Button variant="outline" onClick={changeEmail} disabled={emailInput === user.email}>Update email</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">A verification link will be sent to the new address.</p>
              </div>
              <Button onClick={saveProfile} disabled={busy} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">{t("common.save")}</Button>
            </div>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security">
            <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-6">
              <div>
                <Label>Change password</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input type="password" placeholder="New password (min 8 chars)" value={pwd} onChange={e => setPwd(e.target.value)} />
                  <Button onClick={changePassword}>Update</Button>
                </div>
              </div>
              <div className="border-t border-border pt-6 flex items-center justify-between">
                <div>
                  <div className="font-medium">Forgot password</div>
                  <p className="text-sm text-muted-foreground">Send a reset link to {user.email}.</p>
                </div>
                <Button variant="outline" onClick={forgotPassword}>Send link</Button>
              </div>
              <div className="border-t border-border pt-6 flex items-center justify-between">
                <div>
                  <div className="font-medium">Sign out everywhere</div>
                  <p className="text-sm text-muted-foreground">Ends every active session on every device.</p>
                </div>
                <Button variant="outline" onClick={signOutAll}><LogOut className="h-4 w-4 mr-2" />Sign out all</Button>
              </div>
            </div>
          </TabsContent>

          {/* LEARNING PREFS */}
          <TabsContent value="prefs">
            <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-6">
              <div>
                <Label>{t("profile.language")}</Label>
                <Select value={p.preferred_language} onValueChange={(v) => update({ preferred_language: v })}>
                  <SelectTrigger className="mt-1.5 w-60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Daily learning goal (minutes)</Label>
                <Input type="number" min={5} max={480} className="mt-1.5 w-40" value={p.daily_goal_minutes}
                  onChange={e => update({ daily_goal_minutes: Math.max(5, Math.min(480, parseInt(e.target.value) || 30)) })} />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <div className="font-medium">Study reminders</div>
                  <p className="text-sm text-muted-foreground">Daily nudge to keep your streak alive.</p>
                </div>
                <Switch checked={p.study_reminders_enabled} onCheckedChange={(v) => update({ study_reminders_enabled: v })} />
              </div>
              <Button onClick={saveProfile} disabled={busy} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">{t("common.save")}</Button>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-5">
              {[
                { k: "notify_email" as const, title: "Email notifications", body: "Master switch for all email from ZeroD Academy." },
                { k: "notify_inactivity" as const, title: "Inactivity alerts", body: "Get a nudge if you haven't studied in a few days." },
                { k: "notify_completion" as const, title: "Completion emails", body: "Receive a recap when you finish a module or course." },
              ].map(item => (
                <div key={item.k} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                  <Switch checked={p[item.k]} onCheckedChange={(v) => update({ [item.k]: v } as any)} />
                </div>
              ))}
              <Button onClick={saveProfile} disabled={busy} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">{t("common.save")}</Button>
            </div>
          </TabsContent>

          {/* PROGRESS */}
          <TabsContent value="progress">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total gems", value: p.total_gems },
                { label: "Total XP", value: p.total_xp },
                { label: "Level", value: level },
                { label: "Modules completed", value: completedCount },
                { label: "Current streak", value: `${p.current_streak} days` },
                { label: "Longest streak", value: `${p.longest_streak} days` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className="font-display text-3xl text-primary mt-2">{s.value}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* COURSES */}
          <TabsContent value="courses">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">You haven't created any courses yet. <Link to="/courses" className="text-primary underline">Create one</Link>.</p>
              ) : (
                <div className="space-y-2">
                  {courses.map(c => (
                    <CourseRow key={c.id} c={c} onRename={renameCourse} onToggle={toggleCoursePublic} onDelete={deleteCourse} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* PRIVACY */}
          <TabsContent value="privacy">
            <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Public profile</div>
                  <p className="text-sm text-muted-foreground">Show your name and avatar on the leaderboard and shared courses.</p>
                </div>
                <Switch checked={p.profile_public} onCheckedChange={(v) => update({ profile_public: v })} />
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-5">Per-course public/private visibility lives under <span className="font-medium text-foreground">My courses</span>.</p>
              <Button onClick={saveProfile} disabled={busy} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">{t("common.save")}</Button>
            </div>
          </TabsContent>

          {/* DANGER */}
          <TabsContent value="danger">
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Reset all progress</div>
                  <p className="text-sm text-muted-foreground">Wipes gems, XP, streak, completions, quiz attempts, attendance and certificates. Your courses are kept.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline"><RotateCcw className="h-4 w-4 mr-2" />Reset</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone. You'll start over from zero gems and XP.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={resetProgress}>Reset progress</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-destructive/30 pt-6">
                <div>
                  <div className="font-medium text-destructive">Delete account</div>
                  <p className="text-sm text-muted-foreground">Permanently removes your account, profile, courses, progress and certificates.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Delete account</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>This is permanent. Everything you've created and earned will be deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteAccount}>Delete forever</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
};

const CourseRow = ({ c, onRename, onToggle, onDelete }: {
  c: { id: string; title: string; is_public: boolean };
  onRename: (id: string, t: string) => void;
  onToggle: (id: string, v: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(c.title);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
      {editing ? (
        <>
          <Input value={val} onChange={e => setVal(e.target.value)} className="h-8" />
          <Button size="sm" className="h-8" onClick={() => { onRename(c.id, val); setEditing(false); }}>Save</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setVal(c.title); setEditing(false); }}>Cancel</Button>
        </>
      ) : (
        <>
          <Link to={`/courses/${c.id}`} className="flex-1 truncate font-medium hover:text-primary">{c.title}</Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{c.is_public ? "Public" : "Private"}</span>
            <Switch checked={c.is_public} onCheckedChange={(v) => onToggle(c.id, v)} />
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete "{c.title}"?</AlertDialogTitle>
                <AlertDialogDescription>The course and all its modules and progress will be permanently removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(c.id)}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Settings;