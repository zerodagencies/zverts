import { useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";

const BroadcastInner = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState<"normal" | "high" | "critical">("high");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and message required"); return; }
    if (!confirm(`Send "${title}" to ALL users?`)) return;
    setSending(true);
    const { data, error } = await supabase.rpc("admin_broadcast_notification" as any, {
      _title: title, _body: body,
      _deep_link: link.trim() || null,
      _priority: priority,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Sent to ${(data as any)?.count ?? 0} users 📢`);
    setTitle(""); setBody(""); setLink("");
  };

  return (
    <AppShell>
      <section className="container py-10 max-w-2xl">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ admin · broadcast</div>
        <h1 className="font-display text-4xl font-semibold mt-2 flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" /> Broadcast notification
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Sends an in-app notification to every user instantly. If they've allowed browser notifications, Chrome will pop it up with a sound — even when the tab is in the background.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="🎉 New feature live!" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4} placeholder="Tell users what's new…" className="mt-1.5" />
            <div className="text-[10px] font-mono text-muted-foreground mt-1">{body.length}/500</div>
          </div>
          <div>
            <Label htmlFor="link">Deep link (optional)</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard or /buy" className="mt-1.5 font-mono" />
          </div>
          <div>
            <Label>Priority</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {(["normal", "high", "critical"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${priority === p ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              "critical" bypasses user mute / quiet-hours settings.
            </p>
          </div>
          <Button onClick={send} disabled={sending} className="w-full bg-gradient-lime text-primary-foreground shadow-glow">
            {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "📢 Send to all users"}
          </Button>
        </div>
      </section>
    </AppShell>
  );
};

const Broadcast = () => <RequireRole role="admin"><BroadcastInner /></RequireRole>;
export default Broadcast;
