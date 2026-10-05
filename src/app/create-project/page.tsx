"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function createProject(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Project title is required.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      // Automatically add creator as project owner
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: "Owner",
        });

      if (memberError) {
        console.error(memberError);
        alert(memberError.message);
        return;
      }

      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Back
          </button>

          <div className="font-semibold tracking-tight">
            TRIANGLES
          </div>

          <div className="w-12" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            PROJECT WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Create a Project
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            Start a workspace and bring professionals together around
            the work.
          </p>
        </div>

        <form
          onSubmit={createProject}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-white/75">
              Project title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Build a premium website"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30"
              maxLength={120}
              required
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-white/75">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What are you building?"
              rows={6}
              maxLength={1000}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </main>
  );
}