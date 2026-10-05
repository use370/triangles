"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";

type Profile = {
  id: string;
  full_name: string | null;
  location: string | null;
  skill: string | null;
  role: string | null;
  professional_level: string | null;
  verified: boolean | null;
};

const suggestions = [
  "Web Development",
  "Web Design",
  "Full-Stack Development",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "SEO",
  "Content Writing",
  "Video Editing",
  "Photography",
  "Business Development",
];

export default function HomePage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  /* =====================================================
     THEME
  ===================================================== */

  useEffect(() => {
    const savedTheme = localStorage.getItem("triangles-theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggleTheme() {
    const nextMode = !darkMode;

    setDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("triangles-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("triangles-theme", "light");
    }
  }

  /* =====================================================
     PAGE READY
  ===================================================== */

  useEffect(() => {
    setCheckingAuth(false);
  }, []);

  /* =====================================================
     SEARCH PEOPLE
  ===================================================== */

  async function searchPeople(value?: string) {
    const query = (value ?? search).trim();

    setSearch(query);
    setShowSuggestions(false);
    setSearched(true);
    setLoading(true);

    try {
      let request = supabase
        .from("profiles")
        .select(
          "id, full_name, location, skill, role, professional_level, verified"
        )
        .limit(12);

      if (!query) {
        const { data, error } = await request;

        if (error) {
          console.error("Profile search error:", error);
          setProfiles([]);
        } else {
          setProfiles((data as Profile[]) || []);
        }

        setLoading(false);
        return;
      }

      const cleanQuery = query
        .replace(/,/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const words = cleanQuery
        .split(" ")
        .filter(Boolean);

      const searchConditions: string[] = [];

      words.forEach((word) => {
        const safe = word
          .replace(/[%_]/g, "")
          .trim();

        if (!safe) return;

        searchConditions.push(
          `full_name.ilike.%${safe}%`
        );

        searchConditions.push(
          `skill.ilike.%${safe}%`
        );

        searchConditions.push(
          `location.ilike.%${safe}%`
        );

        searchConditions.push(
          `role.ilike.%${safe}%`
        );
      });

      if (searchConditions.length > 0) {
        request = request.or(
          searchConditions.join(",")
        );
      }

      const { data, error } = await request;

      if (error) {
        console.error("Profile search error:", error);
        setProfiles([]);
        return;
      }

      setProfiles((data as Profile[]) || []);
    } catch (error) {
      console.error("Search failed:", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  function handleSearchChange(value: string) {
    setSearch(value);
    setShowSuggestions(value.trim().length > 0);

    if (!value.trim()) {
      setShowSuggestions(false);
      setSearched(false);
      setProfiles([]);
    }
  }

  /* =====================================================
     KEYBOARD SEARCH
  ===================================================== */

  function handleSearchKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      searchPeople();
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  /* =====================================================
     FILTER SUGGESTIONS
  ===================================================== */

  const filteredSuggestions =
    search.trim().length === 0
      ? suggestions.slice(0, 6)
      : suggestions
          .filter((item) =>
            item
              .toLowerCase()
              .includes(search.toLowerCase())
          )
          .slice(0, 6);

  /* =====================================================
     LOADING
  ===================================================== */

  if (checkingAuth) {
    return <LoadingLogo />;
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-[var(--background)]
        text-[var(--foreground)]
        transition-colors
        duration-300
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-[var(--border)]
          bg-[color-mix(in_srgb,var(--background)_92%,transparent)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-5
            py-3
            sm:px-6
            lg:px-10
          "
        >
          {/* LOGO */}

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
            aria-label="TRIANGLES home"
          >
            <div className="flex h-16 w-16 items-center justify-center sm:h-18 sm:w-18">
              <img
                src="/triangles-logo.png"
                alt="TRIANGLES"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="text-left">
              <p className="text-[16px] font-bold tracking-[0.24em] text-[var(--foreground)] sm:text-[18px]">
                TRIANGLES
              </p>

              <p className="mt-0.5 text-[8px] tracking-[0.28em] text-[var(--muted)] sm:text-[9px]">
                PROFESSIONAL NETWORK
              </p>
            </div>
          </button>

          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 md:flex lg:gap-10">
            <button
              onClick={() =>
                router.push("/community")
              }
              className="
                text-sm
                text-[var(--muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              Community
            </button>

            <button
              onClick={() =>
                router.push("/needs")
              }
              className="
                text-sm
                text-[var(--muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              Opportunities
            </button>

            <button
              onClick={() => {
                setSearched(true);
                searchPeople("");
              }}
              className="
                text-sm
                text-[var(--muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              People
            </button>

            <button
              onClick={() => router.push("/about")}
              className="
                text-sm
                text-[var(--muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              About
            </button>
          </nav>

          {/* RIGHT ACTIONS */}

          <div className="flex items-center gap-2">
            {/* THEME */}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-[var(--border)]
                bg-[var(--surface)]
                text-[var(--foreground)]
                shadow-sm
                transition
                hover:border-[var(--accent)]
                hover:bg-[var(--surface-soft)]
              "
            >
              {darkMode ? "☀" : "☾"}
            </button>

            {/* LOGIN */}

            <button
              onClick={() => router.push("/login")}
              className="
                rounded-full
                border
                border-[var(--foreground)]
                bg-transparent
                px-5
                py-2.5
                text-sm
                font-semibold
                text-[var(--foreground)]
                transition
                hover:bg-[var(--foreground)]
                hover:text-[var(--background)]
              "
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="
          relative
          overflow-hidden
          border-b
          border-[var(--border)]
        "
      >
        {/* LARGE SYMMETRICAL DECORATION */}

        <div
          className="
            pointer-events-none
            absolute
            -left-32
            top-12
            h-72
            w-72
            rounded-full
            border
            border-[var(--accent)]
            opacity-[0.18]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -left-24
            top-24
            h-56
            w-56
            rounded-full
            border
            border-[var(--accent)]
            opacity-[0.12]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-[-90px]
            top-[-80px]
            h-80
            w-80
            rotate-45
            border
            border-[var(--accent)]
            opacity-[0.15]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            bottom-[-120px]
            left-1/2
            h-72
            w-72
            -translate-x-1/2
            rotate-45
            border
            border-[var(--accent)]
            opacity-[0.08]
          "
        />

        {/* HERO CONTENT */}

        <div
          className="
            relative
            mx-auto
            grid
            max-w-7xl
            gap-12
            px-5
            py-14
            sm:px-6
            sm:py-16
            lg:grid-cols-[1.05fr_0.95fr]
            lg:gap-16
            lg:px-10
            lg:py-24
          "
        >
          {/* LEFT */}

          <div className="relative z-10 flex flex-col justify-center">
            {/* EYEBROW */}

            <div
              className="
                mb-8
                inline-flex
                w-fit
                items-center
                gap-3
                rounded-full
                border
                border-[var(--border-strong)]
                bg-[var(--surface)]
                px-4
                py-2
                shadow-sm
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[var(--accent)]
                "
              />

              <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.24em]
                  text-[var(--muted)]
                "
              >
                Skills meet opportunity
              </span>
            </div>

            {/* HEADING */}

            <h1
              className="
                max-w-3xl
                font-serif
                text-5xl
                font-medium
                leading-[1.02]
                tracking-[-0.045em]
                text-[var(--foreground)]
                sm:text-6xl
                lg:text-7xl
              "
            >
              Your skills deserve
              <span
                className="
                  block
                  text-[var(--foreground)]
                "
              >
                the right network.
              </span>
            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                mt-8
                max-w-xl
                text-base
                leading-8
                text-[var(--muted)]
                sm:text-lg
              "
            >
              TRIANGLES connects skilled professionals
              with people, projects and opportunities
              that actually match what they can do.
            </p>

            {/* CTA */}

            <div
              className="
                mt-10
                flex
                flex-col
                gap-3
                sm:flex-row
              "
            >
              {/* BUILD NETWORK */}

              <button
                onClick={() =>
                  router.push("/join")
                }
                className="
                  group
                  rounded-full
                  bg-[var(--brand)]
                  px-8
                  py-4
                  font-semibold
                  text-[var(--background)]
                  shadow-[0_12px_30px_rgba(0,0,0,0.10)]
                  transition
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[var(--brand-dark)]
                "
              >
                Build your network

                <span
                  className="
                    ml-3
                    inline-block
                    transition
                    group-hover:translate-x-1
                  "
                >
                  →
                </span>
              </button>

              {/* EXPLORE */}

              <button
                onClick={() => {
                  setSearched(true);
                  searchPeople("");
                }}
                className="
                  rounded-full
                  border
                  border-[var(--border-strong)]
                  bg-[var(--surface)]
                  px-8
                  py-4
                  font-semibold
                  text-[var(--foreground)]
                  transition
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-[var(--accent)]
                  hover:bg-[var(--surface-soft)]
                "
              >
                Explore professionals
              </button>
            </div>

            {/* TRUST POINTS */}

            <div
              className="
                mt-10
                flex
                flex-wrap
                gap-x-7
                gap-y-3
                text-sm
                text-[var(--muted)]
              "
            >
              <span>✓ Professional profiles</span>
              <span>✓ Skill verification</span>
              <span>✓ Real opportunities</span>
            </div>

            {/* HERITAGE LINE */}

            <div className="mt-12 flex items-center gap-4">
              <span className="h-px w-10 bg-[var(--accent)] opacity-50" />

              <span
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.28em]
                  text-[var(--muted)]
                "
              >
                Built for ambition
              </span>

              <span className="h-px w-10 bg-[var(--accent)] opacity-50" />
            </div>
          </div>

          {/* =================================================
              SEARCH CARD
          ================================================= */}

          <div
            id="people-search"
            className="
              relative
              z-10
              overflow-hidden
              rounded-[28px]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              shadow-[0_24px_70px_rgba(0,0,0,0.10)]
            "
          >
            {/* CARD HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[var(--border)]
                px-6
                py-5
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.28em]
                    text-[var(--muted)]
                  "
                >
                  Opportunity
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-semibold
                    text-[var(--foreground)]
                  "
                >
                  Find the right people.
                </h2>
              </div>

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--surface-soft)]
                  text-[var(--accent)]
                "
              >
                ◇
              </div>
            </div>

            {/* CARD BODY */}

            <div className="p-6">
              {/* INPUT */}

              <div className="relative">
                <span
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-[var(--accent)]
                  "
                >
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value
                    )
                  }
                  onFocus={() => {
                    if (search.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  placeholder="What are you looking for?"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-[var(--border)]
                    bg-[var(--background)]
                    py-4
                    pl-11
                    pr-12
                    text-sm
                    text-[var(--foreground)]
                    outline-none
                    placeholder:text-[var(--muted)]
                    transition
                    focus:border-[var(--accent)]
                    focus:ring-2
                    focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]
                  "
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setProfiles([]);
                      setSearched(false);
                      setShowSuggestions(false);
                    }}
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-lg
                      text-[var(--muted)]
                      transition
                      hover:text-[var(--foreground)]
                    "
                  >
                    ×
                  </button>
                )}

                {/* SUGGESTIONS */}

                {showSuggestions &&
                  filteredSuggestions.length > 0 && (
                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-full
                        z-50
                        mt-2
                        overflow-hidden
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface)]
                        shadow-[0_18px_45px_rgba(0,0,0,0.15)]
                      "
                    >
                      <div
                        className="
                          px-4
                          py-3
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.2em]
                          text-[var(--muted)]
                        "
                      >
                        Suggestions
                      </div>

                      {filteredSuggestions.map(
                        (item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(event) =>
                              event.preventDefault()
                            }
                            onClick={() =>
                              searchPeople(item)
                            }
                            className="
                              flex
                              w-full
                              items-center
                              gap-3
                              border-t
                              border-[var(--border)]
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-[var(--surface-soft)]
                            "
                          >
                            <div
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-[var(--border)]
                                bg-[var(--surface-soft)]
                                text-xs
                                text-[var(--accent)]
                              "
                            >
                              ⌕
                            </div>

                            <div className="flex-1">
                              <p
                                className="
                                  text-sm
                                  font-medium
                                  text-[var(--foreground)]
                                "
                              >
                                {item}
                              </p>

                              <p
                                className="
                                  text-[11px]
                                  text-[var(--muted)]
                                "
                              >
                                Find professionals
                              </p>
                            </div>

                            <span className="text-[var(--accent)]">
                              →
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>

              {/* SEARCH BUTTON */}

              <button
                onClick={() => searchPeople()}
                disabled={loading}
                className="
                  mt-3
                  w-full
                  rounded-xl
                  bg-[var(--brand)]
                  py-3
                  text-sm
                  font-semibold
                  text-[var(--background)]
                  transition
                  hover:bg-[var(--brand-dark)]
                  disabled:opacity-60
                "
              >
                {loading
                  ? "Searching..."
                  : "Find professionals"}
              </button>

              {/* RESULTS */}

              {searched ? (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-[var(--muted)]
                      "
                    >
                      {search
                        ? `Results for "${search}"`
                        : "Professionals"}
                    </p>

                    {profiles.length > 0 && (
                      <span className="text-xs text-[var(--muted)]">
                        {profiles.length} found
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        p-6
                        text-center
                      "
                    >
                      <LoadingLogo
                        size={40}
                        text=""
                        fullScreen={false}
                      />

                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Finding matching
                        professionals...
                      </p>
                    </div>
                  ) : profiles.length === 0 ? (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--background)]
                        p-6
                        text-center
                      "
                    >
                      <div
                        className="
                          mx-auto
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-[var(--border)]
                          bg-[var(--surface-soft)]
                          text-xl
                          text-[var(--accent)]
                        "
                      >
                        ◇
                      </div>

                      <p className="mt-4 font-medium text-[var(--foreground)]">
                        No matching professionals yet.
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Try another skill, name or city.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() =>
                            router.push(
                              `/profile/${profile.id}`
                            )
                          }
                          className="
                            group
                            flex
                            w-full
                            cursor-pointer
                            items-center
                            gap-4
                            rounded-2xl
                            border
                            border-[var(--border)]
                            bg-[var(--background)]
                            p-4
                            text-left
                            transition
                            hover:border-[var(--accent)]
                            hover:bg-[var(--surface-soft)]
                          "
                        >
                          <div
                            className="
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              font-semibold
                              text-[var(--foreground)]
                            "
                          >
                            {(profile.full_name ||
                              "P")[0].toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className="
                                  truncate
                                  font-semibold
                                  text-[var(--foreground)]
                                "
                              >
                                {profile.full_name ||
                                  "Professional"}
                              </p>

                              {profile.verified && (
                                <span
                                  className="
                                    shrink-0
                                    text-sm
                                    text-[var(--accent)]
                                  "
                                >
                                  ✓
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                              {profile.skill ||
                                profile.role ||
                                "Professional"}
                            </p>

                            {profile.location && (
                              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                                📍 {profile.location}
                              </p>
                            )}
                          </div>

                          {profile.professional_level && (
                            <span
                              className="
                                hidden
                                shrink-0
                                rounded-full
                                border
                                border-[var(--border)]
                                bg-[var(--surface-soft)]
                                px-3
                                py-1
                                text-[10px]
                                font-medium
                                text-[var(--muted)]
                                sm:block
                              "
                            >
                              {profile.professional_level}
                            </span>
                          )}

                          <span
                            className="
                              text-[var(--accent)]
                              opacity-0
                              transition
                              group-hover:translate-x-1
                              group-hover:opacity-100
                            "
                          >
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* POPULAR SKILLS */

                <div className="mt-6">
                  <p
                    className="
                      mb-3
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-[var(--muted)]
                    "
                  >
                    Popular skills
                  </p>

                  <div className="space-y-3">
                    {suggestions
                      .slice(0, 3)
                      .map((item, index) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            searchPeople(item)
                          }
                          className="
                            group
                            flex
                            w-full
                            items-center
                            gap-4
                            rounded-2xl
                            border
                            border-[var(--border)]
                            bg-[var(--background)]
                            p-4
                            text-left
                            transition
                            hover:border-[var(--accent)]
                            hover:bg-[var(--surface-soft)]
                          "
                        >
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              text-sm
                              font-semibold
                              text-[var(--foreground)]
                            "
                          >
                            0{index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[var(--foreground)]">
                              {item}
                            </p>

                            <p className="text-xs text-[var(--muted)]">
                              Find professionals
                            </p>
                          </div>

                          <span
                            className="
                              rounded-full
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              px-3
                              py-1
                              text-[10px]
                              font-medium
                              text-[var(--muted)]
                            "
                          >
                            Explore
                          </span>
                        </button>
                      ))}
                  </div>

                  {/* MORE SKILLS */}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {suggestions
                      .slice(3, 9)
                      .map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            searchPeople(item)
                          }
                          className="
                            rounded-full
                            border
                            border-[var(--border)]
                            bg-[var(--surface)]
                            px-3
                            py-2
                            text-xs
                            text-[var(--muted)]
                            transition
                            hover:border-[var(--accent)]
                            hover:text-[var(--foreground)]
                          "
                        >
                          {item}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* CARD FOOTER */}

            <div
              className="
                border-t
                border-[var(--border)]
                bg-[var(--surface-soft)]
                px-6
                py-5
              "
            >
              <p className="text-xs text-[var(--muted)]">
                TRIANGLES network
              </p>

              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                Skills → People → Opportunity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          HERITAGE STRIP
      ================================================= */}

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-10">
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[var(--accent)] opacity-40" />

            <span className="text-[10px] tracking-[0.35em] text-[var(--muted)]">
              △ ◇ △
            </span>

            <span className="h-px w-12 bg-[var(--accent)] opacity-40" />
          </div>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="
          border-t
          border-[var(--border)]
          bg-[var(--background)]
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-5
            px-5
            py-8
            sm:px-6
            md:flex-row
            md:items-center
            md:justify-between
            lg:px-10
          "
        >
          {/* FOOTER BRAND */}

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center">
              <img
                src="/triangles-logo.png"
                alt="TRIANGLES"
                className="h-9 w-9 object-contain"
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-bold
                  tracking-[0.2em]
                  text-[var(--foreground)]
                "
              >
                TRIANGLES
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Real skills. Real people. Real opportunities.
              </p>
            </div>
          </div>

          {/* FOOTER LINKS */}

          <div
            className="
              flex
              flex-wrap
              gap-6
              text-xs
              text-[var(--muted)]
            "
          >
            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="transition hover:text-[var(--foreground)]"
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/community")
              }
              className="transition hover:text-[var(--foreground)]"
            >
              Community
            </button>

            <button
              onClick={() =>
                router.push("/needs")
              }
              className="transition hover:text-[var(--foreground)]"
            >
              Opportunities
            </button>

            <button
              onClick={() =>
                router.push("/about")
              }
              className="transition hover:text-[var(--foreground)]"
            >
              About
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}