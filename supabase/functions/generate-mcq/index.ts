import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const json = (b: unknown, s = 200) =>
        new Response(JSON.stringify(b), {
            status: s,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    try {
        const auth = req.headers.get("Authorization");
        if (!auth) return json({ error: "Unauthorized" }, 401);

        const url = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;

        const userClient = createClient(url, anonKey, {
            global: { headers: { Authorization: auth } },
        });
        const {
            data: { user },
        } = await userClient.auth.getUser();
        if (!user) return json({ error: "Unauthorized" }, 401);

        const { module_id } = await req.json();
        if (!module_id || typeof module_id !== "string")
            return json({ error: "module_id required" }, 400);

        const admin = createClient(url, serviceKey);

        // Return early if questions already exist (race-condition guard)
        const { data: existing } = await admin
            .from("mcq_questions")
            .select("id")
            .eq("module_id", module_id)
            .limit(1);
        if (existing && existing.length > 0) return json({ ok: true, generated: false });

        // Fetch module + course info
        const { data: mod } = await admin
            .from("modules")
            .select("title, youtube_video_id, courses(title)")
            .eq("id", module_id)
            .maybeSingle();
        if (!mod) return json({ error: "Module not found" }, 404);

        // Try to use transcript if ready
        const { data: transcript } = await admin
            .from("transcripts")
            .select("text, status")
            .eq("module_id", module_id)
            .maybeSingle();

        const courseTitle = (mod.courses as { title: string } | null)?.title ?? "";
        const hasTranscript = transcript?.status === "ready" && transcript?.text;

        const context = hasTranscript
            ? `Course: "${courseTitle}"\nLesson: "${mod.title}"\n\nTranscript:\n${transcript!.text!.slice(0, 8000)}`
            : `Course: "${courseTitle}"\nLesson: "${mod.title}"`;

        const prompt = `You are an educational quiz generator. Generate exactly 10 multiple-choice questions for this lesson.

${context}

Return ONLY a JSON array of exactly 10 objects with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0
  }
]

Rules:
- Each question must have exactly 4 options
- correct_index is 0-based (0=A, 1=B, 2=C, 3=D)
- Questions must test understanding of the lesson topic
- Mix easy, medium, and hard difficulty
- Return ONLY the JSON array, no markdown, no explanation`;

        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openrouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://zverts.com",
                "X-Title": "ZverTs MCQ Generator",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            }),
        });

        if (!aiRes.ok) {
            const err = await aiRes.text();
            return json({ error: `AI error: ${err}` }, 500);
        }

        const aiData = await aiRes.json();
        const content: string = aiData.choices?.[0]?.message?.content ?? "";

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return json({ error: "Could not parse AI response" }, 500);

        const questions: { question: string; options: string[]; correct_index: number }[] =
            JSON.parse(jsonMatch[0]);
        if (!Array.isArray(questions) || questions.length === 0)
            return json({ error: "Invalid questions format" }, 500);

        const rows = questions.map((q, i) => ({
            module_id,
            question: q.question,
            options: q.options,
            correct_index: q.correct_index,
            position: i + 1,
        }));

        const { error: insertErr } = await admin.from("mcq_questions").insert(rows);
        if (insertErr) return json({ error: insertErr.message }, 500);

        return json({ ok: true, generated: true, count: rows.length });
    } catch (e) {
        console.error("generate-mcq error:", e);
        return json({ error: (e as Error).message }, 500);
    }
});
