import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
    Loader2,
    Eye,
    Trash2,
    BookOpen,
    Globe,
    Lock,
    Search,
    ListVideo,
    Play,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { PlaylistPreview } from "@/components/app/PlaylistPreview";

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

const fmt = (s: number) => {
    const m = Math.floor(s / 60),
        sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
};

const PAGE_SIZE = 12;

const Courses = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [url, setUrl] = useState("");
    const [importing, setImporting] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
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

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSearchRef = useRef<string | null>(null);

    const doSearch = useCallback(
        async (q: string, ct: ContentType, pg: number) => {
            const trimmed = q.trim();
            if (!trimmed) return;

            const key = `${trimmed}|${ct}|${pg}`;
            if (lastSearchRef.current === key) return;
            lastSearchRef.current = key;

            setSearching(true);
            const { data, error } = await supabase.functions.invoke("search-youtube-playlists", {
                body: { query: trimmed, contentType: ct, page: pg, pageSize: PAGE_SIZE },
            });
            setSearching(false);
            setSearched(true);

            const dataErr = (data as Record<string, unknown>)?.error;
            if (error || dataErr) {
                toast.error((dataErr as string) ?? error?.message ?? "Search failed");
                return;
            }

            const resp = data as SearchResponse;
            setResults(resp.results ?? []);
            setTotalCount(resp.totalCount ?? 0);
            setTotalPages(resp.totalPages ?? 0);
            setSearchPage(resp.page ?? pg);
        },
        [],
    );

    useEffect(() => {
        if (!searched) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            doSearch(query, contentType, searchPage);
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, contentType]); // eslint-disable-line

    const searchManual = useCallback(() => {
        lastSearchRef.current = null;
        doSearch(query, contentType, 1);
    }, [query, contentType, doSearch]);

    const goToPage = useCallback(
        (pg: number) => {
            if (pg < 1 || pg > totalPages || pg === searchPage) return;
            lastSearchRef.current = null;
            doSearch(query, contentType, pg);
            document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        const { data: courses } = await supabase
            .from("courses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (!courses?.length) {
            setMine([]);
            setLoading(false);
            return;
        }

        const ids = courses.map((c) => c.id);
        const { data: modsData } = await supabase
            .from("modules")
            .select("id,course_id")
            .in("course_id", ids);
        const mods = modsData ?? [];
        const modIds = mods.map((m) => m.id);
        const { data: prog } = modIds.length
            ? await supabase
                  .from("module_progress")
                  .select("module_id,completed")
                  .eq("user_id", user.id)
                  .in("module_id", modIds)
            : { data: [] as { module_id: string; completed: boolean }[] };

        const modsByCourse = new Map<string, string[]>();
        (mods ?? []).forEach((m) => {
            const arr = modsByCourse.get(m.course_id) ?? [];
            arr.push(m.id);
            modsByCourse.set(m.course_id, arr);
        });
        const completedSet = new Set(
            (prog ?? []).filter((p) => p.completed).map((p) => p.module_id),
        );

        setMine(
            courses.map((c) => ({
                ...c,
                module_count: modsByCourse.get(c.id)?.length ?? 0,
                completed_count: (modsByCourse.get(c.id) ?? []).filter((mid) =>
                    completedSet.has(mid),
                ).length,
            })),
        );
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
            toast.error((dataErr as string) ?? error?.message ?? "Preview failed");
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

    const importPlaylist = async () => {
        if (!url.trim()) return;
        setImporting(true);
        const { data, error } = await supabase.functions.invoke("import-youtube-playlist", {
            body: { url: url.trim() },
        });
        setImporting(false);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success("Course created!");
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

    const contentLabel = contentType === "both" ? "Videos & Playlists" : contentType === "videos" ? "Videos" : "Playlists";

    return (
        <AppShell>
            <section className="container py-8 md:py-12 max-w-6xl">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            / {t("nav.courses")}
                        </div>
                        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mt-1">
                            {t("courses.mine")}
                        </h1>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                        {loading ? "…" : `${mine.length} course${mine.length !== 1 ? "s" : ""}`}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 mb-8">
                    <Tabs defaultValue="paste">
                        <TabsList className="mb-3">
                            <TabsTrigger value="paste">Paste URL</TabsTrigger>
                            <TabsTrigger value="search">Search</TabsTrigger>
                        </TabsList>

                        <TabsContent value="paste" className="mt-0">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    placeholder="Paste a YouTube video or playlist URL…"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && previewPlaylist()}
                                    className="flex-1 bg-background"
                                />
                                <Button
                                    onClick={() => previewPlaylist()}
                                    disabled={previewing || !url.trim()}
                                    className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow shrink-0 w-full sm:w-auto"
                                >
                                    {previewing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading…
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="search" className="mt-0 space-y-3">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Search YouTube videos & playlists…"
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
                                                    setActiveSuggestion((i) =>
                                                        (i + 1) % suggestions.length,
                                                    );
                                                } else if (open && e.key === "ArrowUp") {
                                                    e.preventDefault();
                                                    setActiveSuggestion((i) =>
                                                        i <= 0 ? suggestions.length - 1 : i - 1,
                                                    );
                                                } else if (e.key === "Enter") {
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
                                            className="bg-background"
                                        />
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-elevated overflow-hidden">
                                                {suggestions.map((s, i) => (
                                                    <button
                                                        key={s}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => selectSuggestion(s)}
                                                        onMouseEnter={() => setActiveSuggestion(i)}
                                                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors ${
                                                            i === activeSuggestion
                                                                ? "bg-muted"
                                                                : "hover:bg-muted"
                                                        }`}
                                                    >
                                                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={searchManual}
                                        disabled={searching || !query.trim()}
                                        className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow shrink-0 w-full sm:w-auto"
                                    >
                                        {searching ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Searching…
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-2" />
                                                Search
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        Content:
                                    </span>
                                    {(["both", "videos", "playlists"] as ContentType[]).map((ct) => (
                                        <button
                                            key={ct}
                                            onClick={() => {
                                                setContentType(ct);
                                                if (searched) {
                                                    lastSearchRef.current = null;
                                                    doSearch(query, ct, 1);
                                                }
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-200 ${
                                                contentType === ct
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                        >
                                            {ct === "both" ? "Both" : ct === "videos" ? "Videos" : "Playlists"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {searched && !searching && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                                    <span>{totalCount} Result{totalCount !== 1 ? "s" : ""} Found</span>
                                    <span>Filter: {contentLabel}</span>
                                    {query.trim() && (
                                        <span>
                                            Search: "<span className="text-foreground">{query.trim()}</span>"
                                        </span>
                                    )}
                                </div>
                            )}

                            {searching && results.length === 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl border border-border overflow-hidden"
                                        >
                                            <Skeleton className="aspect-video w-full" />
                                            <div className="p-3 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div id="search-results">
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {results.map((r) => (
                                            <button
                                                key={
                                                    r.type === "playlist"
                                                        ? `pl-${r.playlistId}`
                                                        : `vid-${r.videoId}`
                                                }
                                                onClick={() => selectResult(r)}
                                                disabled={previewing}
                                                className="text-left rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 hover:shadow-elevated transition-all duration-200 disabled:opacity-50"
                                            >
                                                <div className="relative aspect-video bg-muted overflow-hidden">
                                                    {r.thumbnail ? (
                                                        <img
                                                            src={r.thumbnail}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {r.type === "playlist" ? (
                                                                <ListVideo className="h-8 w-8 text-muted-foreground/40" />
                                                            ) : (
                                                                <Play className="h-8 w-8 text-muted-foreground/40" />
                                                            )}
                                                        </div>
                                                    )}
                                                    {r.type === "video" && (
                                                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                                                            {fmt(r.duration)}
                                                        </div>
                                                    )}
                                                    {r.type === "playlist" && (
                                                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                                                            {r.itemCount} videos
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    <h4 className="font-medium text-sm leading-tight line-clamp-2">
                                                        {r.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                        {r.type === "playlist" ? (
                                                            <ListVideo className="h-3 w-3 shrink-0" />
                                                        ) : (
                                                            <Play className="h-3 w-3 shrink-0" />
                                                        )}
                                                        <span className="truncate">{r.channel}</span>
                                                        <span className="shrink-0 ml-auto">
                                                            {r.type === "playlist"
                                                                ? "Playlist"
                                                                : "Video"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searched && !searching && results.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No results found. Try a different search term.
                                </p>
                            )}

                            {searched && totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                                        Showing {(searchPage - 1) * PAGE_SIZE + 1}–
                                        {Math.min(searchPage * PAGE_SIZE, totalCount)} of {totalCount}
                                    </span>
                                    <div className="flex items-center gap-1 mx-auto sm:mx-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(searchPage - 1)}
                                            disabled={searchPage <= 1 || searching}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {renderPageNumbers().map((pg, i) =>
                                            pg === "..." ? (
                                                <span
                                                    key={`ellipsis-${i}`}
                                                    className="px-1 text-muted-foreground text-xs"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <Button
                                                    key={pg}
                                                    variant={pg === searchPage ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => goToPage(pg)}
                                                    disabled={searching}
                                                    className={`h-8 min-w-[2rem] px-2 text-xs font-mono ${
                                                        pg === searchPage
                                                            ? "bg-primary text-primary-foreground"
                                                            : ""
                                                    }`}
                                                >
                                                    {pg}
                                                </Button>
                                            ),
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(searchPage + 1)}
                                            disabled={searchPage >= totalPages || searching}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-border overflow-hidden"
                            >
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mine.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center space-y-3">
                        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="font-display text-xl">No courses yet</p>
                        <p className="text-sm text-muted-foreground">
                            Paste a YouTube video or playlist URL above to import your first course.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {mine.map((c) => (
                            <CourseCard key={c.id} c={c} onDelete={() => remove(c)} />
                        ))}
                    </div>
                )}
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

const CourseCard = ({ c, onDelete }: { c: Course; onDelete: () => void }) => {
    const pct = c.module_count
        ? Math.round(((c.completed_count ?? 0) / c.module_count) * 100)
        : 0;
    const allDone = c.module_count > 0 && pct === 100;

    return (
        <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-elevated transition-all duration-200">
            <Link to={`/courses/${c.id}`} className="block">
                <div className="relative aspect-video bg-muted overflow-hidden">
                    {c.thumbnail_url ? (
                        <img
                            src={c.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                    )}
                    {allDone && (
                        <div className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground text-[10px] font-mono uppercase px-2 py-0.5">
                            Done
                        </div>
                    )}
                </div>
                <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">{c.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>
                            {c.module_count} lesson{c.module_count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                            {c.is_public ? (
                                <Globe className="h-3 w-3" />
                            ) : (
                                <Lock className="h-3 w-3" />
                            )}
                            {c.is_public ? "Public" : "Private"}
                        </span>
                    </div>
                    {(c.module_count ?? 0) > 0 && (
                        <div className="space-y-1">
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-lime transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                                {c.completed_count}/{c.module_count} completed
                            </p>
                        </div>
                    )}
                </div>
            </Link>
            <div className="px-3 pb-3 flex justify-end">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default Courses;
