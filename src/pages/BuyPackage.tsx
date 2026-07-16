import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck } from "lucide-react";

const BENEFITS = [
    "30 Playlist Converts Per Month",
    "AI Tutor Access",
    "Credits Never Expire",
    "MCQ Test After Every Module Completion",
    "Focus Extension Protection",
    "Social Media Distraction Blocking",
    "AI Site Blocking During Quiz",
    "Progress Tracking & Learning Analytics",
    "Priority Support",
];

const WHY_CHOOSE = [
    "Finish courses faster",
    "Reduce distractions",
    "Learn with AI assistance",
    "Test knowledge after every module",
    "Build consistent study habits",
];

const BuyPackage = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <AppShell>
            <section className="relative overflow-hidden py-16 md:py-24">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/3 to-transparent" />
                </div>

                <div className="container max-w-3xl mx-auto px-4 space-y-12">
                    <div className="text-center space-y-4">
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            / upgrade
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Unlock Your Full{" "}
                            <span className="text-primary">Learning Potential</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Stay focused, learn faster, and complete more courses with ZverTs Premium.
                        </p>
                    </div>

                    <div className="relative mx-auto max-w-md">
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-primary/40 via-primary/20 to-transparent blur-lg" />
                        <div className="relative rounded-3xl border border-primary/30 bg-card p-8 md:p-10 space-y-8 shadow-glow">
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-2xl font-bold">Premium</h2>
                                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider">
                                    Most Popular
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-6xl font-bold tracking-tight">
                                    ৳179
                                </span>
                                <span className="text-muted-foreground text-lg font-mono">/ Month</span>
                            </div>

                            <ul className="space-y-3">
                                {BENEFITS.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-sm">
                                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                size="lg"
                                className="w-full bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow text-base font-semibold h-12"
                            >
                                Upgrade to Premium
                            </Button>

                            <p className="text-center text-xs text-muted-foreground font-mono">
                                Cancel anytime. No hidden fees.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/50 p-8 md:p-10 space-y-6">
                        <h3 className="font-display text-2xl font-bold text-center">
                            Why Students Choose ZverTs
                        </h3>
                        <ul className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                            {WHY_CHOOSE.map((w) => (
                                <li key={w} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-center text-xs text-muted-foreground font-mono space-y-1">
                        <div className="flex items-center justify-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Secure payment via bKash, Nagad, or Rocket</span>
                        </div>
                        <div>
                            By making a payment you agree to the{" "}
                            <Link to="/refund-policy" className="text-primary hover:underline">
                                ZverTs Refund Policy
                            </Link>
                            .
                        </div>
                    </div>
                </div>
            </section>
        </AppShell>
    );
};
export default BuyPackage;
