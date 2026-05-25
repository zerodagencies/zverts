import { useMemo, useState } from "react";
import { Search, Pin, PinOff, Trash2, Pencil, Plus, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoredChat } from "./types";

type Props = {
  chats: StoredChat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onClose?: () => void;
};

export const ChatHistorySidebar = ({ chats, activeId, onSelect, onNew, onPin, onDelete, onRename, onClose }: Props) => {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { pinned, others } = useMemo(() => {
    const filtered = chats.filter((c) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return c.title.toLowerCase().includes(needle) ||
        c.messages.some((m) => m.content.toLowerCase().includes(needle));
    });
    const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      pinned: sorted.filter((c) => c.pinned),
      others: sorted.filter((c) => !c.pinned),
    };
  }, [chats, q]);

  const renderItem = (c: StoredChat) => (
    <div
      key={c.id}
      onClick={() => onSelect(c.id)}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
        activeId === c.id ? "bg-muted" : "hover:bg-muted/60"
      )}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {editingId === c.id ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onRename(c.id, draft.trim() || c.title); setEditingId(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onRename(c.id, draft.trim() || c.title); setEditingId(null); } }}
          className="flex-1 bg-transparent text-xs outline-none border-b border-border"
        />
      ) : (
        <span className="flex-1 truncate text-xs">{c.title}</span>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onPin(c.id); }} className="p-1 rounded hover:bg-background" title={c.pinned ? "Unpin" : "Pin"}>
          {c.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title); }} className="p-1 rounded hover:bg-background" title="Rename">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="p-1 rounded hover:bg-background text-destructive" title="Delete">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-xl border-r border-border/60 w-64">
      <div className="p-3 border-b border-border/60 flex items-center gap-2">
        <Button onClick={onNew} size="sm" className="flex-1 h-8 bg-gradient-lime text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5 mr-1" /> New chat
        </Button>
        {onClose && (
          <Button onClick={onClose} size="icon" variant="ghost" className="h-8 w-8 md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-2 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats…" className="h-8 pl-7 text-xs" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {pinned.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Pinned</div>
            <div className="space-y-0.5">{pinned.map(renderItem)}</div>
          </div>
        )}
        {others.length > 0 && (
          <div>
            {pinned.length > 0 && <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Recent</div>}
            <div className="space-y-0.5">{others.map(renderItem)}</div>
          </div>
        )}
        {chats.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8 px-3">
            No chats yet. Start a conversation with Vert.
          </div>
        )}
      </div>
    </div>
  );
};