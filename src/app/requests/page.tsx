"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    location: string | null;
    skill: string | null;
    role: string | null;
    professional_level: string | null;
    verified: boolean | null;
  } | null;
};

export default function RequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: connections, error } = await supabase
      .from("connections")
      .select("id, requester_id, status, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setRequests([]);
      setLoading(false);
      return;
    }

    if (!connections || connections.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const requesterIds = connections.map(
      (connection) => connection.requester_id
    );

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, location, skill, role, professional_level, verified"
      )
      .in("id", requesterIds);

    if (profileError) {
      console.error(profileError);
      setRequests([]);
      setLoading(false);
      return;
    }

    const combined = connections.map((connection) => ({
      ...connection,
      profile:
        profiles?.find(
          (profile) => profile.id === connection.requester_id
        ) || null,
    }));

    setRequests(combined as RequestItem[]);
    setLoading(false);
  }

  async function updateRequest(
    connectionId: string,
    status: "accepted" | "rejected"
  ) {
    setProcessingId(connectionId);

    const { error } = await supabase
      .from("connections")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setProcessingId(null);
      return;
    }

    setRequests((current) =>
      current.filter((request) => request.id !== connectionId)
    );

    setProcessingId(null);
  }

  return (
    <main className="min-h-screen bg-[#F9F7F2] text-[#18352D]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E4DED3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D5B98A] bg-[#F9F7F2]">
              <span className="text-xl font-semibold text-[#176B52]">
                △
              </span>
            </div>

            <div className="text-left">
              <div className="text-lg font-bold tracking-[0.18em] text-[#18352D]">
                TRIANGLES
              </div>

              <div className="text-[10px] uppercase tracking-[0.22em] text-[#9A7B4F]">
                Professional Network
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full border border-[#D8D1C5] px-5 py-2.5 text-sm font-semibold text-[#35554B] transition hover:border-[#176B52] hover:text-[#176B52]"
          >
            Dashboard
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 pb-2">
          <span className="h-px w-16 bg-[#D5B98A]" />
          <span className="h-1.5 w-1.5 rotate-45 border border-[#D5B98A]" />
          <span className="h-px w-16 bg-[#D5B98A]" />
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7B4F]">
            Network
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#18352D]">
            Link Up Requests
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6F6A61]">
            Professionals who want to connect with you will appear here.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-[28px] border border-[#E4DED3] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D5B98A] border-t-[#176B52]" />

            <p className="mt-4 text-sm text-[#6F6A61]">
              Loading Link Up requests...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && requests.length === 0 && (
          <div className="mt-10 rounded-[28px] border border-[#E4DED3] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4EF] text-2xl text-[#176B52]">
              △
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[#18352D]">
              No Link Up requests
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#777168]">
              When another professional sends you a Link Up request,
              it will appear here.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-7 rounded-full bg-[#176B52] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#12553F]"
            >
              Explore Professionals
            </button>
          </div>
        )}

        {/* Requests */}
        {!loading && requests.length > 0 && (
          <div className="mt-8 space-y-4">
            {requests.map((request) => {
              const person = request.profile;

              if (!person) return null;

              const initials =
                person.full_name
                  ?.split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase() || "T";

              const processing = processingId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-[28px] border border-[#E4DED3] bg-white p-6 shadow-sm transition hover:shadow-md lg:p-7"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    {/* Person */}
                    <button
                      onClick={() =>
                        router.push(`/profile/${person.id}`)
                      }
                      className="flex items-center gap-4 text-left"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#176B52] text-lg font-semibold text-white">
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-[#18352D]">
                            {person.full_name ||
                              "TRIANGLES Professional"}
                          </h2>

                          {person.verified && (
                            <span
                              title="Verified Professional"
                              className="text-sm font-bold text-[#176B52]"
                            >
                              △✓
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-[#6F6A61]">
                          {person.role ||
                            person.skill ||
                            "Professional"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#777168]">
                          {person.location && (
                            <span>⌖ {person.location}</span>
                          )}

                          {person.skill && (
                            <span>• {person.skill}</span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          updateRequest(request.id, "rejected")
                        }
                        disabled={processing}
                        className="rounded-full border border-[#D8D1C5] px-5 py-2.5 text-sm font-semibold text-[#6F6A61] transition hover:border-[#B76D5C] hover:text-[#A4513E] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() =>
                          updateRequest(request.id, "accepted")
                        }
                        disabled={processing}
                        className="rounded-full bg-[#176B52] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#12553F] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processing ? "Saving..." : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom decoration */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <span className="h-px w-24 bg-[#D5B98A]" />
          <span className="h-2 w-2 rotate-45 border border-[#D5B98A]" />
          <span className="h-px w-24 bg-[#D5B98A]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 bg-[#123C32] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl lg:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-bold tracking-[0.18em]">
                TRIANGLES
              </div>

              <p className="mt-2 text-sm text-[#C7D5D0]">
                Real Skills. Real People.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-[#DCE6E2]">
              <button
                onClick={() => router.push("/dashboard")}
                className="transition hover:text-white"
              >
                Dashboard
              </button>

              <button
                onClick={() => router.push("/community")}
                className="transition hover:text-white"
              >
                Community
              </button>

              <button
                onClick={() => router.push("/opportunities")}
                className="transition hover:text-white"
              >
                Opportunities
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-[#AFC1BA]">
            © 2026 TRIANGLES. Built for people who build.
          </div>
        </div>
      </footer>
    </main>
  );
}