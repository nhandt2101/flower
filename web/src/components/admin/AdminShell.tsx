"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearAdminSession, getAdminSession, type AdminSession } from "@/lib/adminAuth";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/images", label: "Images" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/account", label: "Account" },
];

export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:gap-6 lg:px-8 lg:py-6">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-fit lg:w-72 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:block">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-sm">
                F
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Flower Admin</p>
                <p className="truncate text-base font-semibold text-slate-950">Control panel</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition lg:block ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:mt-8">
            <p className="font-semibold text-slate-950">Account</p>
            <p className="mt-2 truncate text-sm font-medium text-slate-900">{session?.name ?? "Admin"}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{session?.email ?? "admin@shop.com"}</p>
            <button
              onClick={async () => {
                await clearAdminSession();
                router.push("/admin/login");
              }}
              className="mt-4 inline-flex items-center rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Manage your shop content, images, comments, and settings.
              </p>
            </div>
          </div>

          <div className="mt-4 lg:mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
