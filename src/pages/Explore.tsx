import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const Explore = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("courses").select("*").or("is_public.eq.true,is_system.eq.true").order("created_at", { ascending: false }).limit(60).then(({ data }) => setCourses(data ?? []));
  }, []);
  return (
    <AppShell>
      <section className="container py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-8">{t("courses.explore")}</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`} className="rounded-xl border border-border bg-gradient-card p-5 shadow-card hover:border-primary/40 hover:-translate-y-0.5 transition-all">
              {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full aspect-video object-cover rounded-lg mb-4 border border-border" loading="lazy" />}
              <h3 className="font-display text-lg leading-tight">{c.title}</h3>
              {c.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
};
export default Explore;