"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [about, setAbout] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          full_name,
          username,
          bio,
          about,
          location,
          skill,
          role,
          website,
          avatar_url
        `
        )
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAbout(data.about || "");
        setLocation(data.location || "");
        setSkill(data.skill || "");
        setRole(data.role || "");
        setWebsite(data.website || "");
        setAvatarUrl(data.avatar_url || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        about: about.trim() || null,
        location: location.trim() || null,
        skill: skill.trim() || null,
        role: role.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile saved successfully.");

      setTimeout(() => {
        window.location.href = "/dashboard/profile";
      }, 700);
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img
            src="/triangles-logo.png"
            alt="TRIANGLES"
            className="w-14 h-14 object-contain animate-spin"
          />

          <p className="mt-4 text-sm text-[#68736E]">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F7F2] text-[#18201D]">
      {/* HEADER */}
      <header className="border-b border-[#DEDAD1] bg-[#F9F7F2]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/triangles-logo.png"
              alt="TRIANGLES"
              className="w-9 h-9 object-contain"
            />

            <span className="text-lg font-semibold tracking-[0.18em]">
              TRIANGLES
            </span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="rounded-full border border-[#CFCBC2] px-5 py-2.5 text-sm font-medium hover:bg-white transition"
          >
            Back to Profile
          </Link>
        </div>
      </header>

      {/* PAGE */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[#68736E]">
            Professional Profile
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Edit Profile
          </h1>

          <p className="mt-2 text-[#68736E]">
            Update your professional identity on TRIANGLES.
          </p>
        </div>

        {/* FORM */}
        <div className="rounded-[28px] border border-[#DEDAD1] bg-white p-7 md:p-9 shadow-[0_12px_40px_rgba(24,32,29,0.05)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FULL NAME */}
            <div>
              <label className="text-sm font-medium">
                Full Name
              </label>

              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className="text-sm font-medium">
                Username
              </label>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* LOCATION */}
            <div>
              <label className="text-sm font-medium">
                Location
              </label>

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jaipur, India"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="text-sm font-medium">
                Professional Role
              </label>

              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Web Developer"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* SKILL */}
            <div>
              <label className="text-sm font-medium">
                Primary Skill
              </label>

              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Your main professional skill"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* WEBSITE */}
            <div>
              <label className="text-sm font-medium">
                Website
              </label>

              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* AVATAR */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Profile Photo URL
              </label>

              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />

              <p className="mt-2 text-xs text-[#68736E]">
                Photo upload can be connected later to TRIANGLES storage.
              </p>
            </div>

            {/* BIO */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Bio
              </label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short professional introduction"
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>

            {/* ABOUT */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                About
              </label>

              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell people about your professional experience, interests and work."
                rows={6}
                className="mt-2 w-full resize-none rounded-2xl border border-[#D8D4CC] bg-[#FBFAF7] px-4 py-3 outline-none focus:border-[#18201D]"
              />
            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mt-6 rounded-2xl border border-[#D8D4CC] bg-[#F9F7F2] px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-full bg-[#18201D] px-7 py-3 text-sm font-medium text-white hover:bg-[#29332F] transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-[#CFCBC2] px-7 py-3 text-sm font-medium text-center hover:bg-[#F9F7F2] transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}