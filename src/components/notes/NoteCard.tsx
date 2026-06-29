import { Clock, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NoteItem = {
    id: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    timestampSeconds?: number | null;
};

type Props = {
    note: NoteItem;
    onEdit: (note: NoteItem) => void;
    onDelete: (id: string) => void;
    onSeek?: (seconds: number) => void;
};

const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const NoteCard = ({ note, onEdit, onDelete, onSeek }: Props) => (
    <article className="rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
                    <button
                        type="button"
                        onClick={() => onSeek?.(note.timestampSeconds ?? 0)}
                        className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(note.timestampSeconds)}
                    </button>
                ) : null}
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {note.content}
                </p>
                <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    {new Date(note.updatedAt ?? note.createdAt).toLocaleString()}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Edit note"
                    className="h-8 w-8"
                    onClick={() => onEdit(note)}
                >
                    <PencilLine className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete note"
                    className={cn("h-8 w-8 text-destructive hover:text-destructive")}
                    onClick={() => onDelete(note.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    </article>
);
