import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const { url } = await req.json();
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return new Response(JSON.stringify({ error: "Invalid playlist URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
    // playlist info
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    const plJson = await plRes.json();
    const playlistTitle = plJson.items?.[0]?.snippet?.title ?? "Imported playlist";
    const playlistDesc = plJson.items?.[0]?.snippet?.description ?? null;
    const playlistThumb = plJson.items?.[0]?.snippet?.thumbnails?.high?.url ?? null;

    // playlist items (paginate up to 200)
    const items: any[] = [];
    let pageToken: string | undefined;
    for (let i = 0; i < 4; i++) {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}${pageToken ? `&pageToken=${pageToken}` : ""}&key=${apiKey}`);
      const j = await res.json();
      if (j.error) return new Response(JSON.stringify({ error: j.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      items.push(...(j.items ?? []));
      if (!j.nextPageToken) break;
      pageToken = j.nextPageToken;
    }
    if (items.length === 0) return new Response(JSON.stringify({ error: "No videos in playlist" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    // Extract video IDs from snippet.resourceId.videoId (per YouTube API spec)
    const validItems = items.filter(it => {
      const vid = it?.snippet?.resourceId?.videoId;
      const title = it?.snippet?.title ?? "";
      if (!vid) { console.log("Skipping item, missing videoId:", title); return false; }
      if (/^(Private|Deleted) video$/i.test(title)) return false;
      return true;
    });
    if (validItems.length === 0) return new Response(JSON.stringify({ error: "No playable videos in playlist" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const ids = validItems.map(i => i.snippet.resourceId.videoId);
    const durations = new Map<string, number>();
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50).join(",");
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch}&key=${apiKey}`);
      const j = await r.json();
      (j.items ?? []).forEach((v: any) => durations.set(v.id, parseDuration(v.contentDetails.duration)));
    }

    // create course
    const { data: course, error: cErr } = await supabase.from("courses").insert({
      user_id: user.id, title: playlistTitle, description: playlistDesc, thumbnail_url: playlistThumb,
      source_playlist_id: playlistId, source_playlist_url: url, is_public: false, is_system: false,
    }).select().single();
    if (cErr) return new Response(JSON.stringify({ error: cErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const rows = validItems.map((it, idx) => {
      const videoId = it.snippet.resourceId.videoId;
      return {
        course_id: course.id,
        position: idx + 1,
        title: it.snippet.title,
        youtube_video_id: videoId,
        duration_seconds: durations.get(videoId) ?? 0,
        thumbnail_url: it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    });
    const { error: mErr } = await supabase.from("modules").insert(rows);
    if (mErr) return new Response(JSON.stringify({ error: mErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    return new Response(JSON.stringify({ course_id: course.id, modules: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});