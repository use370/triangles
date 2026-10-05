"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";

type Need = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skill: string | null;
  location: string | null;
  need_type: string;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
};

export default function NeedsPage() {
  const router = useRouter();

  const [needs, setNeeds] = useState<Need[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  async function loadNeeds() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: needsData, error } = await supabase
      .from("needs")
      .select("*")
      .eq("status", "open")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const list = needsData || [];
    setNeeds(list);

    const ids = [
      ...new Set(list.map((item) => item.user_id)),
    ];

    if (ids.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,skill,role,location"
        )
        .in("id", ids);

      const map: Record<string, Profile> = {};

      (profileData || []).forEach((profile) => {
        map[profile.id] = profile;
      });

      setProfiles(map);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNeeds();
  }, []);

  const visibleNeeds =
    filter === "All"
      ? needs
      : needs.filter(
          (need) => need.need_type === filter
        );

  function timeAgo(date: string) {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
  }

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07080c]/85 backdrop-blur-2xl">
        <div className="max-w-[1050px] mx-auto h-[68px] px-4 flex items-center">
          <button
            onClick={() => router.push("/community")}
            className="font-semibold tracking-[0.18em] text-sm"
          >
            TRIANGLES
          </button>

          <div className="mx-auto text-sm font-medium">
            Opportunities
          </div>

          <button
            onClick={() => router.push("/create-need")}
            className="rounded-xl bg-white text-black px-4 py-2 text-xs sm:text-sm font-semibold"
          >
            + Create Need
          </button>
        </div>
      </header>

      <section className="max-w-[1050px] mx-auto px-4 py-8">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">
            Network
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold mt-2">
            Opportunities
          </h1>

          <p className="text-white/35 mt-2">
            Find people who need exactly what you can build.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[
            "All",
            "Project",
            "Collaboration",
            "Hiring",
            "Service",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs border transition ${
                filter === item
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-white/[0.035] border-white/[0.08] text-white/45 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="min-h-[320px] flex items-center justify-center">
            <LoadingLogo
              size={58}
              text="Loading opportunities..."
              fullScreen={false}
            />
          </div>
        ) : visibleNeeds.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] py-20 text-center">
            <div className="text-4xl">⌁</div>

            <h2 className="mt-4 font-semibold">
              No opportunities yet
            </h2>

            <p className="text-sm text-white/30 mt-2">
              Be the first person to publish a need.
            </p>

            <button
              onClick={() => router.push("/create-need")}
              className="mt-6 rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold"
            >
              Create Need
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {visibleNeeds.map((need) => {
              const owner = profiles[need.user_id];

              return (
                <article
                  key={need.id}
                  className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 hover:bg-white/[0.05] transition"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        router.push(`/profile/${need.user_id}`)
                      }
                      className="h-11 w-11 rounded-full overflow-hidden bg-white/[0.07] border border-white/[0.08] shrink-0"
                    >
                      {owner?.avatar_url ? (
                        <img
                          src={owner.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-semibold">
                          {(
                            owner?.full_name ||
                            owner?.username ||
                            "P"
                          )[0].toUpperCase()}
                        </div>
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {owner?.full_name ||
                          owner?.username ||
                          "Professional"}
                      </p>

                      <p className="text-xs text-white/30">
                        {owner?.role ||
                          owner?.skill ||
                          "Professional"}
                        {owner?.location
                          ? ` · ${owner.location}`
                          : ""}
                      </p>
                    </div>

                    <span className="ml-auto shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-[10px] text-cyan-200/70">
                      {need.need_type}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h2 className="text-lg font-semibold">
                      {need.title}
                    </h2>

                    <p className="text-sm text-white/45 leading-6 mt-2">
                      {need.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    {need.skill && (
                      <span className="rounded-lg bg-violet-400/[0.08] border border-violet-300/10 px-3 py-1.5 text-xs text-violet-200/70">
                        {need.skill}
                      </span>
                    )}

                    {need.location && (
                      <span className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 text-xs text-white/40">
                        {need.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
                    <span className="text-[11px] text-white/25">
                      {timeAgo(need.created_at)}
                    </span>

                    <button
                      onClick={() =>
                        router.push(
                          `/messages?user=${need.user_id}`
                        )
                      }
                      className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-2 text-xs text-cyan-100/80 hover:bg-cyan-300/[0.12] transition"
                    >
                      Link Up
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <nav className="fixed lg:hidden bottom-0 left-0 right-0 z-50 h-[68px] border-t border-white/[0.08] bg-[#090a0f]/90 backdrop-blur-2xl flex items-center justify-around">
        <button
          onClick={() => router.push("/community")}
          className="text-white/50 text-[10px]"
        >
          Community
        </button>

        <button
          onClick={() => router.push("/needs")}
          className="text-white text-[10px] font-semibold"
        >
          Needs
        </button>

        <button
          onClick={() => router.push("/community/bits")}
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
      </nav>
    </main>
  );
}