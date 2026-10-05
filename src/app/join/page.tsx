"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function JoinPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"have" | "need" | "">("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!role) {
      setError("Please select what brings you to TRIANGLES.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage(
      "Account created successfully. Please check your email to verify your account."
    );
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
              href="/login"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md sm:px-5"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <section className="relative min-h-[calc(100vh-79px)] overflow-hidden px-5 py-12 sm:py-16">
        {/* DECORATIVE GEOMETRY */}
        <div className="pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full border border-[var(--accent)] opacity-20" />

        <div className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 rotate-45 border border-[var(--accent)] opacity-15" />

        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-[220px] font-thin text-[var(--accent)] opacity-[0.012]">
          △
        </div>

        <div className="relative mx-auto w-full max-w-xl">
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
              Create your account
            </p>

            <h1 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
              Join TRIANGLES
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
              Build your network around real skills, meaningful connections
              and opportunities.
            </p>
          </div>

          {/* FORM CARD */}
          <div className="triangles-glow rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9">
            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-2xl border border-[var(--danger)]/30 bg-[var(--surface-soft)] px-4 py-3 text-sm leading-5 text-[var(--danger)]">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="mb-6 rounded-2xl border border-[var(--success)]/30 bg-[var(--brand-soft)] px-4 py-4 text-sm leading-6 text-[var(--success)]">
                {message}

                <div className="mt-3">
                  <Link
                    href="/login"
                    className="font-bold underline underline-offset-2"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Use at least 6 characters.
                </p>
              </div>

              {/* ROLE */}
              <div>
                <p className="mb-3 text-sm font-semibold">
                  What brings you to TRIANGLES?
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* HAVE SKILL */}
                  <button
                    type="button"
                    onClick={() => setRole("have")}
                    className={`rounded-2xl border px-5 py-5 text-center transition ${
                      role === "have"
                        ? "border-[var(--accent)] bg-[var(--brand-soft)] text-[var(--accent)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-lg text-[var(--accent)] shadow-sm">
                      △
                    </div>

                    <div className="text-sm font-bold">
                      I HAVE A SKILL
                    </div>

                    <div className="mt-1 text-xs text-[var(--muted)]">
                      I want to showcase my work
                    </div>
                  </button>

                  {/* NEED SKILL */}
                  <button
                    type="button"
                    onClick={() => setRole("need")}
                    className={`rounded-2xl border px-5 py-5 text-center transition ${
                      role === "need"
                        ? "border-[var(--accent)] bg-[var(--brand-soft)] text-[var(--accent)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-lg text-[var(--accent)] shadow-sm">
                      ◇
                    </div>

                    <div className="text-sm font-bold">
                      I NEED A SKILL
                    </div>

                    <div className="mt-1 text-xs text-[var(--muted)]">
                      I want to find the right people
                    </div>
                  </button>
                </div>
              </div>

              {/* CREATE ACCOUNT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3.5 text-sm font-bold text-[var(--background)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* LOGIN */}
            <div className="mt-7 border-t border-[var(--border)] pt-6 text-center">
              <p className="text-sm text-[var(--muted)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[var(--accent)] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* TRUST */}
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
            <span>△ Professional profiles</span>
            <span>△ Skill-focused network</span>
            <span>△ Real opportunities</span>
          </div>
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