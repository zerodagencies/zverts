import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Flame, Trophy, BookOpen, Target, Gem, Brain, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES: Record<string, { name: string; desc: string; icon: any; color: string }> = {
  first_module: { name: "First Steps", desc: "Completed your first module", icon: BookOpen, color: "from-emerald-500 to-emerald-600" },
  modules_10: { name: "Getting Serious", desc: "10 modules completed", icon: Target, color: "from-cyan-500 to-blue-600" },
  modules_50: { name: "Knowledge Seeker", desc: "50 modules completed", icon: Brain, color: "from-violet-500 to-purple-600" },
  first_course: { name: "Course Conqueror", desc: "Finished a full course", icon: Trophy, color: "from-amber-500 to-orange-600" },
  streak_7: { name: "On Fire", desc: "7-day learning streak", icon: Flame, color: "from-orange-500 to-red-600" },
  streak_30: { name: "Unstoppable", desc: "30-day streak", icon: Crown, color: "from-yellow-400 to-amber-600" },
  quiz_master: { name: "Quiz Master", desc: "Passed 5 quizzes", icon: Award, color: "from-pink-500 to-rose-600" },
  gems_100: { name: "Gem Collector", desc: "Earned 100 gems", icon: Gem, color: "from-teal-400 to-emerald-600" },
};

export const BadgesGrid = ({ userId }: { userId: string }) => {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      await supabase.rpc("check_achievements");
      const { data } = await supabase.from("achievements").select("code").eq("user_id", userId);
      setUnlocked(new Set((data ?? []).map((r: any) => r.code)));
    })();
  }, [userId]);

  const total = Object.keys(BADGES).length;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ achievements</div>
          <h2 className="font-display text-2xl mt-1">Badges</h2>
        </div>
        <div className="text-sm font-mono text-muted-foreground">{unlocked.size} / {total}</div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {Object.entries(BADGES).map(([code, b]) => {
          const Got = unlocked.has(code);
          const Icon = b.icon;
          return (
            <div key={code} title={`${b.name} — ${b.desc}`} className={cn(
              "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative transition-all",
              Got
                ? `bg-gradient-to-br ${b.color} text-white shadow-elevated hover:scale-105`
                : "bg-muted/50 text-muted-foreground/40 border border-border"
            )}>
              <Icon className={cn("h-5 w-5", Got && "drop-shadow-md")} />
              <span className="text-[9px] font-mono mt-1 text-center leading-tight">{Got ? b.name : "Locked"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};