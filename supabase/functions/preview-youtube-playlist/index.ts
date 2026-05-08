const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}
function extractPlaylistId(url: string): string | null {
  try { const u = new URL(url); return u.searchParams.get("list"); } catch {
    if (/^[A-Za-z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { url } = await req.json();
    const id = extractPlaylistId(url);
    if (!id) return json({ error: "Invalid playlist URL" }, 400);
    const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
    if (!apiKey) return json({ error: "YouTube API key missing" }, 500);

    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${id}&key=${apiKey}`);
    const plJson = await plRes.json();
    if (plJson.error) return json({ error: plJson.error.message }, 400);
    if (!plJson.items?.length) return json({ error: "Playlist not found or private" }, 404);
    const sn = plJson.items[0].snippet;

    const items: any[] = [];
    let token: string | undefined;
    for (let i = 0; i < 4; i++) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${id}${token ? `&pageToken=${token}` : ""}&key=${apiKey}`);
      const j = await r.json();
      if (j.error) return json({ error: j.error.message }, 400);
      items.push(...(j.items ?? []));
      if (!j.nextPageToken) break;
      token = j.nextPageToken;
    }
    const valid = items.filter((it) => {
      const v = it?.snippet?.resourceId?.videoId;
      const t = it?.snippet?.title ?? "";
      return v && !/^(Private|Deleted) video$/i.test(t);
    });
    const ids = valid.map((i) => i.snippet.resourceId.videoId);
    const durations = new Map<string, number>();
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50).join(",");
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch}&key=${apiKey}`);
      const j = await r.json();
      (j.items ?? []).forEach((v: any) => durations.set(v.id, parseDuration(v.contentDetails.duration)));
    }

    return json({
      playlist: {
        title: sn.title,
        description: sn.description,
        channel: sn.channelTitle,
        thumbnail: sn.thumbnails?.high?.url ?? sn.thumbnails?.medium?.url ?? null,
      },
      videos: valid.map((it: any) => ({
        videoId: it.snippet.resourceId.videoId,
        title: it.snippet.title,
        thumbnail: it.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${it.snippet.resourceId.videoId}/hqdefault.jpg`,
        duration: durations.get(it.snippet.resourceId.videoId) ?? 0,
      })),
      total: valid.length,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});