"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, setAdminSession } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getAdminSession()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setAdminSession({
        token: "demo-admin-token",
        email,
        name: "Quản trị viên",
      });
      setIsLoading(false);
      router.push("/admin");
    }, 400);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Flower Shop Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Đăng nhập quản trị</h1>
          <p className="mt-2 text-sm text-slate-600">Quản lý ảnh, bình luận và thông tin cửa hàng.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          {error ? <p className="rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
          </form>
        </div>
      </main>
    );
  }
