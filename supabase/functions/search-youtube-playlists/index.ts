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

        const { query, contentType = "both", page = 1, pageSize = 12 } = await req.json();
        const q = (query ?? "").trim();
        if (!q) return json({ error: "Search query required" }, 400);
        const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
        if (!apiKey) return json({ error: "YouTube API key missing" }, 500);

        const wantPlaylists = contentType === "both" || contentType === "playlists";
        const wantVideos = contentType === "both" || contentType === "videos";

        const PAGE_SIZE_YT = 50;
        const MAX_PAGES = 20;

        async function fetchYouTubeSearch(
            type: "playlist" | "video",
            maxResults: number,
        ): Promise<Record<string, unknown>[]> {
            const allItems: Record<string, unknown>[] = [];
            let ytToken: string | undefined;
            const pagesNeeded = Math.ceil(maxResults / PAGE_SIZE_YT);

            for (let i = 0; i < Math.min(pagesNeeded, MAX_PAGES); i++) {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${type}&maxResults=${PAGE_SIZE_YT}&q=${encodeURIComponent(q)}${ytToken ? `&pageToken=${ytToken}` : ""}&key=${apiKey}`;
                const res = await fetch(url);
                const j = await res.json();
                if (j.error) throw new Error(j.error.message);
                allItems.push(...(j.items ?? []));
                if (!j.nextPageToken || allItems.length >= maxResults) break;
                ytToken = j.nextPageToken;
            }
            return allItems.slice(0, maxResults);
        }

        const searchMax = Math.max(page * pageSize, 60);
        const searches: Promise<Record<string, unknown>[]>[] = [];
        if (wantPlaylists) searches.push(fetchYouTubeSearch("playlist", searchMax));
        if (wantVideos) searches.push(fetchYouTubeSearch("video", searchMax));

        const searchResults = await Promise.all(searches);
        const playlistSearchItems = wantPlaylists ? searchResults[0] : [];
        const videoSearchItems = wantVideos
            ? (wantPlaylists ? searchResults[1] : searchResults[0])
            : [];

        let playlistResults: Record<string, unknown>[] = [];
        const playlistIds = playlistSearchItems
            .map((it) => (it.id as Record<string, unknown>)?.playlistId)
            .filter(Boolean);

        if (playlistIds.length) {
            for (let i = 0; i < playlistIds.length; i += 50) {
                const batch = playlistIds.slice(i, i + 50).join(",");
                const detailsRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${batch}&key=${apiKey}`,
                );
                const detailsJson = await detailsRes.json();
                if (detailsJson.error) return json({ error: detailsJson.error.message }, 400);

                playlistResults.push(
                    ...(detailsJson.items ?? []).map((it: Record<string, unknown>) => {
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
                    }),
                );
            }
        }

        let videoResults: Record<string, unknown>[] = [];
        const videoIds = videoSearchItems
            .map((it) => (it.id as Record<string, unknown>)?.videoId)
            .filter(Boolean);

        if (videoIds.length) {
            for (let i = 0; i < videoIds.length; i += 50) {
                const batch = videoIds.slice(i, i + 50).join(",");
                const detailsRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${batch}&key=${apiKey}`,
                );
                const detailsJson = await detailsRes.json();
                if (detailsJson.error) return json({ error: detailsJson.error.message }, 400);

                videoResults.push(
                    ...(detailsJson.items ?? []).map((it: Record<string, unknown>) => {
                        const sn = it.snippet as Record<string, unknown>;
                        const thumbs = sn.thumbnails as Record<string, Record<string, string>>;
                        const dur = (it.contentDetails as Record<string, unknown>)?.duration as string;
                        const m = dur?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        const durationSecs = m
                            ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0)
                            : 0;
                        return {
                            type: "video",
                            videoId: it.id,
                            title: sn.title,
                            channel: sn.channelTitle,
                            duration: durationSecs,
                            thumbnail:
                                thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
                        };
                    }),
                );
            }
        }

        const allResults: Record<string, unknown>[] = [];
        let pi = 0, vi = 0;
        while (pi < playlistResults.length || vi < videoResults.length) {
            if (pi < playlistResults.length) allResults.push(playlistResults[pi++]);
            if (vi < videoResults.length) allResults.push(videoResults[vi++]);
            if (vi < videoResults.length) allResults.push(videoResults[vi++]);
        }

        const totalCount = allResults.length;
        const start = (page - 1) * pageSize;
        const paged = allResults.slice(start, start + pageSize);

        return json({
            results: paged,
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
        });
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
