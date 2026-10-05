"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: "active" | "completed" | "paused";
  created_at: string;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    skill: string | null;
    role: string | null;
    professional_level: string | null;
    verified: boolean | null;
  } | null;
};

type Update = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newUpdate, setNewUpdate] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    loadWorkspace();
  }, [projectId]);

  async function loadWorkspace() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    setProject(projectData);

    const { data: memberData } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: true,
      });

    if (memberData) {
      const memberIds = memberData.map((member) => member.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,skill,role,professional_level,verified"
        )
        .in("id", memberIds);

      const combined = memberData.map((member) => ({
        ...member,
        profile:
          profiles?.find(
            (profile) => profile.id === member.user_id
          ) || null,
      }));

      setMembers(combined);
    }

    const { data: updateData } = await supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      });

    if (updateData) {
      const updateUserIds = [
        ...new Set(updateData.map((update) => update.user_id)),
      ];

      const { data: updateProfiles } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url")
        .in("id", updateUserIds);

      const combinedUpdates = updateData.map((update) => ({
        ...update,
        profile:
          updateProfiles?.find(
            (profile) => profile.id === update.user_id
          ) || null,
      }));

      setUpdates(combinedUpdates);
    }

    setLoading(false);
  }

  async function createUpdate(event: FormEvent) {
    event.preventDefault();

    if (!newUpdate.trim() || !userId) return;

    setPosting(true);

    const { error } = await supabase
      .from("project_updates")
      .insert({
        project_id: projectId,
        user_id: userId,
        content: newUpdate.trim(),
      });

    if (error) {
      alert(error.message);
      setPosting(false);
      return;
    }

    setNewUpdate("");
    setPosting(false);

    await loadWorkspace();
  }

  async function updateProjectStatus(
    status: "active" | "completed" | "paused"
  ) {
    if (!project || project.owner_id !== userId) return;

    const { error } = await supabase
      .from("projects")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProject({
      ...project,
      status,
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <p className="text-sm text-white/50">
          Loading project workspace...
        </p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Project not found
          </h1>

          <p className="mt-2 text-sm text-white/45">
            {error}
          </p>

          <button
            onClick={() => router.push("/needs")}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  const isOwner = project.owner_id === userId;

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/50 hover:text-white transition"
          >
            ← Back
          </button>

          <div className="font-semibold tracking-tight">
            TRIANGLES
          </div>

          <button
            onClick={() => router.push("/community")}
            className="text-sm text-white/50 hover:text-white transition"
          >
            Community
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Project Hero */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">
                  Project
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs capitalize text-white/50">
                  {project.status}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {project.title}
              </h1>

              <p className="mt-4 text-sm leading-7 text-white/50 md:text-base">
                {project.description ||
                  "No project description added yet."}
              </p>
            </div>

            {isOwner && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    updateProjectStatus("active")
                  }
                  className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-2 text-xs text-emerald-200"
                >
                  Active
                </button>

                <button
                  onClick={() =>
                    updateProjectStatus("paused")
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60"
                >
                  Pause
                </button>

                <button
                  onClick={() =>
                    updateProjectStatus("completed")
                  }
                  className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  Complete
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Workspace */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Updates */}
          <section>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
                PROJECT FEED
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Updates
              </h2>
            </div>

            {/* Create update */}
            <form
              onSubmit={createUpdate}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <textarea
                value={newUpdate}
                onChange={(event) =>
                  setNewUpdate(event.target.value)
                }
                placeholder="Share a project update..."
                rows={4}
                maxLength={1000}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25"
              />

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    posting || !newUpdate.trim()
                  }
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black disabled:opacity-40"
                >
                  {posting ? "Posting..." : "Post Update"}
                </button>
              </div>
            </form>

            {/* Updates list */}
            <div className="mt-5 space-y-4">
              {updates.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                  <p className="text-sm text-white/40">
                    No updates yet.
                  </p>

                  <p className="mt-2 text-xs text-white/25">
                    Your first project update will appear here.
                  </p>
                </div>
              ) : (
                updates.map((update) => (
                  <article
                    key={update.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-center gap-3">
                      {update.profile?.avatar_url ? (
                        <img
                          src={update.profile.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                          {(
                            update.profile?.full_name ||
                            "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium">
                          {update.profile?.full_name ||
                            "Project Member"}
                        </p>

                        <p className="text-xs text-white/30">
                          {new Date(
                            update.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">
                      {update.content}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Members */}
          <aside>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                    TEAM
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Members
                  </h2>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
                  {members.length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {members.map((member) => {
                  const profile = member.profile;

                  return (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                            {(
                              profile?.full_name ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {profile?.full_name ||
                              "Professional"}
                          </p>

                          <p className="text-xs text-white/35">
                            {member.role}
                          </p>
                        </div>

                        {profile?.verified && (
                          <span className="ml-auto text-sm text-emerald-400">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/profile/${member.user_id}`
                            )
                          }
                          className="flex-1 rounded-lg border border-white/10 px-2 py-2 text-xs text-white/55 hover:text-white transition"
                        >
                          Profile
                        </button>

                        {member.user_id !== userId && (
                          <button
                            onClick={() =>
                              router.push(
                                `/messages?user=${member.user_id}`
                              )
                            }
                            className="flex-1 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.05] px-2 py-2 text-xs text-cyan-100/70"
                          >
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isOwner && (
                <button
                  onClick={() =>
                    router.push("/community")
                  }
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50 hover:text-white transition"
                >
                  Find Professionals
                </button>
              )}
            </div>

            {/* Project info */}
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                WORKSPACE
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-white/35">
                    Status
                  </span>

                  <span className="text-xs capitalize text-white/65">
                    {project.status}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-white/35">
                    Members
                  </span>

                  <span className="text-xs text-white/65">
                    {members.length}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-white/35">
                    Updates
                  </span>

                  <span className="text-xs text-white/65">
                    {updates.length}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}