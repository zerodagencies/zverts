import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_W = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
} as const;

interface PageSectionProps {
    children: ReactNode;
    maxW?: keyof typeof MAX_W;
    className?: string;
}

export const PageSection = ({ children, maxW = "xl", className }: PageSectionProps) => (
    <section className={cn("container py-8 md:py-12", MAX_W[maxW], className)}>
        {children}
    </section>
);
