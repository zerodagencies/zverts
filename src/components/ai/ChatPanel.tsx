import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Send, Sparkles, Square, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/app/ai/MessageContent";
import { ModelSelector } from "@/components/app/ai/ModelSelector";
import { ModeSelector, type StudyMode } from "./ModeSelector";
import type { ChatModelId, Msg } from "@/components/app/ai/types";
import type { ActiveSource } from "./SourcesPanel";
import type { UsageState } from "@/hooks/useAIUsage";
import { useAttachments } from "./useAttachments";


type Props = {
  userId: string;
  source: ActiveSource;
  onUsageUpdate: (u: UsageState) => void;
  externalPrompt?: string | null;
  onExternalConsumed?: () => void;
};

const STORAGE_KEY = (uid: string, sourceId: string) => `zverts.ai.workspace.${uid}.${sourceId}`;

export const ChatPanel = ({ userId, source, onUsageUpdate, externalPrompt, onExternalConsumed }: Props) => {
  const sourceKey = source?.moduleId ?? "general";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState<ChatModelId>("smart");
  const [mode, setMode] = useState<StudyMode>("study_buddy");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPaid, setIsPaid] = useState(false);
  const attachments = useAttachments(userId, isPaid);

  // Load paid status (controls upload gate)
  useEffect(() => {
    let cancelled = false;
    supabase.from("profiles").select("is_paid_user").eq("id", userId).maybeSingle().then(({ data }) => {
      if (!cancelled) setIsPaid(!!data?.is_paid_user);
    });
    return () => { cancelled = true; };
  }, [userId]);


  // Load thread for active source
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId, sourceKey));
      setMessages(raw ? JSON.parse(raw) : []);
    } catch { setMessages([]); }
  }, [userId, sourceKey]);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(userId, sourceKey), JSON.stringify(messages)); } catch { /* noop */ }
  }, [messages, userId, sourceKey]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  // Auto-focus on mount and after replies
  useEffect(() => { if (!busy) textareaRef.current?.focus(); }, [busy, sourceKey]);

  const send = useCallback(async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || busy) return;
    if (attachments.items.some((a) => a.uploading)) {
      toast.error("Wait for attachments to finish uploading.");
      return;
    }
    setInput("");
    const attachmentSnapshot = attachments.items.map((a) => ({ path: a.path, mime: a.mime, name: a.name }));
    const userContent = attachmentSnapshot.length
      ? `${text}\n\n_📎 ${attachmentSnapshot.map((a) => a.name).join(", ")}_`
      : text;
    const next: Msg[] = [...messages, { role: "user", content: userContent }, { role: "assistant", content: "" }];
    setMessages(next);
    setBusy(true);
    attachments.clear();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-tutor`;
      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          module_id: source?.moduleId ?? null,
          messages: [...messages, { role: "user", content: text }],
          language: lang,
          mode,
          model,
          attachments: attachmentSnapshot,
        }),
      });


      // Pick up updated usage from header
      const usageHdr = res.headers.get("X-AI-Usage");
      if (usageHdr) {
        try {
          const parsed = JSON.parse(usageHdr);
          if (parsed && typeof parsed.count === "number") onUsageUpdate(parsed as UsageState);
        } catch { /* noop */ }
      }

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "limit_reached") {
          toast.error("Daily limit reached", { description: body.message ?? "Upgrade for unlimited AI." });
        } else {
          toast.error("Rate limited — try again shortly.");
        }
        setMessages((m) => m.slice(0, -1));
        return;
      }
      if (res.status === 402) {
        toast.error("AI credits exhausted. Please contact admin.");
        setMessages((m) => m.slice(0, -1));
        return;
      }
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              acc += delta;
              setMessages((m) => {
                const copy = m.slice();
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* skip non-JSON keepalive */ }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // user stopped
      } else {
        toast.error(e?.message ?? "Something went wrong");
        setMessages((m) => m.slice(0, -1));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, messages, busy, source, lang, mode, model, onUsageUpdate, attachments]);

  // Allow external (transcript click) prompts
  useEffect(() => {
    if (externalPrompt) {
      send(externalPrompt);
      onExternalConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  const stop = () => abortRef.current?.abort();

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = source
    ? [
        `Summarize "${source.moduleTitle}" in 5 bullets`,
        `Generate 5 MCQs from this module`,
        `Explain the hardest concept simply`,
      ]
    : [
        "What should I revise today?",
        "Quiz me on my weakest topic",
        "Plan my study for the next 3 days",
      ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl">Hi, I'm Vert.</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                {source
                  ? <>Grounded in <span className="text-foreground font-medium">{source.moduleTitle}</span>. Ask me anything.</>
                  : "Pick a module from the left to ground my answers, or ask a general study question."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border/60 bg-card/60 hover:bg-muted/60 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "")}>
                  {m.role === "assistant" && (
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/15 text-primary grid place-items-center text-xs font-mono font-semibold mt-0.5">V</div>
                  )}
                  <div className={cn(
                    "max-w-[85%] text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-2xl bg-primary text-primary-foreground px-4 py-2.5"
                      : "text-foreground/95"
                  )}>
                    {m.role === "user" ? m.content : (
                      m.content ? <MessageContent content={m.content} /> : <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {attachments.items.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.items.map((a) => (
                <div key={a.id} className="group relative flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-2 py-1.5 pr-7 text-xs">
                  {a.previewUrl ? (
                    <img src={a.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : a.mime === "application/pdf" ? (
                    <div className="h-8 w-8 rounded bg-rose-500/15 text-rose-500 grid place-items-center"><FileText className="h-4 w-4" /></div>
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted grid place-items-center"><ImageIcon className="h-4 w-4" /></div>
                  )}
                  <div className="max-w-[160px] truncate">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {a.uploading ? "Uploading…" : `${(a.size / 1024).toFixed(0)} KB`}
                    </div>
                  </div>
                  <button
                    onClick={() => attachments.remove(a.id)}
                    aria-label="Remove attachment"
                    className="absolute right-1 top-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card/60 px-2 py-2 focus-within:border-primary/60 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) attachments.addFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (!isPaid) {
                  toast.error("File uploads are for paid users only.", { description: "Upgrade to attach PDFs or images." });
                  return;
                }
                fileInputRef.current?.click();
              }}
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              aria-label="Attach file"
              title={isPaid ? "Attach PDF or image (max 10MB, 5 files)" : "Paid users only"}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder={source ? `Ask about "${source.moduleTitle}"…` : "Ask Vert anything…"}
              className="flex-1 min-h-[36px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-1.5 text-sm shadow-none"
            />
            {busy ? (
              <Button onClick={stop} size="icon" variant="ghost" className="h-9 w-9 shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => send()} disabled={!input.trim() || attachments.items.some((a) => a.uploading)} size="icon" className="h-9 w-9 shrink-0 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <ModeSelector value={mode} onChange={setMode} />
              <ModelSelector value={model} onChange={setModel} />
              <button
                onClick={() => setLang((l) => (l === "en" ? "bn" : "en"))}
                className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                {lang === "en" ? "EN" : "বাং"}
              </button>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
