import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { OfficialEmail } from "@/components/OfficialEmail";
import {
    ShieldCheck,
    Eye,
    Database,
    Share2,
    Lock,
    Cookie,
    UserCheck,
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

const PrivacyPolicy = () => (
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
                    / legal · privacy policy
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-3">
                    Privacy Policy
                </h1>
                <p className="text-muted-foreground mt-3">
                    Last updated: June 2026 — Your privacy matters to us. Please read carefully.
                </p>
            </header>

            <div className="space-y-6">
                <Section icon={Eye} title="1. Information We Collect">
                    <p>When you use ZverTs, we may collect the following information:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Name, email address, and profile picture (via OAuth or sign-up)</Bullet>
                        <Bullet>Payment details such as transaction IDs and phone numbers</Bullet>
                        <Bullet>Course progress, quiz scores, and learning activity</Bullet>
                        <Bullet>Device type, browser, and usage analytics</Bullet>
                        <Bullet>IP address and approximate location</Bullet>
                    </ul>
                </Section>

                <Section icon={Database} title="2. How We Use Your Information">
                    <p>We use the collected data to:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Provide and improve ZverTs services</Bullet>
                        <Bullet>Verify payments and manage credit balances</Bullet>
                        <Bullet>Personalise your learning experience</Bullet>
                        <Bullet>Send important notifications about your account</Bullet>
                        <Bullet>Ensure platform security and prevent fraud</Bullet>
                        <Bullet>Generate anonymised usage statistics</Bullet>
                    </ul>
                </Section>

                <Section icon={Share2} title="3. Information Sharing">
                    <p>
                        We do <span className="text-foreground font-medium">not sell</span> your
                        personal data. We may share data only in these circumstances:
                    </p>
                    <ul className="space-y-1.5">
                        <Bullet>With service providers (e.g. Supabase, hosting) under strict data agreements</Bullet>
                        <Bullet>When required by law or to comply with legal obligations</Bullet>
                        <Bullet>To protect the rights, property, or safety of ZverTs or its users</Bullet>
                    </ul>
                </Section>

                <Section icon={Lock} title="4. Data Security">
                    <p>
                        We implement industry-standard security measures including encrypted
                        connections (HTTPS), secure database access controls, and regular security
                        reviews. However, no method of transmission over the internet is 100% secure.
                    </p>
                </Section>

                <Section icon={Cookie} title="5. Cookies & Local Storage">
                    <p>ZverTs uses browser storage technologies to:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Keep you signed in across sessions</Bullet>
                        <Bullet>Remember your language and theme preferences</Bullet>
                        <Bullet>Track course progress locally</Bullet>
                    </ul>
                    <p>
                        You can clear cookies and local storage at any time through your browser
                        settings, though this may sign you out and reset preferences.
                    </p>
                </Section>

                <Section icon={UserCheck} title="6. Your Rights">
                    <p>You have the right to:</p>
                    <ul className="space-y-1.5">
                        <Bullet>Access the personal data we hold about you</Bullet>
                        <Bullet>Request correction of inaccurate data</Bullet>
                        <Bullet>Request deletion of your account and associated data</Bullet>
                        <Bullet>Opt out of non-essential communications</Bullet>
                    </ul>
                    <p>
                        To exercise any of these rights, contact us using the details below.
                    </p>
                </Section>

                <Section icon={ShieldCheck} title="7. Data Retention">
                    <p>
                        We retain your data for as long as your account is active or as needed to
                        provide services. If you delete your account, we will remove your personal
                        data within{" "}
                        <span className="text-foreground font-medium">30 days</span>, except where
                        retention is required by law (e.g. payment records).
                    </p>
                </Section>

                <Section icon={Mail} title="8. Contact Us">
                    <p>For privacy-related requests or questions:</p>
                    <OfficialEmail variant="card" label="Official Support" />
                    <p className="text-xs font-mono pt-3 border-t border-border">
                        By using ZverTs, you agree to this Privacy Policy. We may update it
                        periodically — continued use after changes constitutes acceptance.
                    </p>
                </Section>
            </div>
        </section>
    </AppShell>
);

export default PrivacyPolicy;
