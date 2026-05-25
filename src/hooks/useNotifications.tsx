import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Notification = {
  id: string;
  user_id: string;
  category: string;
  priority: "critical" | "high" | "normal" | "low";
  title: string;
  body: string;
  deep_link: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  dismissed_at: string | null;
  sent_at: string;
};

export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data }, { data: cnt }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .is("dismissed_at", null)
        .order("sent_at", { ascending: false })
        .limit(limit),
      supabase.rpc("unread_notification_count"),
    ]);
    setItems((data ?? []) as Notification[]);
    setUnread(typeof cnt === "number" ? cnt : 0);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }
    void load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((cur) => [n, ...cur].slice(0, limit));
          setUnread((c) => c + 1);
          // Foreground toast (browser-native vibe with sonner)
          if (n.priority !== "low") {
            toast(n.title, { description: n.body });
          }
          // Best-effort native browser notification when allowed
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try { new Notification(n.title, { body: n.body, icon: "/favicon.ico" }); } catch {}
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((cur) => cur.map((x) => (x.id === n.id ? n : x)));
          if (n.read_at) setUnread((c) => Math.max(0, c - 1));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, limit, load]);

  const markRead = useCallback(async (id: string) => {
    setItems((cur) => cur.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((c) => Math.max(0, c - 1));
    await supabase.rpc("mark_notification_read", { _id: id });
    await supabase.rpc("log_notification_event", { _id: id, _type: "opened" });
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((cur) => cur.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnread(0);
    await supabase.rpc("mark_all_notifications_read");
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setItems((cur) => cur.filter((n) => n.id !== id));
    await supabase.rpc("dismiss_notification", { _id: id });
  }, []);

  const logClick = useCallback(async (id: string) => {
    await supabase.rpc("log_notification_event", { _id: id, _type: "clicked" });
  }, []);

  return { items, unread, loading, reload: load, markRead, markAllRead, dismiss, logClick };
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}
