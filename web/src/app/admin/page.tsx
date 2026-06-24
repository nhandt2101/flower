"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import Link from "next/link";

export default function AdminIndexPage() {
  const items = [
    { href: "/admin/images", label: "Quản lý hình ảnh" },
    { href: "/admin/comments", label: "Quản lý bình luận" },
    { href: "/admin/settings", label: "Cài đặt cửa hàng" },
    { href: "/admin/account", label: "Tài khoản" },
  ];

  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <section className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-900 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-slate-500">{c.label}</p>
                <p className="mt-4 text-xl font-bold">Mở</p>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Chào mừng đến với trang quản trị</h2>
            <p className="mt-3 text-sm text-slate-600">Từ đây bạn có thể quản lý hình ảnh, bình luận và cài đặt cửa hàng.</p>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
