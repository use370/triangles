"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  project_id: string;
  actor_id: string | null;
  type: "task" | "file" | "member" | "update";
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
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
      .from("project_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function markRead(id: string) {
    const { error } = await supabase
      .from("project_notifications")
      .update({
        read: true,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  }

  async function markAllRead() {
    if (!userId) return;

    const { error } = await supabase
      .from("project_notifications")
      .update({
        read: true,
      })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      alert(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function iconFor(type: Notification["type"]) {
    if (type === "task") return "✓";
    if (type === "file") return "↗";
    if (type === "member") return "◎";
    return "✦";
  }

  function iconStyle(type: Notification["type"]) {
    if (type === "task") {
      return "bg-cyan-300/10 text-cyan-200 border-cyan-300/15";
    }

    if (type === "file") {
      return "bg-purple-300/10 text-purple-200 border-purple-300/15";
    }

    if (type === "member") {
      return "bg-amber-300/10 text-amber-200 border-amber-300/15";
    }

    return "bg-emerald-300/10 text-emerald-200 border-emerald-300/15";
  }

  function timeAgo(date: string) {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return new Date(date).toLocaleDateString();
  }

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white flex items-center justify-center">
        <p className="text-sm text-white/50">
          Loading notifications...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
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

      <div className="mx-auto max-w-4xl px-5 py-8">
        {/* TITLE */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
                TRIANGLES
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Notifications
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Stay updated on your projects and team activity.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="w-fit rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white/55 hover:text-white transition"
              >
                Mark all as read
              </button>
            )}
          </div>
        </section>

        {/* UNREAD COUNT */}
        {unreadCount > 0 && (
          <div className="mb-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3">
            <span className="text-xs text-emerald-200/70">
              {unreadCount} unread{" "}
              {unreadCount === 1
                ? "notification"
                : "notifications"}
            </span>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {notifications.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-14 text-center">
            <div className="text-4xl">
              ◌
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              You're all caught up
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              New project activity and team notifications will appear here.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    markRead(notification.id);
                  }

                  if (notification.project_id) {
                    router.push(
                      `/projects/${notification.project_id}`
                    );
                  }
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  notification.read
                    ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                    : "border-emerald-300/15 bg-emerald-300/[0.05] hover:bg-emerald-300/[0.08]"
                }`}
              >
                <div className="flex gap-4">
                  {/* ICON */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm ${iconStyle(
                      notification.type
                    )}`}
                  >
                    {iconFor(notification.type)}
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        )}
                      </div>

                      <span className="text-[11px] text-white/25">
                        {timeAgo(
                          notification.created_at
                        )}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* NAV */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/community")}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Community
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Messages
          </button>

          <button
            onClick={() => router.push("/needs")}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/50 hover:text-white transition"
          >
            Needs
          </button>
        </div>
      </div>
    </main>
  );
}