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
        setError("Enter a new password.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await confirmSignIn(newPassword);
        if (result.isSignedIn) {
          router.push("/admin");
          return;
        }

        setError(`Your account needs another sign-in step: ${result.nextStep.signInStep}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the new password.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError("Enter email and password.");
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

      setError(`Your account needs another sign-in step: ${result.nextStep.signInStep}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.32em] text-accent">Flower Shop Admin</p>
          <h1 className="mt-4 max-w-xl font-serif text-6xl font-semibold leading-none text-foreground">
            Manage every locale from one calm place.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-muted">
            Keep images, comments, contact details, and map language aligned with the public storefront.
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-silver-soft bg-surface shadow-sm">
          <div className="border-b border-silver-soft px-7 py-7">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Blutenhaus</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-foreground">Admin sign in</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Use your admin account to update public content.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-7 py-7">
            <label className="block text-sm font-medium text-foreground">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={needsNewPassword}
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={needsNewPassword}
                placeholder="********"
                className="mt-2 w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
            </label>

            {needsNewPassword ? (
              <label className="block text-sm font-medium text-foreground">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter a new password"
                  className="mt-2 w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <span className="mt-2 block text-xs leading-5 text-muted">
                  Your account requires a new password before entering the dashboard.
                </span>
              </label>
            ) : null}

            {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Working..." : needsNewPassword ? "Save new password" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
