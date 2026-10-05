"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  about: string | null;
  bio: string | null;
  website: string | null;
  professional_level: string | null;
  verified: boolean | null;
  is_private: boolean | null;
};

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  status_background: string | null;
  created_at: string;
};

const statusBackgrounds = [
  {
    name: "Aurora",
    className:
      "bg-[radial-gradient(circle_at_20%_20%,#8b5cf6,transparent_42%),radial-gradient(circle_at_80%_80%,#06b6d4,transparent_42%),#11111c]",
  },
  {
    name: "Midnight",
    className:
      "bg-[radial-gradient(circle_at_50%_0%,#475569,transparent_45%),#09090b]",
  },
  {
    name: "Violet",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,#7c3aed,transparent_45%),#211333]",
  },
  {
    name: "Ocean",
    className:
      "bg-[radial-gradient(circle_at_70%_20%,#0891b2,transparent_45%),#07151c]",
  },
  {
    name: "Rose",
    className:
      "bg-[radial-gradient(circle_at_30%_20%,#db2777,transparent_45%),#210d19]",
  },
];

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "grid") {
    return (
      <svg {...p}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg {...p}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path
          d="m10 8 6 4-6 4V8Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (name === "bookmark") {
    return (
      <svg {...p}>
        <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.8L6 21V4.5Z" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...p}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.6 1Z" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...p}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = typeof params?.id === "string" ? params.id : "";

  const avatarInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [bookmarks, setBookmarks] = useState(0);
  const [bookmarkedPeople, setBookmarkedPeople] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [postMode, setPostMode] = useState<"post" | "status">("post");

  const [caption, setCaption] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [selectedBackground, setSelectedBackground] =
    useState("Aurora");

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!profileId) {
      router.push("/community");
      return;
    }

    setUserId(user.id);
    setIsOwnProfile(user.id === profileId);

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select(
        "id,full_name,username,avatar_url,skill,role,location,about,bio,website,professional_level,verified,is_private"
      )
      .eq("id", profileId)
      .maybeSingle();

    if (!targetProfile) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    setProfile(targetProfile);

    if (user.id === profileId) {
      setFullName(targetProfile.full_name || "");
      setUsername(targetProfile.username || "");
      setLocation(targetProfile.location || "");
      setSkill(targetProfile.skill || "");
      setRole(targetProfile.role || "");
      setBio(targetProfile.bio || targetProfile.about || "");
      setWebsite(targetProfile.website || "");
    }

    const { data: targetPosts } = await supabase
      .from("posts")
      .select(
        "id,user_id,content,image_url,media_url,media_type,status_background,created_at"
      )
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    setPosts(targetPosts || []);

    const { count: savedPostCount } = await supabase
      .from("post_saves")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId);

    setBookmarks(savedPostCount || 0);

    const { count: bookmarkedPeopleCount } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", profileId)
      .eq("status", "accepted");

    setBookmarkedPeople(bookmarkedPeopleCount || 0);

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  useEffect(() => {
    if (isOwnProfile && window.location.hash === "#add-post") {
      setShowEditor(true);
    }
  }, [isOwnProfile]);

  async function saveProfile() {
    if (!userId || !isOwnProfile) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: username.trim() || null,
        location: location.trim() || null,
        skill: skill.trim() || null,
        role: role.trim() || null,
        bio: bio.trim() || null,
        about: bio.trim() || null,
        website: website.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
    } else {
      await loadProfile();
      alert("Profile saved.");
    }

    setSavingProfile(false);
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;

    setUploadingAvatar(true);

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const path = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      alert(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
    } else {
      await loadProfile();
    }

    setUploadingAvatar(false);
  }

  function chooseMedia(file: File | undefined) {
    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setPostMode("post");
  }

  function resetEditor() {
    setShowEditor(false);
    setCaption("");
    setOverlayText("");
    setSelectedBackground("Aurora");
    setMediaFile(null);
    setMediaPreview(null);

    if (mediaInput.current) {
      mediaInput.current.value = "";
    }
  }

  async function createPost() {
    if (!userId) return;

    if (postMode === "status" && !caption.trim()) {
      alert("Status mein kuch text likho.");
      return;
    }

    if (postMode === "post" && !mediaFile) {
      alert("Photo ya video select karo.");
      return;
    }

    setCreatingPost(true);

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    if (mediaFile) {
      const extension =
        mediaFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const path = `${userId}/posts/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(path, mediaFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        alert(uploadError.message);
        setCreatingPost(false);
        return;
      }

      const { data } = supabase.storage
        .from("community-media")
        .getPublicUrl(path);

      mediaUrl = data.publicUrl;

      mediaType = mediaFile.type.startsWith("video")
        ? "video"
        : "image";
    }

    const content =
      postMode === "status"
        ? caption.trim()
        : caption.trim() || overlayText.trim() || "";

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      content,
      image_url: mediaUrl,
      media_url: mediaUrl,
      media_type: mediaType,
      status_background:
        postMode === "status" ? selectedBackground : null,
    });

    if (error) {
      alert(error.message);
      setCreatingPost(false);
      return;
    }

    resetEditor();
    await loadProfile();

    setCreatingPost(false);
  }

  const displayName =
    profile?.full_name || profile?.username || "Community Profile";

  const handleName =
    profile?.username || profile?.full_name || "professional";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07080c] text-white flex items-center justify-center">
        <LoadingLogo
          size={58}
          text="Loading Profile..."
          fullScreen={false}
        />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#07080c] text-white flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Community Profile not found</h1>
          <p className="mt-2 text-sm text-white/40">This profile may not exist anymore.</p>
          <button
            onClick={() => router.push("/community")}
            className="mt-6 rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold"
          >
            Back to Community
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/7 blur-[130px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-500/6 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07080c]/85 backdrop-blur-2xl">
        <div className="max-w-[980px] mx-auto h-[68px] px-4 flex items-center">
          <button
            onClick={() => router.push("/community")}
            className="font-semibold tracking-[0.18em] text-sm"
          >
            TRIANGLES
          </button>

          <div className="mx-auto text-sm font-medium">
            {profile?.username ? `@${profile.username}` : "Community Profile"}
          </div>

          <button
            onClick={() => router.push("/community")}
            className="h-10 w-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/60"
          >
            <Icon name="grid" size={18} />
          </button>
        </div>
      </header>

      <div className="relative max-w-[980px] mx-auto px-4">
        <section className="py-8 sm:py-10 border-b border-white/[0.07]">
          <div className="flex gap-5 sm:gap-9 items-start">
            <button
              onClick={() => isOwnProfile && avatarInput.current?.click()}
              className={`relative h-[92px] w-[92px] sm:h-[132px] sm:w-[132px] rounded-full p-[3px] bg-gradient-to-br from-violet-400 via-cyan-300 to-white/10 shrink-0 ${isOwnProfile ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="h-full w-full rounded-full overflow-hidden bg-[#15161b]">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-semibold">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <span className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center border-4 border-[#07080c]">
                  <Icon name="plus" size={15} />
                </span>
              )}
            </button>

            {isOwnProfile && (
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    uploadAvatar(file);
                  }
                }}
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold truncate">
                  {displayName}
                </h1>

                {profile?.verified && (
                  <span className="h-5 w-5 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              <p className="text-sm text-white/40 mt-1">
                @{handleName}
              </p>

              <div className="flex gap-6 sm:gap-10 mt-5">
                <div>
                  <strong>{posts.length}</strong>
                  <span className="text-white/40 text-sm ml-1">
                    posts
                  </span>
                </div>

                <div>
                  <strong>{bookmarks}</strong>
                  <span className="text-white/40 text-sm ml-1">
                    bookmarks
                  </span>
                </div>

                <div>
                  <strong>{bookmarkedPeople}</strong>
                  <span className="text-white/40 text-sm ml-1">
                    bookmarked
                  </span>
                </div>
              </div>

              {isOwnProfile && (
                <div className="hidden sm:flex gap-2 mt-5">
                  <button
                    onClick={() => setShowEditor(true)}
                  className="rounded-xl bg-white text-black px-5 py-2.5 text-sm font-semibold"
                >
                  Add Post
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("edit-profile")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm"
                >
                  Edit Profile
                </button>

                <button
                  onClick={() =>
                    router.push("/community-requests")
                  }
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center"
                  >
                    <Icon name="bookmark" size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-6 sm:hidden flex gap-2">
              <button
                onClick={() => setShowEditor(true)}
              className="flex-1 rounded-xl bg-white text-black py-2.5 text-sm font-semibold"
            >
              Add Post
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("edit-profile")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-sm"
              >
                Edit Profile
              </button>
            </div>
          )}

          <div className="mt-6 max-w-[650px]">
            {profile?.role && (
              <p className="font-semibold text-sm">
                {profile.role}
              </p>
            )}

            {profile?.skill && (
              <p className="text-sm text-cyan-200/75 mt-1">
                {profile.skill}
              </p>
            )}

            {profile?.location && (
              <p className="text-xs text-white/35 mt-2">
                {profile.location}
              </p>
            )}

            {(profile?.bio || profile?.about) && (
              <p className="text-sm text-white/65 mt-3 leading-6 whitespace-pre-wrap">
                {profile.bio || profile.about}
              </p>
            )}

            {profile?.website && (
              <a
                href={
                  profile.website.startsWith("http")
                    ? profile.website
                    : `https://${profile.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-sm text-cyan-300 hover:underline"
              >
                {profile.website}
              </a>
            )}
          </div>
        </section>

        <div className="h-16 flex items-center justify-center gap-10 border-b border-white/[0.07]">
          <button className="h-full border-b-2 border-white flex items-center gap-2 text-white">
            <Icon name="grid" size={18} />

            <span className="text-xs tracking-wider uppercase">
              Posts
            </span>
          </button>

          <button
            onClick={() => router.push("/community/bits")}
            className="text-white/30 hover:text-white flex items-center gap-2"
          >
            <Icon name="play" size={18} />

            <span className="text-xs tracking-wider uppercase">
              Bits
            </span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => router.push("/bookmarked")}
              className="text-white/30 hover:text-white flex items-center gap-2"
            >
              <Icon name="bookmark" size={18} />

              <span className="text-xs tracking-wider uppercase">
                Saved
              </span>
            </button>
          )}
        </div>

        <section className="py-5">
          {posts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                <Icon name="plus" size={27} />
              </div>

              <h2 className="mt-5 font-semibold text-lg">
                Create your first post
              </h2>

              <p className="text-sm text-white/35 mt-2">
                Show people what you build.
              </p>

              <button
                onClick={() => setShowEditor(true)}
                className="mt-6 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold"
              >
                Add Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((post) => {
                const media =
                  post.media_url || post.image_url;

                const background =
                  statusBackgrounds.find(
                    (x) =>
                      x.name.toLowerCase() ===
                      (post.status_background || "").toLowerCase()
                  )?.className ||
                  statusBackgrounds[0].className;

                return (
                  <button
                    key={post.id}
                    onClick={() =>
                      router.push(
                        `/community?post=${post.id}`
                      )
                    }
                    className="relative aspect-square overflow-hidden bg-white/[0.04] group"
                  >
                    {media ? (
                      post.media_type === "video" ? (
                        <video
                          src={media}
                          className="h-full w-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={media}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div
                        className={`h-full w-full ${background} p-4 flex items-center justify-center`}
                      >
                        <span className="text-xs sm:text-sm font-semibold line-clamp-5">
                          {post.content}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/40 px-3 py-2 rounded-xl">
                        Open
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {isOwnProfile && (
          <section
            id="edit-profile"
          className="mt-10 mb-24 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">
                Professional Identity
              </h2>

              <p className="text-xs text-white/30 mt-1">
                Keep your professional information current.
              </p>
            </div>

            <button className="h-9 w-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/50">
              <Icon name="settings" size={17} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              placeholder="Full name"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Username"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />

            <input
              value={skill}
              onChange={(e) =>
                setSkill(e.target.value)
              }
              placeholder="Main skill"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />

            <input
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              placeholder="Professional role"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />

            <input
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="City"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />

            <input
              value={website}
              onChange={(e) =>
                setWebsite(e.target.value)
              }
              placeholder="Website"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
            />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people what you build..."
            className="mt-4 w-full min-h-[120px] rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm outline-none resize-none"
          />

          <button
            disabled={savingProfile}
            onClick={saveProfile}
            className="mt-4 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {savingProfile
              ? "Saving..."
              : "Save Profile"}
          </button>
          </section>
        )}
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed lg:hidden bottom-0 left-0 right-0 z-50 h-[68px] border-t border-white/[0.08] bg-[#090a0f]/90 backdrop-blur-2xl flex items-center justify-around">
        <button
          onClick={() => router.push("/community")}
          className="text-white/50 text-[10px]"
        >
          Community
        </button>

        <button
          onClick={() => router.push("/community/bits")}
          className="text-white/50 text-[10px]"
        >
          Bits
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="text-white text-[10px] font-semibold"
        >
          Profile
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="text-white/50 text-[10px]"
        >
          Messages
        </button>

        <button
          onClick={() =>
            router.push("/community-requests")
          }
          className="text-white/50 text-[10px]"
        >
          Requests
        </button>
      </nav>

      {/* CREATE MODAL */}
      {isOwnProfile && showEditor && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[30px] border border-white/10 bg-[#111217] shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#111217]/95 backdrop-blur-xl border-b border-white/[0.07] px-5 py-4 flex items-center">
              <div>
                <h2 className="font-semibold">
                  Create
                </h2>

                <p className="text-xs text-white/30 mt-1">
                  Share your work with the Community
                </p>
              </div>

              <button
                onClick={resetEditor}
                className="ml-auto h-9 w-9 rounded-xl bg-white/[0.05] flex items-center justify-center"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 rounded-2xl bg-white/[0.04] p-1 mb-5">
                <button
                  onClick={() => setPostMode("post")}
                  className={`rounded-xl py-2.5 text-sm ${
                    postMode === "post"
                      ? "bg-white text-black font-semibold"
                      : "text-white/45"
                  }`}
                >
                  Post
                </button>

                <button
                  onClick={() => {
                    setPostMode("status");
                    setMediaFile(null);
                    setMediaPreview(null);
                  }}
                  className={`rounded-xl py-2.5 text-sm ${
                    postMode === "status"
                      ? "bg-white text-black font-semibold"
                      : "text-white/45"
                  }`}
                >
                  Aa Status
                </button>
              </div>

              {postMode === "status" && (
                <>
                  <div
                    className={`min-h-[280px] rounded-[28px] p-7 flex items-center justify-center text-center ${
                      statusBackgrounds.find(
                        (x) =>
                          x.name === selectedBackground
                      )?.className
                    }`}
                  >
                    <textarea
                      value={caption}
                      onChange={(e) =>
                        setCaption(e.target.value)
                      }
                      maxLength={500}
                      placeholder="Write your professional thought..."
                      className="w-full bg-transparent text-2xl sm:text-3xl font-semibold text-center outline-none resize-none placeholder:text-white/35"
                    />
                  </div>

                  <p className="text-xs text-white/30 mt-3">
                    Choose a background
                  </p>

                  <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
                    {statusBackgrounds.map(
                      (background) => (
                        <button
                          key={background.name}
                          onClick={() =>
                            setSelectedBackground(
                              background.name
                            )
                          }
                          className={`shrink-0 h-12 w-12 rounded-xl ${
                            background.className
                          } ${
                            selectedBackground ===
                            background.name
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[#111217]"
                              : ""
                          }`}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {postMode === "post" && (
                <>
                  <input
                    ref={mediaInput}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) =>
                      chooseMedia(e.target.files?.[0])
                    }
                  />

                  {!mediaPreview ? (
                    <button
                      onClick={() =>
                        mediaInput.current?.click()
                      }
                      className="w-full h-[300px] rounded-[28px] border border-dashed border-white/15 bg-white/[0.035] flex flex-col items-center justify-center"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-white/[0.07] flex items-center justify-center">
                        <Icon name="plus" size={28} />
                      </div>

                      <p className="mt-5 font-medium">
                        Add photo or video
                      </p>

                      <p className="text-xs text-white/30 mt-1">
                        Your post will appear in your grid
                      </p>
                    </button>
                  ) : (
                    <div className="relative rounded-[28px] overflow-hidden bg-black">
                      {mediaFile?.type.startsWith(
                        "video"
                      ) ? (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full max-h-[500px] object-contain"
                        />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt=""
                          className="w-full max-h-[500px] object-contain"
                        />
                      )}

                      <button
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <Icon name="close" size={17} />
                      </button>
                    </div>
                  )}

                  <input
                    value={overlayText}
                    onChange={(e) =>
                      setOverlayText(e.target.value)
                    }
                    placeholder="Optional text to place on your post"
                    className="mt-4 w-full h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none"
                  />

                  <textarea
                    value={caption}
                    onChange={(e) =>
                      setCaption(e.target.value)
                    }
                    placeholder="Write a professional caption..."
                    className="mt-3 w-full min-h-[110px] rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm outline-none resize-none"
                  />
                </>
              )}

              <button
                disabled={creatingPost}
                onClick={createPost}
                className="mt-5 w-full rounded-2xl bg-white text-black py-3.5 text-sm font-semibold disabled:opacity-40"
              >
                {creatingPost
                  ? "Publishing..."
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && uploadingAvatar && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center">
          <div className="rounded-2xl bg-[#15161b] border border-white/10 px-6 py-5 text-sm">
            Updating profile photo...
          </div>
        </div>
      )}
    </main>
  );
}