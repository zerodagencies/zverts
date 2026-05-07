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
    const list = u.searchParams.get("list");
    if (list) return list;
    // youtu.be/VIDEO?list=... already handled above
    return null;
  } catch {
    // Maybe bare ID
    if (/^[A-Za-z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { url } = await req.json();
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return json({ error: "Invalid playlist URL — must contain ?list=..." }, 400);
    console.log("Importing playlist:", playlistId, "for user:", user.id);

    const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
    if (!apiKey) return json({ error: "YouTube API key not configured" }, 500);

    // playlist info
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    const plJson = await plRes.json();
    if (plJson.error) {
      console.error("Playlist info error:", plJson.error);
      return json({ error: `YouTube API: ${plJson.error.message}` }, 400);
    }
    if (!plJson.items?.length) return json({ error: "Playlist not found or is private" }, 404);
    const playlistTitle = plJson.items?.[0]?.snippet?.title ?? "Imported playlist";
    const playlistDesc = plJson.items?.[0]?.snippet?.description ?? null;
    const playlistThumb = plJson.items?.[0]?.snippet?.thumbnails?.high?.url
      ?? plJson.items?.[0]?.snippet?.thumbnails?.medium?.url ?? null;

    // playlist items (paginate up to 200)
    const items: any[] = [];
    let pageToken: string | undefined;
    for (let i = 0; i < 4; i++) {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}${pageToken ? `&pageToken=${pageToken}` : ""}&key=${apiKey}`);
      const j = await res.json();
      if (j.error) {
        console.error("playlistItems error:", j.error);
        return json({ error: `YouTube API: ${j.error.message}` }, 400);
      }
      items.push(...(j.items ?? []));
      if (!j.nextPageToken) break;
      pageToken = j.nextPageToken;
    }
    console.log("Fetched playlist items:", items.length);
    if (items.length === 0) return json({ error: "No videos found in playlist" }, 400);

    // Extract video IDs from snippet.resourceId.videoId (per YouTube API spec)
    const validItems = items.filter(it => {
      const vid = it?.snippet?.resourceId?.videoId ?? it?.contentDetails?.videoId;
      const title = it?.snippet?.title ?? "";
      if (!vid) { console.log("Skipping item, missing videoId:", title); return false; }
      if (/^(Private|Deleted) video$/i.test(title)) return false;
      return true;
    });
    console.log("Valid items:", validItems.length);
    if (validItems.length === 0) return json({ error: "No playable videos in playlist" }, 400);

    const ids = validItems.map(i => i.snippet?.resourceId?.videoId ?? i.contentDetails?.videoId);
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
    if (cErr) {
      console.error("Course insert error:", cErr);
      return json({ error: `Course create failed: ${cErr.message}` }, 400);
    }
    console.log("Course created:", course.id);

    const rows = validItems.map((it, idx) => {
      const videoId = it.snippet?.resourceId?.videoId ?? it.contentDetails?.videoId;
      return {
        course_id: course.id,
        position: idx + 1,
        title: it.snippet.title,
        youtube_video_id: videoId,
        duration_seconds: durations.get(videoId) ?? 0,
        thumbnail_url: it.snippet.thumbnails?.medium?.url
          ?? it.snippet.thumbnails?.high?.url
          ?? it.snippet.thumbnails?.default?.url
          ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    });
    console.log("Inserting modules:", rows.length, "first:", rows[0]);
    const { data: inserted, error: mErr } = await supabase.from("modules").insert(rows).select("id");
    if (mErr) {
      console.error("Modules insert error:", mErr);
      // rollback the course so user can retry cleanly
      await supabase.from("courses").delete().eq("id", course.id);
      return json({ error: `Failed to import playlist videos: ${mErr.message}` }, 400);
    }
    console.log("Modules inserted:", inserted?.length);

    return json({ course_id: course.id, modules: inserted?.length ?? rows.length });
  } catch (e) {
    console.error("Unexpected error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});