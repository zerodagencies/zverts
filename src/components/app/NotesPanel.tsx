import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NotebookPen, Trash2, Clock, Plus } from "lucide-react";

interface Note { id: string; content: string; timestamp_seconds: number | null; created_at: string; }

const fmtTs = (s: number) => {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const NotesPanel = ({ moduleId, getCurrentTime, onSeek }: {
  moduleId: string;
  getCurrentTime?: () => number;
  onSeek?: (s: number) => void;
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [withTs, setWithTs] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("notes").select("*").eq("module_id", moduleId).order("created_at", { ascending: false });
    setNotes((data ?? []) as Note[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [moduleId]);

  const add = async () => {
    if (!content.trim()) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const ts = withTs && getCurrentTime ? Math.floor(getCurrentTime()) : null;
    const { error } = await supabase.from("notes").insert({ user_id: user.id, module_id: moduleId, content: content.trim(), timestamp_seconds: ts });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setContent(""); load();
  };

  const remove = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    load();
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <NotebookPen className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg">Smart Notes</h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{notes.length}</span>
      </div>

      <div className="space-y-2 mb-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note for this lesson…"
          rows={2}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          {getCurrentTime ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={withTs} onChange={(e) => setWithTs(e.target.checked)} className="accent-primary" />
              <Clock className="h-3 w-3" /> Save with timestamp
            </label>
          ) : <span />}
          <Button size="sm" onClick={add} disabled={busy || !content.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono py-6 text-center">No notes yet.</p>
        ) : notes.map((n) => (
          <div key={n.id} className="group rounded-lg border border-border/60 bg-background/50 p-3 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {n.timestamp_seconds !== null && (
                  <button
                    onClick={() => onSeek?.(n.timestamp_seconds!)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-1"
                  >
                    <Clock className="h-2.5 w-2.5" /> {fmtTs(n.timestamp_seconds)}
                  </button>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{n.content}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(n.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};