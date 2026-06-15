import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

interface Props {
    videoId: string;
    onProgress: (currentSeconds: number) => void;
    onEnded?: () => void;
}

export type YouTubePlayerHandle = {
    getCurrentTime: () => number;
    seekTo: (seconds: number) => void;
};

let ytApiPromise: Promise<void> | null = null;
const loadYT = () => {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
        if (window.YT?.Player) return resolve();
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => resolve();
    });
    return ytApiPromise;
};

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(
    ({ videoId, onProgress, onEnded }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const playerRef = useRef<any>(null);
        const intervalRef = useRef<number | null>(null);

        useImperativeHandle(
            ref,
            () => ({
                getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
                seekTo: (s: number) => {
                    try {
                        playerRef.current?.seekTo?.(s, true);
                        playerRef.current?.playVideo?.();
                    } catch {}
                },
            }),
            [],
        );

        const handleKeyDown = useCallback((e: KeyboardEvent) => {
            if (!playerRef.current) return;
            const tag = (e.target as HTMLElement).tagName.toLowerCase();
            if (tag === "input" || tag === "textarea" || (e.target as HTMLElement).isContentEditable) return;

            switch (e.key) {
                case " ":
                case "k":
                case "K": {
                    e.preventDefault();
                    const state = playerRef.current.getPlayerState?.();
                    if (state === 1) playerRef.current.pauseVideo?.();
                    else playerRef.current.playVideo?.();
                    break;
                }
                case "ArrowLeft":
                    e.preventDefault();
                    playerRef.current.seekTo?.(Math.max(0, (playerRef.current.getCurrentTime?.() ?? 0) - 5), true);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    playerRef.current.seekTo?.((playerRef.current.getCurrentTime?.() ?? 0) + 5, true);
                    break;
                case "m":
                case "M":
                    e.preventDefault();
                    if (playerRef.current.isMuted?.()) playerRef.current.unMute?.();
                    else playerRef.current.mute?.();
                    break;
            }
        }, []);

        useEffect(() => {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }, [handleKeyDown]);

        useEffect(() => {
            let cancelled = false;
            loadYT().then(() => {
                if (cancelled || !containerRef.current) return;
                playerRef.current = new window.YT.Player(containerRef.current, {
                    videoId,
                    playerVars: {
                        rel: 0, // no related-videos from other channels
                        modestbranding: 1, // minimal YouTube branding
                        playsinline: 1,
                        iv_load_policy: 3, // hide video annotations
                        cc_load_policy: 0,
                        fs: 1,
                        origin: window.location.origin,
                        enablejsapi: 1,
                    },
                    events: {
                        onStateChange: (e: any) => {
                            // 1 = playing, 2 = paused, 0 = ended
                            if (e.data === 1) {
                                if (intervalRef.current) window.clearInterval(intervalRef.current);
                                intervalRef.current = window.setInterval(() => {
                                    const t = playerRef.current?.getCurrentTime?.();
                                    if (typeof t === "number") onProgress(Math.floor(t));
                                }, 5000);
                            } else {
                                if (intervalRef.current) {
                                    window.clearInterval(intervalRef.current);
                                    intervalRef.current = null;
                                }
                                if (e.data === 2) {
                                    const t = playerRef.current?.getCurrentTime?.();
                                    if (typeof t === "number") onProgress(Math.floor(t));
                                }
                                if (e.data === 0) {
                                    const t = playerRef.current?.getCurrentTime?.();
                                    if (typeof t === "number") onProgress(Math.floor(t));
                                    onEnded?.();
                                }
                            }
                        },
                    },
                });
            });
            return () => {
                cancelled = true;
                if (intervalRef.current) window.clearInterval(intervalRef.current);
                try {
                    playerRef.current?.destroy?.();
                } catch {}
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [videoId]);

        return (
            <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-elevated">
                <div ref={containerRef} className="w-full h-full" />
            </div>
        );
    },
);
YouTubePlayer.displayName = "YouTubePlayer";
