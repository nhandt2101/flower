"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "aws-amplify/auth";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { clearAdminSession, getAdminSession, type AdminSession } from "@/lib/adminAuth";
import "@/lib/amplify-config";

export default function AdminAccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const currentSession = await getAdminSession();
      if (mounted) {
        setSession(currentSession);
      }
    }

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePasswordUpdate = async () => {
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("The new password and confirmation do not match.");
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await clearAdminSession();
    router.push("/admin/login");
  };

  return (
    <AdminGuard>
      <AdminShell title="Account">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Admin profile</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
                {session?.name ?? "Administrator"}
              </h2>
              <p className="mt-2 text-sm text-muted">{session?.email ?? "admin@example.com"}</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                Current password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground lg:col-span-2">
                Confirm new password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
                className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-2xl border border-silver-soft bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </div>
            {message ? <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p> : null}
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
