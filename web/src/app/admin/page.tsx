"use client";

import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

const items = [
  {
    href: "/admin/images",
    label: "Images",
    description: "Upload, place, and process gallery images.",
  },
  {
    href: "/admin/comments",
    label: "Comments",
    description: "Review customer notes and publish replies.",
  },
  {
    href: "/admin/settings",
    label: "Shop Settings",
    description: "Update contact details, hours, locale, and map preview.",
  },
  {
    href: "/admin/account",
    label: "Account",
    description: "Manage your admin profile and password.",
  },
];

export default function AdminIndexPage() {
  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <section className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-accent">{item.label}</p>
                <p className="mt-4 min-h-12 text-sm leading-6 text-muted">{item.description}</p>
                <p className="mt-6 text-sm font-semibold text-foreground transition group-hover:text-accent">
                  Open
                </p>
              </Link>
            ))}
          </div>

          <div className="rounded-3xl border border-silver-soft bg-surface p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-accent">Overview</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
              Keep the public site in bloom
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Use this area to manage the images, customer comments, and shop information shown across every locale.
            </p>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
