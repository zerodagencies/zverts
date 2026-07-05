const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDuration(iso: string): number {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0);
}

function extractPlaylistId(url: string): string | null {
    try {
        const u = new URL(url);
        return u.searchParams.get("list");
    } catch {
        if (/^[A-Za-z0-9_-]{10,}$/.test(url.trim())) return url.trim();
        return null;
    }
}

// ─── Guard Rail Logic ────────────────────────────────────────────────────────

// Negative signals — non-educational content types
const MUSIC_SIGNALS =
    /\b(lyrics?|official\s*(video|audio|mv)|ft\.|feat\.|prod\.?\s*by|remix|ost|music\s*video|visualizer|audio)\b/i;

const GAMING_ENTERTAINMENT_SIGNALS =
    /\b(gameplay|playthrough|let'?s\s*play|walkthrough|speedrun|highlights?|montage|clutch|gaming|game\s*play|reaction|vlog|prank|challenge|unboxing|haul|daily\s*routine|funny|comedy|meme|tiktok|shorts)\b/i;

const SPORTS_SIGNALS =
    /\b(highlights?|match|vs\.?|goal|scored|season\s*\d|episode\s*\d|recap|nba|fifa|ipl|bpl)\b/i;

// Positive signals — educational content
const EDUCATIONAL_SIGNALS =
    /\b(tutorial|course|lecture|lesson|learn|explained?|how\s*to|crash\s*course|bootcamp|masterclass|introduction|beginner|advanced|guide|workshop|training|class|module|chapter)\b/i;

// Numbered episode pattern — very strong educational signal
const NUMBERED_PATTERN =
    /[-\s#|:]\s*(\d+)\s*$|\b(part|ep|episode|lesson|chapter|module)\s*\.?\s*\d+\b/i;

const MUSIC_CATEGORY_ID = "10";

interface VideoMeta {
    duration: number;
    categoryId: string;
    title: string;
}

interface GuardDetails {
    median_duration: number;
    music_ratio: number;
    gaming_ratio: number;
    sports_ratio: number;
    educational_ratio: number;
    numbered_ratio: number;
    music_category_ratio: number;
    playlist_title_educational: boolean;
    playlist_title_entertainment: boolean;
}

interface GuardResult {
    approved: boolean;
    educational_score: number;
    entertainment_score: number;
    reason: string | null;
    details: GuardDetails;
}


function analyzeContent(playlistTitle: string, videos: VideoMeta[]): GuardResult {
    const total = videos.length;

    if (total === 0) {
        return {
            approved: false,
            educational_score: 0,
            entertainment_score: 100,
            reason: "Playlist has no valid videos.",
            details: {
                median_duration: 0,
                music_ratio: 0,
                gaming_ratio: 0,
                sports_ratio: 0,
                educational_ratio: 0,
                numbered_ratio: 0,
                music_category_ratio: 0,
                playlist_title_educational: false,
                playlist_title_entertainment: false,
            },
        };
    }

    // Median duration
    const sorted = [...videos.map((v) => v.duration)].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Per-video signal counts
    let musicHits = 0;
    let gamingHits = 0;
    let sportsHits = 0;
    let eduHits = 0;
    let numberedHits = 0;
    let musicCategoryHits = 0;

    for (const v of videos) {
        if (MUSIC_SIGNALS.test(v.title)) musicHits++;
        if (GAMING_ENTERTAINMENT_SIGNALS.test(v.title)) gamingHits++;
        if (SPORTS_SIGNALS.test(v.title)) sportsHits++;
        if (EDUCATIONAL_SIGNALS.test(v.title)) eduHits++;
        if (NUMBERED_PATTERN.test(v.title)) numberedHits++;
        if (v.categoryId === MUSIC_CATEGORY_ID) musicCategoryHits++;
    }

    const musicRatio = musicHits / total;
    const gamingRatio = gamingHits / total;
    const sportsRatio = sportsHits / total;
    const eduRatio = eduHits / total;
    const numberedRatio = numberedHits / total;
    const musicCategoryRatio = musicCategoryHits / total;

    // Playlist-level signals
    const playlistTitleEducational = EDUCATIONAL_SIGNALS.test(playlistTitle);
    const playlistTitleEntertainment =
        MUSIC_SIGNALS.test(playlistTitle) ||
        GAMING_ENTERTAINMENT_SIGNALS.test(playlistTitle) ||
        SPORTS_SIGNALS.test(playlistTitle);

    // ── Entertainment Score ──────────────────────────────────────────────────
    let entertainmentScore = 0;

    if (musicCategoryRatio > 0.5) entertainmentScore += 50;
    else if (musicCategoryRatio > 0.2) entertainmentScore += 25;

    if (musicRatio > 0.4) entertainmentScore += 40;
    else if (musicRatio > 0.2) entertainmentScore += 20;

    if (gamingRatio > 0.4) entertainmentScore += 40;
    else if (gamingRatio > 0.2) entertainmentScore += 20;

    if (sportsRatio > 0.4) entertainmentScore += 35;
    else if (sportsRatio > 0.2) entertainmentScore += 15;

    if (median < 180) entertainmentScore += 20;   // under 3 min — strong non-edu signal

    if (playlistTitleEntertainment) entertainmentScore += 20;

    entertainmentScore = Math.min(entertainmentScore, 100);

    // ── Educational Score ────────────────────────────────────────────────────
    let educationalScore = 0;

    if (numberedRatio > 0.5) educationalScore += 40;   // numbered series is the strongest signal
    else if (numberedRatio > 0.25) educationalScore += 20;

    if (eduRatio > 0.4) educationalScore += 35;
    else if (eduRatio > 0.2) educationalScore += 15;

    if (median >= 480) educationalScore += 20;    // 8+ min
    else if (median >= 300) educationalScore += 10; // 5+ min

    if (playlistTitleEducational) educationalScore += 25;
    if (NUMBERED_PATTERN.test(playlistTitle)) educationalScore += 10;

    educationalScore = Math.min(educationalScore, 100);

    // ── Decision ─────────────────────────────────────────────────────────────
    const approved = entertainmentScore < 50 && educationalScore >= 30;

    // ── Rejection Reason ─────────────────────────────────────────────────────
    let reason: string | null = null;

    if (!approved) {
        if (entertainmentScore >= 50) {
            if (musicCategoryRatio > 0.5 || musicRatio > 0.4) {
                reason = "This appears to be a music playlist. Zverts only supports educational content.";
            } else if (gamingRatio > 0.4) {
                reason = "This appears to be a gaming or entertainment playlist. Please add a tutorial or course playlist.";
            } else if (sportsRatio > 0.4) {
                reason = "This appears to be a sports playlist. Zverts only supports educational content.";
            } else {
                reason = "This playlist appears to contain non-educational content. Please add a tutorial or course playlist.";
            }
        } else {
            // entertainmentScore < 50 but educationalScore < 30 — ambiguous content
            reason = "This playlist doesn't have enough educational signals. Please add a structured tutorial or course playlist.";
        }
    }

    return {
        approved,
        educational_score: educationalScore,
        entertainment_score: entertainmentScore,
        reason,
        details: {
            median_duration: median,
            music_ratio: musicRatio,
            gaming_ratio: gamingRatio,
            sports_ratio: sportsRatio,
            educational_ratio: eduRatio,
            numbered_ratio: numberedRatio,
            music_category_ratio: musicCategoryRatio,
            playlist_title_educational: playlistTitleEducational,
            playlist_title_entertainment: playlistTitleEntertainment,
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────

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

        const { url } = await req.json();
        const id = extractPlaylistId(url);
        if (!id) return json({ error: "Invalid playlist URL" }, 400);

        const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
        if (!apiKey) return json({ error: "YouTube API key missing" }, 500);

        // Fetch playlist metadata
        const plRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${id}&key=${apiKey}`,
        );
        const plJson = await plRes.json();
        if (plJson.error) return json({ error: plJson.error.message }, 400);
        if (!plJson.items?.length) return json({ error: "Playlist not found or private" }, 404);
        const sn = plJson.items[0].snippet;

        // Fetch playlist items
        const items: any[] = [];
        let token: string | undefined;
        for (let i = 0; i < 4; i++) {
            const r = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${id}${token ? `&pageToken=${token}` : ""}&key=${apiKey}`,
            );
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
        const videoMeta = new Map<string, { duration: number; categoryId: string }>();

        for (let i = 0; i < ids.length; i += 50) {
            const batch = ids.slice(i, i + 50).join(",");
            // ↓ Added snippet to part — gets categoryId, no extra quota cost
            const r = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${batch}&key=${apiKey}`,
            );
            const j = await r.json();
            (j.items ?? []).forEach((v: any) =>
                videoMeta.set(v.id, {
                    duration: parseDuration(v.contentDetails.duration),
                    categoryId: v.snippet?.categoryId ?? "",
                }),
            );
        }

        // Build video list
        const videos = valid.map((it: any) => {
            const vid = it.snippet.resourceId.videoId;
            const meta = videoMeta.get(vid);
            return {
                videoId: vid,
                title: it.snippet.title,
                thumbnail:
                    it.snippet.thumbnails?.medium?.url ??
                    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                duration: meta?.duration ?? 0,
            };
        });

        // ─── Run guard rails ───
        const guardInput: VideoMeta[] = valid.map((it: any) => {
            const vid = it.snippet.resourceId.videoId;
            const meta = videoMeta.get(vid);
            return {
                title: it.snippet.title,
                duration: meta?.duration ?? 0,
                categoryId: meta?.categoryId ?? "",
            };
        });

        const guard = analyzeContent(sn.title, guardInput);

        // Hard reject — don't even return the preview
        if (!guard.approved) {
            return json(
                {
                    error: "CONTENT_NOT_APPROVED",
                    message: guard.reason,
                    guard,
                },
                422,
            );
        }
        // ──────────────────────

        return json({
            playlist: {
                title: sn.title,
                description: sn.description,
                channel: sn.channelTitle,
                thumbnail: sn.thumbnails?.high?.url ?? sn.thumbnails?.medium?.url ?? null,
            },
            videos,
            total: valid.length,
            guard, // approved: true, score, details — pass to Stage 2
        });
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
