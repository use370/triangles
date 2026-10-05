"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";
import ThemeToggle from "@/components/ThemeToggle";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  skill: string | null;
  role: string | null;
  about: string | null;
  bio: string | null;
  website: string | null;
  professional_level: string | null;
  verified: boolean | null;
  test_score: number | null;
};

const LEVELS = [
  "Emerging Professional",
  "Mid-Level Professional",
  "Professional",
  "Senior Professional",
];

export default function ProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [about, setAbout] = useState("");
  const [level, setLevel] = useState("Emerging Professional");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
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
        .from("profiles")
        .select(
          `
          id,
          full_name,
          username,
          avatar_url,
          location,
          skill,
          role,
          about,
          bio,
          website,
          professional_level,
          verified,
          test_score
        `,
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setProfile(data);

        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setSkill(data.skill || "");
        setRole(data.role || "");
        setLocation(data.location || "");
        setWebsite(data.website || "");
        setBio(data.bio || "");
        setAbout(data.about || "");
        setLevel(data.professional_level || "Emerging Professional");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!userId) return;

    try {
      setSaving(true);

      let avatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const extension =
          avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, {
            upsert: true,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          console.error(uploadError);
          alert("Photo upload failed.");
          return;
        }

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicData.publicUrl;
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          username: username.trim(),
          skill: skill.trim(),
          role: role.trim(),
          location: location.trim(),
          website: website.trim(),
          bio: bio.trim(),
          about: about.trim(),
          professional_level: level,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setProfile(data);
      setAvatarFile(null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return <LoadingLogo text="Loading profile..." />;
  }

  const displayName =
    profile?.full_name?.trim() || fullName.trim() || "Your Name";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-lg font-semibold tracking-[0.18em]"
          >
            TRIANGLES
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            >
              Network
            </button>

            <button
              onClick={() => router.push("/community")}
              className="rounded-xl px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            >
              Community
            </button>

            <button
              onClick={() => router.push("/needs")}
              className="rounded-xl px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            >
              Opportunities
            </button>

            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />

            <button
              onClick={() => router.push("/community")}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs"
            >
              Community
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* PROFILE HERO */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* AVATAR */}
              <div className="relative shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-28 w-28 rounded-full border border-[var(--border)] object-cover sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-3xl font-semibold sm:h-32 sm:w-32">
                    {initials || "T"}
                  </div>
                )}

                {profile?.verified && (
                  <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--brand)] text-sm text-white">
                    ✓
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {displayName}
                  </h1>

                  {profile?.verified && (
                    <span className="rounded-full border border-[var(--success)]/40 bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-medium text-[var(--success)]">
                      Verified
                    </span>
                  )}
                </div>

                {profile?.username && (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    @{profile.username}
                  </p>
                )}

                {profile?.bio && (
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {profile?.skill && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs">
                      {profile.skill}
                    </span>
                  )}

                  {profile?.role && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs">
                      {profile.role}
                    </span>
                  )}

                  {profile?.location && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs">
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/community")}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
              >
                Community Activity
              </button>

              <button
                onClick={() => setEditing((value) => !value)}
                className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                {editing ? "Close Edit" : "Edit Profile"}
              </button>
            </div>
          </div>
        </section>

        {/* EDIT PROFILE */}
        {editing && (
          <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Keep your professional identity clear and authentic.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Full name"
                value={fullName}
                onChange={setFullName}
                placeholder="Your full name"
              />

              <Field
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="username"
              />

              <Field
                label="Skill"
                value={skill}
                onChange={setSkill}
                placeholder="Web Development"
              />

              <Field
                label="Role"
                value={role}
                onChange={setRole}
                placeholder="Developer"
              />

              <Field
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="Jaipur"
              />

              <Field
                label="Website"
                value={website}
                onChange={setWebsite}
                placeholder="https://..."
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="A short professional introduction"
                  className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  About
                </label>

                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={5}
                  placeholder="Tell people about your work, experience and interests."
                  className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Professional level
                </label>

                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                >
                  {LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Profile photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setAvatarFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>
        )}

        {/* GRID */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* PROFESSIONAL LEVEL */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Professional level
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {profile?.professional_level || "Emerging Professional"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Your professional level is based on your profile and skill
              assessment.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <span className="text-sm">Skill test score</span>
              <span className="font-semibold">
                {profile?.test_score != null
                  ? `${profile.test_score}/10`
                  : "Not attempted"}
              </span>
            </div>
          </section>

          {/* SKILL TEST */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Skill verification
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Prove your skills
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Take the skill assessment to improve your professional
              verification level.
            </p>

            <button
              onClick={() => {
                if (!profile?.skill) {
                  alert("Please add your skill first.");
                  setEditing(true);
                  return;
                }

                router.push(
                  `/test?skill=${encodeURIComponent(
                    profile.skill,
                  )}&level=${encodeURIComponent(
                    profile.professional_level || "Emerging Professional",
                  )}`,
                );
              }}
              className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Take Skill Test
            </button>
          </section>

          {/* VERIFICATION */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              TRIANGLES verification
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-xl text-[var(--success)]">
                △✓
              </div>

              <div>
                <h2 className="font-semibold">
                  {profile?.verified
                    ? "Professionally verified"
                    : "Not verified yet"}
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Complete your skill assessment to strengthen your profile.
                </p>
              </div>
            </div>
          </section>

          {/* OPPORTUNITIES */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Opportunities
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Find work and people
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Explore opportunities and connect with people who need your
              skills.
            </p>

            <button
              onClick={() => router.push("/needs")}
              className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
            >
              Explore Opportunities
            </button>
          </section>

          {/* COMMUNITY */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Community
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Build your professional presence
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Share your work, discover professionals, create posts,
              interact with the community and build meaningful connections.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/community")}
                className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open Community
              </button>

              <button
                onClick={() => router.push("/community")}
                className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
              >
                View Community Activity
              </button>
            </div>
          </section>

          {/* PROFESSIONAL DETAILS */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Professional details
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Skill"
                value={profile?.skill || "Not added"}
              />

              <InfoCard
                label="Role"
                value={profile?.role || "Not added"}
              />

              <InfoCard
                label="Location"
                value={profile?.location || "Not added"}
              />

              <InfoCard
                label="Website"
                value={profile?.website || "Not added"}
              />
            </div>

            {profile?.about && (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                  About
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                  {profile.about}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* LOGOUT */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={logout}
            className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-medium">{value}</p>
    </div>
  );
}