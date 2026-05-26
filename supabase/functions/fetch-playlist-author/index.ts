import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { course_id } = await req.json();
    if (!course_id) return json({ error: "course_id required" }, 400);

    // RLS-scoped read: user can only resolve courses they can already see
    const { data: course } = await userClient.from("courses")
      .select("id, source_playlist_id, author_name, author_channel_id, author_channel_url")
      .eq("id", course_id).maybeSingle();
    if (!course) return json({ error: "Course not found" }, 404);
    if (course.author_name) {
      return json({ author_name: course.author_name, author_channel_url: course.author_channel_url });
    }
    if (!course.source_playlist_id) return json({ author_name: null });

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) return json({ error: "YouTube API key missing" }, 500);
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${course.source_playlist_id}&key=${apiKey}`);
    const j = await res.json();
    const sn = j?.items?.[0]?.snippet;
    if (!sn) return json({ author_name: null });
    const author_name = sn.channelTitle ?? null;
    const author_channel_id = sn.channelId ?? null;
    const author_channel_url = author_channel_id ? `https://www.youtube.com/channel/${author_channel_id}` : null;
    // Only the metadata cache write needs service-role (RLS would block update on public/system courses)
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("courses").update({ author_name, author_channel_id, author_channel_url }).eq("id", course.id);
    return json({ author_name, author_channel_url });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
