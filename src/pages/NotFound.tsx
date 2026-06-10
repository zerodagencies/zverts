import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, LayoutDashboard, ArrowLeft, TrendingUp } from "lucide-react";

const quickLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", desc: "Back to your hub" },
    { to: "/courses", icon: BookOpen, label: "Courses", desc: "Browse all courses" },
    { to: "/growth", icon: TrendingUp, label: "Growth", desc: "Track your progress" },
];

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    return (
        <AppShell>
            <section className="relative min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center overflow-hidden">
                {/* Ambient background orbs */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px] animate-pulse-glow" />
                    <div className="absolute right-[-8%] bottom-[15%] h-[300px] w-[300px] rounded-full bg-primary/6 blur-[120px] animate-pulse-glow [animation-delay:1.2s]" />
                    <div className="absolute left-[-5%] top-[55%] h-[220px] w-[220px] rounded-full bg-primary/5 blur-[100px] animate-pulse-glow [animation-delay:0.6s]" />
                </div>

                <div className="container max-w-2xl py-16 flex flex-col items-center text-center gap-8">

                    {/* Badge */}
                    <div
                        className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 backdrop-blur px-3 py-1 text-xs font-mono text-muted-foreground"
                        style={{ animationDelay: "0s" }}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                        / error · not found
                    </div>

                    {/* Giant 404 */}
                    <div
                        className="animate-fade-up relative select-none -mb-4"
                        style={{ animationDelay: "0.1s" }}
                    >
                        <span className="font-display font-semibold leading-none tracking-tight bg-gradient-to-b from-foreground/90 via-foreground/50 to-foreground/10 bg-clip-text text-transparent"
                            style={{ fontSize: "clamp(7rem, 22vw, 13rem)" }}
                        >
                            404
                        </span>
                        {/* Glow behind the number */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="h-20 w-40 rounded-full bg-primary/25 blur-3xl animate-pulse-glow" />
                        </div>
                    </div>

                    {/* Heading + description */}
                    <div
                        className="animate-fade-up space-y-3"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                            You've gone off-course
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
                            The page{" "}
                            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground/80 border border-border/60">
                                {location.pathname}
                            </code>{" "}
                            doesn't exist. Let's get you back on track.
                        </p>
                    </div>

                    {/* Primary actions */}
                    <div
                        className="animate-fade-up flex flex-wrap gap-3 justify-center"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <Link to="/">
                            <Button
                                size="lg"
                                className="rounded-full px-6 gap-2 bg-gradient-lime text-primary-foreground shadow-glow hover:opacity-90"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full px-6 gap-2"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Button>
                    </div>

                    {/* Quick nav cards */}
                    <div
                        className="animate-fade-up w-full grid grid-cols-1 sm:grid-cols-3 gap-3"
                        style={{ animationDelay: "0.4s" }}
                    >
                        {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                            <Link
                                key={to}
                                to={to}
                                className="group rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-glow hover:-translate-y-0.5"
                            >
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3 transition-colors group-hover:bg-primary/20">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className="font-medium text-sm text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                            </Link>
                        ))}
                    </div>

                    {/* Footer hint */}
                    <p
                        className="animate-fade-up text-xs font-mono text-muted-foreground/60"
                        style={{ animationDelay: "0.5s" }}
                    >
                        ZverTs · disciplined learning
                    </p>
                </div>
            </section>
        </AppShell>
    );
};

export default NotFound;
