import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const InstallPrompt = () => {
    const [evt, setEvt] = useState<BIPEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("zverts.installDismissed") === "1") return;
        // Hide if already running standalone
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        if (standalone) return;

        const onBIP = (e: Event) => {
            e.preventDefault();
            setEvt(e as BIPEvent);
            setVisible(true);
        };
        window.addEventListener("beforeinstallprompt", onBIP);
        return () => window.removeEventListener("beforeinstallprompt", onBIP);
    }, []);

    if (!visible || !evt) return null;

    const install = async () => {
        try {
            await evt.prompt();
            await evt.userChoice;
        } finally {
            setVisible(false);
            setEvt(null);
        }
    };

    const dismiss = () => {
        localStorage.setItem("zverts.installDismissed", "1");
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-3 flex items-center gap-3 animate-fade-in">
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Install ZverTs</div>
                <div className="text-xs text-muted-foreground truncate">
                    Add to home screen for an app-like experience.
                </div>
            </div>
            <Button size="sm" onClick={install}>
                <Download className="h-4 w-4 mr-1.5" />
                Install
            </Button>
            <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss">
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};
