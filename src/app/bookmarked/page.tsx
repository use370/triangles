"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";

type Person = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  professional_level: string | null;
  verified: boolean | null;
};

export default function BookmarkedPage() {
  const router = useRouter();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadBookmarkedPeople() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: bookmarks, error } = await supabase
      .from("bookmarks")
      .select("receiver_id")
      .eq("requester_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const ids = (bookmarks || []).map(
      (item) => item.receiver_id
    );

    if (ids.length === 0) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
        )
        .in("id", ids);

    if (profileError) {
      console.error(profileError);
      setPeople([]);
      setLoading(false);
      return;
    }

    const orderedProfiles = ids
      .map((id) =>
        (profiles || []).find(
          (profile) => profile.id === id
        )
      )
      .filter(Boolean) as Person[];

    setPeople(orderedProfiles);
    setLoading(false);
  }

  useEffect(() => {
    loadBookmarkedPeople();
  }, []);

  async function removeBookmark(personId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setRemoving(personId);

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("requester_id", user.id)
      .eq("receiver_id", personId);

    if (error) {
      alert(error.message);
    } else {
      setPeople((current) =>
        current.filter((person) => person.id !== personId)
      );
    }

    setRemoving(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07080c] text-white flex items-center justify-center">
        <LoadingLogo
          size={64}
          text="Loading Bookmarks..."
          fullScreen={false}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/7 blur-[130px]" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-500/6 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07080c]/85 backdrop-blur-2xl">
        <div className="max-w-[900px] mx-auto h-[68px] px-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-white/60 hover:text-white text-sm"
          >
            ← Back
          </button>

          <h1 className="mx-auto text-sm font-semibold">
            Bookmarked
          </h1>

          <div className="w-12" />
        </div>
      </header>

      <div className="relative max-w-[900px] mx-auto px-4 py-8">
        <div className="mb-7">
          <h2 className="text-2xl font-semibold">
            Your Bookmarked People
          </h2>

          <p className="text-sm text-white/35 mt-2">
            Professionals you chose to keep close.
          </p>
        </div>

        {people.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] py-20 px-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl border border-white/10 bg-white/[0.05] flex items-center justify-center text-2xl">
              🔖
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No bookmarked people yet
            </h2>

            <p className="mt-2 text-sm text-white/35 max-w-sm mx-auto">
              Bookmark professionals from Community and they will appear here.
            </p>

            <button
              onClick={() => router.push("/community")}
              className="mt-6 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold"
            >
              Explore Community
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {people.map((person) => {
              const name =
                person.full_name ||
                person.username ||
                "Professional";

              return (
                <div
                  key={person.id}
                  className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5 flex items-center gap-4"
                >
                  <button
                    onClick={() =>
                      router.push(`/profile/${person.id}`)
                    }
                    className="h-16 w-16 rounded-full overflow-hidden bg-[#15161b] shrink-0 border border-white/10"
                  >
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl font-semibold">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      router.push(`/profile/${person.id}`)
                    }
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {name}
                      </h3>

                      {person.verified && (
                        <span className="h-5 w-5 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-bold shrink-0">
                          ✓
                        </span>
                      )}
                    </div>

                    {person.username && (
                      <p className="text-xs text-white/35 mt-1">
                        @{person.username}
                      </p>
                    )}

                    {person.skill && (
                      <p className="text-sm text-cyan-200/70 mt-2 truncate">
                        {person.skill}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-white/30">
                      {person.role && (
                        <span>{person.role}</span>
                      )}

                      {person.location && (
                        <span>{person.location}</span>
                      )}
                    </div>

                    {person.professional_level && (
                      <p className="text-[11px] text-white/25 mt-2">
                        {person.professional_level}
                      </p>
                    )}
                  </button>

                  <button
                    disabled={removing === person.id}
                    onClick={() =>
                      removeBookmark(person.id)
                    }
                    className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:px-4 py-2.5 text-xs text-white/55 hover:text-white hover:bg-white/[0.08] disabled:opacity-40"
                  >
                    {removing === person.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <nav className="fixed lg:hidden bottom-0 left-0 right-0 z-50 h-[68px] border-t border-white/[0.08] bg-[#090a0f]/90 backdrop-blur-2xl flex items-center justify-around">
        <button
          onClick={() => router.push("/community")}
          className="text-white/50 text-[10px]"
        >
          Community
        </button>

        <button
          onClick={() => router.push("/community")}
          className="text-white/50 text-[10px]"
        >
          Bits
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="text-white/50 text-[10px]"
        >
          Profile
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="text-white/50 text-[10px]"
        >
          Messages
        </button>

        <button
          onClick={() => router.push("/community-requests")}
          className="text-white/50 text-[10px]"
        >
          Requests
        </button>
      </nav>
    </main>
  );
}