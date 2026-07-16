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

        // Search for both playlists and videos in parallel
        const [playlistRes, videoRes] = await Promise.all([
            fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=8&q=${encodeURIComponent(q)}&key=${apiKey}`,
            ),
            fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(q)}&key=${apiKey}`,
            ),
        ]);

        const playlistJson = await playlistRes.json();
        const videoJson = await videoRes.json();

        if (playlistJson.error) return json({ error: playlistJson.error.message }, 400);
        if (videoJson.error) return json({ error: videoJson.error.message }, 400);

        // Process playlists
        const playlistIds = (playlistJson.items ?? [])
            .map((it: Record<string, unknown>) => (it.id as Record<string, unknown>)?.playlistId)
            .filter(Boolean);

        let playlistResults: Record<string, unknown>[] = [];
        if (playlistIds.length) {
            const detailsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistIds.join(",")}&key=${apiKey}`,
            );
            const detailsJson = await detailsRes.json();
            if (detailsJson.error) return json({ error: detailsJson.error.message }, 400);

            playlistResults = (detailsJson.items ?? []).map((it: Record<string, unknown>) => {
                const sn = it.snippet as Record<string, unknown>;
                const thumbs = sn.thumbnails as Record<string, Record<string, string>>;
                return {
                    type: "playlist",
                    playlistId: it.id,
                    title: sn.title,
                    channel: sn.channelTitle,
                    itemCount: (it.contentDetails as Record<string, unknown>)?.itemCount ?? 0,
                    thumbnail: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
                };
            });
        }

        // Process videos
        const videoIds = (videoJson.items ?? [])
            .map((it: Record<string, unknown>) => (it.id as Record<string, unknown>)?.videoId)
            .filter(Boolean);

        let videoResults: Record<string, unknown>[] = [];
        if (videoIds.length) {
            const detailsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(",")}&key=${apiKey}`,
            );
            const detailsJson = await detailsRes.json();
            if (detailsJson.error) return json({ error: detailsJson.error.message }, 400);

            videoResults = (detailsJson.items ?? []).map((it: Record<string, unknown>) => {
                const sn = it.snippet as Record<string, unknown>;
                const thumbs = sn.thumbnails as Record<string, Record<string, string>>;
                const dur = (it.contentDetails as Record<string, unknown>)?.duration as string;
                const m = dur?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                const durationSecs = m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : 0;
                return {
                    type: "video",
                    videoId: it.id,
                    title: sn.title,
                    channel: sn.channelTitle,
                    duration: durationSecs,
                    thumbnail: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
                };
            });
        }

        // Interleave: 1 playlist, 2 videos, 1 playlist, 2 videos, ...
        const results: Record<string, unknown>[] = [];
        let pi = 0, vi = 0;
        while (pi < playlistResults.length || vi < videoResults.length) {
            if (pi < playlistResults.length) results.push(playlistResults[pi++]);
            if (vi < videoResults.length) results.push(videoResults[vi++]);
            if (vi < videoResults.length) results.push(videoResults[vi++]);
        }

        return json({ results });
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
