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
        // Require authenticated user — prevents anonymous abuse of YouTube API quota
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return json({ error: "Unauthorized" }, 401);
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } },
        });
        const {
            data: { user },
        } = await sb.auth.getUser();
        if (!user) return json({ error: "Unauthorized" }, 401);

        const { query } = await req.json();
        const q = (query ?? "").trim();
        if (!q) return json({ error: "Search query required" }, 400);
        const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
        if (!apiKey) return json({ error: "YouTube API key missing" }, 500);

        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=15&q=${encodeURIComponent(q)}&key=${apiKey}`,
        );
        const searchJson = await searchRes.json();
        if (searchJson.error) return json({ error: searchJson.error.message }, 400);

        const ids = (searchJson.items ?? [])
            .map((it: Record<string, unknown>) => (it.id as Record<string, unknown>)?.playlistId)
            .filter(Boolean);
        if (!ids.length) return json({ results: [] });

        // Batch fetch to get accurate item counts (search.list snippet doesn't include them)
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${ids.join(",")}&key=${apiKey}`,
        );
        const detailsJson = await detailsRes.json();
        if (detailsJson.error) return json({ error: detailsJson.error.message }, 400);

        const results = (detailsJson.items ?? []).map((it: Record<string, unknown>) => {
            const sn = it.snippet as Record<string, unknown>;
            const thumbs = sn.thumbnails as Record<string, Record<string, string>>;
            return {
                playlistId: it.id,
                title: sn.title,
                channel: sn.channelTitle,
                itemCount: (it.contentDetails as Record<string, unknown>)?.itemCount ?? 0,
                thumbnail: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
            };
        });

        return json({ results });
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
