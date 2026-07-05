import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChevronRight, FileText, Lock, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Course = { id: string; title: string };
type Mod = { id: string; course_id: string; position: number; title: string };

export type ActiveSource = {
    moduleId: string;
    moduleTitle: string;
    position: number;
    courseId: string;
    courseTitle: string;
} | null;

export const SourcesPanel = ({
    userId,
    active,
    onSelect,
}: {
    userId: string;
    active: ActiveSource;
    onSelect: (s: ActiveSource) => void;
}) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Mod[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const { data: cs } = await supabase
                .from("courses")
                .select("id,title")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            const ids = (cs ?? []).map((c) => c.id);
            const { data: ms } = ids.length
                ? await supabase
                      .from("modules")
                      .select("id,course_id,position,title")
                      .in("course_id", ids)
                      .order("position")
                : { data: [] };
            if (cancelled) return;
            setCourses(cs ?? []);
            setModules((ms ?? []) as Mod[]);
            if (cs && cs[0]) setExpanded(new Set([cs[0].id]));
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const toggle = (id: string) => {
        setExpanded((prev) => {
            const n = new Set(prev);
            if (n.has(id)) { n.delete(id); } else { n.add(id); }
            return n;
        });
    };

    const totalModules = modules.length;

    return (
        <div className="flex h-full flex-col">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            / sources
                        </div>
                        <div className="font-semibold text-sm mt-0.5">Study material</div>
                    </div>
                    {!loading && courses.length > 0 && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {totalModules} modules
                        </span>
                    )}
                </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                {loading ? (
                    <div className="space-y-2 p-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-foreground/70">No courses yet</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                Import a YouTube playlist from the Courses page to ground Vert in your material.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {/* General study option */}
                        <button
                            onClick={() => onSelect(null)}
                            className={cn(
                                "w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                                active === null
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted/60 text-foreground/70 hover:text-foreground",
                            )}
                        >
                            <div className={cn(
                                "h-5 w-5 rounded flex items-center justify-center shrink-0",
                                active === null ? "bg-primary/20" : "bg-muted/60",
                            )}>
                                <FileText className="h-3 w-3" />
                            </div>
                            General study
                            {active === null && (
                                <span className="ml-auto text-[10px] font-mono text-primary/70">active</span>
                            )}
                        </button>

                        <div className="my-1.5 mx-2.5 border-t border-border/40" />

                        {courses.map((c) => {
                            const open = expanded.has(c.id);
                            const mods = modules.filter((m) => m.course_id === c.id);
                            const activeMod = active?.courseId === c.id;
                            return (
                                <div key={c.id}>
                                    {/* Course row */}
                                    <button
                                        onClick={() => toggle(c.id)}
                                        className={cn(
                                            "w-full flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                                            activeMod
                                                ? "bg-primary/5 text-foreground"
                                                : "hover:bg-muted/60 text-foreground",
                                        )}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "h-3.5 w-3.5 transition-transform shrink-0 text-muted-foreground",
                                                open && "rotate-90",
                                            )}
                                        />
                                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate flex-1 text-left">{c.title}</span>
                                        <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                                            {mods.length}
                                        </span>
                                    </button>

                                    {/* Module list */}
                                    {open && (
                                        <div className="ml-6 border-l border-border/40 pl-2 pb-1 space-y-0.5">
                                            {mods.length === 0 ? (
                                                <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                                                    No modules
                                                </div>
                                            ) : (
                                                mods.map((m) => {
                                                    const isActive = active?.moduleId === m.id;
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            onClick={() =>
                                                                onSelect({
                                                                    moduleId: m.id,
                                                                    moduleTitle: m.title,
                                                                    position: m.position,
                                                                    courseId: c.id,
                                                                    courseTitle: c.title,
                                                                })
                                                            }
                                                            className={cn(
                                                                "w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] transition-colors",
                                                                isActive
                                                                    ? "bg-primary/15 text-primary font-medium"
                                                                    : "hover:bg-muted/60 text-foreground/65 hover:text-foreground",
                                                            )}
                                                        >
                                                            <span className="font-mono text-[9px] opacity-50 shrink-0 w-5 text-right">
                                                                {String(m.position).padStart(2, "0")}
                                                            </span>
                                                            <span className="truncate">{m.title}</span>
                                                            {isActive && (
                                                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer: upload placeholder */}
            <div className="border-t border-border/60 p-3">
                <button
                    disabled
                    title="Coming soon"
                    className="w-full flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground hover:cursor-not-allowed"
                >
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span>Upload PDF or notes</span>
                    <Lock className="h-3 w-3 ml-auto opacity-50" />
                </button>
            </div>
        </div>
    );
};
