import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Eye, Trash2, BookOpen, Globe, Lock } from "lucide-react";
import { PlaylistPreview } from "@/components/app/PlaylistPreview";

interface Course {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    is_public: boolean;
    is_system: boolean;
    user_id: string | null;
    module_count?: number;
    completed_count?: number;
}

const Courses = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [importing, setImporting] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [mine, setMine] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        if (!user) return;
        const { data: courses } = await supabase
            .from("courses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (!courses?.length) {
            setMine([]);
            setLoading(false);
            return;
        }

        // fetch module counts first, then progress filtered to those module IDs
        const ids = courses.map((c) => c.id);
        const { data: modsData } = await supabase
            .from("modules")
            .select("id,course_id")
            .in("course_id", ids);
        const mods = modsData ?? [];
        const modIds = mods.map((m) => m.id);
        const { data: prog } = modIds.length
            ? await supabase
                  .from("module_progress")
                  .select("module_id,completed")
                  .eq("user_id", user.id)
                  .in("module_id", modIds)
            : { data: [] as { module_id: string; completed: boolean }[] };

        const modsByCourse = new Map<string, string[]>();
        (mods ?? []).forEach((m) => {
            const arr = modsByCourse.get(m.course_id) ?? [];
            arr.push(m.id);
            modsByCourse.set(m.course_id, arr);
        });
        const completedSet = new Set(
            (prog ?? []).filter((p) => p.completed).map((p) => p.module_id),
        );

        setMine(
            courses.map((c) => ({
                ...c,
                module_count: modsByCourse.get(c.id)?.length ?? 0,
                completed_count: (modsByCourse.get(c.id) ?? []).filter((mid) =>
                    completedSet.has(mid),
                ).length,
            })),
        );
        setLoading(false);
    };

    useEffect(() => {
        load(); /* eslint-disable-next-line */
    }, [user]);

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    const previewPlaylist = async () => {
        if (!url.trim()) return;
        setPreviewing(true);
        const { data, error } = await supabase.functions.invoke("preview-youtube-playlist", {
            body: { url: url.trim() },
        });
        setPreviewing(false);
        const dataErr = (data as Record<string, unknown>)?.error;
        if (error || dataErr) {
            toast.error((dataErr as string) ?? error?.message ?? "Preview failed");
            return;
        }
        setPreview(data);
        setPreviewOpen(true);
    };

    const importPlaylist = async () => {
        if (!url.trim()) return;
        setImporting(true);
        const { data, error } = await supabase.functions.invoke("import-youtube-playlist", {
            body: { url: url.trim() },
        });
        setImporting(false);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success("Course created!");
        setUrl("");
        setPreviewOpen(false);
        setPreview(null);
        if (data?.course_id) navigate(`/courses/${data.course_id}`);
        else load();
    };

    const remove = async (c: Course) => {
        if (!confirm(t("courses.confirmDelete"))) return;
        await supabase.from("courses").delete().eq("id", c.id);
        toast.success("Deleted");
        setMine((prev) => prev.filter((x) => x.id !== c.id));
    };

    return (
        <AppShell>
            <section className="container py-8 md:py-12 max-w-6xl">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            / {t("nav.courses")}
                        </div>
                        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mt-1">
                            {t("courses.mine")}
                        </h1>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                        {loading ? "…" : `${mine.length} course${mine.length !== 1 ? "s" : ""}`}
                    </div>
                </div>

                {/* Import bar */}
                <div className="rounded-2xl border border-border bg-card p-4 mb-8 flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Paste a YouTube playlist URL…"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && previewPlaylist()}
                        className="flex-1 bg-background"
                    />
                    <Button
                        onClick={previewPlaylist}
                        disabled={previewing || !url.trim()}
                        className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow shrink-0 w-full sm:w-auto"
                    >
                        {previewing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading…
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </>
                        )}
                    </Button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-border overflow-hidden"
                            >
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mine.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center space-y-3">
                        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="font-display text-xl">No courses yet</p>
                        <p className="text-sm text-muted-foreground">
                            Paste a YouTube playlist URL above to import your first course.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {mine.map((c) => (
                            <CourseCard key={c.id} c={c} onDelete={() => remove(c)} />
                        ))}
                    </div>
                )}
            </section>

            <PlaylistPreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                preview={preview}
                onConfirm={importPlaylist}
                importing={importing}
            />
        </AppShell>
    );
};

const CourseCard = ({ c, onDelete }: { c: Course; onDelete: () => void }) => {
    const pct = c.module_count ? Math.round(((c.completed_count ?? 0) / c.module_count) * 100) : 0;
    const allDone = c.module_count > 0 && pct === 100;

    return (
        <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-elevated transition-all duration-200">
            <Link to={`/courses/${c.id}`} className="block">
                <div className="relative aspect-video bg-muted overflow-hidden">
                    {c.thumbnail_url ? (
                        <img
                            src={c.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                    )}
                    {allDone && (
                        <div className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground text-[10px] font-mono uppercase px-2 py-0.5">
                            Done
                        </div>
                    )}
                </div>
                <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">{c.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>
                            {c.module_count} lesson{c.module_count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                            {c.is_public ? (
                                <Globe className="h-3 w-3" />
                            ) : (
                                <Lock className="h-3 w-3" />
                            )}
                            {c.is_public ? "Public" : "Private"}
                        </span>
                    </div>
                    {(c.module_count ?? 0) > 0 && (
                        <div className="space-y-1">
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-lime transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                                {c.completed_count}/{c.module_count} completed
                            </p>
                        </div>
                    )}
                </div>
            </Link>
            <div className="px-3 pb-3 flex justify-end">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default Courses;
