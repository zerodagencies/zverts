import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { OFFICIAL_EMAIL, OFFICIAL_MAILTO } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface OfficialEmailProps {
  className?: string;
  variant?: "inline" | "card";
  label?: string;
}

/**
 * Renders the official ZverTs contact email with a mailto link and copy button.
 */
export const OfficialEmail = ({
  className,
  variant = "inline",
  label,
}: OfficialEmailProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(OFFICIAL_EMAIL);
      setCopied(true);
      toast.success("Email copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — long-press to select");
    }
  };

  if (variant === "card") {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 backdrop-blur px-4 py-3 hover:border-primary/50 transition-colors",
          className
        )}
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 text-primary grid place-items-center shrink-0">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {label}
            </div>
          )}
          <a
            href={OFFICIAL_MAILTO}
            className="block truncate text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors"
          >
            {OFFICIAL_EMAIL}
          </a>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy email"
          className="h-9 w-9 grid place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <a
        href={OFFICIAL_MAILTO}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <Mail className="h-4 w-4 text-primary/80" />
        {OFFICIAL_EMAIL}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy email"
        className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
};

export default OfficialEmail;
