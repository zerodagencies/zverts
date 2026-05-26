import { useParams, Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SEO } from "@/components/SEO";
import {
  LifeBuoy,
  Info as InfoIcon,
  HelpCircle,
  BookOpen,
  Mail,
  Handshake,
  Users,
  Newspaper,
  Briefcase,
  ChevronRight,
} from "lucide-react";

type Section = { heading?: string; body?: string; bullets?: string[] };
type Page = {
  slug: string;
  title: string;
  tagline?: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: Section[];
};

const PAGES: Page[] = [
  {
    slug: "support",
    title: "Support",
    icon: LifeBuoy,
    tagline:
      "ZverT Support is here to help learners have a smooth and stress-free experience. Whether you're facing technical issues, payment problems, course access errors, or app-related bugs, our support system is built to guide you quickly.",
    sections: [
      {
        heading: "We provide",
        bullets: [
          "Technical troubleshooting",
          "Account recovery",
          "Subscription support",
          "Payment assistance",
          "Video playback issues",
          "AI feature support",
          "Course unlocking help",
          "Notification issues",
        ],
      },
      { body: "Need help? We've got your back." },
    ],
  },
  {
    slug: "about",
    title: "About Us",
    icon: InfoIcon,
    tagline:
      "ZverT is an AI-powered smart learning platform designed to make education easier, more engaging, and personalized for modern learners.",
    sections: [
      {
        heading: "We combine",
        bullets: [
          "AI learning assistance",
          "Gamification",
          "Personalized study recommendations",
          "Smart quizzes",
          "Progress tracking",
          "Bangla-first student-friendly experience",
        ],
      },
      {
        heading: "Our Mission",
        body: "To make learning smarter, fun, and accessible for everyone.",
      },
      {
        heading: "Our Vision",
        body: "To become a next-generation AI learning ecosystem where students can learn, grow, and level up their skills efficiently.",
      },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    icon: HelpCircle,
    tagline: "Frequently Asked Questions",
    sections: [
      {
        heading: "1. What is ZverT?",
        body: "ZverT is an AI-powered learning app that helps users learn through videos, quizzes, AI summaries, progress tracking, and gamified learning.",
      },
      {
        heading: "2. Is ZverT free?",
        body: "ZverT offers both free and premium learning experiences.",
      },
      {
        heading: "3. Can I watch videos inside the app?",
        body: "Yes. Videos are designed to play inside the app for a seamless learning experience.",
      },
      {
        heading: "4. Does ZverT use AI?",
        body: "Yes. AI helps with summaries, quiz generation, recommendations, and weak-topic analysis.",
      },
      {
        heading: "5. Can I track progress?",
        body: "Yes. You can monitor XP, streaks, lesson completion, and overall course progress.",
      },
      {
        heading: "6. Is ZverT beginner-friendly?",
        body: "Absolutely. Courses are built for beginners to advanced learners.",
      },
    ],
  },
  {
    slug: "help",
    title: "Help Center",
    icon: BookOpen,
    tagline: "The ZverT Help Center is your self-service knowledge hub.",
    sections: [
      {
        heading: "Find help for",
        bullets: [
          "Getting started",
          "Account setup",
          "Subscription issues",
          "Course access",
          "Video problems",
          "AI assistant issues",
          "Notifications",
          "Progress tracking",
          "Password reset",
          "Payment troubleshooting",
        ],
      },
      { body: "Search. Learn. Solve." },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    icon: Mail,
    tagline: "Need direct assistance? Reach out to ZverT.",
    sections: [
      { heading: "Customer Support", body: "For technical or account-related issues." },
      { heading: "Business Inquiries", body: "Partnerships, collaborations, or enterprise opportunities." },
      { heading: "Feedback", body: "Share bugs, ideas, and suggestions." },
      {
        heading: "Contact Channels",
        bullets: ["Email Support", "Live Chat", "In-App Support", "Social Media"],
      },
      { body: "We'd love to hear from you." },
    ],
  },
  {
    slug: "affiliates",
    title: "Affiliates",
    icon: Handshake,
    tagline:
      "Join the ZverT Affiliate Program. Earn rewards by promoting ZverT and helping more learners discover smarter education.",
    sections: [
      {
        heading: "Affiliate benefits",
        bullets: [
          "Referral commissions",
          "Performance bonuses",
          "Marketing resources",
          "Dedicated affiliate support",
          "Growth opportunities",
        ],
      },
      {
        heading: "Perfect for",
        bullets: [
          "Content creators",
          "Educators",
          "Bloggers",
          "Student communities",
          "Learning influencers",
        ],
      },
      { body: "Grow with ZverT. Earn while helping others learn." },
    ],
  },
  {
    slug: "community",
    title: "Community",
    icon: Users,
    tagline: "ZverT is more than an app — it's a learning community.",
    sections: [
      {
        heading: "Connect with",
        bullets: ["Students", "Developers", "Creators", "Mentors", "Lifelong learners"],
      },
      {
        heading: "Community features",
        bullets: [
          "Discussion groups",
          "Study challenges",
          "Learning events",
          "Peer motivation",
          "Skill-sharing",
          "Collaboration",
        ],
      },
      { body: "Learn together. Grow together." },
    ],
  },
  {
    slug: "blog",
    title: "Blog",
    icon: Newspaper,
    tagline: "Explore insights, updates, and learning resources through the ZverT Blog.",
    sections: [
      {
        heading: "Topics include",
        bullets: [
          "Study tips",
          "AI learning guides",
          "Productivity hacks",
          "Skill development",
          "Tech & coding tutorials",
          "Career growth",
          "App updates",
          "Educational trends",
        ],
      },
      { body: "Knowledge beyond the classroom." },
    ],
  },
  {
    slug: "careers",
    title: "Careers",
    icon: Briefcase,
    tagline:
      "Join the team building the future of learning. At ZverT, we're creating an AI-first education platform that helps students learn smarter.",
    sections: [
      {
        heading: "We look for",
        bullets: [
          "Engineers",
          "Designers",
          "AI developers",
          "Product thinkers",
          "Growth marketers",
          "Community builders",
        ],
      },
      {
        heading: "Why join us?",
        bullets: [
          "Purpose-driven work",
          "Innovation-focused culture",
          "Learning opportunities",
          "Growth mindset",
          "Flexible collaboration",
          "Real impact",
        ],
      },
      { body: "Build the future of education with ZverT." },
    ],
  },
];

const Info = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = PAGES.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/" replace />;

  const Icon = page.icon;
  const related = PAGES.filter((p) => p.slug !== page.slug).slice(0, 6);

  return (
    <AppShell>
      <main className="container py-10 md:py-14">
        <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{page.title}</span>
        </nav>

        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-background backdrop-blur p-8 md:p-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.18),_transparent_60%)]" />
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 grid place-items-center rounded-2xl bg-primary/10 border border-primary/30 text-primary shrink-0">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {page.title}
              </h1>
              {page.tagline && (
                <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                  {page.tagline}
                </p>
              )}
            </div>
          </div>
        </header>

        <article className="mt-10 grid gap-6 md:grid-cols-2">
          {page.sections.map((s, i) => (
            <section
              key={i}
              className={
                "rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-6 md:p-7 hover:border-primary/40 transition-colors " +
                (!s.heading && !s.bullets ? "md:col-span-2 text-center italic text-muted-foreground" : "")
              }
            >
              {s.heading && (
                <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                  {s.heading}
                </h2>
              )}
              {s.body && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              )}
              {s.bullets && (
                <ul className="space-y-2">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <section className="mt-14">
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Explore more
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => {
              const RIcon = r.icon;
              return (
                <Link
                  key={r.slug}
                  to={`/info/${r.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 backdrop-blur px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <RIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {r.title}
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default Info;
