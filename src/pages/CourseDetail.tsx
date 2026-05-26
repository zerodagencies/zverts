import { useEffect, useState } from "react";
import { Navigate, useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, GripVertical, Lock, CheckCircle2, PlayCircle, Pencil, Trash2, Award, Share2 } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Course { id: string; title: string; description: string | null; user_id: string | null; is_public: boolean; is_system: boolean; author_name?: string | null; author_channel_url?: string | null; }
interface Module { id: string; position: number; title: string; duration_seconds: number; youtube_video_id: string; thumbnail_url: string | null; }
interface Progress { module_id: string; percent_watched: number; completed: boolean; mcq_passed: boolean; }

const fmt = (s: number) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h ? `${h}h ${m}m` : `${m}m`; };

const SortableRow = ({ m, owned, state, percent, onRename, onDelete }: { m: Module; owned: boolean; state: string; percent: number; onRename: (id: string, t: string) => void; onDelete: (id: string) => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id, disabled: !owned });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(m.title);
  const locked = state === "locked";
  const completed = state === "completed";
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className={`group rounded-xl border ${locked ? "border-border/60 opacity-70" : completed ? "border-primary/40" : "border-border"} bg-gradient-card p-4 shadow-card flex items-center gap-3`}>
      {owned && <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground"><GripVertical className="h-4 w-4" /></button>}
      <div className="font-mono text-xs text-muted-foreground w-10">{String(m.position).padStart(2,"0")}</div>
      {m.thumbnail_url && <img src={m.thumbnail_url} alt="" className="h-12 w-20 object-cover rounded border border-border" loading="lazy" />}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-2">
            <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-8" />
            <Button size="sm" className="h-8" onClick={() => { onRename(m.id, val); setEditing(false); }}>Save</Button>
          </div>
        ) : (
          <div className="font-display text-base leading-tight truncate">{m.title}</div>
        )}
        <div className="text-xs text-muted-foreground font-mono mt-0.5">{fmt(m.duration_seconds)} · {Math.round(percent)}%</div>
      </div>
      {completed ? <CheckCircle2 className="h-5 w-5 text-primary" />
       : locked ? <Lock className="h-4 w-4 text-muted-foreground" />
       : <PlayCircle className="h-5 w-5 text-primary" />}
      {owned && (
        <>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setVal(m.title); setEditing(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </>
      )}
      {!locked && <Link to={`/learn/${m.id}`}><Button size="sm" variant="outline">Open</Button></Link>}
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id).maybeSingle(),
      supabase.from("modules").select("id,position,title,duration_seconds,youtube_video_id,thumbnail_url").eq("course_id", id).order("position"),
    ]);
    setCourse(c as Course | null); setTitleVal(c?.title ?? ""); setModules(m ?? []);
    if (user) {
      const { data: p } = await supabase.from("module_progress").select("module_id,percent_watched,completed,mcq_passed").eq("user_id", user.id).in("module_id", (m ?? []).map((x:any) => x.id));
      setProgress(p ?? []);
    }
    // Backfill author info on demand for older imported courses
    if (c && !(c as any).author_name) {
      supabase.functions.invoke("fetch-playlist-author", { body: { course_id: c.id } }).then(({ data }) => {
        if (data?.author_name) setCourse(prev => prev ? { ...prev, author_name: data.author_name, author_channel_url: data.author_channel_url } : prev);
      });
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!course) return <AppShell><div className="container py-20 text-muted-foreground">Loading…</div></AppShell>;

  const owned = course.user_id === user.id;
  const pmap = new Map(progress.map(p => [p.module_id, p]));
  const completedCount = progress.filter(p => p.completed).length;
  const allDone = modules.length > 0 && completedCount === modules.length;

  const cards = modules.map((m, i) => {
    const p = pmap.get(m.id);
    const prev = i === 0 ? null : modules[i-1];
    const prevDone = !prev || pmap.get(prev.id)?.completed;
    let state = "locked";
    if (p?.completed) state = "completed";
    else if (prevDone && p && p.percent_watched > 0) state = "in_progress";
    else if (prevDone) state = "available";
    return { m, state, percent: p?.percent_watched ?? 0 };
  });

  const onRenameTitle = async () => {
    await supabase.from("courses").update({ title: titleVal }).eq("id", course.id);
    setEditingTitle(false); load();
  };
  const onRenameModule = async (mid: string, title: string) => {
    await supabase.from("modules").update({ title }).eq("id", mid); load();
  };
  const onDeleteModule = async (mid: string) => {
    if (!confirm("Delete module?")) return;
    await supabase.from("modules").delete().eq("id", mid); load();
  };
  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex(m => m.id === active.id);
    const newIdx = modules.findIndex(m => m.id === over.id);
    const next = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, position: i + 1 }));
    setModules(next);
    // batch update positions
    await Promise.all(next.map(m => supabase.from("modules").update({ position: m.position }).eq("id", m.id)));
    toast.success("Reordered");
  };

  const share = () => {
    navigator.clipboard.writeText(`${window.location.origin}/courses/${course.id}`);
    toast.success("Link copied");
  };

  return (
    <AppShell>
      <SEO
        title={course.title}
        description={course.description?.slice(0, 155) || `${course.title} — a course on ZverT with ${modules.length} lessons.`}
        path={`/courses/${course.id}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description || undefined,
          provider: { "@type": "Organization", name: "ZverT", url: "https://zverts.lovable.app" },
          ...(course.author_name ? { author: { "@type": "Person", name: course.author_name } } : {}),
        }}
      />
      <section className="container py-8 md:py-10 max-w-5xl">
        <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono mb-6">
          <ArrowLeft className="h-3 w-3" /> {t("nav.courses")}
        </Link>


        <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
          {editingTitle && owned ? (
            <div className="flex gap-2 flex-1">
              <Input value={titleVal} onChange={e => setTitleVal(e.target.value)} className="text-3xl font-display h-14" />
              <Button onClick={onRenameTitle}>Save</Button>
            </div>
          ) : (
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight" onClick={() => owned && setEditingTitle(true)}>
              {course.title} {owned && <Pencil className="inline h-4 w-4 text-muted-foreground ml-1" />}
            </h1>
          )}
          <div className="flex gap-2">
            {course.is_public && <Button variant="outline" size="sm" onClick={share}><Share2 className="h-4 w-4 mr-2" />{t("courses.share")}</Button>}
            {allDone && <Button size="sm" className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow" onClick={() => navigate(`/certificate/${course.id}`)}><Award className="h-4 w-4 mr-2" />{t("cert.title")}</Button>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-mono mb-3">{completedCount} / {modules.length} {t("dashboard.completed").toLowerCase()}</p>

        {course.author_name && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-gradient-card px-4 py-2 text-sm shadow-card">
            <span className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Author</span>
            {course.author_channel_url ? (
              <a href={course.author_channel_url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors">
                {course.author_name}
              </a>
            ) : (
              <span className="font-medium">{course.author_name}</span>
            )}
            <span className="text-xs text-muted-foreground">· YouTube</span>
          </div>
        )}

        {modules.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center font-mono text-sm">{t("courses.noModules")}</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {cards.map(c => <SortableRow key={c.m.id} m={c.m} owned={owned} state={c.state} percent={c.percent} onRename={onRenameModule} onDelete={onDeleteModule} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </AppShell>
  );
};

export default CourseDetail;