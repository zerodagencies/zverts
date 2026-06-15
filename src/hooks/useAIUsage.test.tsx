import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
    supabase: { rpc: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIUsage, DAILY_LIMIT } from "@/hooks/useAIUsage";
import type { User } from "@supabase/supabase-js";

const MOCK_USER = { id: "user-abc" } as User;

const authWith = (user: User | null) =>
    vi.mocked(useAuth).mockReturnValue({
        user,
        session: null,
        loading: false,
        signOut: vi.fn(),
    });

const rpcWith = (data: unknown, error: unknown = null) =>
    vi.mocked(supabase.rpc).mockResolvedValue({ data, error } as any);

describe("useAIUsage", () => {
    beforeEach(() => vi.clearAllMocks());

    // ── No user ───────────────────────────────────────────────────────────────

    it("returns null usage and loading=false when there is no user", async () => {
        authWith(null);
        const { result } = renderHook(() => useAIUsage());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.usage).toBeNull();
        expect(supabase.rpc).not.toHaveBeenCalled();
    });

    // ── Successful fetch ───────────────────────────────────────────────────────

    it("fetches usage via get_ai_usage_today when user is present", async () => {
        authWith(MOCK_USER);
        rpcWith({ count: 3, limit: 10, remaining: 7, paid: false });

        const { result } = renderHook(() => useAIUsage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(supabase.rpc).toHaveBeenCalledWith("get_ai_usage_today", {
            _daily_limit: DAILY_LIMIT,
        });
        expect(result.current.usage).toEqual({ count: 3, limit: 10, remaining: 7, paid: false });
    });

    it("uses DAILY_LIMIT = 10 as the rpc argument", () => {
        expect(DAILY_LIMIT).toBe(10);
    });

    // ── Error path ────────────────────────────────────────────────────────────

    it("leaves usage null when rpc returns an error", async () => {
        authWith(MOCK_USER);
        rpcWith(null, { message: "DB failure" });

        const { result } = renderHook(() => useAIUsage());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.usage).toBeNull();
    });

    // ── refresh ───────────────────────────────────────────────────────────────

    it("refresh re-fetches and updates usage", async () => {
        authWith(MOCK_USER);
        rpcWith({ count: 2, limit: 10, remaining: 8, paid: false });

        const { result } = renderHook(() => useAIUsage());
        await waitFor(() => expect(result.current.loading).toBe(false));

        rpcWith({ count: 5, limit: 10, remaining: 5, paid: false });
        await act(() => result.current.refresh());

        expect(result.current.usage?.count).toBe(5);
    });

    // ── applyServerUsage ──────────────────────────────────────────────────────

    describe("applyServerUsage", () => {
        const setup = async () => {
            authWith(MOCK_USER);
            rpcWith({ count: 3, limit: 10, remaining: 7, paid: false });
            const hook = renderHook(() => useAIUsage());
            await waitFor(() => expect(hook.result.current.loading).toBe(false));
            return hook;
        };

        it("merges server count into current usage", async () => {
            const { result } = await setup();
            act(() => result.current.applyServerUsage({ count: 6, limit: 10, remaining: 4, paid: false }));
            expect(result.current.usage?.count).toBe(6);
            expect(result.current.usage?.remaining).toBe(4);
        });

        it("sets paid=true and remaining=null for paid users", async () => {
            const { result } = await setup();
            act(() => result.current.applyServerUsage({ count: 50, remaining: null, paid: true }));
            expect(result.current.usage?.paid).toBe(true);
            expect(result.current.usage?.remaining).toBeNull();
        });

        it("ignores calls when data has no count field", async () => {
            const { result } = await setup();
            const countBefore = result.current.usage?.count;
            act(() => result.current.applyServerUsage({ limit: 10 } as any));
            expect(result.current.usage?.count).toBe(countBefore);
        });

        it("ignores null input", async () => {
            const { result } = await setup();
            const before = result.current.usage?.count;
            act(() => result.current.applyServerUsage(null));
            expect(result.current.usage?.count).toBe(before);
        });

        it("ignores undefined input", async () => {
            const { result } = await setup();
            const before = result.current.usage?.count;
            act(() => result.current.applyServerUsage(undefined));
            expect(result.current.usage?.count).toBe(before);
        });
    });
});
