import { ReactNode } from "react";

interface PageHeaderProps {
    eyebrow: string;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, action }: PageHeaderProps) => (
    <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                / {eyebrow}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-1">
                {title}
            </h1>
            {description && (
                <div className="mt-2 text-muted-foreground max-w-2xl">{description}</div>
            )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);
