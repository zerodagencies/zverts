import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export const StatCard = ({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: ReactNode; sub?: string }) => (
  <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
    </div>
    <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground font-mono">{sub}</div>}
  </div>
);
