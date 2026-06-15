import { describe, it, expect } from "vitest";
import { toNumber, rankRows, medalColor, type RankRow } from "@/lib/ranking";

// ── Helpers ─────────────────────────────────────────────────────────────────

const row = (overrides: Partial<RankRow> = {}): RankRow => ({
    id: "user-1",
    name: "Alice",
    avatar_url: null,
    total_xp: 1000,
    total_gems: 5,
    current_streak: 7,
    longest_streak: 10,
    ...overrides,
});

// ── toNumber ─────────────────────────────────────────────────────────────────

describe("toNumber", () => {
    it("returns a finite number unchanged", () => {
        expect(toNumber(42)).toBe(42);
        expect(toNumber(0)).toBe(0);
        expect(toNumber(-10)).toBe(-10);
        expect(toNumber(3.14)).toBe(3.14);
    });

    it("parses integer strings", () => {
        expect(toNumber("100")).toBe(100);
        expect(toNumber("0")).toBe(0);
        expect(toNumber("-5")).toBe(-5);
    });

    it("truncates float strings via parseInt", () => {
        expect(toNumber("3.9")).toBe(3);
        expect(toNumber("9.99")).toBe(9);
    });

    it("returns 0 for NaN", () => expect(toNumber(NaN)).toBe(0));
    it("returns 0 for Infinity", () => expect(toNumber(Infinity)).toBe(0));
    it("returns 0 for -Infinity", () => expect(toNumber(-Infinity)).toBe(0));
    it("returns 0 for null", () => expect(toNumber(null)).toBe(0));
    it("returns 0 for undefined", () => expect(toNumber(undefined)).toBe(0));
    it("returns 0 for non-numeric strings", () => expect(toNumber("abc")).toBe(0));
    it("returns 0 for empty string", () => expect(toNumber("")).toBe(0));
});

// ── rankRows ─────────────────────────────────────────────────────────────────

describe("rankRows", () => {
    describe("empty / null guard", () => {
        it("returns empty array for empty input", () => {
            expect(rankRows([])).toEqual([]);
        });

        it("filters rows without an id", () => {
            const rows = [row(), { id: "", name: "Ghost" } as RankRow];
            expect(rankRows(rows)).toHaveLength(1);
            expect(rankRows(rows)[0].id).toBe("user-1");
        });

        it("filters null / undefined entries", () => {
            const rows = [row(), null as unknown as RankRow];
            expect(rankRows(rows)).toHaveLength(1);
        });
    });

    describe("rank assignment", () => {
        it("assigns rank 1 to the single row", () => {
            expect(rankRows([row()])[0].rank).toBe(1);
        });

        it("assigns sequential 1-indexed ranks with no gaps", () => {
            const rows = [row({ id: "a" }), row({ id: "b" }), row({ id: "c" })];
            expect(rankRows(rows).map((r) => r.rank)).toEqual([1, 2, 3]);
        });

        it("preserves id on each ranked row", () => {
            const rows = [row({ id: "x" }), row({ id: "y" })];
            const ids = rankRows(rows).map((r) => r.id);
            expect(ids).toContain("x");
            expect(ids).toContain("y");
        });
    });

    describe("sort priority", () => {
        it("ranks higher streak above lower streak, ignoring gems and xp", () => {
            const rows = [
                row({ id: "low", current_streak: 5, total_gems: 100, total_xp: 9999 }),
                row({ id: "high", current_streak: 10, total_gems: 1, total_xp: 0 }),
            ];
            expect(rankRows(rows)[0].id).toBe("high");
        });

        it("breaks streak tie with gems descending", () => {
            const rows = [
                row({ id: "few-gems", current_streak: 5, total_gems: 3, total_xp: 9999 }),
                row({ id: "many-gems", current_streak: 5, total_gems: 10, total_xp: 0 }),
            ];
            expect(rankRows(rows)[0].id).toBe("many-gems");
        });

        it("breaks streak+gems tie with xp descending", () => {
            const rows = [
                row({ id: "low-xp", current_streak: 5, total_gems: 5, total_xp: 100 }),
                row({ id: "high-xp", current_streak: 5, total_gems: 5, total_xp: 900 }),
            ];
            expect(rankRows(rows)[0].id).toBe("high-xp");
        });

        it("breaks full tie alphabetically by name ascending", () => {
            const rows = [
                row({ id: "z", name: "Zara", current_streak: 5, total_gems: 5, total_xp: 100 }),
                row({ id: "a", name: "Alice", current_streak: 5, total_gems: 5, total_xp: 100 }),
            ];
            expect(rankRows(rows)[0].id).toBe("a"); // Alice < Zara
        });

        it("treats null name as empty string (sorts before any letter)", () => {
            const rows = [
                row({ id: "has-name", name: "Alice", current_streak: 1, total_gems: 1, total_xp: 1 }),
                row({ id: "no-name", name: null, current_streak: 1, total_gems: 1, total_xp: 1 }),
            ];
            expect(rankRows(rows)[0].id).toBe("no-name"); // "" < "Alice"
        });
    });

    describe("null coercion", () => {
        it("normalises null xp / gems / streak to 0", () => {
            const result = rankRows([
                row({ total_xp: null, total_gems: null, current_streak: null }),
            ]);
            expect(result[0].xp).toBe(0);
            expect(result[0].gems).toBe(0);
            expect(result[0].streak).toBe(0);
        });

        it("handles string numbers returned by the DB", () => {
            const result = rankRows([
                row({ total_xp: "1500" as any, total_gems: "3" as any, current_streak: "7" as any }),
            ]);
            expect(result[0].xp).toBe(1500);
            expect(result[0].gems).toBe(3);
            expect(result[0].streak).toBe(7);
        });
    });

    describe("level calculation — floor(xp/500) + 1", () => {
        const level = (xp: number) => rankRows([row({ total_xp: xp })])[0].level;

        it("level 1 at xp=0", () => expect(level(0)).toBe(1));
        it("level 1 at xp=499", () => expect(level(499)).toBe(1));
        it("level 2 at xp=500", () => expect(level(500)).toBe(2));
        it("level 2 at xp=999", () => expect(level(999)).toBe(2));
        it("level 3 at xp=1000", () => expect(level(1000)).toBe(3));
        it("level 11 at xp=5000", () => expect(level(5000)).toBe(11));
        it("level 21 at xp=10000", () => expect(level(10000)).toBe(21));
    });

    describe("immutability", () => {
        it("does not mutate the input array's order", () => {
            const rows = [
                row({ id: "a", current_streak: 1 }),
                row({ id: "b", current_streak: 9 }),
            ];
            const originalOrder = rows.map((r) => r.id);
            rankRows(rows);
            expect(rows.map((r) => r.id)).toEqual(originalOrder);
        });
    });

    describe("large dataset — invariants", () => {
        const BIG = Array.from({ length: 50 }, (_, i) =>
            row({
                id: `user-${i}`,
                name: `User ${i}`,
                current_streak: Math.floor(Math.random() * 30),
                total_gems: Math.floor(Math.random() * 200),
                total_xp: Math.floor(Math.random() * 10000),
            }),
        );

        it("every row gets a unique rank", () => {
            const ranks = rankRows(BIG).map((r) => r.rank);
            expect(new Set(ranks).size).toBe(BIG.length);
        });

        it("ranks span exactly 1..N", () => {
            const ranks = rankRows(BIG)
                .map((r) => r.rank)
                .sort((a, b) => a - b);
            expect(ranks[0]).toBe(1);
            expect(ranks[ranks.length - 1]).toBe(BIG.length);
        });

        it("result is sorted ascending by rank", () => {
            const result = rankRows(BIG);
            for (let i = 1; i < result.length; i++) {
                expect(result[i].rank).toBeGreaterThan(result[i - 1].rank);
            }
        });
    });
});

// ── medalColor ────────────────────────────────────────────────────────────────

describe("medalColor", () => {
    it("gold for rank 1", () => expect(medalColor(1)).toBe("text-yellow-400"));
    it("silver for rank 2", () => expect(medalColor(2)).toBe("text-slate-300"));
    it("bronze for rank 3", () => expect(medalColor(3)).toBe("text-amber-600"));
    it("muted for rank 4", () => expect(medalColor(4)).toBe("text-muted-foreground"));
    it("muted for rank 10", () => expect(medalColor(10)).toBe("text-muted-foreground"));
    it("muted for rank 999", () => expect(medalColor(999)).toBe("text-muted-foreground"));
});
