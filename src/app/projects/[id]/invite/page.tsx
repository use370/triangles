"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
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

export default function InviteProjectMemberPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) loadPeople();
  }, [projectId]);

  async function loadPeople() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project || project.owner_id !== user.id) {
      alert("Only the project owner can add members.");
      router.push(`/projects/${projectId}`);
      return;
    }

    // Existing members
    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    const existingIds = members?.map((m) => m.user_id) || [];
    setMemberIds(existingIds);

    // All professionals except current user
    const { data: people, error } = await supabase
      .from("profiles")
      .select(
        "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
      )
      .neq("id", user.id)
      .order("full_name", {
        ascending: true,
      })
      .limit(100);

    if (error) {
      console.error(error);
    } else {
      setProfiles(people || []);
    }

    setLoading(false);
  }

  async function addMember(profileId: string) {
    setAdding(profileId);

    const { error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: profileId,
        role: "Member",
      });

    if (error) {
      if (error.code === "23505") {
        alert("This professional is already in the project.");
      } else {
        alert(error.message);
      }

      setAdding(null);
      return;
    }

    setMemberIds((current) => [...current, profileId]);
    setAdding(null);
  }

  const filteredProfiles = profiles.filter((profile) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.username?.toLowerCase().includes(query) ||
      profile.skill?.toLowerCase().includes(query) ||
      profile.role?.toLowerCase().includes(query) ||
      profile.location?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <p className="text-sm text-white/50">
          Finding professionals...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-sm text-white/50 hover:text-white transition"
          >
            ← Project
          </button>

          <div className="font-semibold tracking-tight">
            TRIANGLES
          </div>

          <div className="w-12" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            PROJECT TEAM
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Add Professionals
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Find people on TRIANGLES and add them to your project.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, skill, role or location..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30"
          />
        </div>

        {/* People */}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <h2 className="text-lg font-semibold">
              No professionals found
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Try another name, skill or location.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProfiles.map((person) => {
              const alreadyMember = memberIds.includes(person.id);

              return (
                <article
                  key={person.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-4">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                        {(person.full_name || "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() =>
                          router.push(`/profile/${person.id}`)
                        }
                        className="text-left"
                      >
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-semibold">
                            {person.full_name || "Professional"}
                          </h2>

                          {person.verified && (
                            <span className="text-emerald-400">
                              ✓
                            </span>
                          )}
                        </div>

                        {person.username && (
                          <p className="mt-0.5 text-xs text-white/35">
                            @{person.username}
                          </p>
                        )}
                      </button>

                      <p className="mt-1 text-sm text-white/50">
                        {person.role ||
                          person.skill ||
                          "Professional"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {person.skill && (
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/50">
                        {person.skill}
                      </span>
                    )}

                    {person.location && (
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/40">
                        {person.location}
                      </span>
                    )}

                    {person.professional_level && (
                      <span className="rounded-lg border border-emerald-300/10 bg-emerald-300/[0.04] px-2.5 py-1 text-xs text-emerald-200/60">
                        {person.professional_level}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/profile/${person.id}`)
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60 hover:text-white transition"
                    >
                      Profile
                    </button>

                    <button
                      disabled={
                        alreadyMember || adding === person.id
                      }
                      onClick={() => addMember(person.id)}
                      className="flex-1 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                    >
                      {alreadyMember
                        ? "Added"
                        : adding === person.id
                        ? "Adding..."
                        : "Add to Project"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
