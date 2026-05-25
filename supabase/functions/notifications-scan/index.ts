// Smart scheduled scanner — call on a cron (e.g. hourly).
// Detects streak risk, inactivity comeback windows, and behavior-timed pushes.
// Inserts notifications via the SECURITY DEFINER dispatch_notification RPC.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Tpl = { title: string; body: string };
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const T = {
  streak_risk: (streak: number): Tpl => pick([
    { title: "Streak fragile mode 👀", body: `${streak} দিনের consistency ভাঙতেছে — ৫ মিনিট দেন!` },
    { title: "আজকে না পড়লে streak break 😶", body: "১টা ছোট lesson = streak safe" },
  ]),
  comeback_1d: (): Tpl => ({ title: "কালকে থামছিলেন, আজকে আবার? 😎", body: "ZverT এ ফেরত আসেন boss" }),
  comeback_3d: (): Tpl => ({ title: "৩ দিন gap 😅", body: "Course কিন্তু অপেক্ষায় আছে boss" }),
  comeback_7d: (): Tpl => ({ title: "অনেকদিন দেখা নাই 👀", body: "ZverT miss করতেছে 😄" }),
  comeback_14d: (): Tpl => ({ title: "Comeback দিবেন নাকি? 🔥", body: "Skill কিন্তু বসে থাকলে বাড়ে না" }),
  morning_push: (): Tpl => pick([
    { title: "সকাল শুরু হইছে ☀️", body: "আজকে ২০ মিনিট পড়লেই XP বাড়বে 🔥" },
    { title: "নতুন দিন, নতুন streak 😎", body: "আজকেও চালাইবেন তো?" },
  ]),
  evening_push: (): Tpl => pick([
    { title: "সন্ধ্যা + focus = combo 🔥", body: "১টা lesson শেষ করেন" },
    { title: "Course ta পড়ে আছে 👀", body: "২০ মিনিট = XP + progress + streak" },
  ]),
  night_push: (): Tpl => ({ title: "Streak এখনো বাঁচানো যায় 😎", body: "৫ মিনিটেই save হবে" }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let scanned = 0, dispatched = 0;
  try {
    // 1) Streak risk: profiles where current_streak > 0 AND last_attendance_date = yesterday (BD)
    const { data: streakUsers } = await supabase
      .from("profiles")
      .select("id, current_streak, last_attendance_date, last_active")
      .gt("current_streak", 0)
      .limit(500);

    const todayBD = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
    const yestBD = new Date(Date.now() + 6 * 3600 * 1000 - 86400000).toISOString().slice(0, 10);

    for (const u of streakUsers ?? []) {
      scanned++;
      const last = u.last_attendance_date as string | null;
      const inactiveDays = last ? Math.floor((Date.parse(todayBD) - Date.parse(last)) / 86400000) : 99;

      // streak risk: missed today, last was yesterday
      if (last === yestBD) {
        const t = T.streak_risk(u.current_streak);
        const { data } = await supabase.rpc("dispatch_notification", {
          _user_id: u.id, _category: "streak_risk",
          _title: t.title, _body: t.body, _priority: "high",
          _deep_link: "/dashboard", _payload: { streak: u.current_streak },
          _dedupe_key: `streak_risk:${todayBD}`, _cooldown_hours: 12,
        });
        if (data) dispatched++;
      }

      // comeback windows
      const cat = inactiveDays === 1 ? "comeback_1d"
        : inactiveDays === 3 ? "comeback_3d"
        : inactiveDays === 7 ? "comeback_7d"
        : inactiveDays === 14 ? "comeback_14d" : null;
      if (cat) {
        const t = (T as any)[cat]();
        const { data } = await supabase.rpc("dispatch_notification", {
          _user_id: u.id, _category: cat,
          _title: t.title, _body: t.body, _priority: cat === "comeback_14d" ? "high" : "normal",
          _deep_link: "/dashboard", _payload: { inactive_days: inactiveDays },
          _dedupe_key: `${cat}:${todayBD}`, _cooldown_hours: 24,
        });
        if (data) dispatched++;
      }
    }

    // 2) Behavior-aware time push: send a single bucket push to users whose most_active_hour is near current BD hour
    const bdHour = new Date(Date.now() + 6 * 3600 * 1000).getUTCHours();
    const { data: behaviorUsers } = await supabase
      .from("user_behavior")
      .select("user_id, most_active_hour, pattern, last_lesson_at")
      .not("most_active_hour", "is", null)
      .limit(500);

    for (const b of behaviorUsers ?? []) {
      if (b.most_active_hour == null) continue;
      const diff = Math.abs((b.most_active_hour as number) - bdHour);
      if (diff > 1) continue; // window match
      // skip if studied in last 6h
      if (b.last_lesson_at && Date.now() - Date.parse(b.last_lesson_at) < 6 * 3600 * 1000) continue;

      const cat = bdHour >= 5 && bdHour <= 11 ? "morning_push"
        : bdHour >= 17 && bdHour <= 20 ? "evening_push"
        : bdHour >= 21 || bdHour < 5 ? "night_push" : null;
      if (!cat) continue;
      const t = (T as any)[cat]();
      const { data } = await supabase.rpc("dispatch_notification", {
        _user_id: b.user_id, _category: cat,
        _title: t.title, _body: t.body, _priority: "normal",
        _deep_link: "/dashboard", _payload: { hour: bdHour },
        _dedupe_key: `${cat}:${todayBD}`, _cooldown_hours: 20,
      });
      if (data) dispatched++;
    }

    return new Response(JSON.stringify({ ok: true, scanned, dispatched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
