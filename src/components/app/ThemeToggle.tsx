import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
] as const;

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const current = themes.find((t) => t.value === theme) ?? themes[2];
    const Icon = mounted ? current.icon : Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Theme">
                    <Icon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {themes.map(({ value, label, icon: ItemIcon }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                            "gap-2",
                            mounted && theme === value && "text-primary font-medium",
                        )}
                    >
                        <ItemIcon className="h-4 w-4 shrink-0" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const LanguageToggle = () => {
    const [lang, setLang] = useState<"en" | "bn">(
        (typeof window !== "undefined" && (localStorage.getItem("i18nextLng") as any)) || "en",
    );
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
