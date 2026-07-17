import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSection } from "@/components/app/PageSection";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminManagementInner = () => {
    const [admins, setAdmins] = useState<Record<string, unknown>[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "super_admin">("admin");
    const [busy, setBusy] = useState(false);

    const load = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase.rpc("list_admin_users" as any);
        setAdmins((data as Record<string, unknown>[]) ?? []);
    };
    useEffect(() => {
        load();
    }, []);

    const grant = async () => {
        if (!email.trim()) return;
        setBusy(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.rpc("admin_set_role" as any, {
            _email: email.trim(),
            _role: role,
            _grant: true,
        });
        setBusy(false);
        if (error) toast.error(error.message);
        else {
            toast.success("Role granted");
            setEmail("");
            load();
        }
    };
    const revoke = async (userEmail: string, r: string) => {
        if (!confirm(`Remove ${r} from ${userEmail}?`)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.rpc("admin_set_role" as any, {
            _email: userEmail,
            _role: r,
            _grant: false,
        });
        if (error) toast.error(error.message);
        else {
            toast.success("Revoked");
            load();
        }
    };

    return (
        <AppShell>
            <section className="container py-10 max-w-4xl">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    / admin · roles
                </div>
                <h1 className="font-display text-4xl font-semibold mt-2">Admin management</h1>
                <p className="text-muted-foreground mt-2">
                    Only super admins can grant or remove roles.
                </p>

                <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        Grant role
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[240px]">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="user@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
                                className="mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="admin">admin</option>
                                <option value="super_admin">super_admin</option>
                            </select>
                        </div>
                        <Button
                            onClick={grant}
                            disabled={busy}
                            className="bg-gradient-lime text-primary-foreground"
                        >
                            Grant
                        </Button>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                        Current admins ({admins.length})
                    </div>
                    <div className="divide-y divide-border">
                        {admins.map((a) => (
                            <div key={a.user_id} className="p-4 flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="font-medium">{a.name}</div>
                                    <div className="text-xs text-muted-foreground">{a.email}</div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {a.roles.map((r: string) => (
                                        <button
                                            key={r}
                                            onClick={() => revoke(a.email, r)}
                                            className="px-2.5 py-1 rounded-full text-xs font-mono border border-primary/40 text-primary bg-primary/10 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
                                        >
                                            {r} ×
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AppShell>
    );
};
const AdminManagement = () => (
    <RequireRole role="super_admin">
        <AdminManagementInner />
    </RequireRole>
);
export default AdminManagement;
