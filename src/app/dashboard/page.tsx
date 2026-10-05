"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Profile = {
  id: string;
  full_name: string | null;
  location: string | null;
  skill: string | null;
  role: string | null;
  about: string | null;
  professional_level: string | null;
  verified: boolean | null;
  test_score: number | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  async function handleSearch() {
    const value = search.trim();

    if (!value) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError("");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(
        `full_name.ilike.%${value}%,skill.ilike.%${value}%,location.ilike.%${value}%,role.ilike.%${value}%`
      )
      .limit(12);

    if (error) {
      setError(error.message);
      setSearching(false);
      return;
    }

    setResults(data || []);
    setSearching(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function getInitials(name: string | null) {
    if (!name) return "T";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  function getLevel(level: string | null) {
    return level || "Emerging Talent";
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* TOP ACCENT */}
      <div className="h-[3px] bg-[var(--accent)]" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* LOGO */}
          <Link href="/dashboard" className="flex items-center gap-3">
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

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[var(--accent)]"
            >
              Network
            </Link>

            <Link
              href="/community"
              className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
            >
              Community
            </Link>

            <Link
              href="/opportunities"
              className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
            >
              Opportunities
            </Link>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact />

            <Link
              href="/dashboard/profile"
              className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md sm:block"
            >
              My Profile
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--danger)] hover:text-[var(--danger)] hover:shadow-md sm:px-5"
            >
              Log out
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        <div className="border-t border-[var(--border)] px-5 py-3 md:hidden">
          <nav className="flex items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-[var(--accent)]"
            >
              Network
            </Link>

            <Link
              href="/community"
              className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Community
            </Link>

            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Opportunities
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <section className="relative overflow-hidden">
        {/* DECORATIVE GEOMETRY */}
        <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full border border-[var(--accent)] opacity-15" />

        <div className="pointer-events-none absolute -right-24 top-40 h-64 w-64 rotate-45 border border-[var(--accent)] opacity-10" />

        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 text-[260px] font-thin leading-none text-[var(--accent)] opacity-[0.012]">
          △
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          {/* WELCOME */}
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
              Your network
            </p>

            <h1 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
              Welcome,{" "}
              {loading
                ? "there"
                : profile?.full_name || "there"}
              .
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Discover people, opportunities and collaborations that can turn
              your skills into real possibilities.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-8 rounded-2xl border border-[var(--danger)]/30 bg-[var(--surface-soft)] px-5 py-4 text-sm leading-6 text-[var(--danger)]">
              {error}
            </div>
          )}

          {/* PROFILE SUMMARY */}
          <div className="triangles-glow rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              {/* PROFILE INFO */}
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--accent)]/30 bg-[var(--brand-soft)] text-lg font-bold text-[var(--accent)] shadow-sm">
                  {getInitials(profile?.full_name || null)}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted-soft)]">
                    Your profile
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {loading
                      ? "Loading..."
                      : profile?.full_name ||
                        "Complete your profile"}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile?.skill && (
                      <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        {profile.skill}
                      </span>
                    )}

                    {profile?.location && (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        {profile.location}
                      </span>
                    )}

                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                      {getLevel(profile?.professional_level || null)}
                    </span>
                  </div>
                </div>
              </div>

              {/* VERIFICATION */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:pr-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--brand-soft)] text-sm font-bold text-[var(--accent)]">
                      ✓
                    </div>

                    <span className="text-sm font-bold text-[var(--accent)]">
                      {profile?.verified
                        ? "Verified"
                        : "Not verified"}
                    </span>
                  </div>

                  {profile?.test_score !== null &&
                    profile?.test_score !== undefined && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Test score:{" "}
                        <span className="font-semibold text-[var(--foreground)]">
                          {profile.test_score}%
                        </span>
                      </p>
                    )}
                </div>

                <Link
                  href="/dashboard/profile"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm"
                >
                  My Profile
                </Link>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-14">
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
                Discover
              </p>

              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
                Find people
              </h2>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Search by skill, profession, name or location.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg text-[var(--accent)]">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="e.g. web developer, designer, marketing..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-4 pl-12 pr-5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={searching}
                className="rounded-2xl bg-[var(--brand)] px-8 py-4 text-sm font-bold text-[var(--background)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {/* QUICK SEARCHES */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Web Development",
                "Web Design",
                "Graphic Design",
                "Digital Marketing",
                "UI/UX",
                "SEO",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSearch(item);
                  }}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH RESULTS */}
          {results.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  People you may be looking for
                </h3>

                <span className="text-xs text-[var(--muted-soft)]">
                  {results.length} result
                  {results.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((person) => (
                  <Link
                    key={person.id}
                    href={`/profile/${person.id}`}
                    className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--brand-soft)] font-bold text-[var(--accent)]">
                        {getInitials(person.full_name)}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate font-bold">
                          {person.full_name || "Professional"}
                        </h4>

                        {person.skill && (
                          <p className="mt-1 truncate text-sm text-[var(--accent)]">
                            {person.skill}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {person.location && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                          {person.location}
                        </span>
                      )}

                      <span className="rounded-full border border-[var(--accent)]/15 bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                        {getLevel(person.professional_level)}
                      </span>
                    </div>

                    <div className="mt-5 text-xs font-bold text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
                      View professional →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* EMPTY SEARCH */}
          {!searching &&
            search.trim() &&
            results.length === 0 && (
              <div className="mt-8 rounded-[26px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--brand-soft)] text-xl text-[var(--accent)]">
                  △
                </div>

                <h3 className="mt-4 font-serif text-xl">
                  No matching professionals yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                  Try another skill, profession, name or location.
                </p>
              </div>
            )}

          {/* NETWORK AREAS */}
          <div className="mt-16">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
                Explore
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Your professional network
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {/* COMMUNITY */}
              <Link
                href="/community"
                className="group rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--brand-soft)] text-lg text-[var(--accent)]">
                  ◇
                </div>

                <h3 className="mt-7 font-serif text-2xl">
                  Community
                </h3>

                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Share professional updates, ideas and work with the network.
                </p>

                <span className="mt-6 inline-block text-sm font-bold text-[var(--accent)] transition group-hover:translate-x-1">
                  Explore community →
                </span>
              </Link>

              {/* OPPORTUNITIES */}
              <Link
                href="/opportunities"
                className="group rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--brand-soft)] text-lg text-[var(--accent)]">
                  ✦
                </div>

                <h3 className="mt-7 font-serif text-2xl">
                  Opportunities
                </h3>

                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Discover projects and professional opportunities connected
                  to your skills.
                </p>

                <span className="mt-6 inline-block text-sm font-bold text-[var(--accent)] transition group-hover:translate-x-1">
                  Find opportunities →
                </span>
              </Link>

              {/* PEOPLE */}
              <Link
                href="/people"
                className="group rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--brand-soft)] text-lg text-[var(--accent)]">
                  ○
                </div>

                <h3 className="mt-7 font-serif text-2xl">
                  People
                </h3>

                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Find professionals by skill, experience and location.
                </p>

                <span className="mt-6 inline-block text-sm font-bold text-[var(--accent)] transition group-hover:translate-x-1">
                  Meet people →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]">
                  <img
                    src="/triangles-logo.png"
                    alt="TRIANGLES"
                    className="h-7 w-7 object-contain"
                  />
                </div>

                <div className="text-lg font-bold tracking-[0.25em]">
                  TRIANGLES
                </div>
              </div>

              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
                A professional network built around real skills, people and
                meaningful opportunities.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--muted)]">
              <Link
                href="/dashboard/profile"
                className="transition hover:text-[var(--accent)]"
              >
                Profile
              </Link>

              <Link
                href="/community"
                className="transition hover:text-[var(--accent)]"
              >
                Community
              </Link>

              <Link
                href="/opportunities"
                className="transition hover:text-[var(--accent)]"
              >
                Opportunities
              </Link>

              <Link
                href="/people"
                className="transition hover:text-[var(--accent)]"
              >
                People
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted-soft)]">
            © 2026 TRIANGLES · Real skills. Real people. Real opportunities.
          </div>
        </div>
      </footer>
    </main>
  );
}