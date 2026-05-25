import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Loader2, Plus, Trash2 } from "lucide-react";
import { PlaylistPreview } from "@/components/app/PlaylistPreview";
import { Eye } from "lucide-react";

interface Course { id: string; title: string; description: string | null; thumbnail_url: string | null; is_public: boolean; is_system: boolean; user_id: string | null; }

const Courses = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mine, setMine] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMine(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const previewPlaylist = async () => {
    if (!url.trim()) return;
    setPreviewing(true);
    const { data, error } = await supabase.functions.invoke("preview-youtube-playlist", { body: { url: url.trim() } });
    setPreviewing(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error ?? error?.message ?? "Preview failed"); return; }
    setPreview(data); setPreviewOpen(true);
  };
  const importPlaylist = async () => {
    if (!url.trim()) return;
    setImporting(true);
    const { data, error } = await supabase.functions.invoke("import-youtube-playlist", { body: { url: url.trim() } });
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Course created!");
    setUrl(""); setPreviewOpen(false); setPreview(null);
    if (data?.course_id) navigate(`/courses/${data.course_id}`);
    else load();
  };

  const togglePublic = async (c: Course) => {
    await supabase.from("courses").update({ is_public: !c.is_public }).eq("id", c.id);
    load();
  };

  const remove = async (c: Course) => {
    if (!confirm(t("courses.confirmDelete"))) return;
    await supabase.from("courses").delete().eq("id", c.id);
    toast.success("Deleted");
    load();
  };

  const Card = ({ c, owned }: { c: Course; owned: boolean }) => (
    <div className="group rounded-xl border border-border bg-gradient-card p-5 shadow-card hover:border-primary/40 hover:-translate-y-0.5 transition-all">
      <Link to={`/courses/${c.id}`}>
        {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full aspect-video object-cover rounded-lg mb-4 border border-border" loading="lazy" />}
        <h3 className="font-display text-lg leading-tight text-balance">{c.title}</h3>
        {c.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
      </Link>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Lock className="h-3 w-3" />{t("courses.private")}
        </span>
        {owned && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(c)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
      <section className="container py-10 md:py-14">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ {t("nav.courses")}</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">{t("courses.mine")}</h1>

        <div className="mt-8 rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">{t("courses.createNew")}</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder={t("courses.playlistPlaceholder")} value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
            <Button onClick={previewPlaylist} disabled={previewing || !url.trim()} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">
              {previewing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading</> : <><Eye className="h-4 w-4 mr-2" />Preview</>}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-mono">Preview the playlist before creating your course.</p>
        </div>

        {loading ? (
          <div className="text-muted-foreground font-mono text-sm mt-12">{t("common.loading")}</div>
        ) : (
          <>
            <div className="mt-12">
              <h2 className="font-display text-2xl mb-4">{t("courses.mine")}</h2>
              {mine.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">No courses yet. Paste a playlist URL above.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mine.map(c => <Card key={c.id} c={c} owned={true} />)}
                </div>
              )}
            </div>
          </>
        )}

        <PlaylistPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          preview={preview}
          onConfirm={importPlaylist}
          importing={importing}
        />
      </section>
    </AppShell>
  );
};

export default Courses;