import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, X as XIcon, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MCQ { id: string; question: string; options: string[]; correct_index: number; module_id: string; }

export const DailyChallenge = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase.from("daily_challenges").select("*").eq("user_id", userId).eq("date", today).maybeSingle();
      if (existing) {
        setDone({ score: existing.score, total: existing.total, passed: existing.passed });
        setLoading(false);
        return;
      }
      const { data: completed } = await supabase.from("module_progress").select("module_id").eq("user_id", userId).eq("completed", true);
      const moduleIds = (completed ?? []).map((c: any) => c.module_id);
      let q: any[] = [];
      if (moduleIds.length > 0) {
        const { data } = await supabase.from("mcq_questions").select("*").in("module_id", moduleIds).limit(20);
        q = data ?? [];
      }
      if (q.length === 0) {
        const { data } = await supabase.from("mcq_questions").select("*").limit(20);
        q = data ?? [];
      }
      const shuffled = q.sort(() => Math.random() - 0.5).slice(0, 3).map((m: any) => ({ ...m, options: Array.isArray(m.options) ? m.options : JSON.parse(m.options) }));
      setQuestions(shuffled);
      setLoading(false);
    })();
  }, [userId]);

  const submit = async () => {
    if (Object.keys(answers).length !== questions.length) { toast.error("Answer all questions"); return; }
    setSubmitting(true);
    let score = 0;
    const res: Record<string, boolean> = {};
    questions.forEach(q => {
      const ok = answers[q.id] === q.correct_index;
      res[q.id] = ok;
      if (ok) score++;
    });
    setResults(res);
    const { data, error } = await supabase.rpc("submit_daily_challenge", {
      _module_id: questions[0]?.module_id, _score: score, _total: questions.length,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const r = data as any;
    setDone({ score: r.score, total: r.total, passed: r.passed });
    if (r.passed) toast.success("Daily challenge passed! +75 XP, +2 gems 🎉");
    else toast.message("Try again tomorrow!");
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg">Daily Challenge</h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">+75 XP · +2 gems</span>
      </div>

      {done ? (
        <div className="text-center py-6">
          <div className={cn("h-14 w-14 mx-auto rounded-full flex items-center justify-center mb-3", done.passed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
            {done.passed ? <Trophy className="h-7 w-7" /> : <XIcon className="h-7 w-7" />}
          </div>
          <div className="font-display text-xl">{done.passed ? "Passed!" : "Try tomorrow"}</div>
          <div className="text-sm text-muted-foreground mt-1">Scored {done.score} / {done.total} today</div>
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center font-mono">Complete a module with quizzes to unlock today's challenge.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <div className="text-sm font-medium">{i + 1}. {q.question}</div>
              <div className="grid gap-1.5">
                {q.options.map((opt: string, idx: number) => {
                  const sel = answers[q.id] === idx;
                  const correct = results && idx === q.correct_index;
                  const wrong = results && sel && !correct;
                  return (
                    <button
                      key={idx}
                      disabled={!!results}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                      className={cn(
                        "text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                        correct ? "border-primary bg-primary/10 text-primary"
                          : wrong ? "border-destructive bg-destructive/10 text-destructive"
                          : sel ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                      {correct && <Check className="inline h-3.5 w-3.5 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit answers
          </Button>
        </div>
      )}
    </div>
  );
};