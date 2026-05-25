import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * For every newly delivered notification for the current user:
 *  - Plays a short ding via Web Audio (no asset needed)
 *  - Shows a Chrome / desktop Notification (requires permission)
 *  - Clicking the notification deep-links into the app
 *
 * Works while the tab is open or backgrounded. For fully-closed delivery,
 * a service worker + Web Push subscription would be needed.
 */
export function useBrowserNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const askedRef = useRef(false);

  useEffect(() => {
    if (!user || askedRef.current) return;
    askedRef.current = true;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      // Ask after first interaction (most browsers require gesture). Defer slightly.
      const handler = () => {
        Notification.requestPermission().catch(() => {});
        window.removeEventListener("click", handler);
        window.removeEventListener("keydown", handler);
      };
      window.addEventListener("click", handler, { once: true });
      window.addEventListener("keydown", handler, { once: true });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-popup:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const n = payload.new;
          if (!n) return;
          playDing();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              const note = new Notification(n.title || "ZverT", {
                body: n.body || "",
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: n.id,
                requireInteraction: n.priority === "critical",
              });
              note.onclick = () => {
                window.focus();
                if (n.deep_link) navigate(n.deep_link);
                note.close();
              };
            } catch {}
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, navigate]);
}

function playDing() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.42);
    setTimeout(() => { try { ctx.close(); } catch {} }, 600);
  } catch {}
}
