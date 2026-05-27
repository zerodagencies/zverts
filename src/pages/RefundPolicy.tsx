import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { OfficialEmail } from "@/components/OfficialEmail";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Scale,
  ArrowLeft,
} from "lucide-react";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="font-display text-xl md:text-2xl">{title}</h2>
    </div>
    <div className="text-sm md:text-base text-muted-foreground space-y-3 leading-relaxed">
      {children}
    </div>
  </section>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2.5">
    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
    <span>{children}</span>
  </li>
);

const RefundPolicy = () => (
  <AppShell>
    <section className="container py-10 md:py-16 max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> back
      </Link>

      <header className="mt-4 mb-10">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          / legal · refund policy
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-3">
          ZverTs Refund Policy
        </h1>
        <p className="text-muted-foreground mt-3">
          Last updated: 2026 — Please read carefully before making any payment.
        </p>
      </header>

      <div className="space-y-6">
        <Section icon={Scale} title="1. Digital Product Policy">
          <p>ZverTs provides digital products and services, including:</p>
          <ul className="space-y-1.5">
            <Bullet>Playlist conversion credits</Bullet>
            <Bullet>AI feature access</Bullet>
            <Bullet>Premium learning features</Bullet>
          </ul>
          <p>
            Because these are digital services, refunds are generally{" "}
            <span className="text-foreground font-medium">
              not automatic after successful approval and activation
            </span>
            .
          </p>
        </Section>

        <Section icon={CheckCircle2} title="2. Eligible Refund Cases">
          <p>Refund requests may be considered if:</p>
          <ul className="space-y-1.5">
            <Bullet>Payment was sent by mistake</Bullet>
            <Bullet>Duplicate payment was made</Bullet>
            <Bullet>Wrong amount was sent</Bullet>
            <Bullet>Credits were not added after approval</Bullet>
            <Bullet>Technical / payment verification issue occurred</Bullet>
          </ul>
        </Section>

        <Section icon={XCircle} title="3. Non-Refundable Cases">
          <p>Refunds may not be provided if:</p>
          <ul className="space-y-1.5">
            <Bullet>Credits were already used</Bullet>
            <Bullet>AI access was already activated</Bullet>
            <Bullet>Wrong information was submitted by the user</Bullet>
            <Bullet>User changed mind after successful activation</Bullet>
            <Bullet>
              Payment was sent to a wrong number outside official ZverTs accounts
            </Bullet>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="4. Manual Review Process">
          <p>
            All refund requests are manually reviewed by the ZverTs admin team.
            We reserve the right to:
          </p>
          <ul className="space-y-1.5">
            <Bullet>Approve refund</Bullet>
            <Bullet>Reject refund</Bullet>
            <Bullet>Request additional verification</Bullet>
          </ul>
        </Section>

        <Section icon={Clock} title="5. Refund Processing Time">
          <p>
            If approved, refunds may take{" "}
            <span className="text-foreground font-medium">
              3–7 business days
            </span>{" "}
            depending on the payment method (bKash, Nagad, Rocket).
          </p>
        </Section>

        <Section icon={AlertTriangle} title="6. Fraud Prevention">
          <p>
            ZverTs monitors suspicious payment activity. Fraudulent refund claims
            or fake transaction submissions may result in{" "}
            <span className="text-destructive font-medium">
              account restrictions or permanent suspension
            </span>
            .
          </p>
        </Section>

        <Section icon={Mail} title="7. Contact Support">
          <p>For payment or refund-related issues, contact us at:</p>
          <OfficialEmail variant="card" label="Official Support" />
          <ul className="space-y-1.5 pt-2">
            <Bullet>
              Or visit our{" "}
              <Link to="/info/contact" className="text-primary hover:underline">
                contact page
              </Link>
            </Bullet>
          </ul>
          <p className="text-xs font-mono pt-3 border-t border-border">
            By using ZverTs and making payments, you agree to this refund policy.
          </p>
        </Section>
      </div>
    </section>
  </AppShell>
);

export default RefundPolicy;
