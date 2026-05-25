import { Cpu, Check, ChevronDown, Sparkles, Zap, Brain, Rocket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatModelId } from "./types";
import { MODELS } from "./types";

const ICONS: Record<ChatModelId, React.ComponentType<{ className?: string }>> = {
  fast: Zap, smart: Sparkles, pro: Rocket, reasoning: Brain,
};

export const ModelSelector = ({ value, onChange }: { value: ChatModelId; onChange: (v: ChatModelId) => void }) => {
  const current = MODELS.find((m) => m.id === value)!;
  const Icon = ICONS[value];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium hover:bg-muted/60 transition-colors">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {MODELS.map((m) => {
          const I = ICONS[m.id];
          const active = m.id === value;
          return (
            <DropdownMenuItem key={m.id} onClick={() => onChange(m.id)} className={cn("gap-3 py-2.5", active && "bg-muted")}>
              <I className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-[11px] text-muted-foreground">{m.description}</div>
              </div>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { Cpu };