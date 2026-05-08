import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, X, Languages, FileText, ListChecks, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export const AITutorPanel = ({ moduleId }: { moduleId: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (override?: { text: string; mode?: "chat" | "summary" | "mcq" }) => {
    const text = override?.text ?? input.trim();
    if (!text || busy) return;
    const mode = override?.mode ?? "chat";
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
        return [...prev, { role: "assistant", content: acc }];
      });
    };
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ module_id: moduleId, messages: next, language: lang, mode }),
      });
      if (resp.status === 429) { toast.error("Rate limit — wait a moment"); setBusy(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted"); setBusy(false); return; }
      if (!resp.ok || !resp.body) { toast.error("AI unavailable"); setBusy(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim();
          if (js === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(js);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Stream error");
    } finally {
      setBusy(false);
    }
  };

  const quick = (mode: "summary" | "mcq") => {
    const text = mode === "summary" ? "Summarize the key points of this lesson." : "Generate 5 MCQs to test my understanding.";
    send({ text, mode });
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 font-medium text-primary-foreground shadow-glow",
          "bg-gradient-lime hover:scale-105 transition-transform",
          open && "hidden"
        )}
        aria-label="Open AI Tutor"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[640px] z-50",
          "transition-all duration-300",
          open ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none md:translate-y-4"
        )}
      >
        <div className="h-[88vh] md:h-full flex flex-col rounded-t-2xl md:rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-lime flex items-center justify-center"><Bot className="h-4 w-4 text-primary-foreground" /></div>
              <div>
                <div className="font-display text-sm font-semibold">AI Study Tutor</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{lang === "bn" ? "বাংলা" : "english"}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLang(lang === "en" ? "bn" : "en")} title="Toggle language">
                <Languages className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-lime/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="font-display text-base">Ask me anything about this lesson</div>
                  <div className="text-xs text-muted-foreground mt-1">Explain concepts, summarize, quiz yourself</div>
                </div>
                <div className="flex flex-col gap-2 px-4">
                  <Button size="sm" variant="outline" onClick={() => quick("summary")} className="justify-start">
                    <FileText className="h-3.5 w-3.5 mr-2" /> Summarize this lesson
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quick("mcq")} className="justify-start">
                    <ListChecks className="h-3.5 w-3.5 mr-2" /> Quiz me with 5 MCQs
                  </Button>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2.5 text-sm rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/60 p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask about this lesson…"
                className="resize-none min-h-[44px] max-h-32"
                rows={1}
              />
              <Button size="icon" onClick={() => send()} disabled={busy || !input.trim()} className="h-11 w-11 shrink-0 bg-gradient-lime text-primary-foreground hover:opacity-90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};