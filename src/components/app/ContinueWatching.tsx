import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Row {
  module_id: string;
  percent_watched: number;
  updated_at: string;
  modules: { id: string; title: string; position: number; thumbnail_url: string | null; course_id: string; courses: { title: string } | null } | null;
}

export const ContinueWatching = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("module_progress")
        .select("module_id, percent_watched, updated_at, modules!inner(id,title,position,thumbnail_url,course_id, courses!inner(title))")
        .eq("user_id", userId)
        .eq("completed", false)
        .gt("percent_watched", 0)
        .order("updated_at", { ascending: false })
        .limit(4);
      setItems((data ?? []) as any);
      setLoading(false);
    })();
  }, [userId]);

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ continue watching</div>
          <h2 className="font-display text-2xl mt-1">Pick up where you left off</h2>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <Link key={it.module_id} to={`/learn/${it.module_id}`} className="group rounded-xl border border-border bg-background/50 overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-video bg-muted">
              {it.modules?.thumbnail_url && <img src={it.modules.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                  <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div className="h-full bg-gradient-lime" style={{ width: `${Math.min(100, it.percent_watched)}%` }} />
              </div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-mono text-muted-foreground uppercase truncate">{it.modules?.courses?.title}</div>
              <div className="text-sm font-medium leading-tight line-clamp-2 mt-0.5">{it.modules?.title}</div>
              <div className="text-[10px] font-mono text-primary mt-1">{Math.round(it.percent_watched)}% • Resume</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};