"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Need = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skill: string | null;
  location: string | null;
  need_type: string;
  status: string;
};

type Professional = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  professional_level: string | null;
  verified: boolean | null;
  match_score: number;
};

export default function NeedMatchesPage() {
  const params = useParams();
  const router = useRouter();

  const needId = params.id as string;

  const [need, setNeed] = useState<Need | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!needId) return;

    loadMatches();
  }, [needId]);

  async function loadMatches() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load need
      const { data: needData, error: needError } = await supabase
        .from("needs")
        .select("*")
        .eq("id", needId)
        .single();

      if (needError || !needData) {
        setError("Need not found.");
        setLoading(false);
        return;
      }

      setNeed(needData);

      // Load professionals
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
        )
        .neq("id", needData.user_id)
        .limit(100);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const requiredSkill = (needData.skill || "").toLowerCase().trim();
      const requiredLocation = (needData.location || "")
        .toLowerCase()
        .trim();

      const matches: Professional[] = (profiles || [])
        .map((profile) => {
          const profileSkill =
            `${profile.skill || ""} ${profile.role || ""}`.toLowerCase();

          const profileLocation = (profile.location || "").toLowerCase();

          let score = 0;

          // Skill match
          if (
            requiredSkill &&
            profileSkill.includes(requiredSkill)
          ) {
            score += 70;
          }

          // Location match
          if (
            requiredLocation &&
            profileLocation.includes(requiredLocation)
          ) {
            score += 20;
          }

          // Verified
          if (profile.verified) {
            score += 5;
          }

          // Senior professional
          if (
            profile.professional_level === "Senior Professional"
          ) {
            score += 5;
          }

          return {
            ...profile,
            match_score: Math.min(score, 100),
          };
        })
        .filter((profile) => profile.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score);

      setProfessionals(matches);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkUp(professionalId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("connections").insert({
      requester_id: user.id,
      receiver_id: professionalId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        alert("Link Up request already exists.");
      } else {
        alert(error.message);
      }

      return;
    }

    alert("Link Up request sent.");

    router.push(`/profile/${professionalId}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <div className="text-white/60 text-sm">
          Finding the right professionals...
        </div>
      </main>
    );
  }

  if (error || !need) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-3">
            Need not found
          </h1>

          <p className="text-white/50 text-sm mb-6">
            {error || "This need may no longer exist."}
          </p>

          <button
            onClick={() => router.push("/needs")}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Back to Needs
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/needs")}
            className="text-sm text-white/60 hover:text-white transition"
          >
            ← Needs
          </button>

          <div className="font-semibold tracking-tight">
            TRIANGLES
          </div>

          <button
            onClick={() => router.push("/community")}
            className="text-sm text-white/60 hover:text-white transition"
          >
            Community
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Need information */}
        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              {need.need_type}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
              {need.status}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {need.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm md:text-base leading-7 text-white/60">
            {need.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {need.skill && (
              <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] px-4 py-2 text-sm text-cyan-100/80">
                Skill: {need.skill}
              </div>
            )}

            {need.location && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
                Location: {need.location}
              </div>
            )}
          </div>
        </section>

        {/* Match heading */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            TRIANGLES MATCH
          </p>

          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
            Matched Professionals
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Professionals whose skills and profile fit this need.
          </p>
        </section>

        {/* Empty state */}
        {professionals.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="text-4xl mb-4">⌁</div>

            <h3 className="text-lg font-semibold">
              No strong matches yet
            </h3>

            <p className="mt-2 text-sm text-white/45">
              Try adding a more specific skill or location to your need.
            </p>

            <button
              onClick={() => router.push("/needs")}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Back to Needs
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((person) => (
              <article
                key={person.id}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.065] hover:border-white/15 transition"
              >
                {/* Profile */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() =>
                      router.push(`/profile/${person.id}`)
                    }
                    className="shrink-0"
                  >
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.full_name || "Professional"}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-semibold">
                        {(person.full_name || "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </button>

                  <div className="min-w-0">
                    <button
                      onClick={() =>
                        router.push(`/profile/${person.id}`)
                      }
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {person.full_name || "Professional"}
                        </h3>

                        {person.verified && (
                          <span
                            className="text-emerald-400 text-sm"
                            title="Verified"
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      {person.username && (
                        <p className="text-xs text-white/40 mt-0.5">
                          @{person.username}
                        </p>
                      )}
                    </button>

                    <p className="mt-1 text-sm text-white/50">
                      {person.role || person.skill || "Professional"}
                    </p>
                  </div>
                </div>

                {/* Match score */}
                <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/45">
                      Match
                    </span>

                    <span className="text-lg font-semibold text-emerald-300">
                      {person.match_score}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{
                        width: `${person.match_score}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2">
                  {person.skill && (
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-white/35">
                        Skill
                      </span>
                      <span className="text-white/65 text-right">
                        {person.skill}
                      </span>
                    </div>
                  )}

                  {person.location && (
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-white/35">
                        Location
                      </span>
                      <span className="text-white/65 text-right">
                        {person.location}
                      </span>
                    </div>
                  )}

                  {person.professional_level && (
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-white/35">
                        Level
                      </span>
                      <span className="text-white/65 text-right">
                        {person.professional_level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      router.push(`/profile/${person.id}`)
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() =>
                      router.push(
                        `/messages?user=${person.id}`
                      )
                    }
                    className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-3 text-xs font-medium text-cyan-100/80 hover:bg-cyan-300/[0.12] transition"
                  >
                    Message
                  </button>
                </div>

                <button
                  onClick={() => handleLinkUp(person.id)}
                  className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-xs font-semibold text-black hover:bg-white/90 transition"
                >
                  Link Up
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}