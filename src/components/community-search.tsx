"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  avatar_url: string | null;
};

const popularSuggestions = [
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

export default function CommunitySearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  useEffect(() => {
    const search = query.trim();

    if (!search) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setOpen(true);

      const { data } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,skill,role,location,avatar_url"
        )
        .or(
          `full_name.ilike.%${search}%,username.ilike.%${search}%,skill.ilike.%${search}%,role.ilike.%${search}%,location.ilike.%${search}%`
        )
        .limit(6);

      setResults(data || []);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function selectSuggestion(value: string) {
    setQuery(value);
    setOpen(true);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full max-w-[520px]"
    >
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
            }
          }}
          placeholder="Search people, skills or work..."
          className="w-full h-12 rounded-2xl border border-white/[0.08] bg-white/[0.045] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-300/25 focus:bg-white/[0.06]"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/[0.07] text-white/40 hover:text-white flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-[80] mt-2 left-0 right-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101116]/95 backdrop-blur-2xl shadow-2xl">
          {loading ? (
            <div className="px-4 py-5 text-sm text-white/35">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <p className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
                Professionals
              </p>

              {results.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/profile/${person.id}`);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.05] transition"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-white/[0.07] border border-white/[0.08]">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-semibold text-sm">
                        {(
                          person.full_name ||
                          person.username ||
                          "P"
                        )[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {person.full_name ||
                        person.username ||
                        "Professional"}
                    </p>

                    <p className="text-xs text-cyan-200/60 truncate">
                      {person.skill ||
                        person.role ||
                        "Professional"}
                    </p>

                    {person.location && (
                      <p className="text-[11px] text-white/25 truncate">
                        {person.location}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-3">
              <p className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
                Try searching
              </p>

              {popularSuggestions
                .filter((item) =>
                  item
                    .toLowerCase()
                    .includes(query.toLowerCase())
                )
                .slice(0, 4)
                .map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      selectSuggestion(item)
                    }
                    className="w-full px-4 py-3 text-left text-sm text-white/65 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <span className="text-cyan-300/60 mr-3">
                      →
                    </span>
                    {item}
                  </button>
                ))}

              <p className="px-4 pt-3 pb-2 text-xs text-white/25">
                No professionals found yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}