import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    onClick: () => void;
    count?: number;
    className?: string;
};

export const NotesButton = ({ onClick, count = 0, className }: Props) => (
    <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        aria-label="Open notes"
        className={cn("gap-2", className)}
    >
        <NotebookPen className="h-4 w-4" />
        <span>Notes</span>
        {count > 0 ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {count}
            </span>
        ) : null}
    </Button>
);
