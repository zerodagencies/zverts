import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const en = {
  nav: { dashboard: "Dashboard", courses: "Courses", explore: "Explore", profile: "Profile", admin: "Admin", leaderboard: "Leaderboard", signin: "Sign in", signout: "Sign out" },
  common: { loading: "Loading…", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", create: "Create", back: "Back", next: "Next", continue: "Continue", complete: "Complete", retry: "Retry", submit: "Submit" },
  hero: { eyebrow: "Free · Sequential · Verified", title1: "Learn with", title2: "discipline", title3: "not distraction.", subtitle: "Turn any YouTube playlist into a locked, gamified, verified course. Earn gems, level up, and finish what you start.", cta: "Start free", how: "How it works ↓" },
  dashboard: { welcome: "Welcome back", continue: "Continue learning", progress: "Course progress", completed: "Completed", watchTime: "Watch time", streak: "Day streak", weeklyTitle: "Minutes watched · last 7 days", modules: "Modules", checkin: "Daily check-in", checkedIn: "Checked in today", level: "Level", xp: "XP", gems: "Gems", accuracy: "Accuracy" },
  courses: { mine: "My courses", createNew: "Create from playlist", playlistPlaceholder: "Paste YouTube playlist URL…", import: "Import", public: "Public", private: "Private", makePublic: "Make public", makePrivate: "Make private", noModules: "No modules yet", deleteCourse: "Delete course", confirmDelete: "Delete this course and all its progress?", share: "Share link", explore: "Explore public courses" },
  module: { lockedTitle: "This module is locked", lockedBody: "Complete the previous module to unlock it.", watchProgress: "Watch progress", markComplete: "Mark complete", nextModule: "Next module", takeQuiz: "Take quiz", quizPassed: "Quiz passed ✓", notes: "Notes", addNote: "Add note", noteAt: "at" },
  mcq: { title: "Module quiz", subtitle: "Score 8 / 10 to pass", question: "Question", submit: "Submit answers", passed: "Passed!", failed: "Not yet — try again", scored: "You scored", correct: "correct", reward: "+1 gem · +30 XP" },
  profile: { title: "Profile", name: "Name", email: "Email", certificateName: "Name on certificate", photo: "Profile photo", upload: "Upload photo", language: "Language", saved: "Saved" },
  admin: { title: "Admin panel", users: "Users", emailLogs: "Email logs", inactive: "Inactive users", gems: "Gems", xp: "XP", lastActive: "Last active" },
  cert: { title: "Certificate", download: "Download PDF", awarded: "Awarded to", on: "on", code: "Certificate ID", presented: "This certificate is presented to" },
  leaderboard: { title: "Leaderboard", weekly: "Weekly", monthly: "Monthly", allTime: "All time", rank: "Rank" },
  footer: { credit: "Made by Kazi Tauhid Rana" },
};

const bn = {
  nav: { dashboard: "ড্যাশবোর্ড", courses: "কোর্স", explore: "এক্সপ্লোর", profile: "প্রোফাইল", admin: "অ্যাডমিন", leaderboard: "লিডারবোর্ড", signin: "সাইন ইন", signout: "সাইন আউট" },
  common: { loading: "লোড হচ্ছে…", save: "সংরক্ষণ", cancel: "বাতিল", delete: "মুছুন", edit: "এডিট", create: "তৈরি", back: "ফিরে", next: "পরবর্তী", continue: "চালিয়ে যান", complete: "সম্পন্ন", retry: "আবার চেষ্টা", submit: "জমা" },
  hero: { eyebrow: "ফ্রি · ধারাবাহিক · যাচাইকৃত", title1: "শৃঙ্খলার সাথে", title2: "শিখুন", title3: "বিভ্রান্তি ছাড়াই।", subtitle: "যেকোনো ইউটিউব প্লেলিস্টকে লকড, গেমিফাইড কোর্সে রূপান্তর করুন। জেম অর্জন করুন, লেভেল আপ করুন, এবং শেষ করুন।", cta: "ফ্রিতে শুরু", how: "কিভাবে কাজ করে ↓" },
  dashboard: { welcome: "স্বাগতম", continue: "চালিয়ে যান", progress: "কোর্সের অগ্রগতি", completed: "সম্পন্ন", watchTime: "দেখার সময়", streak: "দৈনিক স্ট্রিক", weeklyTitle: "শেষ ৭ দিন", modules: "মডিউল", checkin: "দৈনিক উপস্থিতি", checkedIn: "আজ উপস্থিত", level: "লেভেল", xp: "এক্সপি", gems: "জেম", accuracy: "নির্ভুলতা" },
  courses: { mine: "আমার কোর্স", createNew: "প্লেলিস্ট থেকে তৈরি", playlistPlaceholder: "ইউটিউব প্লেলিস্ট URL…", import: "ইম্পোর্ট", public: "পাবলিক", private: "প্রাইভেট", makePublic: "পাবলিক করুন", makePrivate: "প্রাইভেট করুন", noModules: "কোনো মডিউল নেই", deleteCourse: "কোর্স মুছুন", confirmDelete: "এই কোর্স এবং অগ্রগতি মুছবেন?", share: "শেয়ার লিংক", explore: "পাবলিক কোর্স দেখুন" },
  module: { lockedTitle: "এই মডিউলটি লক", lockedBody: "আনলক করতে আগের মডিউল সম্পন্ন করুন।", watchProgress: "দেখার অগ্রগতি", markComplete: "সম্পন্ন চিহ্নিত করুন", nextModule: "পরবর্তী মডিউল", takeQuiz: "কুইজ দিন", quizPassed: "কুইজ পাশ ✓", notes: "নোট", addNote: "নোট যোগ করুন", noteAt: "এ" },
  mcq: { title: "মডিউল কুইজ", subtitle: "পাশের জন্য ৮/১০ লাগবে", question: "প্রশ্ন", submit: "জমা দিন", passed: "পাশ!", failed: "এখনো নয় — আবার চেষ্টা করুন", scored: "আপনি পেয়েছেন", correct: "সঠিক", reward: "+১ জেম · +৩০ এক্সপি" },
  profile: { title: "প্রোফাইল", name: "নাম", email: "ইমেইল", certificateName: "সার্টিফিকেটে নাম", photo: "প্রোফাইল ছবি", upload: "ছবি আপলোড", language: "ভাষা", saved: "সংরক্ষিত" },
  admin: { title: "অ্যাডমিন প্যানেল", users: "ইউজার", emailLogs: "ইমেইল লগ", inactive: "নিষ্ক্রিয় ইউজার", gems: "জেম", xp: "এক্সপি", lastActive: "শেষ সক্রিয়" },
  cert: { title: "সার্টিফিকেট", download: "PDF ডাউনলোড", awarded: "প্রদান করা হয়েছে", on: "তারিখে", code: "সার্টিফিকেট আইডি", presented: "এই সার্টিফিকেট প্রদান করা হলো" },
  leaderboard: { title: "লিডারবোর্ড", weekly: "সাপ্তাহিক", monthly: "মাসিক", allTime: "সর্বকালের", rank: "র‌্যাঙ্ক" },
  footer: { credit: "তৈরি করেছেন কাজী তৌহিদ রানা" },
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;