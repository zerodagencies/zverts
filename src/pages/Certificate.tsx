import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Award, Download } from "lucide-react";
import { jsPDF } from "jspdf";

const Certificate = () => {
    const { courseId } = useParams();
    const { user, loading } = useAuth();
    const { t } = useTranslation();
    const [cert, setCert] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        if (!user || !courseId) return;
        supabase.rpc("issue_certificate", { _course_id: courseId }).then(({ data, error }) => {
            if (error) {
                toast.error(error.message);
                return;
            }
            setCert(data);
        });
    }, [user, courseId]);

    if (loading) return null;
    if (!user) return <Navigate to="/auth" replace />;

    const download = () => {
        if (!cert) return;
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const w = doc.internal.pageSize.getWidth(),
            h = doc.internal.pageSize.getHeight();
        doc.setFillColor(15, 17, 22);
        doc.rect(0, 0, w, h, "F");
        doc.setDrawColor(190, 240, 80);
        doc.setLineWidth(3);
        doc.rect(30, 30, w - 60, h - 60);
        doc.setTextColor(190, 240, 80);
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("ZERO·D ACADEMY", w / 2, 100, { align: "center" });
        doc.setTextColor(245, 240, 230);
        doc.setFontSize(40);
        doc.setFont("times", "italic");
        doc.text(t("cert.title"), w / 2, 170, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(t("cert.presented"), w / 2, 220, { align: "center" });
        doc.setFontSize(36);
        doc.setFont("times", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(cert.issued_to_name, w / 2, 280, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(`for completing  "${cert.course_title}"`, w / 2, 320, { align: "center" });
        doc.setFontSize(11);
        doc.setTextColor(190, 240, 80);
        doc.text(`${t("cert.code")}: ${cert.certificate_code}`, w / 2, h - 80, { align: "center" });
        doc.setTextColor(140, 140, 140);
        doc.text(
            `${t("cert.on")} ${new Date(cert.issued_at).toLocaleDateString()}`,
            w / 2,
            h - 60,
            { align: "center" },
        );
        doc.save(`zerod-${cert.certificate_code}.pdf`);
    };

    return (
        <AppShell>
            <section className="container py-12 max-w-3xl">
                <h1 className="font-display text-4xl font-semibold tracking-tight mb-8 inline-flex items-center gap-3">
                    <Award className="h-8 w-8 text-primary" />
                    {t("cert.title")}
                </h1>
                {cert ? (
                    <div className="rounded-2xl border border-border bg-gradient-card p-10 shadow-elevated text-center">
                        <p className="text-muted-foreground text-sm font-mono">
                            {t("cert.presented")}
                        </p>
                        <p className="font-display text-3xl mt-3">{cert.issued_to_name}</p>
                        <p className="text-muted-foreground mt-2">
                            for completing{" "}
                            <span className="text-foreground font-medium">{cert.course_title}</span>
                        </p>
                        <p className="font-mono text-xs text-primary mt-6">
                            {cert.certificate_code}
                        </p>
                        <Button
                            onClick={download}
                            className="mt-8 bg-gradient-lime text-primary-foreground hover:opacity-90 shadow-glow"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {t("cert.download")}
                        </Button>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Loading certificate…</p>
                )}
            </section>
        </AppShell>
    );
};
export default Certificate;
