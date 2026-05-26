import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { PACKAGES, PackageKey } from "@/lib/payment-config";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Check, Zap, Sparkles } from "lucide-react";

const ORDER: PackageKey[] = ["single", "mini", "pro"];

const BuyPackage = () => {
  const { user, loading } = useAuth();
  const ent = useEntitlements();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppShell>
      <section className="container py-10 md:py-14 max-w-6xl">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ buy convert pack</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">Unlock more conversions</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          One-time payment. Credits never expire. First purchase also unlocks <span className="text-primary font-medium">AI Tutor for lifetime</span>.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 flex flex-wrap gap-6 text-sm">
          <span>Free conversions left: <b className="text-primary">{ent.free_left}/3</b></span>
          <span>Convert credits: <b className="text-primary">{ent.convert_credits}</b></span>
          <span>AI: <b className={ent.ai_enabled ? "text-primary" : "text-muted-foreground"}>{ent.ai_enabled ? "Unlocked ✨" : "Locked"}</b></span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {ORDER.map((key) => {
            const p = PACKAGES[key];
            const popular = key === "pro";
            return (
              <div key={key} className={`relative rounded-2xl border p-6 shadow-card flex flex-col ${popular ? "border-primary bg-gradient-card shadow-glow" : "border-border bg-card"}`}>
                {popular && <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider">Best value</div>}
                <div className="font-display text-2xl">{p.name}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{p.tagline}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">Tk</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> {p.credits} playlist convert{p.credits > 1 ? "s" : ""}</li>
                  <li className="flex gap-2"><Sparkles className="h-4 w-4 text-primary mt-0.5" /> AI Tutor unlocked for life</li>
                  <li className="flex gap-2"><Zap className="h-4 w-4 text-primary mt-0.5" /> Never expires</li>
                </ul>
                <Link to={`/payment?pkg=${key}`} className="mt-6">
                  <Button className={`w-full ${popular ? "bg-gradient-lime text-primary-foreground shadow-glow" : ""}`} variant={popular ? "default" : "outline"}>
                    Buy now
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground font-mono space-y-1">
          <div>Need help? Payment is reviewed manually within a few hours.</div>
          <div>
            By making payment, you agree to the{" "}
            <Link to="/refund-policy" className="text-primary hover:underline">ZverT Refund Policy</Link>.
          </div>
        </div>
      </section>
    </AppShell>
  );
};
export default BuyPackage;
