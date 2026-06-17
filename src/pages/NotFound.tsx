import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, LayoutDashboard, ArrowLeft, TrendingUp, Compass } from "lucide-react";

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
        <div className="relative min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden">

            {/* Grid pattern */}
            <div
                className="pointer-events-none absolute inset-0 -z-20 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Ambient glow orbs */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-[40%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[160px] animate-pulse-glow" />
                <div className="absolute right-[-10%] bottom-[10%] h-[350px] w-[350px] rounded-full bg-primary/6 blur-[130px] animate-pulse-glow [animation-delay:1.4s]" />
                <div className="absolute left-[-8%] top-[20%] h-[250px] w-[250px] rounded-full bg-primary/5 blur-[110px] animate-pulse-glow [animation-delay:0.7s]" />
            </div>

            <div className="container max-w-2xl px-6 py-16 flex flex-col items-center text-center gap-8">

                {/* Status badge */}
                <div
                    className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-4 py-1.5 text-xs font-mono text-muted-foreground"
                    style={{ animationDelay: "0s" }}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    HTTP 404 · page not found
                </div>

                {/* Compass icon */}
                <div
                    className="animate-fade-up relative"
                    style={{ animationDelay: "0.1s" }}
                >
                    <div className="relative h-20 w-20 mx-auto">
                        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl animate-pulse-glow" />
                        <div className="relative h-20 w-20 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 grid place-items-center">
                            <Compass className="h-9 w-9 text-primary opacity-80" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Giant 404 */}
                <div
                    className="animate-fade-up relative select-none -my-2"
                    style={{ animationDelay: "0.15s" }}
                >
                    <span
                        className="font-display font-semibold leading-none tracking-tight bg-gradient-to-b from-foreground/90 via-foreground/40 to-foreground/5 bg-clip-text text-transparent"
                        style={{ fontSize: "clamp(6rem, 20vw, 12rem)" }}
                    >
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-16 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
                    </div>
                </div>

                {/* Heading + description */}
                <div
                    className="animate-fade-up space-y-3"
                    style={{ animationDelay: "0.25s" }}
                >
                    <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                        You've gone off-course
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
                        The page{" "}
                        <code className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-sm text-foreground/80 border border-border/60">
                            {location.pathname}
                        </code>{" "}
                        doesn't exist. Let's get you back on track.
                    </p>
                </div>

                {/* Primary actions */}
                <div
                    className="animate-fade-up flex flex-wrap gap-3 justify-center"
                    style={{ animationDelay: "0.35s" }}
                >
                    <Link to="/">
                        <Button
                            size="lg"
                            className="rounded-full px-6 gap-2 bg-gradient-lime text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
                        >
                            <Home className="h-4 w-4" />
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-6 gap-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                </div>

                {/* Quick nav cards */}
                <div
                    className="animate-fade-up w-full grid grid-cols-1 sm:grid-cols-3 gap-3"
                    style={{ animationDelay: "0.45s" }}
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
                    className="animate-fade-up text-xs font-mono text-muted-foreground/50 tracking-wider"
                    style={{ animationDelay: "0.55s" }}
                >
                    ZverTs · disciplined learning
                </p>
            </div>
        </div>
    );
};

export default NotFound;
