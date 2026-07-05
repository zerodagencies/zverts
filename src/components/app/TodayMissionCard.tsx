import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Target } from "lucide-react";

type Mission = { total: number; done: number; rewarded_at: string | null };

export function TodayMissionCard({ userId }: { userId: string }) {
    const [m, setM] = useState<Mission | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.rpc as any)("get_today_mission");
            if (!cancelled && data) setM(data as Mission);
        };
        void load();
        const ch = supabase
            .channel(`mission-card:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "module_progress",
                    filter: `user_id=eq.${userId}`,
                },
                () => void load(),
            )
            .subscribe();
        return () => {
            cancelled = true;
            void supabase.removeChannel(ch);
        };
    }, [userId]);

    const total = m?.total ?? 0;
    const done = m?.done ?? 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const complete = !!m?.rewarded_at;

    return (
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        / today's mission
                    </div>
                    <h2 className="font-display text-2xl mt-1 flex items-center gap-2">
                        {complete ? (
                            <>
                                <Trophy className="h-5 w-5 text-primary" /> Mission complete
                            </>
                        ) : (
                            <>
                                <Target className="h-5 w-5 text-primary" /> Better than yesterday
                            </>
                        )}
                    </h2>
                </div>
                <Link to="/growth">
                    <Button variant="outline" size="sm">
                        Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="font-display text-3xl font-semibold tabular-nums">
                    {done}/{total}
                </div>
                <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-gradient-lime transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        {complete
                            ? "+50 XP, +10 Gems earned today"
                            : `${pct}% of today's tasks done`}
                    </div>
                </div>
            </div>
        </div>
    );
}
