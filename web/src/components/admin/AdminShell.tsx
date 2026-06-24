"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearAdminSession, getAdminSession } from "@/lib/adminAuth";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/images", label: "Quản lý hình ảnh" },
  { href: "/admin/comments", label: "Quản lý bình luận" },
  { href: "/admin/settings", label: "Cài đặt" },
  { href: "/admin/account", label: "Tài khoản" },
];

export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = getAdminSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col lg:flex-row">
        <aside className="border-r border-slate-200 bg-white px-6 py-8 lg:w-72">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400 text-xl font-semibold text-white shadow-sm">F</div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Flower Admin</p>
              <p className="text-lg font-semibold text-slate-900">Quản trị</p>
            </div>
          </div>

          <nav className="space-y-2">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Tài khoản</p>
            <p>{session?.name ?? "Admin"}</p>
            <p className="mt-1 text-xs text-slate-500">{session?.email ?? "admin@shop.com"}</p>
            <div className="mt-4">
              <button
                onClick={() => {
                  clearAdminSession();
                  router.push("/admin/login");
                }}
                className="inline-flex items-center rounded-full bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Bảng</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
