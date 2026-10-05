"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  project_id: string;
  user_id: string;
  activity_type: "update" | "task" | "file" | "member";
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function ProjectActivityPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadActivity();
    }
  }, [projectId]);

  async function loadActivity() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: activityData, error } =
      await supabase
        .from("project_activity")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setActivities(activityData || []);

    const userIds = Array.from(
      new Set(
        (activityData || []).map(
          (item) => item.user_id
        )
      )
    );

    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url"
        )
        .in("id", userIds);

      setProfiles(profileData || []);
    }

    setLoading(false);
  }

  async function createUpdate(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!content.trim() || !userId) {
      return;
    }

    setPosting(true);

    const { error } = await supabase
      .from("project_activity")
      .insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "update",
        content: content.trim(),
      });

    if (error) {
      alert(error.message);
      setPosting(false);
      return;
    }

    setContent("");
    setPosting(false);

    await loadActivity();
  }

  function getProfile(id: string) {
    return profiles.find(
      (profile) => profile.id === id
    );
  }

  function getName(id: string) {
    const profile = getProfile(id);

    return (
      profile?.full_name ||
      profile?.username ||
      "Project Member"
    );
  }

  function getInitials(id: string) {
    const name = getName(id);

    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <p className="text-sm text-white/50">
          Loading project activity...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button
            onClick={() =>
              router.push(`/projects/${projectId}`)
            }
            className="text-sm text-white/50 hover:text-white transition"
          >
            ← Project
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

      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* TITLE */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            PROJECT WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Activity
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Keep the whole team updated on project progress.
          </p>
        </section>

        {/* POST UPDATE */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-xs font-semibold text-emerald-200">
              {userId
                ? getInitials(userId)
                : "ME"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Post a project update
              </p>

              <p className="mt-1 text-xs text-white/35">
                Share progress, decisions, milestones or important notes.
              </p>

              <form
                onSubmit={createUpdate}
                className="mt-4"
              >
                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="What's happening with the project?"
                  rows={5}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30"
                />

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-white/25">
                    {content.length}/2000
                  </span>

                  <button
                    type="submit"
                    disabled={
                      posting || !content.trim()
                    }
                    className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {posting
                      ? "Posting..."
                      : "Post Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Project Timeline
            </h2>

            <span className="text-xs text-white/30">
              {activities.length}{" "}
              {activities.length === 1
                ? "update"
                : "updates"}
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <div className="text-3xl">
                ✦
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No activity yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
                Your first project update will appear here.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* TIMELINE LINE */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-white/10" />

              <div className="space-y-6">
                {activities.map((activity) => {
                  const profile = getProfile(
                    activity.user_id
                  );

                  return (
                    <article
                      key={activity.id}
                      className="relative pl-14"
                    >
                      {/* DOT */}
                      <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#111216]">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-200">
                            {getInitials(
                              activity.user_id
                            )}
                          </span>
                        )}
                      </div>

                      {/* CARD */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="text-sm font-medium">
                              {getName(
                                activity.user_id
                              )}
                            </span>

                            <span className="ml-2 rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-200/70">
                              Update
                            </span>
                          </div>

                          <time className="text-[11px] text-white/30">
                            {formatDate(
                              activity.created_at
                            )}
                          </time>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">
                          {activity.content}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* NAV */}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(`/projects/${projectId}`)
            }
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Workspace
          </button>

          <button
            onClick={() =>
              router.push(
                `/projects/${projectId}/tasks`
              )
            }
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Tasks
          </button>

          <button
            onClick={() =>
              router.push(
                `/projects/${projectId}/files`
              )
            }
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Files
          </button>
        </div>
      </div>
    </main>
  );
}