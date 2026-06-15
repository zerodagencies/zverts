import { useEffect, useState } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    XCircle,
    Trophy,
    BrainCircuit,
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    Lock,
} from "lucide-react";

interface Question {
    id: string;
    question: string;
    options: string[];
    position: number;
}

type QuizState = "loading" | "generating" | "no_questions" | "already_passed" | "quiz" | "submitted";

const PASS_THRESHOLD = 8;

const Quiz = () => {
    const { id: moduleId } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [state, setState] = useState<QuizState>("loading");
    const [moduleTitle, setModuleTitle] = useState("");
    const [courseId, setCourseId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(
        null,
    );
    const [prevPassed, setPrevPassed] = useState(false);
    const [prevScore, setPrevScore] = useState<{ score: number; total: number } | null>(null);

    useEffect(() => {
        if (!user || !moduleId) return;
        (async () => {
            setState("loading");

            const [{ data: mod }, { data: prog }, { data: attempt }] = await Promise.all([
                supabase
                    .from("modules")
                    .select("title, course_id")
                    .eq("id", moduleId)
                    .maybeSingle(),
                supabase
                    .from("module_progress")
                    .select("mcq_passed")
                    .eq("user_id", user.id)
                    .eq("module_id", moduleId)
                    .maybeSingle(),
                supabase
                    .from("mcq_attempts")
                    .select("score, total, passed")
                    .eq("user_id", user.id)
                    .eq("module_id", moduleId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
            ]);

            if (mod) {
                setModuleTitle(mod.title);
                setCourseId(mod.course_id);
            }

            if (attempt) {
                setPrevScore({ score: attempt.score, total: attempt.total });
            }

            const { data: qs, error } = await (supabase.rpc as any)("get_mcq_questions", {
                _module_ids: [moduleId],
                _limit: 10,
            });

            if (error) {
                toast.error(error.message);
                setState("no_questions");
                return;
            }

            const parsed: Question[] = (qs ?? []).map((q: any) => ({
                id: q.q_id,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
                position: q.q_position,
            }));

            if (parsed.length === 0) {
                setState("generating");
                const { data: { session } } = await supabase.auth.getSession();
                const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mcq`;
                const genRes = await fetch(fnUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token}`,
                        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    },
                    body: JSON.stringify({ module_id: moduleId }),
                });
                if (!genRes.ok) {
                    setState("no_questions");
                    return;
                }
                const { data: qs2, error: e2 } = await (supabase.rpc as any)(
                    "get_mcq_questions",
                    { _module_ids: [moduleId], _limit: 10 },
                );
                if (e2 || !qs2?.length) {
                    setState("no_questions");
                    return;
                }
                const parsed2: Question[] = qs2.map((q: any) => ({
                    id: q.q_id,
                    question: q.question,
                    options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
                    position: q.q_position,
                }));
                setQuestions(parsed2);
                setAnswers({});
                setState("quiz");
                return;
            }

            setQuestions(parsed);
            setAnswers({});

            if (prog?.mcq_passed) {
                setPrevPassed(true);
                setState("already_passed");
                return;
            }

            setState("quiz");
        })();
    }, [user, moduleId]);

    const submit = async () => {
        if (!moduleId) return;
        if (Object.keys(answers).length < questions.length) {
            toast.error("Answer all questions before submitting.");
            return;
        }
        setSubmitting(true);
        const { data, error } = await (supabase.rpc as any)("submit_mcq", {
            _module_id: moduleId,
            _answers: answers,
        });
        setSubmitting(false);
        if (error) {
            toast.error(error.message);
            return;
        }
        const r = data as { score: number; total: number; passed: boolean };
        setResult(r);
        setState("submitted");
        if (r.passed) {
            toast.success(`Quiz passed! +1 Gem · +30 XP 🎉`);
        } else {
            toast.message(
                `Scored ${r.score}/${r.total} — need ${PASS_THRESHOLD} to pass. Try again!`,
            );
        }
    };

    const retry = () => {
        setAnswers({});
        setResult(null);
        setState("quiz");
    };

    if (authLoading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <AppShell>
            <section className="container py-10 md:py-14 max-w-2xl">
                {/* Back link */}
                <div className="mb-6">
                    <Link
                        to={courseId ? `/courses/${courseId}` : "/courses"}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        {moduleTitle || "Back to course"}
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        / module quiz
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                        {moduleTitle || "Quiz"}
                    </h1>
                    {state === "quiz" && (
                        <p className="text-sm text-muted-foreground mt-2 font-mono">
                            {questions.length} questions · score {PASS_THRESHOLD}/{questions.length}{" "}
                            to pass
                        </p>
                    )}
                    {prevScore && state !== "submitted" && state !== "already_passed" && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Last attempt: {prevScore.score}/{prevScore.total}
                        </p>
                    )}
                </div>

                {/* States */}
                {state === "loading" && (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <Skeleton key={j} className="h-10 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {state === "generating" && (
                    <div className="rounded-2xl border border-border bg-gradient-card p-8 text-center shadow-card">
                        <BrainCircuit className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse" />
                        <h2 className="font-display text-xl">Generating quiz with AI…</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Creating 10 questions for this lesson. This takes a few seconds.
                        </p>
                    </div>
                )}

                {state === "no_questions" && (
                    <div className="rounded-2xl border border-border bg-gradient-card p-8 text-center shadow-card">
                        <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <h2 className="font-display text-xl">No questions yet</h2>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                            Quiz questions for this module haven't been added yet. Check back soon.
                        </p>
                        <Button
                            className="mt-6"
                            variant="outline"
                            onClick={() => navigate(courseId ? `/courses/${courseId}` : "/courses")}
                        >
                            Back to course
                        </Button>
                    </div>
                )}

                {state === "already_passed" && (
                    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center shadow-card">
                        <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="font-display text-2xl">Already passed!</h2>
                        {prevScore && (
                            <p className="text-sm text-muted-foreground mt-1 font-mono">
                                Best score: {prevScore.score}/{prevScore.total}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                            You've already earned the reward for this quiz.
                        </p>
                        <div className="flex justify-center gap-3 mt-6">
                            <Button variant="outline" onClick={retry} className="gap-2">
                                <RotateCcw className="h-4 w-4" /> Retake for practice
                            </Button>
                            <Button
                                className="bg-gradient-lime text-primary-foreground shadow-glow gap-2"
                                onClick={() =>
                                    navigate(courseId ? `/courses/${courseId}` : "/courses")
                                }
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {state === "submitted" && result && (
                    <div
                        className={cn(
                            "rounded-2xl border p-8 text-center shadow-card",
                            result.passed
                                ? "border-primary/40 bg-primary/5"
                                : "border-border bg-gradient-card",
                        )}
                    >
                        {result.passed ? (
                            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                        ) : (
                            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        )}
                        <h2 className="font-display text-2xl">
                            {result.passed ? "Passed!" : "Not quite yet"}
                        </h2>
                        <p className="text-4xl font-display font-bold mt-3">
                            <span className={result.passed ? "text-primary" : "text-foreground"}>
                                {result.score}
                            </span>
                            <span className="text-muted-foreground text-2xl">/{result.total}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {result.passed
                                ? "+1 Gem · +30 XP earned"
                                : `Need ${PASS_THRESHOLD} correct to pass`}
                        </p>
                        <div className="flex justify-center gap-3 mt-6">
                            {!result.passed && (
                                <Button variant="outline" onClick={retry} className="gap-2">
                                    <RotateCcw className="h-4 w-4" /> Try again
                                </Button>
                            )}
                            <Button
                                className={cn(
                                    "gap-2",
                                    result.passed
                                        ? "bg-gradient-lime text-primary-foreground shadow-glow"
                                        : "",
                                )}
                                variant={result.passed ? "default" : "outline"}
                                onClick={() =>
                                    navigate(courseId ? `/courses/${courseId}` : "/courses")
                                }
                            >
                                {result.passed ? (
                                    <>
                                        Continue <ArrowRight className="h-4 w-4" />
                                    </>
                                ) : (
                                    "Back to course"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {state === "quiz" && (
                    <div className="space-y-5">
                        {questions.map((q, i) => (
                            <div
                                key={q.id}
                                className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5">
                                        Q{i + 1}.
                                    </span>
                                    <p className="text-sm font-medium leading-snug">{q.question}</p>
                                </div>
                                <div className="grid gap-2 pl-6">
                                    {q.options.map((opt, idx) => {
                                        const selected = answers[q.id] === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() =>
                                                    setAnswers((a) => ({ ...a, [q.id]: idx }))
                                                }
                                                className={cn(
                                                    "text-left text-sm px-4 py-2.5 rounded-xl border transition-colors",
                                                    selected
                                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                                                )}
                                            >
                                                <span className="font-mono text-xs mr-2 opacity-60">
                                                    {String.fromCharCode(65 + idx)}.
                                                </span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-mono text-muted-foreground">
                                    {Object.keys(answers).length}/{questions.length} answered
                                </span>
                                <span className="text-xs font-mono text-muted-foreground">
                                    Need {PASS_THRESHOLD}/{questions.length} to pass
                                </span>
                            </div>
                            <Button
                                onClick={submit}
                                disabled={
                                    submitting || Object.keys(answers).length < questions.length
                                }
                                className="w-full bg-gradient-lime text-primary-foreground shadow-glow"
                                size="lg"
                            >
                                {submitting ? "Grading…" : "Submit answers"}
                            </Button>
                            {Object.keys(answers).length < questions.length && (
                                <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
                                    Answer all {questions.length} questions to submit
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </AppShell>
    );
};

export default Quiz;
