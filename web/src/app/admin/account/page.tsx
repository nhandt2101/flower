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
      setMessage("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Mật khẩu đã được cập nhật.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không thể cập nhật mật khẩu.");
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
      <AdminShell title="Tài khoản">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Thông tin tài khoản</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{session?.name ?? "Quản trị viên"}</h2>
              <p className="mt-2 text-sm text-slate-600">{session?.email ?? "admin@example.com"}</p>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Mật khẩu hiện tại
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Mật khẩu mới
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                Xác nhận mật khẩu mới
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
                className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Đăng xuất
              </button>
            </div>
            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
