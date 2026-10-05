"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createProjectNotification } from "@/lib/project-notifications";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "completed" | "paused";
  owner_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  skill: string | null;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  profile?: Profile | null;
};

type Task = {
  id: string;
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
  creator?: Profile | null;
};

type FilterType = "all" | "todo" | "in_progress" | "done";

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = String(params.id);

  const [userId, setUserId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadPage();
  }, [projectId]);

  async function loadPage() {
    setLoading(true);

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
      .select("id,title,description,status,owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      setLoading(false);
      return;
    }

    setProject(projectData);

    const { data: memberData } = await supabase
      .from("project_members")
      .select("id,user_id,role")
      .eq("project_id", projectId);

    const memberRows = memberData || [];

    const memberIds = memberRows.map((member) => member.user_id);

    let profileRows: Profile[] = [];

    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,role,skill")
        .in("id", memberIds);

      profileRows = profiles || [];
    }

    const membersWithProfiles: Member[] = memberRows.map((member) => ({
      ...member,
      profile:
        profileRows.find((profile) => profile.id === member.user_id) ||
        null,
    }));

    setMembers(membersWithProfiles);

    const { data: taskData } = await supabase
      .from("project_tasks")
      .select(
        `
        id,
        project_id,
        assigned_to,
        created_by,
        title,
        description,
        status,
        created_at,
        updated_at
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    const taskRows = taskData || [];

    const taskUserIds = Array.from(
      new Set(
        taskRows.flatMap((task) =>
          [task.assigned_to, task.created_by].filter(Boolean)
        )
      )
    );

    let taskProfiles: Profile[] = [];

    if (taskUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,role,skill")
        .in("id", taskUserIds as string[]);

      taskProfiles = profiles || [];
    }

    const tasksWithProfiles: Task[] = taskRows.map((task) => ({
      ...task,
      assignee:
        taskProfiles.find(
          (profile) => profile.id === task.assigned_to
        ) || null,
      creator:
        taskProfiles.find(
          (profile) => profile.id === task.created_by
        ) || null,
    }));

    setTasks(tasksWithProfiles);

    setLoading(false);
  }

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      in_progress: tasks.filter(
        (task) => task.status === "in_progress"
      ).length,
      done: tasks.filter((task) => task.status === "done").length,
    };
  }, [tasks]);

  function getProfileName(profile?: Profile | null) {
    if (!profile) return "Unassigned";

    return (
      profile.full_name ||
      profile.username ||
      "Professional"
    );
  }

  function getInitials(profile?: Profile | null) {
    const name = getProfileName(profile);

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getStatusLabel(status: Task["status"]) {
    if (status === "in_progress") return "In Progress";
    if (status === "done") return "Done";
    return "Todo";
  }

  function getStatusClasses(status: Task["status"]) {
    if (status === "done") {
      return "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200";
    }

    if (status === "in_progress") {
      return "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200";
    }

    return "border-white/10 bg-white/[0.04] text-white/60";
  }

  async function notifyProjectMembers(
    titleText: string,
    message: string,
    type: "task"
  ) {
    if (!userId) return;

    const recipientIds = members
      .map((member) => member.user_id)
      .filter((id) => id !== userId);

    await Promise.all(
      recipientIds.map((recipientId) =>
        createProjectNotification({
          projectId,
          userId: recipientId,
          actorId: userId,
          type,
          title: titleText,
          message,
        })
      )
    );
  }

  async function createTask() {
    if (!userId || !project) return;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      alert("Please enter a task title.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("project_tasks")
      .insert({
        project_id: projectId,
        assigned_to: assignedTo || null,
        created_by: userId,
        title: cleanTitle,
        description: cleanDescription || null,
        status: "todo",
      })
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      alert(error?.message || "Could not create task.");
      setSaving(false);
      return;
    }

    const assignedProfile = members.find(
      (member) => member.user_id === assignedTo
    )?.profile;

    const assignedName = assignedProfile
      ? getProfileName(assignedProfile)
      : "the team";

    await notifyProjectMembers(
      "New project task",
      assignedTo
        ? `${cleanTitle} was created and assigned to ${assignedName}.`
        : `${cleanTitle} was added to the project.`,
      "task"
    );

    setTitle("");
    setDescription("");
    setAssignedTo("");

    await loadPage();

    setSaving(false);
  }

  async function updateTaskStatus(
    task: Task,
    nextStatus: Task["status"]
  ) {
    if (!userId) return;

    if (task.status === nextStatus) return;

    const { error } = await supabase
      .from("project_tasks")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const actorName =
      members.find((member) => member.user_id === userId)?.profile
        ? getProfileName(
            members.find((member) => member.user_id === userId)
              ?.profile
          )
        : "A team member";

    await notifyProjectMembers(
      "Task updated",
      `${actorName} moved "${task.title}" to ${getStatusLabel(
        nextStatus
      )}.`,
      "task"
    );

    await loadPage();
  }

  async function deleteTask(task: Task) {
    if (!project || !userId) return;

    const isOwner = project.owner_id === userId;

    if (!isOwner) {
      alert("Only the project owner can delete tasks.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) return;

    setDeletingId(task.id);

    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      console.error(error);
      alert(error.message);
      setDeletingId(null);
      return;
    }

    setTasks((current) =>
      current.filter((item) => item.id !== task.id)
    );

    setDeletingId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090b] text-white flex items-center justify-center">
        <div className="text-sm text-white/50">
          Loading project tasks...
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#07090b] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Project not found
          </h1>

          <button
            onClick={() => router.push("/projects")}
            className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70"
          >
            Back to Projects
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() =>
                router.push(`/projects/${projectId}`)
              }
              className="mb-3 text-xs text-white/40 hover:text-white/70 transition"
            >
              ← Back to Workspace
            </button>

            <h1 className="text-2xl font-semibold tracking-tight">
              Project Tasks
            </h1>

            <p className="mt-1 text-sm text-white/45">
              {project.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                router.push(`/projects/${projectId}`)
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/65 hover:bg-white/[0.08] transition"
            >
              Workspace
            </button>

            <button
              onClick={() =>
                router.push(`/projects/${projectId}/files`)
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/65 hover:bg-white/[0.08] transition"
            >
              Files
            </button>

            <button
              onClick={() =>
                router.push(`/projects/${projectId}/activity`)
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/65 hover:bg-white/[0.08] transition"
            >
              Activity
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create Task */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-sm font-semibold">
                Create Task
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Give your team a clear next step.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-white/50">
                  Task title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Build landing page"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/50">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="What needs to be done?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/50">
                  Assign to
                </label>

                <select
                  value={assignedTo}
                  onChange={(event) =>
                    setAssignedTo(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e11] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-300/30"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {members.map((member) => (
                    <option
                      key={member.user_id}
                      value={member.user_id}
                    >
                      {getProfileName(member.profile)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={createTask}
                disabled={saving}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Task"}
              </button>
            </div>

            {/* Team */}
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                Team
              </p>

              <div className="mt-4 space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
                  >
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white/60">
                        {getInitials(member.profile)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/75">
                        {getProfileName(member.profile)}
                      </p>

                      <p className="truncate text-[10px] text-white/35">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Tasks */}
          <section>
            {/* Filters */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  ["all", "All"],
                  ["todo", "Todo"],
                  ["in_progress", "In Progress"],
                  ["done", "Done"],
                ] as [FilterType, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-xs transition ${
                    filter === value
                      ? "border-cyan-300/20 bg-cyan-300/[0.09] text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.06]"
                  }`}
                >
                  {label}
                  <span className="ml-2 opacity-50">
                    {counts[value]}
                  </span>
                </button>
              ))}
            </div>

            {/* Empty */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-white/40">
                  ✓
                </div>

                <h2 className="mt-4 text-sm font-semibold text-white/75">
                  No tasks here
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Create a task to start moving the project forward.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-white/90">
                            {task.title}
                          </h2>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] ${getStatusClasses(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>

                        {task.description && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/45">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            {task.assignee?.avatar_url ? (
                              <img
                                src={task.assignee.avatar_url}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-semibold text-white/55">
                                {getInitials(task.assignee)}
                              </div>
                            )}

                            <div>
                              <p className="text-[10px] text-white/30">
                                Assigned to
                              </p>

                              <p className="text-xs text-white/65">
                                {getProfileName(task.assignee)}
                              </p>
                            </div>
                          </div>

                          <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

                          <span className="text-[10px] text-white/30">
                            Created{" "}
                            {new Date(
                              task.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(event) =>
                            updateTaskStatus(
                              task,
                              event.target.value as Task["status"]
                            )
                          }
                          className="rounded-xl border border-white/10 bg-[#0b0e11] px-3 py-2 text-xs text-white/65 outline-none"
                        >
                          <option value="todo">
                            Todo
                          </option>
                          <option value="in_progress">
                            In Progress
                          </option>
                          <option value="done">
                            Done
                          </option>
                        </select>

                        {project.owner_id === userId && (
                          <button
                            onClick={() => deleteTask(task)}
                            disabled={deletingId === task.id}
                            className="rounded-xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2 text-xs text-red-200/60 hover:bg-red-300/[0.08] hover:text-red-200 transition disabled:opacity-40"
                          >
                            {deletingId === task.id
                              ? "..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}