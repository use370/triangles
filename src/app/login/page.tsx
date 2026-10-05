"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password reset link has been sent to your email.");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* TOP ACCENT */}
      <div className="h-[3px] bg-[var(--accent)]" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <img
                src="/triangles-logo.png"
                alt="TRIANGLES"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
              <div className="text-[16px] font-bold tracking-[0.24em]">
                TRIANGLES
              </div>

              <div className="text-[8px] tracking-[0.22em] text-[var(--muted)]">
                PROFESSIONAL NETWORK
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact />

            <Link
              href="/join"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md sm:px-5"
            >
              Join
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <section className="relative flex min-h-[calc(100vh-79px)] items-center justify-center overflow-hidden px-5 py-12 sm:py-16">
        {/* DECORATIVE TRIANGLES */}
        <div className="pointer-events-none absolute left-[-120px] top-20 h-72 w-72 rounded-full border border-[var(--accent)] opacity-20" />

        <div className="pointer-events-none absolute right-[-120px] bottom-10 h-72 w-72 rotate-45 border border-[var(--accent)] opacity-15" />

        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 text-[230px] font-thin leading-none text-[var(--accent)] opacity-[0.012]">
          △
        </div>

        <div className="relative w-full max-w-md">
          {/* INTRO */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <img
                src="/triangles-logo.png"
                alt="TRIANGLES"
                className="h-11 w-11 object-contain"
              />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
              Welcome back
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="triangles-glow rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9">
            <div>
              <h1 className="font-serif text-4xl tracking-[-0.025em] sm:text-[42px]">
                Log in to TRIANGLES
              </h1>

              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Connect your skills with people, projects and real
                opportunities.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-6 rounded-2xl border border-[var(--danger)]/30 bg-[var(--surface-soft)] px-4 py-3 text-sm leading-5 text-[var(--danger)]">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="mt-6 rounded-2xl border border-[var(--success)]/30 bg-[var(--brand-soft)] px-4 py-3 text-sm leading-5 text-[var(--success)]">
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-xs font-semibold text-[var(--accent)] transition hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 pr-20 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--accent)]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--accent)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* LOGIN */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3.5 text-sm font-bold text-[var(--background)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--border)]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-soft)]">
                New here?
              </span>

              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {/* JOIN */}
            <Link
              href="/join"
              className="flex w-full items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:text-[var(--accent)] hover:shadow-sm"
            >
              Create your TRIANGLES account
            </Link>
          </div>

          {/* BOTTOM NOTE */}
          <p className="mt-7 text-center text-xs leading-5 text-[var(--muted)]">
            By continuing, you agree to use TRIANGLES for professional and
            work-related networking.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-7 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <img
            src="/triangles-logo.png"
            alt="TRIANGLES"
            className="h-6 w-6 object-contain"
          />

          <span className="text-xs font-bold tracking-[0.2em]">
            TRIANGLES
          </span>
        </div>

        <p className="text-xs tracking-wide text-[var(--muted)]">
          © 2026 TRIANGLES · Real skills. Real people. Real opportunities.
        </p>
      </footer>
    </main>
  );
}