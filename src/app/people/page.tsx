"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  professional_level: string | null;
  verified: boolean | null;
};

export default function PeoplePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url, bio, skill, role, location, professional_level, verified"
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProfiles(data.filter((profile) => profile.id !== user?.id));
    }

    if (user) {
      const { data: connections } = await supabase
        .from("connections")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const statuses: Record<string, string> = {};

      connections?.forEach((connection) => {
        const otherUser =
          connection.requester_id === user.id
            ? connection.receiver_id
            : connection.requester_id;

        statuses[otherUser] = connection.status;
      });

      setConnectionStatus(statuses);
    }

    setLoading(false);
  }

  async function handleLinkUp(profileId: string) {
    setConnecting(profileId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const existingStatus = connectionStatus[profileId];

    if (existingStatus) {
      setConnecting(null);
      return;
    }

    const { error } = await supabase.from("connections").insert({
      requester_id: user.id,
      receiver_id: profileId,
      status: "pending",
    });

    if (!error) {
      setConnectionStatus((previous) => ({
        ...previous,
        [profileId]: "pending",
      }));
    }

    setConnecting(null);
  }

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return profiles;

    return profiles.filter((profile) => {
      return [
        profile.full_name,
        profile.username,
        profile.skill,
        profile.role,
        profile.location,
        profile.bio,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [profiles, search]);

  function getInitials(name: string | null) {
    if (!name) return "T";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  if (loading) {
    return <LoadingLogo text="Loading people..." />;
  }

  return (
    <main className="min-h-screen bg-[#F9F7F2] text-[#171A18]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#DDD8CC] bg-[#F9F7F2]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-3"
          >
            <img
              src="/triangles-logo.png"
              alt="TRIANGLES"
              className="h-10 w-10 object-contain"
            />

            <div className="text-left">
              <div className="text-lg font-semibold tracking-[0.18em]">
                TRIANGLES
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#7B817D]">
                People
              </div>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-full border border-[#CFC9BB] px-5 py-2 text-sm font-medium transition hover:bg-[#EEEAE0]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        {/* Heading */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#7A827C]">
            Professional Network
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Find people.
          </h1>

          <p className="mt-3 max-w-2xl text-[#68706B]">
            Discover professionals, builders and skilled people you can
            connect with.
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8A908C]">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, skill, role or location..."
              className="w-full rounded-2xl border border-[#D8D2C6] bg-white px-12 py-4 text-sm outline-none transition placeholder:text-[#9A9E9B] focus:border-[#8A948D] focus:ring-2 focus:ring-[#8A948D]/10"
            />
          </div>

          {search && (
            <div className="mt-3 text-sm text-[#7A817D]">
              {filteredProfiles.length}{" "}
              {filteredProfiles.length === 1 ? "person" : "people"} found
            </div>
          )}
        </div>

        {/* People */}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-[#DDD8CC] bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEEAE0] text-2xl">
              ◌
            </div>

            <h2 className="text-xl font-semibold">
              {search ? "No people found" : "No people yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747A76]">
              {search
                ? "Try searching for another name, skill, role or location."
                : "As professionals join TRIANGLES, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const status = connectionStatus[profile.id];

              return (
                <article
                  key={profile.id}
                  className="group rounded-3xl border border-[#DDD8CC] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(50,45,35,0.08)]"
                >
                  {/* Profile top */}
                  <div className="flex items-start justify-between gap-4">
                    <button
                      onClick={() =>
                        (window.location.href = `/profile/${profile.id}`)
                      }
                      className="flex items-center gap-4 text-left"
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || "Profile"}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#242925] text-sm font-semibold text-white">
                          {getInitials(profile.full_name)}
                        </div>
                      )}
                    </button>

                    {profile.verified && (
                      <div
                        title="Verified professional"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#A8B7A9] bg-[#EEF4EE] text-sm font-bold text-[#4E6A52]"
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <button
                    onClick={() =>
                      (window.location.href = `/profile/${profile.id}`)
                    }
                    className="mt-5 block text-left"
                  >
                    <h2 className="text-lg font-semibold group-hover:underline">
                      {profile.full_name || "Unnamed Professional"}
                    </h2>

                    {profile.username && (
                      <p className="mt-1 text-sm text-[#858B87]">
                        @{profile.username}
                      </p>
                    )}
                  </button>

                  {/* Role */}
                  {profile.role && (
                    <p className="mt-4 text-sm font-medium text-[#4F5752]">
                      {profile.role}
                    </p>
                  )}

                  {/* Skill */}
                  {profile.skill && (
                    <div className="mt-3 inline-flex rounded-full bg-[#EEEAE0] px-3 py-1.5 text-xs font-medium text-[#59605B]">
                      {profile.skill}
                    </div>
                  )}

                  {/* Location */}
                  {profile.location && (
                    <p className="mt-4 text-sm text-[#7A817D]">
                      ◉ {profile.location}
                    </p>
                  )}

                  {/* Bio */}
                  {profile.bio && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#69716C]">
                      {profile.bio}
                    </p>
                  )}

                  {/* Level */}
                  {profile.professional_level && (
                    <div className="mt-5 border-t border-[#EEEAE0] pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A908C]">
                        Professional Level
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#454C47]">
                        {profile.professional_level}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() =>
                        (window.location.href = `/profile/${profile.id}`)
                      }
                      className="flex-1 rounded-xl border border-[#D2CDC1] px-4 py-3 text-sm font-medium transition hover:bg-[#F3F0E9]"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleLinkUp(profile.id)}
                      disabled={connecting === profile.id || !!status}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        status === "accepted"
                          ? "bg-[#E7EEE7] text-[#536656]"
                          : status === "pending"
                            ? "bg-[#EEEAE0] text-[#6D736E]"
                            : "bg-[#202521] text-white hover:bg-[#303631]"
                      }`}
                    >
                      {connecting === profile.id
                        ? "Sending..."
                        : status === "accepted"
                          ? "Linked"
                          : status === "pending"
                            ? "Requested"
                            : "Link Up"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}