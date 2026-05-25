import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
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

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(({ videoId, onProgress, onEnded }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    seekTo: (s: number) => { try { playerRef.current?.seekTo?.(s, true); playerRef.current?.playVideo?.(); } catch {} },
  }), []);

  useEffect(() => {
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
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
      try { playerRef.current?.destroy?.(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-elevated">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});
YouTubePlayer.displayName = "YouTubePlayer";
