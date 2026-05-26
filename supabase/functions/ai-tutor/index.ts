import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_MAP: Record<string, string> = {
  fast: "google/gemini-2.5-flash-lite",
  smart: "google/gemini-2.5-flash",
  pro: "google/gemini-2.5-pro",
  reasoning: "openai/gpt-5-mini",
  deep: "openai/gpt-5",
  coding: "openai/gpt-5-mini",
};

const MODE_PROMPTS: Record<string, string> = {
  chat: "",
  study_buddy: "Tone: warm, encouraging study friend. Use short paragraphs, friendly emojis sparingly, ask one check-in question at the end.",
  strict_teacher: "Tone: rigorous teacher. Demand precision. Point out common mistakes. End with one challenge problem.",
  exam: "Mode: exam-style. Give exam-ready answers: definition → derivation → worked example → 2 practice questions.",
  simple_bangla: "Mode: explain in simple, everyday Bangla (Banglish ok). Use everyday analogies. Keep English only for technical terms.",
  deep_explain: "Mode: deep explanation. Start with intuition, then formal definition, then 2 worked examples (one easy, one harder), then edge cases.",
  fast_revision: "Mode: fast revision. ONE-PAGE summary only — key formulas, 3 bullet points per concept, no fluff.",
  coding_mentor: "Mode: coding mentor. Always include a runnable code snippet. Explain time/space complexity. Suggest one refactor.",
  summary: "Task: Produce a 5-7 bullet point summary of the key concepts likely covered in this lesson based on the title and any provided transcript.",
  mcq: `Task: Generate exactly 5 multiple-choice questions about this lesson's likely content.
Output ONLY the questions in this STRICT format (no preamble, no closing text):
**Q1.** question text
- A) option
- B) option
- C) option
- D) option
**Answer:** B — short explanation

(repeat for Q2..Q5, separated by a blank line)`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const {
      module_id = null,
      messages,
      language = "en",
      mode = "chat",
      model = "smart",
    } = body;
    if (!Array.isArray(messages) || messages.length === 0)
      return json({ error: "messages required" }, 400);

    // Server-controlled daily free-preview cap (paid users always pass).
    // NEVER trust a client-supplied limit.
    const DAILY_LIMIT = 10;
    const { data: usage, error: uErr } = await userClient.rpc("consume_ai_message", { _daily_limit: DAILY_LIMIT });
    if (uErr) return json({ error: uErr.message }, 400);
    if (usage && (usage as any).ok === false) {
      return json({
        error: "limit_reached",
        message: `You've used your ${DAILY_LIMIT} free AI messages today. Upgrade for unlimited.`,
        usage,
      }, 429);
    }

    // Load source context (module + transcript) — RLS-scoped
    let moduleCtx = "";
    let courseTitle = "general study";
    let modTitle = "";
    if (module_id) {
      const { data: mod } = await userClient
        .from("modules")
        .select("title, position, course_id, courses!inner(title)")
        .eq("id", module_id)
        .maybeSingle();
      if (mod) {
        modTitle = (mod as any).title;
        courseTitle = (mod as any).courses?.title ?? courseTitle;
        moduleCtx = `\nACTIVE SOURCE: "${modTitle}" (module ${(mod as any).position} of "${courseTitle}").`;

        const { data: tr } = await userClient
          .from("transcripts")
          .select("status,text")
          .eq("module_id", module_id)
          .maybeSingle();
        if (tr?.status === "ready" && tr.text) {
          const snippet = tr.text.length > 12000 ? tr.text.slice(0, 12000) + "\n…[truncated]" : tr.text;
          moduleCtx += `\n\nTRANSCRIPT (use as primary source of truth, cite timestamps when present):\n${snippet}`;
        } else if (tr?.status === "queued" || tr?.status === "processing") {
          moduleCtx += `\n\n(Transcript is being generated. Answer from general knowledge and acknowledge the limitation.)`;
        } else {
          moduleCtx += `\n\n(No transcript available yet. Answer from general knowledge and the module title.)`;
        }
      }
    }

    const langLine = language === "bn"
      ? "Reply in clear, simple Bangla (bengali). Use English technical terms when needed."
      : "Reply in clear, simple English.";

    const baseSystem = `You are Vert — ZverTs's personal AI study companion.${moduleCtx ? "" : " The user has not selected a source module; answer general study questions."}
${langLine}
${moduleCtx}

${MODE_PROMPTS[mode] ?? ""}

FORMATTING RULES (strict):
- Use markdown: headings (##, ###), bullet lists, short paragraphs.
- MATH: every math expression MUST be LaTeX. Inline $...$, display $$...$$. Never raw x^2 or sqrt(2) outside delimiters.
- Code: fenced blocks with language tag.
- Tables for comparisons. **Bold** for emphasis sparingly.
- When you reference the transcript, quote 1 short line and tag it like [00:12].`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const gatewayModel = MODEL_MAP[model] ?? MODEL_MAP.smart;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: gatewayModel,
        messages: [{ role: "system", content: baseSystem }, ...messages],
        stream: true,
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted. Contact admin." }, 402);
    if (!r.ok || !r.body) {
      const t = await r.text();
      console.error("AI gateway error:", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    // Forward usage info via custom response header so the client can update its chip
    const headers = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-AI-Usage": JSON.stringify(usage ?? {}),
      "Access-Control-Expose-Headers": "X-AI-Usage",
    };
    return new Response(r.body, { headers });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
