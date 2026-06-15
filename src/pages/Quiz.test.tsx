import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/components/app/AppShell", () => ({
    AppShell: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="shell">{children}</div>
    ),
}));

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
        auth: { getSession: vi.fn() },
    },
}));

global.fetch = vi.fn();

// ── Imports after mocks ───────────────────────────────────────────────────────

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Quiz from "@/pages/Quiz";
import type { User } from "@supabase/supabase-js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_USER = { id: "user-1" } as User;
const MODULE_ID = "mod-abc";

const makeChain = (data: unknown, error: unknown = null) => {
    const c: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    };
    return c;
};

const renderQuiz = () =>
    render(
        <MemoryRouter initialEntries={[`/quiz/${MODULE_ID}`]}>
            <Routes>
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/auth" element={<div data-testid="auth-page" />} />
            </Routes>
        </MemoryRouter>,
    );

const authWith = (user: User | null, loading = false) =>
    vi.mocked(useAuth).mockReturnValue({
        user,
        session: null,
        loading,
        signOut: vi.fn(),
    });

const MOCK_QUESTIONS = [
    { q_id: "q1", question: "What is 2+2?", options: ["1", "2", "3", "4"], q_position: 1 },
    { q_id: "q2", question: "Capital of France?", options: ["Berlin", "Paris", "Rome", "Madrid"], q_position: 2 },
];

const setupFrom = (
    opts: { mcqPassed?: boolean; hasAttempt?: boolean; noQuestions?: boolean } = {},
) => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "modules")
            return makeChain({ title: "Test Module", course_id: "course-1" });
        if (table === "module_progress")
            return makeChain(opts.mcqPassed ? { mcq_passed: true } : null);
        if (table === "mcq_attempts")
            return makeChain(
                opts.hasAttempt ? { score: 7, total: 10, passed: false } : null,
            );
        return makeChain(null);
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
        data: opts.noQuestions ? [] : MOCK_QUESTIONS,
        error: null,
    } as any);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Quiz page", () => {
    beforeEach(() => vi.clearAllMocks());

    // ── Auth guards ───────────────────────────────────────────────────────────

    it("renders nothing while auth is loading", () => {
        authWith(null, true);
        const { container } = renderQuiz();
        expect(container.firstChild).toBeNull();
    });

    it("redirects to /auth when user is not logged in", async () => {
        authWith(null, false);
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByTestId("auth-page")).toBeInTheDocument(),
        );
    });

    // ── Already passed ────────────────────────────────────────────────────────

    it("shows trophy screen when module is already passed", async () => {
        authWith(MOCK_USER);
        setupFrom({ mcqPassed: true, hasAttempt: true });
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("Already passed!")).toBeInTheDocument(),
        );
        expect(screen.getByText("Retake for practice")).toBeInTheDocument();
    });

    it("shows best score on already-passed screen", async () => {
        authWith(MOCK_USER);
        setupFrom({ mcqPassed: true, hasAttempt: true });
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText(/Best score: 7\/10/)).toBeInTheDocument(),
        );
    });

    it("retake button returns to quiz state from already-passed", async () => {
        authWith(MOCK_USER);
        setupFrom({ mcqPassed: true });
        // RPC already returns MOCK_QUESTIONS from setupFrom — no override needed
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("Already passed!")).toBeInTheDocument(),
        );
        fireEvent.click(screen.getByText("Retake for practice"));
        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );
    });

    // ── Quiz state ────────────────────────────────────────────────────────────

    it("renders all questions in quiz state", async () => {
        authWith(MOCK_USER);
        setupFrom();
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );
        expect(screen.getByText("Capital of France?")).toBeInTheDocument();
    });

    it("shows question count and pass threshold", async () => {
        authWith(MOCK_USER);
        setupFrom();
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText(/2 questions · score/)).toBeInTheDocument(),
        );
    });

    it("submit button is disabled until all questions are answered", async () => {
        authWith(MOCK_USER);
        setupFrom();
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("Submit answers")).toBeInTheDocument(),
        );
        expect(screen.getByText("Submit answers")).toBeDisabled();
    });

    it("submit button enables once all questions are answered", async () => {
        authWith(MOCK_USER);
        setupFrom();
        renderQuiz();

        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );

        // Answer question 1
        fireEvent.click(screen.getByText("4"));
        // Answer question 2
        fireEvent.click(screen.getByText("Paris"));

        await waitFor(() =>
            expect(screen.getByText("Submit answers")).not.toBeDisabled(),
        );
    });

    // ── Submit — pass ─────────────────────────────────────────────────────────

    it("shows passed result screen after successful submission", async () => {
        authWith(MOCK_USER);
        setupFrom();
        vi.mocked(supabase.rpc).mockImplementation((name: string) => {
            if (name === "get_mcq_questions")
                return Promise.resolve({ data: MOCK_QUESTIONS, error: null }) as any;
            if (name === "submit_mcq")
                return Promise.resolve({ data: { score: 10, total: 10, passed: true }, error: null }) as any;
            return Promise.resolve({ data: null, error: null }) as any;
        });

        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByText("4"));
        fireEvent.click(screen.getByText("Paris"));
        fireEvent.click(screen.getByText("Submit answers"));

        await waitFor(() => expect(screen.getByText("Passed!")).toBeInTheDocument());
        expect(screen.getByText("+1 Gem · +30 XP earned")).toBeInTheDocument();
    });

    // ── Submit — fail ─────────────────────────────────────────────────────────

    it("shows fail result and retry button after failed submission", async () => {
        authWith(MOCK_USER);
        setupFrom();
        vi.mocked(supabase.rpc).mockImplementation((name: string) => {
            if (name === "get_mcq_questions")
                return Promise.resolve({ data: MOCK_QUESTIONS, error: null }) as any;
            if (name === "submit_mcq")
                return Promise.resolve({ data: { score: 5, total: 10, passed: false }, error: null }) as any;
            return Promise.resolve({ data: null, error: null }) as any;
        });

        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );

        fireEvent.click(screen.getByText("4"));
        fireEvent.click(screen.getByText("Paris"));
        fireEvent.click(screen.getByText("Submit answers"));

        await waitFor(() =>
            expect(screen.getByText("Not quite yet")).toBeInTheDocument(),
        );
        expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("retry button brings user back to quiz from fail screen", async () => {
        authWith(MOCK_USER);
        setupFrom();
        vi.mocked(supabase.rpc).mockImplementation((name: string) => {
            if (name === "get_mcq_questions")
                return Promise.resolve({ data: MOCK_QUESTIONS, error: null }) as any;
            if (name === "submit_mcq")
                return Promise.resolve({ data: { score: 3, total: 10, passed: false }, error: null }) as any;
            return Promise.resolve({ data: null, error: null }) as any;
        });

        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );
        fireEvent.click(screen.getByText("4"));
        fireEvent.click(screen.getByText("Paris"));
        fireEvent.click(screen.getByText("Submit answers"));

        await waitFor(() =>
            expect(screen.getByText("Try again")).toBeInTheDocument(),
        );
        fireEvent.click(screen.getByText("Try again"));

        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );
    });

    // ── Generating state ──────────────────────────────────────────────────────

    it("shows generating UI and then loads questions when none exist", async () => {
        authWith(MOCK_USER);
        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === "modules")
                return makeChain({ title: "Test Module", course_id: "course-1" });
            return makeChain(null);
        });

        let rpcCallCount = 0;
        vi.mocked(supabase.rpc).mockImplementation(() => {
            rpcCallCount++;
            if (rpcCallCount === 1)
                return Promise.resolve({ data: [], error: null }) as any; // first call: no questions
            return Promise.resolve({ data: MOCK_QUESTIONS, error: null }) as any; // after generation
        });

        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: { access_token: "tok" } },
        } as any);

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true, generated: true, count: 2 }),
        } as any);

        renderQuiz();

        await waitFor(() =>
            expect(screen.getByText("Generating quiz with AI…")).toBeInTheDocument(),
        );

        await waitFor(() =>
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument(),
        );
    });

    it("shows no-questions fallback if generation fetch fails", async () => {
        authWith(MOCK_USER);
        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === "modules")
                return makeChain({ title: "Test Module", course_id: "course-1" });
            return makeChain(null);
        });
        vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: { access_token: "tok" } },
        } as any);
        vi.mocked(global.fetch).mockResolvedValue({ ok: false } as any);

        renderQuiz();

        await waitFor(() =>
            expect(screen.getByText("No questions yet")).toBeInTheDocument(),
        );
    });

    // ── Previous attempt info ─────────────────────────────────────────────────

    it("shows last attempt score when one exists", async () => {
        authWith(MOCK_USER);
        setupFrom({ hasAttempt: true });
        renderQuiz();
        await waitFor(() =>
            expect(screen.getByText(/Last attempt: 7\/10/)).toBeInTheDocument(),
        );
    });
});
