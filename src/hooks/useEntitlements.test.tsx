import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
};

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => mockChannel),
        removeChannel: vi.fn(),
    },
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { User } from "@supabase/supabase-js";

const MOCK_USER = { id: "user-xyz" } as User;

const makeChain = (data: unknown, error: unknown = null) => {
    const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    };
    return chain;
};

const authWith = (user: User | null) =>
    vi.mocked(useAuth).mockReturnValue({
        user,
        session: null,
        loading: false,
        signOut: vi.fn(),
    });

const fromWith = (entData: unknown, profileData: unknown) =>
    vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "user_entitlements") return makeChain(entData);
        if (table === "profiles") return makeChain(profileData);
        return makeChain(null);
    });

describe("useEntitlements", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChannel.on.mockReset().mockReturnThis();
        mockChannel.subscribe.mockReset().mockReturnThis();
    });

    // ── No user ───────────────────────────────────────────────────────────────

    it("returns safe defaults and loading=false with no user", async () => {
        authWith(null);
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isSuperAdmin).toBe(false);
        expect(result.current.ai_enabled).toBe(false);
        expect(result.current.is_paid_user).toBe(false);
        expect(result.current.playlist_conversions_left).toBe(0);
    });

    it("does not subscribe to realtime when user is null", async () => {
        authWith(null);
        renderHook(() => useEntitlements());
        await waitFor(() => {}); // let effects flush
        expect(supabase.channel).not.toHaveBeenCalled();
    });

    // ── Successful load ───────────────────────────────────────────────────────

    it("loads entitlements and profile from DB", async () => {
        authWith(MOCK_USER);
        fromWith(
            {
                playlist_conversions_left: 3,
                convert_credits: 2,
                ai_enabled: true,
                is_paid_user: true,
                total_paid: 500,
            },
            { locked: false, role: "user" },
        );

        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.ai_enabled).toBe(true);
        expect(result.current.is_paid_user).toBe(true);
        expect(result.current.total_paid).toBe(500);
        expect(result.current.playlist_conversions_left).toBe(3);
        expect(result.current.convert_credits).toBe(2);
    });

    it("free_left mirrors playlist_conversions_left", async () => {
        authWith(MOCK_USER);
        fromWith(
            { playlist_conversions_left: 7, convert_credits: 0, ai_enabled: false, is_paid_user: false, total_paid: 0 },
            { locked: false, role: null },
        );
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.free_left).toBe(result.current.playlist_conversions_left);
        expect(result.current.free_left).toBe(7);
    });

    // ── Role logic ────────────────────────────────────────────────────────────

    it("isAdmin=true, isSuperAdmin=false for role='admin'", async () => {
        authWith(MOCK_USER);
        fromWith(null, { locked: false, role: "admin" });
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isSuperAdmin).toBe(false);
    });

    it("isAdmin=true and isSuperAdmin=true for role='super_admin'", async () => {
        authWith(MOCK_USER);
        fromWith(null, { locked: false, role: "super_admin" });
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isSuperAdmin).toBe(true);
    });

    it("isAdmin=false for role='user'", async () => {
        authWith(MOCK_USER);
        fromWith(null, { locked: false, role: "user" });
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.isAdmin).toBe(false);
    });

    // ── Realtime subscription ─────────────────────────────────────────────────

    it("subscribes to two postgres_changes listeners", async () => {
        authWith(MOCK_USER);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.from).mockReturnValue(makeChain(null) as any);
        renderHook(() => useEntitlements());
        await waitFor(() => expect(supabase.channel).toHaveBeenCalled());
        expect(mockChannel.on).toHaveBeenCalledTimes(2);
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);
    });

    it("calls removeChannel on unmount", async () => {
        authWith(MOCK_USER);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.from).mockReturnValue(makeChain(null) as any);
        const { unmount } = renderHook(() => useEntitlements());
        await waitFor(() => expect(supabase.channel).toHaveBeenCalled());
        unmount();
        expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    });

    it("channel name is unique per hook instance (contains user id)", async () => {
        authWith(MOCK_USER);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.from).mockReturnValue(makeChain(null) as any);
        renderHook(() => useEntitlements());
        await waitFor(() => expect(supabase.channel).toHaveBeenCalled());
        const channelName: string = vi.mocked(supabase.channel).mock.calls[0][0];
        expect(channelName).toContain(MOCK_USER.id);
    });

    // ── refresh ───────────────────────────────────────────────────────────────

    it("refresh re-fetches from DB", async () => {
        authWith(MOCK_USER);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.from).mockReturnValue(makeChain(null) as any);
        const { result } = renderHook(() => useEntitlements());
        await waitFor(() => expect(result.current.loading).toBe(false));
        const callsBefore = vi.mocked(supabase.from).mock.calls.length;
        await act(() => result.current.refresh());
        expect(vi.mocked(supabase.from).mock.calls.length).toBeGreaterThan(callsBefore);
    });
});
