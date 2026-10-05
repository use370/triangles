"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProjectFile = {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export default function ProjectFilesPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  async function loadFiles() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
    } else {
      setFiles(data || []);
    }

    setLoading(false);
  }

  async function uploadFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !userId) {
      return;
    }

    setUploading(true);

    try {
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();

      const filePath = `${projectId}/${userId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("community-media")
        .getPublicUrl(filePath);

      const { error: databaseError } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          uploaded_by: userId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type || null,
          file_size: file.size,
        });

      if (databaseError) {
        await supabase.storage
          .from("community-media")
          .remove([filePath]);

        alert(databaseError.message);
        return;
      }

      await loadFiles();
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function deleteFile(file: ProjectFile) {
    const confirmed = window.confirm(
      `Delete "${file.file_name}"?`
    );

    if (!confirmed) {
      return;
    }

    const fileUrl = file.file_url;

    const marker = "/storage/v1/object/public/community-media/";

    const index = fileUrl.indexOf(marker);

    if (index !== -1) {
      const storagePath = decodeURIComponent(
        fileUrl.slice(index + marker.length)
      );

      await supabase.storage
        .from("community-media")
        .remove([storagePath]);
    }

    const { error } = await supabase
      .from("project_files")
      .delete()
      .eq("id", file.id);

    if (error) {
      alert(error.message);
      return;
    }

    setFiles((current) =>
      current.filter((item) => item.id !== file.id)
    );
  }

  function formatSize(bytes: number | null) {
    if (!bytes) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  }

  function fileIcon(type: string | null) {
    if (!type) return "📄";

    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎬";
    if (type.includes("pdf")) return "📕";
    if (type.includes("word")) return "📝";
    if (type.includes("sheet") || type.includes("excel"))
      return "📊";
    if (type.includes("zip")) return "🗜️";

    return "📄";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <p className="text-sm text-white/50">
          Loading project files...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
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

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* TITLE */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            PROJECT WORKSPACE
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Project Files
              </h1>

              <p className="mt-2 text-sm text-white/45">
                Keep important project documents and resources together.
              </p>
            </div>

            <label className="cursor-pointer rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-white/90 transition">
              {uploading
                ? "Uploading..."
                : "+ Upload File"}

              <input
                type="file"
                className="hidden"
                onChange={uploadFile}
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* INFO */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">
                Shared Project Files
              </p>

              <p className="mt-1 text-xs text-white/35">
                Files uploaded here are available to project members.
              </p>
            </div>

            <span className="text-xs text-white/35">
              {files.length}{" "}
              {files.length === 1 ? "file" : "files"}
            </span>
          </div>
        </section>

        {/* FILE LIST */}
        {files.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-14 text-center">
            <div className="text-4xl">
              📁
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No files yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              Upload project documents, designs, references,
              presentations or other useful resources.
            </p>

            <label className="mt-6 inline-flex cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs text-white/65 hover:text-white transition">
              Choose a File

              <input
                type="file"
                className="hidden"
                onChange={uploadFile}
                disabled={uploading}
              />
            </label>
          </section>
        ) : (
          <section className="space-y-3">
            {files.map((file) => (
              <article
                key={file.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
                    {fileIcon(file.file_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {file.file_name}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/30">
                      <span>
                        {formatSize(file.file_size)}
                      </span>

                      <span>•</span>

                      <span>
                        {new Date(
                          file.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 hover:text-white transition"
                    >
                      Open
                    </a>

                    {file.uploaded_by === userId && (
                      <button
                        onClick={() =>
                          deleteFile(file)
                        }
                        className="rounded-xl border border-red-300/10 px-3 py-2 text-xs text-red-200/45 hover:text-red-200 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* BOTTOM NAVIGATION */}
        <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </div>
    </main>
  );
}