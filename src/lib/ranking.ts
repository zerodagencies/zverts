export type RankRow = {
    id: string;
    name: string | null;
    avatar_url: string | null;
    total_xp: number | null;
    total_gems: number | null;
    current_streak: number | null;
    longest_streak: number | null;
};

export type RankedRow = RankRow & {
    rank: number;
    xp: number;
    gems: number;
    streak: number;
    level: number;
};

export const toNumber = (v: unknown): number => {
    const n = typeof v === "string" ? parseInt(v, 10) : (v as number);
    return Number.isFinite(n) ? n : 0;
};

export function rankRows(rows: RankRow[]): RankedRow[] {
    const normalized = rows
        .filter((r) => r && r.id)
        .map<RankedRow>((r) => {
            const xp = toNumber(r.total_xp);
            return {
                ...r,
                xp,
                gems: toNumber(r.total_gems),
                streak: toNumber(r.current_streak),
                level: Math.floor(xp / 500) + 1,
                rank: 0,
            };
        })
        .sort((a, b) => {
            if (b.streak !== a.streak) return b.streak - a.streak;
            if (b.gems !== a.gems) return b.gems - a.gems;
            if (b.xp !== a.xp) return b.xp - a.xp;
            return (a.name ?? "").localeCompare(b.name ?? "");
        });
    for (let i = 0; i < normalized.length; i++) normalized[i].rank = i + 1;
    return normalized;
}

export const medalColor = (r: number) =>
    r === 1
        ? "text-yellow-400"
        : r === 2
          ? "text-slate-300"
          : r === 3
            ? "text-amber-600"
            : "text-muted-foreground";
