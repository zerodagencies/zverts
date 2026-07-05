import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { OfficialEmail } from "@/components/OfficialEmail";
import {
    ScrollText,
    UserCheck,
    Ban,
    CreditCard,
    ShieldAlert,
    RefreshCcw,
    Scale,
    Mail,
    ArrowLeft,
} from "lucide-react";

const Section = ({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
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

const TermsOfService = () => (
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
                    / legal · terms of service
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-3">
                    Terms of Service
                </h1>
                <p className="text-muted-foreground mt-3">
                    Last updated: June 2026 — By using ZverTs you agree to these terms.
                </p>
            </header>

            <div className="space-y-6">
                <Section icon={ScrollText} title="1. Acceptance of Terms">
                    <p>
                        By accessing or using ZverTs (the &ldquo;Platform&rdquo;), you agree to be
                        bound by these Terms of Service. If you do not agree, please do not use the
                        Platform.
                    </p>
                    <p>
                        These terms apply to all visitors, registered users, and anyone who accesses
                        or uses any part of ZverTs.
                    </p>
                </Section>

                <Section icon={UserCheck} title="2. Eligibility & Account">
                    <p>To use ZverTs you must:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Be at least 13 years old (or have parental consent)</Bullet>
                        <Bullet>Provide accurate and complete registration information</Bullet>
                        <Bullet>Keep your account credentials secure and confidential</Bullet>
                        <Bullet>Notify us immediately of any unauthorised account access</Bullet>
                    </ul>
                    <p>
                        You are responsible for all activity that occurs under your account.
                    </p>
                </Section>

                <Section icon={ScrollText} title="3. Platform Use">
                    <p>ZverTs grants you a limited, non-exclusive, non-transferable licence to:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Access and use the Platform for personal, non-commercial learning</Bullet>
                        <Bullet>Convert YouTube playlists into structured courses for your own study</Bullet>
                        <Bullet>Use AI features within your allocated credit balance</Bullet>
                    </ul>
                    <p>
                        You may not copy, redistribute, or resell any content or features of the
                        Platform without express written permission from ZverTs.
                    </p>
                </Section>

                <Section icon={Ban} title="4. Prohibited Conduct">
                    <p>You agree not to:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Submit false, fraudulent, or misleading payment information</Bullet>
                        <Bullet>Attempt to reverse-engineer, hack, or disrupt the Platform</Bullet>
                        <Bullet>Share your account or credentials with others</Bullet>
                        <Bullet>Upload or transmit harmful, offensive, or illegal content</Bullet>
                        <Bullet>Use automated tools or bots to access the Platform</Bullet>
                        <Bullet>Violate any applicable local, national, or international law</Bullet>
                    </ul>
                    <p>
                        Violations may result in immediate account suspension or permanent ban.
                    </p>
                </Section>

                <Section icon={CreditCard} title="5. Payments & Credits">
                    <p>
                        Payments on ZverTs are processed manually via mobile financial services
                        (bKash, Nagad, Rocket). Credits are added after admin verification.
                    </p>
                    <ul className="space-y-1.5">
                        <Bullet>All prices are in Bangladeshi Taka (BDT) unless stated otherwise</Bullet>
                        <Bullet>Credits are non-transferable between accounts</Bullet>
                        <Bullet>ZverTs reserves the right to adjust pricing with reasonable notice</Bullet>
                    </ul>
                    <p>
                        For refund eligibility, see our{" "}
                        <Link to="/refund-policy" className="text-primary hover:underline">
                            Refund Policy
                        </Link>
                        .
                    </p>
                </Section>

                <Section icon={ShieldAlert} title="6. Intellectual Property">
                    <p>
                        All content, branding, and software on ZverTs — including course structures,
                        UI, and AI-generated summaries — are the property of ZverTs or its licensors.
                        YouTube video content remains subject to YouTube&rsquo;s Terms of Service and
                        respective copyright holders.
                    </p>
                </Section>

                <Section icon={RefreshCcw} title="7. Service Changes & Availability">
                    <p>
                        ZverTs may modify, suspend, or discontinue any feature or the Platform
                        itself at any time, with or without notice. We are not liable for any
                        interruption in service. We will make reasonable efforts to notify users of
                        significant changes.
                    </p>
                </Section>

                <Section icon={Scale} title="8. Limitation of Liability">
                    <p>
                        To the fullest extent permitted by law, ZverTs is not liable for any indirect,
                        incidental, special, or consequential damages arising from your use of the
                        Platform. Our total liability shall not exceed the amount you paid to ZverTs
                        in the past 30 days.
                    </p>
                </Section>

                <Section icon={Mail} title="9. Contact Us">
                    <p>Questions about these terms?</p>
                    <OfficialEmail variant="card" label="Official Support" />
                    <p className="text-xs font-mono pt-3 border-t border-border">
                        Continued use of ZverTs after any update to these terms constitutes your
                        acceptance of the revised terms. Governing law: Bangladesh.
                    </p>
                </Section>
            </div>
        </section>
    </AppShell>
);

export default TermsOfService;
