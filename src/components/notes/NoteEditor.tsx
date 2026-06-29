import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel?: () => void;
    isEditing: boolean;
    busy?: boolean;
    includeTimestamp: boolean;
    onToggleTimestamp: (value: boolean) => void;
    showTimestampToggle?: boolean;
    currentTime?: number | null;
};

export const NoteEditor = ({
    value,
    onChange,
    onSave,
    onCancel,
    isEditing,
    busy = false,
    includeTimestamp,
    onToggleTimestamp,
    showTimestampToggle = true,
    currentTime,
}: Props) => (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
        <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Write a note for this lesson…"
            rows={4}
            className="min-h-[110px] resize-none bg-background"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
            {showTimestampToggle ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={includeTimestamp}
                        onChange={(event) => onToggleTimestamp(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                    Save with current timestamp{currentTime !== null && currentTime !== undefined ? ` · ${Math.floor(currentTime)}` : ""}
                </label>
            ) : (
                <span />
            )}
            <div className="flex items-center gap-2">
                {onCancel ? (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                ) : null}
                <Button type="button" onClick={onSave} disabled={busy || !value.trim()}>
                    {isEditing ? (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Update note
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Save note
                        </>
                    )}
                </Button>
            </div>
        </div>
    </div>
);
