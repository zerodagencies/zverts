import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const COUNTRY_CODES = [
    { code: "+880", label: "🇧🇩 +880" },
    { code: "+91", label: "🇮🇳 +91" },
    { code: "+1", label: "🇺🇸 +1" },
    { code: "+44", label: "🇬🇧 +44" },
    { code: "+971", label: "🇦🇪 +971" },
    { code: "+966", label: "🇸🇦 +966" },
    { code: "+60", label: "🇲🇾 +60" },
    { code: "+65", label: "🇸🇬 +65" },
];

const REMIND_AFTER_DAYS = 5;

const phoneSchema = z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(/^[0-9]+$/, "Only digits allowed");

const nameSchema = z.string().trim().min(2, "Name is too short").max(80);

export const SupportContactPopup = () => {
    const { user, loading } = useAuth();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [country, setCountry] = useState("+880");
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (loading || !user) return;
        let cancelled = false;

        (async () => {
            // Already submitted?
            const { data: existing } = await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from("support_contacts" as any)
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (cancelled || existing) return;

            // Recently dismissed?
            const { data: dismissal } = await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from("support_contact_dismissals" as any)
                .select("dismissed_at")
                .eq("user_id", user.id)
                .maybeSingle();
            if (cancelled) return;
            if (dismissal && (dismissal as { dismissed_at: string }).dismissed_at) {
                const ageMs = Date.now() - new Date((dismissal as { dismissed_at: string }).dismissed_at).getTime();
                if (ageMs < REMIND_AFTER_DAYS * 86400_000) return;
            }

            // Prefill name from profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("name, certificate_name")
                .eq("id", user.id)
                .maybeSingle();
            if (cancelled) return;
            setName(
                profile?.name || profile?.certificate_name || user.user_metadata?.full_name || "",
            );

            // Small delay so it doesn't pop the very instant the page paints
            setTimeout(() => {
                if (!cancelled) setOpen(true);
            }, 1200);
        })();

        return () => {
            cancelled = true;
        };
    }, [user, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const nameRes = nameSchema.safeParse(name);
        if (!nameRes.success) return toast.error(nameRes.error.issues[0].message);
        const phoneRes = phoneSchema.safeParse(phone);
        if (!phoneRes.success) return toast.error(phoneRes.error.issues[0].message);

        setBusy(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from("support_contacts" as any).upsert(
            {
                user_id: user.id,
                name: nameRes.data,
                email: user.email,
                country_code: country,
                phone_number: phoneRes.data,
                whatsapp_enabled: whatsapp,
                source: "support_popup",
            },
            { onConflict: "user_id" },
        );
        setBusy(false);

        if (error) return toast.error(error.message || "Could not save number");
        toast.success("Thanks! Our team will be in touch.");
        setOpen(false);
    };

    const handleLater = async () => {
        if (!user) return setOpen(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("support_contact_dismissals" as any).upsert(
            {
                user_id: user.id,
                dismissed_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        );
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleLater();
            }}
        >
            <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-lime grid place-items-center shadow-glow mb-2">
                        <Phone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <DialogTitle className="text-center font-display text-2xl">
                        Stay Connected with ZverTs
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Submit your phone number so our team can contact you for learning support,
                        updates, guidance, and premium assistance.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor="sc-name">Full Name</Label>
                        <Input
                            id="sc-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1.5"
                        />
                    </div>

                    <div>
                        <Label htmlFor="sc-phone">Phone Number</Label>
                        <div className="mt-1.5 flex gap-2">
                            <Select value={country} onValueChange={setCountry}>
                                <SelectTrigger className="w-[110px] shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRY_CODES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="sc-phone"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="1XXXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                required
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <Checkbox checked={whatsapp} onCheckedChange={(v) => setWhatsapp(!!v)} />
                        This number is on WhatsApp
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="sm:flex-1"
                            onClick={handleLater}
                            disabled={busy}
                        >
                            Maybe Later
                        </Button>
                        <Button
                            type="submit"
                            className="sm:flex-1 bg-gradient-lime text-primary-foreground hover:opacity-95 shadow-glow"
                            disabled={busy}
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
