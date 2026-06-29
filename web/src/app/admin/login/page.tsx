"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { confirmSignIn, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function redirectIfSignedIn() {
      const session = await getAdminSession();
      if (mounted && session) {
        router.replace("/admin");
      }
    }

    void redirectIfSignedIn();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (needsNewPassword) {
      if (!newPassword) {
        setError("Vui lòng nhập mật khẩu mới.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await confirmSignIn(newPassword);
        if (result.isSignedIn) {
          router.push("/admin");
          return;
        }

        setError(`Tài khoản cần hoàn tất bước xác thực: ${result.nextStep.signInStep}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không đổi được mật khẩu mới.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);

      if (result.isSignedIn) {
        router.push("/admin");
        return;
      }

      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setNeedsNewPassword(true);
        return;
      }

      setError(`Tài khoản cần hoàn tất bước xác thực: ${result.nextStep.signInStep}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập không thành công.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-silver-soft bg-surface shadow-sm">
        <div className="border-b border-silver-soft px-8 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-accent">Flower Shop Admin</p>
          <h1 className="mt-3 text-3xl font-serif font-semibold text-foreground">Đăng nhập quản trị</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Quản lý ảnh, bình luận và thông tin cửa hàng.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
          <label className="block text-sm font-medium text-foreground">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={needsNewPassword}
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-3xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={needsNewPassword}
              placeholder="••••••••"
              className="mt-2 w-full rounded-3xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            />
          </label>

          {needsNewPassword ? (
            <label className="block text-sm font-medium text-foreground">
              Mật khẩu mới
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="mt-2 w-full rounded-3xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <span className="mt-2 block text-xs leading-5 text-muted">
                Cognito yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên.
              </span>
            </label>
          ) : null}

          {error ? <p className="rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-background shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : needsNewPassword ? "Lưu mật khẩu mới" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </main>
  );
}
