import { useState } from "react";
import { Navigate, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MERCHANT_NUMBERS, METHOD_LABELS, PACKAGES, PackageKey } from "@/lib/payment-config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Loader2 } from "lucide-react";

const METHODS = ["bkash", "nagad", "rocket"] as const;
type Method = typeof METHODS[number];

const Payment = () => {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pkgKey = (params.get("pkg") as PackageKey) || "mini";
  const pkg = PACKAGES[pkgKey] ?? PACKAGES.mini;
  const [method, setMethod] = useState<Method>("bkash");
  const [sender, setSender] = useState("");
  const [trx, setTrx] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const submit = async () => {
    if (!sender.trim() || !trx.trim()) { toast.error("Fill all fields"); return; }
    if (!/^\d{8,20}$/.test(sender.replace(/\s/g, ""))) { toast.error("Invalid sender number"); return; }
    if (!agreed) { toast.error("Please agree to the Refund Policy to continue"); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_payment" as any, {
      _package: pkgKey, _method: method, _sender_number: sender, _trx_id: trx,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("duplicate") || error.message.includes("payments_trx_unique")
        ? "This transaction ID was already submitted"
        : error.message.replace(/^.*: /, "");
      toast.error(msg);
      return;
    }
    toast.success("Payment submitted! Waiting for admin approval.");
    navigate("/payments");
  };

  const merchantNumber = MERCHANT_NUMBERS[method];

  return (
    <AppShell>
      <section className="container py-10 md:py-14 max-w-3xl">
        <Link to="/buy" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">← back to packages</Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-3">Complete payment</h1>

        {/* Package summary */}
        <div className="mt-6 rounded-2xl border border-primary/40 bg-gradient-card p-6 shadow-card flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">selected pack</div>
            <div className="font-display text-2xl mt-1">{pkg.name}</div>
            <div className="text-sm text-muted-foreground">{pkg.credits} convert credits</div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-bold">{pkg.price} <span className="text-base font-normal text-muted-foreground">Tk</span></div>
          </div>
        </div>

        {/* Method tabs */}
        <div className="mt-8">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">step 1 · choose method</div>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`rounded-xl border p-4 font-medium transition-all ${method === m ? "border-primary bg-primary/10 text-primary shadow-glow" : "border-border bg-card hover:border-primary/40"}`}>
                {METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">step 2 · send money</div>
          <ol className="space-y-3 text-sm">
            <li>Open your <b>{METHOD_LABELS[method]}</b> app and choose <b>Send Money</b>.</li>
            <li>Send <b className="text-primary">{pkg.price} Tk</b> to this merchant number:</li>
          </ol>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <span className="font-mono text-lg font-bold flex-1">{merchantNumber}</span>
            <Button size="sm" variant="ghost" onClick={() => copy(merchantNumber, "num")}>
              {copied === "num" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-mono">After sending, paste your sender number and transaction ID below.</p>
        </div>

        {/* Form */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">step 3 · confirm</div>
          <div>
            <Label htmlFor="sender">Your {METHOD_LABELS[method]} number</Label>
            <Input id="sender" inputMode="numeric" placeholder="01XXXXXXXXX" value={sender} onChange={(e) => setSender(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="trx">Transaction ID</Label>
            <Input id="trx" placeholder="e.g. 8N7Y6XKL21" value={trx} onChange={(e) => setTrx(e.target.value)} className="mt-1.5 font-mono" />
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              id="agree-refund"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="agree-refund" className="text-xs leading-relaxed font-normal cursor-pointer">
              I agree to the{" "}
              <Link to="/refund-policy" target="_blank" className="text-primary hover:underline font-medium">
                ZverT Refund Policy
              </Link>
              . By making payment, I confirm I have read and accepted its terms.
            </Label>
          </div>
          <Button onClick={submit} disabled={submitting || !agreed} className="w-full bg-gradient-lime text-primary-foreground shadow-glow disabled:opacity-50">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit payment"}
          </Button>
          <p className="text-xs text-muted-foreground text-center font-mono">
            Admins typically approve within a few hours. ·{" "}
            <Link to="/refund-policy" className="hover:text-primary underline">Refund Policy</Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
};
export default Payment;
