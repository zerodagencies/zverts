import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Entitlements {
    playlist_conversions_left: number;
    free_left: number;
    convert_credits: number;
    ai_enabled: boolean;
    is_paid_user: boolean;
    total_paid: number;
    locked: boolean;
    role: AppRole | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    loading: boolean;
    refresh: () => Promise<void>;
}

export const useEntitlements = (): Entitlements => {
    const { user } = useAuth();
    const channelSuffix = useRef(Math.random().toString(36).slice(2));
    const [state, setState] = useState<{
        playlist_conversions_left: number;
        convert_credits: number;
        ai_enabled: boolean;
        is_paid_user: boolean;
        total_paid: number;
        locked: boolean;
        role: AppRole | null;
    }>({
        playlist_conversions_left: 0,
        convert_credits: 0,
        ai_enabled: false,
        is_paid_user: false,
        total_paid: 0,
        locked: false,
        role: null,
    });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const [{ data: ent }, { data: profile }] = await Promise.all([
            supabase
                .from("user_entitlements")
                .select(
                    "playlist_conversions_left,convert_credits,ai_enabled,is_paid_user,total_paid",
                )
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase.from("profiles").select("locked,role").eq("id", user.id).maybeSingle(),
        ]);
        setState({
            playlist_conversions_left: ent?.playlist_conversions_left ?? 0,
            convert_credits: ent?.convert_credits ?? 0,
            ai_enabled: ent?.ai_enabled ?? false,
            is_paid_user: ent?.is_paid_user ?? false,
            total_paid: ent?.total_paid ?? 0,
            locked: profile?.locked ?? false,
            role: profile?.role ?? null,
        });
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!user) return;
        const ch = supabase
            .channel(`user:${user.id}:ent:${channelSuffix.current}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "user_entitlements",
                    filter: `user_id=eq.${user.id}`,
                },
                () => load(),
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${user.id}`,
                },
                () => load(),
            )
            .subscribe();
        return () => {
            supabase.removeChannel(ch);
        };
    }, [user, load]);

    return {
        ...state,
        free_left: state.playlist_conversions_left,
        isAdmin: state.role === "admin" || state.role === "super_admin",
        isSuperAdmin: state.role === "super_admin",
        loading,
        refresh: load,
    };
};
