import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NoteCard, type NoteItem } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import { NotesButton } from "./NotesButton";

type Props = {
    moduleId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    currentTime?: number | null;
    onSeek?: (seconds: number) => void;
};

const STORAGE_KEY = (moduleId: string) => `zverts.notes.${moduleId}`;

const createId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const NotesPanel = ({
    moduleId,
    open,
    onOpenChange,
    currentTime = 0,
    onSeek,
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [draft, setDraft] = useState("");
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [includeTimestamp, setIncludeTimestamp] = useState(true);
    const [busy, setBusy] = useState(false);

    const resolvedOpen = typeof open === "boolean" ? open : isOpen;

    const setPanelOpen = useCallback(
        (next: boolean) => {
            if (typeof open === "boolean") {
                onOpenChange?.(next);
            } else {
                setIsOpen(next);
            }
        },
        [open, onOpenChange],
    );

    const persistNotes = useCallback(
        (nextNotes: NoteItem[]) => {
            setNotes(nextNotes);
            try {
                window.localStorage.setItem(STORAGE_KEY(moduleId), JSON.stringify(nextNotes));
            } catch {
                // no-op for storage restrictions
            }
        },
        [moduleId],
    );

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY(moduleId));
            if (raw) {
                const parsed = JSON.parse(raw) as NoteItem[];
                setNotes(Array.isArray(parsed) ? parsed : []);
            }
        } catch {
            setNotes([]);
        }
    }, [moduleId]);

    const filteredNotes = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        if (!normalized) return notes;
        return notes.filter((note) => {
            const haystack = `${note.content} ${note.timestampSeconds ?? ""}`.toLowerCase();
            return haystack.includes(normalized);
        });
    }, [notes, search]);

    const resetEditor = useCallback(() => {
        setDraft("");
        setEditingId(null);
        setIncludeTimestamp(true);
    }, []);

    const handleSave = useCallback(() => {
        const trimmed = draft.trim();
        if (!trimmed) return;

        setBusy(true);
        const timestampSeconds = includeTimestamp && currentTime != null ? Math.floor(currentTime) : null;

        if (editingId) {
            const existing = notes.find((note) => note.id === editingId);
            const nextNotes = notes.map((note) =>
                note.id === editingId
                    ? {
                          ...note,
                          content: trimmed,
                          updatedAt: new Date().toISOString(),
                          timestampSeconds: existing?.timestampSeconds ?? timestampSeconds,
                      }
                    : note,
            );
            persistNotes(nextNotes);
        } else {
            const nextNote: NoteItem = {
                id: createId(),
                content: trimmed,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timestampSeconds,
            };
            persistNotes([nextNote, ...notes]);
        }

        resetEditor();
        setBusy(false);
    }, [currentTime, draft, editingId, includeTimestamp, notes, persistNotes, resetEditor]);

    const handleEdit = (note: NoteItem) => {
        setDraft(note.content);
        setEditingId(note.id);
        setIncludeTimestamp(Boolean(note.timestampSeconds));
        setPanelOpen(true);
    };

    const handleDelete = (id: string) => {
        persistNotes(notes.filter((note) => note.id !== id));
        if (editingId === id) resetEditor();
    };

    return (
        <>
            <NotesButton
                count={notes.length}
                onClick={() => setPanelOpen(true)}
                className="w-full justify-center sm:w-auto"
            />
            <Sheet open={resolvedOpen} onOpenChange={setPanelOpen}>
                <SheetContent side="right" className="flex w-full flex-col border-l border-border/70 p-0 sm:max-w-[440px]">
                    <div className="flex h-full flex-col">
                        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
                            <SheetTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Notes
                            </SheetTitle>
                            <SheetDescription>
                                Capture lesson ideas, reminders, and timestamps locally.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            <div className="space-y-4">
                                <NoteEditor
                                    value={draft}
                                    onChange={setDraft}
                                    onSave={handleSave}
                                    onCancel={editingId ? resetEditor : undefined}
                                    isEditing={Boolean(editingId)}
                                    busy={busy}
                                    includeTimestamp={includeTimestamp}
                                    onToggleTimestamp={setIncludeTimestamp}
                                    currentTime={currentTime}
                                />

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search notes"
                                        className="pl-9"
                                    />
                                </div>

                                <div className="space-y-2">
                                    {filteredNotes.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
                                            {search.trim()
                                                ? "No notes match your search."
                                                : "No notes yet. Start with a quick insight."}
                                        </div>
                                    ) : (
                                        filteredNotes.map((note) => (
                                            <NoteCard
                                                key={note.id}
                                                note={note}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onSeek={onSeek}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};
