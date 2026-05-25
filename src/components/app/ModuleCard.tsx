import { Link } from "react-router-dom";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  position: number;
  title: string;
  durationSeconds: number;
  state: "locked" | "available" | "in_progress" | "completed";
  percent?: number;
  id: string;
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const ModuleCard = ({ position, title, durationSeconds, state, percent = 0, id }: Props) => {
  const locked = state === "locked";
  const completed = state === "completed";
  const inner = (
    <div className={cn(
      "group relative rounded-xl border p-5 transition-all duration-500 ease-smooth h-full",
      "bg-gradient-card shadow-card",
      locked ? "border-border/60 opacity-60" : "border-border hover:border-primary/40 hover:-translate-y-1 hover:shadow-elevated",
      completed && "border-primary/30"
    )}>
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono text-xs text-muted-foreground">MODULE / {String(position).padStart(2, "0")}</span>
        {completed ? <CheckCircle2 className="h-5 w-5 text-primary" />
         : locked ? <Lock className="h-5 w-5 text-muted-foreground" />
         : <PlayCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />}
      </div>
      <h3 className="font-display text-lg leading-tight text-balance min-h-[3.5rem]">{title}</h3>
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{fmt(durationSeconds)}</span>
        <span>{completed ? "100%" : `${Math.round(percent)}%`}</span>
      </div>
      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-lime transition-all duration-700" style={{ width: `${completed ? 100 : percent}%` }} />
      </div>
    </div>
  );
  return locked ? <div>{inner}</div> : <Link to={`/learn/${id}`}>{inner}</Link>;
};
