import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Clock } from "lucide-react";

interface Video { videoId: string; title: string; thumbnail: string; duration: number; }
interface Preview { playlist: { title: string; description: string; channel: string; thumbnail: string | null }; videos: Video[]; total: number; }

const fmt = (s: number) => { const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, "0")}`; };

export const PlaylistPreview = ({ open, onClose, preview, onConfirm, importing }: {
  open: boolean; onClose: () => void; preview: Preview | null; onConfirm: () => void; importing: boolean;
}) => {
  if (!preview) return null;
  const totalSecs = preview.videos.reduce((s, v) => s + v.duration, 0);
  const hours = Math.floor(totalSecs / 3600), mins = Math.round((totalSecs % 3600) / 60);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Playlist preview</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 py-2 border-b border-border">
          {preview.playlist.thumbnail && <img src={preview.playlist.thumbnail} alt="" className="w-32 aspect-video object-cover rounded-lg border border-border" />}
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg leading-tight">{preview.playlist.title}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">{preview.playlist.channel}</div>
            <div className="flex gap-3 text-xs font-mono text-muted-foreground mt-2">
              <span>{preview.total} videos</span>
              <span><Clock className="inline h-3 w-3 mr-0.5" />{hours ? `${hours}h ` : ""}{mins}m</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 space-y-1.5 -mx-6 px-6">
          {preview.videos.map((v, i) => (
            <div key={v.videoId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}</span>
              <img src={v.thumbnail} alt="" className="w-20 aspect-video object-cover rounded border border-border" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight line-clamp-2">{v.title}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{fmt(v.duration)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={importing} className="bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow">
            {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating</> : <><Plus className="h-4 w-4 mr-2" />Create course</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};