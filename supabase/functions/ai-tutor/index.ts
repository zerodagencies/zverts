import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { module_id, messages, language = "en", mode = "chat" } = await req.json();
    if (!module_id || !Array.isArray(messages)) return json({ error: "module_id and messages required" }, 400);

    const { data: mod } = await supabase.from("modules")
      .select("title, position, course_id, youtube_video_id, courses!inner(id,title,user_id)")
      .eq("id", module_id).maybeSingle();
    if (!mod) return json({ error: "Module not found" }, 404);

    const course = (mod as any).courses;
    if (!course || course.user_id !== user.id) {
      return json({ error: "Unauthorized" }, 403);
    }

    const courseTitle = course?.title ?? "course";
    const langLine = language === "bn"
      ? "Reply in clear, simple Bangla (bengali). Use English technical terms when needed."
      : "Reply in clear, simple English.";

    let system = `You are Vert — ZverT's focused study assistant for the lesson "${mod.title}" (module ${mod.position} of "${courseTitle}").
${langLine}
Be concise, accurate, and well structured.
Always answer in a real study format using this order when relevant:
1. Short direct answer
2. Key points
3. Simple example or explanation
4. What to study next
Use markdown headings, bullets, and short paragraphs. Use code blocks for code.
Only answer about THIS module or its parent course; if asked something unrelated, gently redirect.`;

    if (mode === "summary") {
      system += `\nTask: Produce a 5-7 bullet point summary of the key concepts likely covered in this lesson based on the title.`;
    } else if (mode === "mcq") {
      system += `\nTask: Generate exactly 5 multiple-choice questions about this lesson's likely content. Format STRICTLY as:
**Q1.** question text
- A) option
- B) option
- C) option
- D) option
**Answer:** B — short explanation`;
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }, 402);
    if (!r.ok || !r.body) {
      const t = await r.text();
      console.error("AI gateway error:", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});