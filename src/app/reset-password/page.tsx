"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new one."
        );
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setMessage("Password updated successfully!");

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0C0B] text-[#F5F1E8] flex items-center justify-center">
        <p className="text-[#A8A49A]">Loading TRIANGLES...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0C0B] text-[#F5F1E8] flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <svg
            width="42"
            height="42"
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="21"
              cy="21"
              r="19"
              stroke="#C9A45C"
              strokeWidth="1.5"
            />

            <path
              d="M21 10L31 29H11L21 10Z"
              stroke="#C9A45C"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />

            <path
              d="M21 17L25.5 25H16.5L21 17Z"
              stroke="#C9A45C"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>

          <span className="text-xl tracking-[0.28em] font-medium">
            TRIANGLES
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#2A2A25] bg-[#121412] p-8 shadow-2xl">

          <h1 className="text-3xl font-serif mb-2">
            Reset password
          </h1>

          <p className="text-[#A8A49A] text-sm mb-8">
            Create a new password for your TRIANGLES account.
          </p>

          {error ? (
            <div className="mb-5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mb-5 rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/10 px-4 py-3 text-sm text-[#E0C27A]">
              {message}
            </div>
          ) : null}

          {!error && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">

              <div>
                <label className="block text-sm text-[#A8A49A] mb-2">
                  New password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-[#2A2A25] bg-[#0B0C0B] px-4 py-3 text-[#F5F1E8] outline-none transition focus:border-[#C9A45C]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#A8A49A] mb-2">
                  Confirm password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter password again"
                  className="w-full rounded-xl border border-[#2A2A25] bg-[#0B0C0B] px-4 py-3 text-[#F5F1E8] outline-none transition focus:border-[#C9A45C]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#C9A45C] py-3.5 font-medium text-[#0B0C0B] transition hover:bg-[#E0C27A] disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update password"}
              </button>

            </form>
          )}

          {error && (
            <button
              onClick={() => router.replace("/login")}
              className="mt-4 w-full rounded-xl border border-[#3A3933] py-3 text-sm text-[#F5F1E8] hover:border-[#C9A45C] transition"
            >
              Back to Login
            </button>
          )}

        </div>

        <p className="text-center text-xs text-[#77756E] mt-6">
          © TRIANGLES
        </p>

      </div>
    </main>
  );
}