import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyCourses } from "@/lib/offline/queries";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardPaste,
    Eye,
    Globe,
    Link2,
    ListVideo,
    Loader2,
    Lock,
    Play,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaylistPreview, type Preview } from "@/components/app/PlaylistPreview";

interface SearchPlaylistResult {
    type: "playlist";
    playlistId: string;
    title: string;
    channel: string;
    itemCount: number;
    thumbnail: string | null;
}

interface SearchVideoResult {
    type: "video";
    videoId: string;
    title: string;
    channel: string;
    duration: number;
    publishedAt?: string;
    thumbnail: string | null;
}

type SearchResult = SearchPlaylistResult | SearchVideoResult;

type ContentType = "both" | "videos" | "playlists";

interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    is_public: boolean;
    is_system: boolean;
    user_id: string | null;
    module_count?: number;
    completed_count?: number;
}

const fmtDuration = (s: number) => {
    if (s <= 0) return "0 min";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return m > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
    return `${m} min`;
};

const fmtPublishedDate = (iso?: string) => {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 1) return "Today";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
        return "";
    }
};

const PAGE_SIZE = 12;

const searchCache = new Map<string, SearchResponse>();

const Courses = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    // ?url= : a playlist pasted on the landing page before signing in.
    const [searchParams] = useSearchParams();

    const [url, setUrl] = useState(() => searchParams.get("url") ?? "");
    const [importing, setImporting] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const [mine, setMine] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchPage, setSearchPage] = useState(1);
    const [contentType, setContentType] = useState<ContentType>("both");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);

    const [convertingId, setConvertingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<CourseFilter>("all");

    const lastSearchRef = useRef<string | null>(null);

    const doSearch = useCallback(async (q: string, ct: ContentType, pg: number) => {
        const trimmed = q.trim();
        if (!trimmed) return;

        const key = `${trimmed}|${ct}|${pg}`;
        if (lastSearchRef.current === key) return;
        lastSearchRef.current = key;

        const cacheKey = key;
        const cached = searchCache.get(cacheKey);
        if (cached) {
            setResults(cached.results ?? []);
            setTotalCount(cached.totalCount ?? 0);
            setTotalPages(cached.totalPages ?? 0);
            setSearchPage(cached.page ?? pg);
            setSearched(true);
            return;
        }

        setSearching(true);
        const { data, error } = await supabase.functions.invoke("search-youtube-playlists", {
            body: { query: trimmed, contentType: ct, page: pg, pageSize: PAGE_SIZE },
        });
        setSearching(false);
        setSearched(true);

        const dataErr = (data as Record<string, unknown>)?.error;
        if (error || dataErr) {
            const errMsg = (dataErr as string) ?? error?.message ?? "Search failed";
            toast.error(errMsg, { description: "Please check your search query and try again." });
            return;
        }

        const resp = data as SearchResponse;
        searchCache.set(cacheKey, resp);
        setResults(resp.results ?? []);
        setTotalCount(resp.totalCount ?? 0);
        setTotalPages(resp.totalPages ?? 0);
        setSearchPage(resp.page ?? pg);
    }, []);

    const searchManual = useCallback(() => {
        lastSearchRef.current = null;
        doSearch(query, contentType, 1);
    }, [query, contentType, doSearch]);

    const goToPage = useCallback(
        (pg: number) => {
            if (pg < 1 || pg > totalPages || pg === searchPage) return;
            lastSearchRef.current = null;
            doSearch(query, contentType, pg);
            document
                .getElementById("search-results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        [query, contentType, totalPages, searchPage, doSearch],
    );

    useEffect(() => {
        setActiveSuggestion(-1);
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            const { data } = await supabase.functions.invoke("youtube-suggest", {
                body: { query: query.trim() },
            });
            setSuggestions((data as { suggestions?: string[] })?.suggestions ?? []);
        }, 250);
        return () => clearTimeout(timer);
    }, [query]);

    const load = async () => {
        if (!user) return;
        setMine(await fetchMyCourses(user.id));
        setLoading(false);
    };

    useEffect(() => {
        load(); /* eslint-disable-next-line */
    }, [user]);

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    const previewPlaylist = async (urlOverride?: string) => {
        const target = (urlOverride ?? url).trim();
        if (!target) return;
        setPreviewing(true);
        const { data, error } = await supabase.functions.invoke("preview-youtube-playlist", {
            body: { url: target },
        });
        setPreviewing(false);
        const dataErr = (data as Record<string, unknown>)?.error;
        if (error || dataErr) {
            const errMsg = (dataErr as string) ?? error?.message ?? "Preview failed";
            toast.error(errMsg, {
                description: "Could not load preview. Check the URL and try again.",
            });
            return;
        }
        setPreview(data);
        setPreviewOpen(true);
    };

    const selectSuggestion = (s: string) => {
        setQuery(s);
        setShowSuggestions(false);
        lastSearchRef.current = null;
        doSearch(s, contentType, 1);
    };

    const selectResult = (r: SearchResult) => {
        if (r.type === "playlist") {
            const playlistUrl = `https://www.youtube.com/playlist?list=${r.playlistId}`;
            setUrl(playlistUrl);
            previewPlaylist(playlistUrl);
        } else {
            const videoUrl = `https://www.youtube.com/watch?v=${r.videoId}`;
            setUrl(videoUrl);
            previewPlaylist(videoUrl);
        }
    };

    const quickConvert = async (r: SearchResult) => {
        const targetUrl =
            r.type === "playlist"
                ? `https://www.youtube.com/playlist?list=${r.playlistId}`
                : `https://www.youtube.com/watch?v=${r.videoId}`;
        const id = r.type === "playlist" ? r.playlistId : r.videoId;
        setConvertingId(id);
        setImporting(true);
        const { data, error } = await supabase.functions.invoke("import-youtube-playlist", {
            body: { url: targetUrl },
        });
        setImporting(false);
        setConvertingId(null);
        const dataErr = (data as Record<string, unknown>)?.error;
        if (error || dataErr) {
            const errMsg = (dataErr as string) ?? error?.message ?? "Conversion failed";
            toast.error(errMsg, { description: "Please try again or use the Preview button." });
            return;
        }
        toast.success("Course created!", { description: `${r.title} has been imported.` });
        if (data?.course_id) navigate(`/courses/${data.course_id}`);
        else load();
    };

    const importPlaylist = async () => {
        if (!url.trim()) return;
        setImporting(true);
        const { data, error } = await supabase.functions.invoke("import-youtube-playlist", {
            body: { url: url.trim() },
        });
        setImporting(false);
        const dataErr = (data as Record<string, unknown>)?.error;
        if (error || dataErr) {
            const errMsg = (dataErr as string) ?? error?.message ?? "Import failed";
            toast.error(errMsg, { description: "Could not create course. Please try again." });
            return;
        }
        toast.success("Course created!", { description: "Your course is ready." });
        setUrl("");
        setPreviewOpen(false);
        setPreview(null);
        if (data?.course_id) navigate(`/courses/${data.course_id}`);
        else load();
    };

    const remove = async (c: Course) => {
        if (!confirm(t("courses.confirmDelete"))) return;
        await supabase.from("courses").delete().eq("id", c.id);
        toast.success("Deleted");
        setMine((prev) => prev.filter((x) => x.id !== c.id));
    };

    const renderPageNumbers = () => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (searchPage > 3) pages.push("...");
            for (
                let i = Math.max(2, searchPage - 1);
                i <= Math.min(totalPages - 1, searchPage + 1);
                i++
            ) {
                pages.push(i);
            }
            if (searchPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const contentLabel =
        contentType === "both"
            ? "Videos & Playlists"
            : contentType === "videos"
              ? "Videos"
              : "Playlists";

    const statusOf = (c: Course): CourseStatus => {
        const total = c.module_count ?? 0;
        const done = c.completed_count ?? 0;
        if (total > 0 && done >= total) return "done";
        return done > 0 ? "progress" : "new";
    };
    const counts = {
        all: mine.length,
        progress: mine.filter((c) => statusOf(c) === "progress").length,
        done: mine.filter((c) => statusOf(c) === "done").length,
        new: mine.filter((c) => statusOf(c) === "new").length,
    };
    const shown = filter === "all" ? mine : mine.filter((c) => statusOf(c) === filter);

    const pasteFromClipboard = async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (text) {
                setUrl(text);
                previewPlaylist(text);
            }
        } catch {
            toast.error("Couldn't read the clipboard", {
                description: "Paste the link into the box instead.",
            });
        }
    };

    return (
        <AppShell>
            <section className="container max-w-6xl space-y-6 py-5 md:py-10">
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-end justify-between gap-4 px-1">
                    <div>
                        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight md:text-4xl">
                            {t("courses.mine")}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {loading
                                ? "Loading your library…"
                                : `${mine.length} course${mine.length !== 1 ? "s" : ""} · ${counts.done} completed`}
                        </p>
                    </div>
                </div>

                {/* ── Add a course ─────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-card sm:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
                    <div className="relative">
                        <div className="mb-4 flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-lime text-primary-foreground shadow-glow">
                                <Plus className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold">Add a course</h2>
                                <p className="text-sm text-muted-foreground">
                                    Turn any YouTube playlist or video into a structured course.
                                </p>
                            </div>
                        </div>

                        <Tabs defaultValue="paste">
                            <TabsList className="mb-4 grid h-11 w-full grid-cols-2 rounded-2xl bg-muted/70 p-1 sm:w-80">
                                <TabsTrigger
                                    value="paste"
                                    className="h-9 gap-1.5 rounded-xl data-[state=active]:shadow-sm"
                                >
                                    <Link2 className="h-4 w-4" /> Paste link
                                </TabsTrigger>
                                <TabsTrigger
                                    value="search"
                                    className="h-9 gap-1.5 rounded-xl data-[state=active]:shadow-sm"
                                >
                                    <Search className="h-4 w-4" /> Search YouTube
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="paste" className="mt-0">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Paste a YouTube video or playlist link"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && previewPlaylist()
                                            }
                                            inputMode="url"
                                            className="h-12 rounded-2xl bg-background pl-11 pr-12"
                                        />
                                        {url ? (
                                            <button
                                                type="button"
                                                aria-label="Clear link"
                                                onClick={() => setUrl("")}
                                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                aria-label="Paste from clipboard"
                                                onClick={pasteFromClipboard}
                                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <ClipboardPaste className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => previewPlaylist()}
                                        disabled={previewing || !url.trim()}
                                        className="h-12 w-full shrink-0 rounded-2xl bg-gradient-lime px-6 font-semibold text-primary-foreground shadow-glow hover:opacity-90 sm:w-auto"
                                    >
                                        {previewing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading…
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Preview
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="search" className="mt-0 space-y-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search YouTube videos & playlists"
                                                value={query}
                                                onChange={(e) => {
                                                    setQuery(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                onBlur={() =>
                                                    setTimeout(() => setShowSuggestions(false), 150)
                                                }
                                                onKeyDown={(e) => {
                                                    const open =
                                                        showSuggestions && suggestions.length > 0;
                                                    if (open && e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                        setActiveSuggestion(
                                                            (i) => (i + 1) % suggestions.length,
                                                        );
                                                    } else if (open && e.key === "ArrowUp") {
                                                        e.preventDefault();
                                                        setActiveSuggestion((i) =>
                                                            i <= 0 ? suggestions.length - 1 : i - 1,
                                                        );
                                                    } else if (e.key === "Enter") {
                                                        setShowSuggestions(false);
                                                        if (open && activeSuggestion >= 0) {
                                                            selectSuggestion(
                                                                suggestions[activeSuggestion],
                                                            );
                                                        } else {
                                                            searchManual();
                                                        }
                                                    } else if (e.key === "Escape" && open) {
                                                        setShowSuggestions(false);
                                                    }
                                                }}
                                                enterKeyHint="search"
                                                className="h-12 rounded-2xl bg-background pl-11"
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover py-1 shadow-elevated">
                                                    {suggestions.map((s, i) => (
                                                        <button
                                                            key={s}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => selectSuggestion(s)}
                                                            onMouseEnter={() =>
                                                                setActiveSuggestion(i)
                                                            }
                                                            className={cn(
                                                                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                                                i === activeSuggestion
                                                                    ? "bg-muted"
                                                                    : "hover:bg-muted",
                                                            )}
                                                        >
                                                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                            <span className="truncate">{s}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={searchManual}
                                            disabled={searching || !query.trim()}
                                            className="h-12 w-full shrink-0 rounded-2xl bg-gradient-lime px-6 font-semibold text-primary-foreground shadow-glow hover:opacity-90 sm:w-auto"
                                        >
                                            {searching ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Searching…
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="mr-2 h-4 w-4" />
                                                    Search
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {(["both", "videos", "playlists"] as ContentType[]).map(
                                            (ct) => (
                                                <Chip
                                                    key={ct}
                                                    active={contentType === ct}
                                                    onClick={() => {
                                                        setContentType(ct);
                                                        if (searched) {
                                                            lastSearchRef.current = null;
                                                            doSearch(query, ct, 1);
                                                        }
                                                    }}
                                                >
                                                    {ct === "both"
                                                        ? "All"
                                                        : ct === "videos"
                                                          ? "Videos"
                                                          : "Playlists"}
                                                </Chip>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {searched && !searching && (
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                            {totalCount.toLocaleString()}
                                        </span>{" "}
                                        result{totalCount !== 1 ? "s" : ""} · {contentLabel}
                                        {query.trim() && <> · “{query.trim()}”</>}
                                    </p>
                                )}

                                {searching && results.length === 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="overflow-hidden rounded-2xl border border-border"
                                            >
                                                <Skeleton className="aspect-video w-full rounded-none" />
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-3 w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div id="search-results" className="scroll-mt-24">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {results.map((r) => {
                                                const itemId =
                                                    r.type === "playlist"
                                                        ? r.playlistId
                                                        : r.videoId;
                                                const isConverting = convertingId === itemId;
                                                return (
                                                    <div
                                                        key={
                                                            r.type === "playlist"
                                                                ? `pl-${r.playlistId}`
                                                                : `vid-${r.videoId}`
                                                        }
                                                        className="group overflow-hidden rounded-2xl border border-border bg-background/60 transition-all duration-200 hover:border-primary/40 hover:shadow-elevated"
                                                    >
                                                        <button
                                                            onClick={() => selectResult(r)}
                                                            disabled={previewing || isConverting}
                                                            className="block w-full text-left disabled:opacity-50"
                                                        >
                                                            <div className="relative aspect-video overflow-hidden bg-muted">
                                                                {r.thumbnail ? (
                                                                    <img
                                                                        src={r.thumbnail}
                                                                        alt=""
                                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                                        loading="lazy"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center">
                                                                        {r.type === "playlist" ? (
                                                                            <ListVideo className="h-8 w-8 text-muted-foreground/40" />
                                                                        ) : (
                                                                            <Play className="h-8 w-8 text-muted-foreground/40" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                                                                    {r.type === "playlist"
                                                                        ? "Playlist"
                                                                        : "Video"}
                                                                </span>
                                                                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
                                                                    {r.type === "playlist" ? (
                                                                        <>
                                                                            <ListVideo className="h-3 w-3" />
                                                                            {r.itemCount} videos
                                                                        </>
                                                                    ) : (
                                                                        fmtDuration(r.duration)
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </button>
                                                        <div className="space-y-2 p-3">
                                                            <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                                                                {r.title}
                                                            </h4>
                                                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                                <span className="truncate">
                                                                    {r.channel}
                                                                </span>
                                                                {r.type === "video" &&
                                                                    r.publishedAt && (
                                                                        <span className="shrink-0">
                                                                            {fmtPublishedDate(
                                                                                r.publishedAt,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                            <div className="flex gap-2 pt-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-9 flex-1 rounded-xl text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        selectResult(r);
                                                                    }}
                                                                    disabled={
                                                                        previewing || isConverting
                                                                    }
                                                                >
                                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                    Preview
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-9 flex-1 rounded-xl bg-gradient-lime text-xs font-semibold text-primary-foreground hover:opacity-90"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        quickConvert(r);
                                                                    }}
                                                                    disabled={
                                                                        importing || isConverting
                                                                    }
                                                                >
                                                                    {isConverting ? (
                                                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                                    )}
                                                                    {isConverting
                                                                        ? "Creating…"
                                                                        : "Create course"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {searched && !searching && results.length === 0 && (
                                    <div className="py-8 text-center">
                                        <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            No results found. Try a different search term.
                                        </p>
                                    </div>
                                )}

                                {searched && totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-border pt-4">
                                        <span className="hidden text-xs text-muted-foreground sm:block">
                                            Showing {(searchPage - 1) * PAGE_SIZE + 1}–
                                            {Math.min(searchPage * PAGE_SIZE, totalCount)} of{" "}
                                            {totalCount}
                                        </span>
                                        <div className="mx-auto flex items-center gap-1 sm:mx-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                aria-label="Previous page"
                                                onClick={() => goToPage(searchPage - 1)}
                                                disabled={searchPage <= 1 || searching}
                                                className="h-9 w-9 rounded-full p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {renderPageNumbers().map((pg, i) =>
                                                pg === "..." ? (
                                                    <span
                                                        key={`ellipsis-${i}`}
                                                        className="px-1 text-xs text-muted-foreground"
                                                    >
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={pg}
                                                        onClick={() => goToPage(pg)}
                                                        disabled={searching}
                                                        aria-current={
                                                            pg === searchPage ? "page" : undefined
                                                        }
                                                        className={cn(
                                                            "h-9 min-w-9 rounded-full px-2 text-sm font-medium tabular-nums transition-colors",
                                                            pg === searchPage
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted",
                                                        )}
                                                    >
                                                        {pg}
                                                    </button>
                                                ),
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                aria-label="Next page"
                                                onClick={() => goToPage(searchPage + 1)}
                                                disabled={searchPage >= totalPages || searching}
                                                className="h-9 w-9 rounded-full p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* ── Library ──────────────────────────────────────────────── */}
                <section>
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <h2 className="text-lg font-semibold tracking-tight">Your library</h2>
                    </div>
                    {!loading && mine.length > 0 && (
                        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
                            {FILTERS.map((f) => (
                                <Chip
                                    key={f.id}
                                    active={filter === f.id}
                                    onClick={() => setFilter(f.id)}
                                >
                                    {f.label}
                                    <span
                                        className={cn(
                                            "ml-1.5 tabular-nums",
                                            filter === f.id
                                                ? "opacity-80"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {counts[f.id]}
                                    </span>
                                </Chip>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex gap-3 overflow-hidden rounded-2xl border border-border p-2.5 sm:block sm:p-0"
                                >
                                    <Skeleton className="aspect-video w-[42%] shrink-0 rounded-xl sm:w-full sm:rounded-none" />
                                    <div className="flex-1 space-y-2 py-1 sm:p-4">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : mine.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BookOpen className="h-7 w-7" />
                            </span>
                            <p className="mt-4 font-display text-xl">No courses yet</p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                Paste a YouTube video or playlist link above to import your first
                                course.
                            </p>
                        </div>
                    ) : shown.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                            No {FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} courses.
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                            {shown.map((c) => (
                                <CourseCard
                                    key={c.id}
                                    c={c}
                                    status={statusOf(c)}
                                    onDelete={() => remove(c)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </section>

            <PlaylistPreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                preview={preview}
                onConfirm={importPlaylist}
                importing={importing}
            />
        </AppShell>
    );
};

type CourseStatus = "progress" | "done" | "new";
type CourseFilter = "all" | CourseStatus;
const FILTERS: { id: CourseFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "progress", label: "In progress" },
    { id: "done", label: "Completed" },
    { id: "new", label: "Not started" },
];

const Chip = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
            "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
            active
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-muted",
        )}
    >
        {children}
    </button>
);

const CourseCard = ({
    c,
    status,
    onDelete,
}: {
    c: Course;
    status: CourseStatus;
    onDelete: () => void;
}) => {
    const total = c.module_count ?? 0;
    const done = c.completed_count ?? 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const action = status === "done" ? "Review" : status === "progress" ? "Continue" : "Start";

    return (
        <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
            <Link
                to={`/courses/${c.id}`}
                className="flex gap-3 p-2.5 active:bg-muted/40 sm:h-full sm:flex-col sm:gap-0 sm:p-0"
            >
                <div className="relative aspect-video w-[42%] shrink-0 overflow-hidden rounded-xl bg-muted sm:w-full sm:rounded-none">
                    {c.thumbnail_url ? (
                        <img
                            src={c.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                    )}
                    {c.thumbnail_url && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white sm:bottom-2 sm:left-2 sm:text-[11px]">
                        <ListVideo className="h-3 w-3" />
                        {total} lesson{total !== 1 ? "s" : ""}
                    </span>
                    {status === "done" && (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground sm:left-2 sm:top-2">
                            <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                    )}
                    <span className="absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                            <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
                        </span>
                    </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col py-0.5 sm:p-4">
                    <h3 className="line-clamp-2 pr-6 text-sm font-semibold leading-snug sm:pr-0">
                        {c.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        {c.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {c.is_public ? "Public" : "Private"}
                    </div>
                    <div className="mt-auto pt-2 sm:pt-3">
                        {total > 0 && (
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-gradient-lime transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                            <span className="tabular-nums text-muted-foreground">
                                {done}/{total} done · {pct}%
                            </span>
                            <span className="inline-flex items-center font-semibold text-primary">
                                {action}
                                <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
            <button
                type="button"
                aria-label={`Delete ${c.title}`}
                onClick={onDelete}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive sm:right-2 sm:top-2 sm:bg-black/55 sm:text-white sm:opacity-0 sm:backdrop-blur sm:hover:bg-destructive sm:hover:text-white sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};

export default Courses;
