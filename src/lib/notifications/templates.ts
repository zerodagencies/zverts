// Bangla student-vibe notification content engine.
// Rotates per-category templates and personalizes with user context.
// Used by client-side dispatcher (XP, AI, comeback hooks) and edge function.

export type Ctx = {
  name?: string | null;
  streak?: number;
  xp?: number;
  level?: number;
  subject?: string | null;
  weakTopic?: string | null;
  moduleTitle?: string | null;
  courseTitle?: string | null;
  hour?: number; // local hour 0-23
};

type Tpl = (c: Ctx) => { title: string; body: string };

const pick = <T,>(arr: T[], seed = Date.now()): T =>
  arr[Math.floor(seed % arr.length)] ?? arr[0];

const T = {
  morning_push: [
    () => ({ title: "সকাল শুরু হইছে ☀️", body: "আজকে ২০ মিনিট পড়লেই XP বাড়বে 🔥" }),
    () => ({ title: "নতুন দিন, নতুন streak 😎", body: "আজকেও চালাইবেন তো?" }),
    () => ({ title: "ঘুম শেষ, skill টাইম 💡", body: "ZverT খুলে অল্প একটু চর্চা দেন" }),
    (c) => ({ title: "১টা lesson = level up?", body: `Level ${(c.level ?? 1) + 1} খুব কাছেই 🔥` }),
  ] as Tpl[],
  afternoon_push: [
    () => ({ title: "দুপুর গেল boss 😅", body: "১০ মিনিট video = XP add 🔥" }),
    () => ({ title: "অল্প অল্প করলেও course শেষ হয় 😎", body: "ZverT এ lesson অপেক্ষায়" }),
    () => ({ title: "Lesson skip দিলে streak risk 😶", body: "আজকের জন্য একটু সময় দেন" }),
  ] as Tpl[],
  evening_push: [
    () => ({ title: "সন্ধ্যা + focus = combo 🔥", body: "এই সময়টাই best — ১টা lesson শেষ করেন" }),
    (c) => ({ title: "Next lesson unlock! 🔓", body: `${c.moduleTitle ?? "Module"} ready, ready আপনি?` }),
    () => ({ title: "Course ta পড়ে আছে 👀", body: "২০ মিনিট = XP + progress + streak" }),
  ] as Tpl[],
  night_push: [
    () => ({ title: "দিন শেষ, একটু চর্চা? 🔥", body: "নিজেরই লাভ boss" }),
    () => ({ title: "Streak এখনো বাঁচানো যায় 😎", body: "৫ মিনিট = streak safe" }),
    () => ({ title: "ঘুমের আগে ১টা ছোট lesson?", body: "খারাপ না 👀" }),
  ] as Tpl[],
  streak_risk: [
    (c) => ({ title: "Streak fragile mode 👀", body: `${c.streak ?? 0} দিনের consistency ভেঙে যাইতেছে — ৫ মিনিট দেন!` }),
    () => ({ title: "আজকে না পড়লে streak break 😶", body: "১টা ছোট lesson = streak safe" }),
    () => ({ title: "এতদিনের consistency নষ্ট কইরেন না 😅", body: "Quick lesson দেন এখনই" }),
  ] as Tpl[],
  comeback_1d: [
    () => ({ title: "কালকে থামছিলেন, আজকে আবার? 😎", body: "ZverT এ ফেরত আসেন boss" }),
  ] as Tpl[],
  comeback_3d: [
    () => ({ title: "৩ দিন gap 😅", body: "Course কিন্তু অপেক্ষায় আছে boss" }),
  ] as Tpl[],
  comeback_7d: [
    () => ({ title: "অনেকদিন দেখা নাই 👀", body: "ZverT miss করতেছে 😄" }),
  ] as Tpl[],
  comeback_14d: [
    () => ({ title: "Comeback দিবেন নাকি? 🔥", body: "Skill কিন্তু বসে থাকলে বাড়ে না" }),
  ] as Tpl[],
  xp_gain: [
    (c) => ({ title: `Boom! +${c.xp ?? 50} XP 🔥`, body: "Progress bar আরো full হইছে" }),
    () => ({ title: "XP জমতেছে boss 😎", body: "আরেকটু effort = next level" }),
  ] as Tpl[],
  level_up: [
    (c) => ({ title: `Level Up! 🚀 Level ${c.level ?? 2}`, body: "আপনি আরেক ধাপ এগাইলেন" }),
  ] as Tpl[],
  weak_topic: [
    (c) => ({ title: `${c.weakTopic ?? "এই topic"} e একটু ঝামেলা?`, body: "AI ready আছে 😎 ২ মিনিট practice দেন" }),
    () => ({ title: "এই topic বারবার miss হচ্ছে 👀", body: "একটু revise করি?" }),
  ] as Tpl[],
  ai_recommendation: [
    (c) => ({ title: "AI detect করছে 📚", body: `${c.subject ?? "আপনার favorite subject"} এ next lesson ready` }),
    () => ({ title: "AI quick summary বানাইছে 😎", body: "দেখতে চান?" }),
  ] as Tpl[],
  ai_summary: [
    () => ({ title: "Summary ready ⚡", body: "৩০ সেকেন্ডে পুরা lesson ধরেন" }),
  ] as Tpl[],
  ai_quiz: [
    () => ({ title: "নতুন quiz generated 🧩", body: "২ মিনিট = solid revision" }),
  ] as Tpl[],
  quiz_reminder: [
    () => ({ title: "আগের quiz এ একটু miss হইছে 😅", body: "Quick practice দিবেন?" }),
  ] as Tpl[],
  unfinished_lesson: [
    (c) => ({ title: "Lesson half-done 👀", body: `${c.moduleTitle ?? "Lesson"} শেষ করেন — ৫ মিনিটই enough` }),
  ] as Tpl[],
  system_success: [
    () => ({ title: "Playlist convert complete 🔥", body: "এখন শুরু করেন 😎" }),
  ] as Tpl[],
  system_failure: [
    () => ({ title: "Oops 😅", body: "একটু network ঝামেলা, আবার try করি?" }),
  ] as Tpl[],
  payment: [
    () => ({ title: "Payment success ✅", body: "Premium ready boss" }),
  ] as Tpl[],
  subscription: [
    () => ({ title: "Premium শেষ হতে চলতেছে ⏳", body: "Miss কইরেন না" }),
  ] as Tpl[],
} as const;

export type TemplateCategory = keyof typeof T;

export function renderTemplate(category: TemplateCategory, ctx: Ctx = {}, seed = Date.now()) {
  const list = T[category];
  if (!list) return { title: "ZverT", body: "নতুন update আছে — দেখেন!" };
  return pick(list, seed)(ctx);
}

// Behaviour-aware time bucket → preferred template category
export function bucketForHour(hour: number): TemplateCategory {
  if (hour >= 5 && hour <= 11) return "morning_push";
  if (hour >= 12 && hour <= 16) return "afternoon_push";
  if (hour >= 17 && hour <= 20) return "evening_push";
  return "night_push";
}
