"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";

let cachedAdminAccess = false;

export default function AdminGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(cachedAdminAccess);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      if (cachedAdminAccess) return;

      const authenticated = await isAdminAuthenticated();
      if (!mounted) return;

      if (!authenticated) {
        cachedAdminAccess = false;
        router.replace("/admin/login");
        return;
      }

      cachedAdminAccess = true;
      setReady(true);
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-700">Checking access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
