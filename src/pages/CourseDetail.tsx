import { useEffect, useState } from "react";
import { Navigate, useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Lock,
    CheckCircle2,
    PlayCircle,
    Pencil,
    Trash2,
    Award,
    Share2,
    GripVertical,
    BookOpen,
    Clock,
    BrainCircuit,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface Course {
    id: string;
    title: string;
    description: string | null;
    user_id: string | null;
    is_public: boolean;
    is_system: boolean;
    thumbnail_url: string | null;
    author_name?: string | null;
    author_channel_url?: string | null;
}
interface Module {
    id: string;
    position: number;
    title: string;
    duration_seconds: number;
    youtube_video_id: string;
    thumbnail_url: string | null;
}
interface Progress {
    module_id: string;
    percent_watched: number;
    completed: boolean;
    mcq_passed: boolean;
}

const fmt = (s: number) => {
    const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
};

// ── Sortable row ────────────────────────────────────────────────────────────
const SortableRow = ({
    m,
    owned,
    state,
    percent,
    onRename,
    onDelete,
}: {
    m: Module;
    owned: boolean;
    state: string;
    percent: number;
    onRename: (id: string, t: string) => void;
    onDelete: (id: string) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: m.id,
        disabled: !owned,
    });
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(m.title);
    const locked = state === "locked";
    const completed = state === "completed";

    const row = (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
            }}
            className={cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                locked
                    ? "border-border/50 bg-muted/30 opacity-70"
                    : completed
                      ? "border-primary/30 bg-card"
                      : "border-border bg-card hover:border-primary/40",
            )}
        >
            {/* drag handle */}
            {owned && (
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 touch-none"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            )}

            {/* position */}
            <span className="font-mono text-xs text-muted-foreground w-6 shrink-0 text-center">
                {String(m.position).padStart(2, "0")}
            </span>

            {/* thumbnail */}
            {m.thumbnail_url && (
                <img
                    src={m.thumbnail_url}
                    alt=""
                    className="h-10 w-[72px] object-cover rounded shrink-0"
                    loading="lazy"
                />
            )}

            {/* title / editor */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="flex gap-2">
                        <Input
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            className="h-7 text-sm"
                        />
                        <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => {
                                onRename(m.id, val);
                                setEditing(false);
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => setEditing(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <>
                        <p
                            className={cn(
                                "text-sm leading-tight truncate",
                                locked && "text-muted-foreground",
                            )}
                        >
                            {m.title}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {fmt(m.duration_seconds)}
                            {!locked && percent > 0 && <span>· {Math.round(percent)}%</span>}
                        </p>
                    </>
                )}
            </div>

            {/* status icon */}
            <div className="shrink-0">
                {completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : locked ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                ) : (
                    <PlayCircle className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>

            {/* owner controls */}
            {owned && !editing && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                            setVal(m.title);
                            setEditing(true);
                        }}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(m.id)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* open buttons */}
            {!locked && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {completed && (
                        <Link to={`/quiz/${m.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5 gap-1">
                                <BrainCircuit className="h-3 w-3" /> Quiz
                            </Button>
                        </Link>
                    )}
                    <Link to={`/learn/${m.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                            {completed ? "Rewatch" : "Watch"}
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );

    return row;
};

// ── Main page ────────────────────────────────────────────────────────────────
const CourseDetail = () => {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleVal, setTitleVal] = useState("");
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const load = async () => {
        if (!id) return;
        const [{ data: c }, { data: m }] = await Promise.all([
            supabase.from("courses").select("*").eq("id", id).maybeSingle(),
            supabase
                .from("modules")
                .select("id,position,title,duration_seconds,youtube_video_id,thumbnail_url")
                .eq("course_id", id)
                .order("position"),
        ]);
        setCourse(c as Course | null);
        setTitleVal(c?.title ?? "");
        setModules(m ?? []);
        if (user && m?.length) {
            const { data: p } = await supabase
                .from("module_progress")
                .select("module_id,percent_watched,completed,mcq_passed")
                .eq("user_id", user.id)
                .in(
                    "module_id",
                    m.map((x) => x.id),
                );
            setProgress(p ?? []);
        }
        setLoading(false);
        if (c && !c.author_name) {
            supabase.functions
                .invoke("fetch-playlist-author", { body: { course_id: c.id } })
                .then(({ data }) => {
                    if (data?.author_name)
                        setCourse((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      author_name: data.author_name,
                                      author_channel_url: data.author_channel_url,
                                  }
                                : prev,
                        );
                });
        }
    };

    useEffect(() => {
        load(); /* eslint-disable-next-line */
    }, [id, user]);

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;
    if (loading)
        return (
            <AppShell>
                <section className="container py-8 max-w-5xl space-y-6">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-6">
                        <Skeleton className="w-56 aspect-video rounded-xl shrink-0" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                    </div>
                </section>
            </AppShell>
        );
    if (!course)
        return (
            <AppShell>
                <div className="container py-20 text-muted-foreground">Course not found.</div>
            </AppShell>
        );

    const owned = course.user_id === user.id;
    const pmap = new Map(progress.map((p) => [p.module_id, p]));
    const completedCount = progress.filter((p) => p.completed).length;
    const totalSecs = modules.reduce((s, m) => s + m.duration_seconds, 0);
    const allDone = modules.length > 0 && completedCount === modules.length;
    const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

    const cards = modules.map((m, i) => {
        const p = pmap.get(m.id);
        const prev = i === 0 ? null : modules[i - 1];
        const prevDone = !prev || pmap.get(prev.id)?.completed;
        let state = "locked";
        if (p?.completed) state = "completed";
        else if (prevDone && p && p.percent_watched > 0) state = "in_progress";
        else if (prevDone) state = "available";
        return { m, state, percent: p?.percent_watched ?? 0 };
    });

    const nextUp = cards.find((c) => c.state === "in_progress" || c.state === "available");

    const onRenameTitle = async () => {
        await supabase.from("courses").update({ title: titleVal }).eq("id", course.id);
        setEditingTitle(false);
        load();
    };
    const onRenameModule = async (mid: string, title: string) => {
        await supabase.from("modules").update({ title }).eq("id", mid);
        load();
    };
    const onDeleteModule = async (mid: string) => {
        if (!confirm("Delete module?")) return;
        await supabase.from("modules").delete().eq("id", mid);
        load();
    };
    const onDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIdx = modules.findIndex((m) => m.id === active.id);
        const newIdx = modules.findIndex((m) => m.id === over.id);
        const next = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, position: i + 1 }));
        setModules(next);
        await Promise.all(
            next.map((m) =>
                supabase.from("modules").update({ position: m.position }).eq("id", m.id),
            ),
        );
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
                description={
                    course.description?.slice(0, 155) ||
                    `${course.title} — ${modules.length} lessons on ZverTs.`
                }
                path={`/courses/${course.id}`}
                type="article"
                jsonLd={{ "@context": "https://schema.org", "@type": "Course", name: course.title }}
            />
            <section className="container py-6 md:py-10 max-w-5xl">
                {/* Back */}
                <Link
                    to="/courses"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="h-3 w-3" /> All courses
                </Link>

                {/* Hero */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
                    <div className="flex flex-col sm:flex-row gap-0">
                        {/* Thumbnail */}
                        {course.thumbnail_url && (
                            <div className="sm:w-56 lg:w-64 shrink-0">
                                <img
                                    src={course.thumbnail_url}
                                    alt=""
                                    className="w-full h-full object-cover aspect-video sm:aspect-auto sm:h-full"
                                />
                            </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4">
                            <div>
                                {editingTitle && owned ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={titleVal}
                                            onChange={(e) => setTitleVal(e.target.value)}
                                            className="text-xl font-display h-10"
                                        />
                                        <Button onClick={onRenameTitle}>Save</Button>
                                    </div>
                                ) : (
                                    <h1
                                        className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight"
                                        onClick={() => owned && setEditingTitle(true)}
                                    >
                                        {course.title}
                                        {owned && (
                                            <Pencil className="inline h-3.5 w-3.5 text-muted-foreground ml-2 cursor-pointer" />
                                        )}
                                    </h1>
                                )}
                                {course.author_name && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        By{" "}
                                        {course.author_channel_url ? (
                                            <a
                                                href={course.author_channel_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-foreground hover:text-primary"
                                            >
                                                {course.author_name}
                                            </a>
                                        ) : (
                                            <span className="text-foreground">
                                                {course.author_name}
                                            </span>
                                        )}
                                        {" · "}YouTube
                                    </p>
                                )}
                                {course.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {course.description}
                                    </p>
                                )}
                            </div>

                            {/* Stats row */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <BookOpen className="h-4 w-4" /> {modules.length} lessons
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-4 w-4" /> {fmt(totalSecs)}
                                </span>
                                <span className="font-medium text-foreground">
                                    {completedCount}/{modules.length} done
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-lime transition-all duration-700"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {nextUp && (
                                    <Link to={`/learn/${nextUp.m.id}`}>
                                        <Button className="bg-gradient-lime text-primary-foreground shadow-glow">
                                            {nextUp.state === "in_progress"
                                                ? "Continue"
                                                : "Start learning"}
                                        </Button>
                                    </Link>
                                )}
                                {allDone && (
                                    <Button
                                        className="bg-gradient-lime text-primary-foreground shadow-glow"
                                        onClick={() => navigate(`/certificate/${course.id}`)}
                                    >
                                        <Award className="h-4 w-4 mr-2" /> {t("cert.title")}
                                    </Button>
                                )}
                                {course.is_public && (
                                    <Button variant="outline" size="sm" onClick={share}>
                                        <Share2 className="h-4 w-4 mr-1.5" /> {t("courses.share")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module list */}
                {modules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground font-mono">
                        {t("courses.noModules")}
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={modules.map((m) => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1.5">
                                {cards.map((c) => (
                                    <SortableRow
                                        key={c.m.id}
                                        m={c.m}
                                        owned={owned}
                                        state={c.state}
                                        percent={c.percent}
                                        onRename={onRenameModule}
                                        onDelete={onDeleteModule}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </section>
        </AppShell>
    );
};

export default CourseDetail;
