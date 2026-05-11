import { useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Send, Loader2, X, Languages, FileText, ListChecks, Bot, WandSparkles,
  Minus, Maximize2, Minimize2, Menu, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MessageContent } from "./ai/MessageContent";
import { ModelSelector } from "./ai/ModelSelector";
import { ChatHistorySidebar } from "./ai/ChatHistorySidebar";
import { useChatStore } from "./ai/useChatStore";
import { exportAsTxt, exportAsMarkdown, exportAsPdf } from "./ai/exportChat";
import type { Msg, ChatModelId } from "./ai/types";
import { MODELS } from "./ai/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const AITutorPanel = ({ moduleId }: { moduleId: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const store = useChatStore(user?.id ?? null, moduleId);
  const active = store.active;
  const messages = active?.messages ?? [];
  const lang = active?.language ?? "en";
  const model: ChatModelId = active?.model ?? "smart";

  // Auto-create the first chat once user is loaded and there are none
  useEffect(() => {
    if (user && store.chats.length === 0 && open) {
      store.newChat("smart", "en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Reset per-chat feedback on switch
  useEffect(() => { setFeedback({}); }, [store.activeId]);

  const ensureChat = (): string => {
    if (store.activeId) return store.activeId;
    return store.newChat("smart", "en");
  };

  const updateLang = (l: "en" | "bn") => {
    if (active) store.updateChat(active.id, { language: l });
  };
  const updateModel = (m: ChatModelId) => {
    if (active) store.updateChat(active.id, { model: m });
  };

  const send = async (override?: { text: string; mode?: "chat" | "summary" | "mcq" }) => {
    const text = override?.text ?? input.trim();
    if (!text || busy) return;
    const id = ensureChat();
    const mode = override?.mode ?? "chat";
    const userMsg: Msg = { role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    store.setMessages(id, next);
    setInput("");
    setBusy(true);

    let acc = "";
    let assistantStarted = false;
    const upsert = (chunk: string) => {
      acc += chunk;
      const list: Msg[] = assistantStarted
        ? next.concat({ role: "assistant", content: acc })
        : (assistantStarted = true, next.concat({ role: "assistant", content: acc }));
      store.setMessages(id, list);
    };

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ module_id: moduleId, messages: next, language: lang, mode, model }),
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
    const text = mode === "summary"
      ? "Summarize the key points of this lesson."
      : "Generate 5 MCQs to test my understanding.";
    send({ text, mode });
  };

  const copyMsg = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const exportChat = (kind: "txt" | "md" | "pdf") => {
    if (!active) return;
    if (kind === "txt") exportAsTxt(active);
    if (kind === "md") exportAsMarkdown(active);
    if (kind === "pdf") exportAsPdf(active);
  };

  const currentModelLabel = MODELS.find((m) => m.id === model)?.label ?? "ZverT Smart";

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
        aria-label="Open Vert AI"
      >
        <Sparkles className="h-4 w-4" />
        Chat with Vert
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-300",
          maximized
            ? "inset-2 md:inset-6"
            : "inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 md:w-[460px] md:h-[680px]",
          open ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none md:translate-y-4"
        )}
      >
        <div className={cn(
          "h-[88vh] md:h-full flex rounded-t-2xl md:rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden",
          maximized && "h-full"
        )}>
          {/* History sidebar (desktop persistent when maximized, drawer otherwise) */}
          <div className={cn(
            "hidden",
            maximized && "md:block",
          )}>
            <ChatHistorySidebar
              chats={store.chats}
              activeId={store.activeId}
              onSelect={store.setActiveId}
              onNew={() => store.newChat(model, lang)}
              onPin={store.togglePin}
              onDelete={store.deleteChat}
              onRename={store.renameChat}
            />
          </div>

          {/* Mobile / drawer sidebar */}
          {showSidebar && (
            <div className={cn("absolute inset-0 z-10 flex", maximized ? "md:hidden" : "")}>
              <ChatHistorySidebar
                chats={store.chats}
                activeId={store.activeId}
                onSelect={(id) => { store.setActiveId(id); setShowSidebar(false); }}
                onNew={() => { store.newChat(model, lang); setShowSidebar(false); }}
                onPin={store.togglePin}
                onDelete={store.deleteChat}
                onRename={store.renameChat}
                onClose={() => setShowSidebar(false)}
              />
              <div className="flex-1 bg-background/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", maximized && "md:hidden")} onClick={() => setShowSidebar(true)} title="Chat history">
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-lime grid place-items-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold leading-tight truncate">Vert</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" /> online · {currentModelLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ModelSelector value={model} onChange={updateModel} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateLang(lang === "en" ? "bn" : "en")} title="Toggle language">
                  <Languages className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" onClick={() => setMaximized((m) => !m)} title={maximized ? "Restore" : "Maximize"}>
                  {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} title="Minimize">
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setOpen(false); setMaximized(false); }} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-4">
                  <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-lime/20 grid place-items-center">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-base">Ask Vert anything about this lesson</div>
                    <div className="text-xs text-muted-foreground mt-1">Math, code, summaries, MCQs — beautifully formatted.</div>
                  </div>
                  <div className="flex flex-col gap-2 px-4 max-w-sm mx-auto">
                    <Button size="sm" variant="outline" onClick={() => quick("summary")} className="justify-start">
                      <FileText className="h-3.5 w-3.5 mr-2" /> Summarize this lesson
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quick("mcq")} className="justify-start">
                      <ListChecks className="h-3.5 w-3.5 mr-2" /> Quiz me with 5 MCQs
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => send({ text: "Explain this lesson with key ideas, an example, and what to study next.", mode: "chat" })} className="justify-start">
                      <WandSparkles className="h-3.5 w-3.5 mr-2" /> Explain in real format
                    </Button>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-1.5", m.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/70 text-foreground rounded-bl-sm border border-border/40"
                  )}>
                    {m.role === "assistant" ? (
                      <MessageContent content={m.content || "…"} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                  </div>
                  {m.role === "assistant" && m.content && !(busy && i === messages.length - 1) && (
                    <div className="flex items-center gap-0.5 px-1 text-muted-foreground">
                      <button onClick={() => copyMsg(m.content)} className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition" title="Copy">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setFeedback((f) => ({ ...f, [i]: f[i] === "up" ? undefined as any : "up" }))} className={cn("p-1.5 rounded-md hover:bg-muted hover:text-foreground transition", feedback[i] === "up" && "text-primary bg-muted")} title="Like">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setFeedback((f) => ({ ...f, [i]: f[i] === "down" ? undefined as any : "down" }))} className={cn("p-1.5 rounded-md hover:bg-muted hover:text-foreground transition", feedback[i] === "down" && "text-destructive bg-muted")} title="Dislike">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition" title="More">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => exportChat("txt")}><Download className="h-3.5 w-3.5 mr-2" /> Export as TXT</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportChat("md")}><Download className="h-3.5 w-3.5 mr-2" /> Export as Markdown</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportChat("pdf")}><Download className="h-3.5 w-3.5 mr-2" /> Export as PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyMsg(m.content)}><Copy className="h-3.5 w-3.5 mr-2" /> Copy message</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}

              {busy && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted/70 border border-border/40 rounded-2xl rounded-bl-sm px-3.5 py-3 text-sm">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </div>
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
                  placeholder="Ask Vert about this lesson… (Shift+Enter for newline)"
                  className="resize-none min-h-[44px] max-h-32 text-sm"
                  rows={1}
                />
                <Button size="icon" onClick={() => send()} disabled={busy || !input.trim()} className="h-11 w-11 shrink-0 bg-gradient-lime text-primary-foreground hover:opacity-90">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-1.5 text-[10px] text-muted-foreground text-center">
                Vert can make mistakes. Verify important info.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};