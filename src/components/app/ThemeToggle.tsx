import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" aria-label="Toggle theme"><Sun className="h-4 w-4" /></Button>;
  const isDark = theme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export const LanguageToggle = () => {
  const [lang, setLang] = useState<"en" | "bn">((typeof window !== "undefined" && (localStorage.getItem("i18nextLng") as any)) || "en");
  const toggle = async () => {
    const next = lang === "en" ? "bn" : "en";
    const i18n = (await import("@/lib/i18n")).default;
    i18n.changeLanguage(next);
    setLang(next);
  };
  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="font-mono text-xs">
      {lang === "en" ? "বাংলা" : "EN"}
    </Button>
  );
};