"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import LoadingLogo from "@/components/LoadingLogo";
import ThemeToggle from "@/components/ThemeToggle";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
  professional_level: string | null;
  verified: boolean | null;
};

type Bit = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  image_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
  profile?: Profile;

  likes: number;
  comments: number;
  saves: number;

  liked: boolean;
  saved: boolean;
  connected: boolean;
};

type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
};

function initials(
  name: string | null
) {
  const value =
    (name || "Professional").trim();

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function Icon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
  };

  if (name === "play") {
    return (
      <svg {...common}>
        <path
          d="m9 6 10 6-10 6V6Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M20.8 8.7c0 5.2-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.7A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.5Z" />
      </svg>
    );
  }

  if (name === "comment") {
    return (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5H8l-4 2 1.2-3.8A7.2 7.2 0 0 1 4 13.2a7.5 7.5 0 0 1 7.5-7.2H12.5A7.5 7.5 0 0 1 20 11.5Z" />
      </svg>
    );
  }

  if (name === "bookmark") {
    return (
      <svg {...common}>
        <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.8L6 21V4.5Z" />
      </svg>
    );
  }

  if (name === "share") {
    return (
      <svg {...common}>
        <path d="M12 15V3" />
        <path d="m8 7 4-4 4 4" />
        <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg {...common}>
        <path d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z" />
        <path d="M10 14 21 3" />
      </svg>
    );
  }

  if (name === "volume") {
    return (
      <svg {...common}>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="M16 9a4 4 0 0 1 0 6" />
        <path d="M18.5 6.5a8 8 0 0 1 0 11" />
      </svg>
    );
  }

  if (name === "mute") {
    return (
      <svg {...common}>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="m18 9-5 6" />
        <path d="m13 9 5 6" />
      </svg>
    );
  }

  if (name === "link") {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 7 20l1.2-1.2" />
      </svg>
    );
  }

  if (name === "message") {
    return (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5H8l-4 2 1.2-3.8A7.2 7.2 0 0 1 4 13.2a7.5 7.5 0 0 1 7.5-7.2H12.5A7.5 7.5 0 0 1 20 11.5Z" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle
          cx="11"
          cy="11"
          r="7"
        />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

export default function BitsPage() {
  const router = useRouter();

  const videoRefs =
    useRef<
      Record<string, HTMLVideoElement | null>
    >({});

  const fileInput =
    useRef<HTMLInputElement>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [bits, setBits] =
    useState<Bit[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [mode, setMode] =
    useState<"for-you" | "following">(
      "for-you"
    );

  const [muted, setMuted] =
    useState(true);

  const [activeBit, setActiveBit] =
    useState<string | null>(null);

  const [comments, setComments] =
    useState<
      Record<string, Comment[]>
    >({});

  const [commentText, setCommentText] =
    useState<
      Record<string, string>
    >({});

  const [openComments, setOpenComments] =
    useState<
      Record<string, boolean>
    >({});

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [caption, setCaption] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  function notify(
    message: string
  ) {
    setActionMessage(message);

    window.setTimeout(() => {
      setActionMessage("");
    }, 2200);
  }

  async function loadBits() {
    setLoading(true);

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const {
      data: currentProfile,
    } =
      await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
        )
        .eq("id", user.id)
        .maybeSingle();

    setProfile(
      currentProfile as Profile
    );

    const { data: posts } =
      await supabase
        .from("posts")
        .select(
          "id,user_id,content,media_url,image_url,media_type,created_at"
        )
        .eq(
          "media_type",
          "video"
        )
        .not(
          "media_url",
          "is",
          null
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    const rawPosts =
      posts || [];

    const userIds = [
      ...new Set(
        rawPosts.map(
          (post) =>
            post.user_id
        )
      ),
    ];

    let profiles: Profile[] =
      [];

    if (userIds.length) {
      const {
        data: profileRows,
      } =
        await supabase
          .from("profiles")
          .select(
            "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
          )
          .in(
            "id",
            userIds
          );

      profiles =
        (profileRows ||
          []) as Profile[];
    }

    const profileMap =
      new Map(
        profiles.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const postIds =
      rawPosts.map(
        (post) =>
          post.id
      );

    let likes: {
      post_id: string;
      user_id: string;
    }[] = [];

    let saves: {
      post_id: string;
      user_id: string;
    }[] = [];

    let commentRows: {
      post_id: string;
    }[] = [];

    if (postIds.length) {
      const [
        likesResult,
        savesResult,
        commentsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "post_likes"
            )
            .select(
              "post_id,user_id"
            )
            .in(
              "post_id",
              postIds
            ),

          supabase
            .from(
              "post_saves"
            )
            .select(
              "post_id,user_id"
            )
            .in(
              "post_id",
              postIds
            ),

          supabase
            .from(
              "post_comments"
            )
            .select(
              "post_id"
            )
            .in(
              "post_id",
              postIds
            ),
        ]);

      likes =
        likesResult.data ||
        [];

      saves =
        savesResult.data ||
        [];

      commentRows =
        commentsResult.data ||
        [];
    }

    const {
      data: connectionRows,
    } =
      await supabase
        .from(
          "connections"
        )
        .select(
          "requester_id,receiver_id,status"
        )
        .eq(
          "status",
          "accepted"
        )
        .or(
          `requester_id.eq.${user.id},receiver_id.eq.${user.id}`
        );

    const connectedIds =
      new Set<string>();

    (
      connectionRows ||
      []
    ).forEach(
      (connection) => {
        if (
          connection.requester_id ===
          user.id
        ) {
          connectedIds.add(
            connection.receiver_id
          );
        } else {
          connectedIds.add(
            connection.requester_id
          );
        }
      }
    );

    const finalBits: Bit[] =
      rawPosts.map(
        (post) => {
          const postLikes =
            likes.filter(
              (like) =>
                like.post_id ===
                post.id
            );

          const postSaves =
            saves.filter(
              (save) =>
                save.post_id ===
                post.id
            );

          const postComments =
            commentRows.filter(
              (comment) =>
                comment.post_id ===
                post.id
            );

          return {
            ...post,

            profile:
              profileMap.get(
                post.user_id
              ),

            likes:
              postLikes.length,

            saves:
              postSaves.length,

            comments:
              postComments.length,

            liked:
              postLikes.some(
                (like) =>
                  like.user_id ===
                  user.id
              ),

            saved:
              postSaves.some(
                (save) =>
                  save.user_id ===
                  user.id
              ),

            connected:
              connectedIds.has(
                post.user_id
              ),
          };
        }
      );

    setBits(finalBits);

    setLoading(false);
  }

  useEffect(() => {
    loadBits();
  }, []);

  useEffect(() => {
    if (!bits.length) return;

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              const id =
                entry.target.getAttribute(
                  "data-bit-id"
                );

              if (!id) return;

              const video =
                videoRefs.current[
                  id
                ];

              if (!video) return;

              if (
                entry.isIntersecting &&
                entry.intersectionRatio >
                  0.65
              ) {
                setActiveBit(id);

                video
                  .play()
                  .catch(() => {});
              } else {
                video.pause();
              }
            }
          );
        },
        {
          threshold: [
            0.2,
            0.65,
            0.9,
          ],
        }
      );

    const elements =
      document.querySelectorAll(
        "[data-bit-id]"
      );

    elements.forEach(
      (element) =>
        observer.observe(
          element
        )
    );

    return () =>
      observer.disconnect();
  }, [bits, mode]);

  useEffect(() => {
    Object.values(
      videoRefs.current
    ).forEach(
      (video) => {
        if (video) {
          video.muted =
            muted;
        }
      }
    );
  }, [muted]);

  async function toggleLike(
    bit: Bit
  ) {
    if (!userId) return;

    const previous =
      bit.liked;

    setBits(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            bit.id
              ? {
                  ...item,
                  liked:
                    !previous,
                  likes:
                    item.likes +
                    (previous
                      ? -1
                      : 1),
                }
              : item
        )
    );

    if (previous) {
      await supabase
        .from(
          "post_likes"
        )
        .delete()
        .eq(
          "post_id",
          bit.id
        )
        .eq(
          "user_id",
          userId
        );
    } else {
      await supabase
        .from(
          "post_likes"
        )
        .insert({
          post_id:
            bit.id,
          user_id:
            userId,
        });
    }
  }

  async function toggleSave(
    bit: Bit
  ) {
    if (!userId) return;

    const previous =
      bit.saved;

    setBits(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            bit.id
              ? {
                  ...item,
                  saved:
                    !previous,
                  saves:
                    item.saves +
                    (previous
                      ? -1
                      : 1),
                }
              : item
        )
    );

    if (previous) {
      await supabase
        .from(
          "post_saves"
        )
        .delete()
        .eq(
          "post_id",
          bit.id
        )
        .eq(
          "user_id",
          userId
        );
    } else {
      await supabase
        .from(
          "post_saves"
        )
        .insert({
          post_id:
            bit.id,
          user_id:
            userId,
        });
    }

    notify(
      previous
        ? "Removed from Saved"
        : "Saved"
    );
  }

  async function loadComments(
    postId: string
  ) {
    const {
      data,
    } =
      await supabase
        .from(
          "post_comments"
        )
        .select(
          "id,content,user_id,created_at"
        )
        .eq(
          "post_id",
          postId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    const rows =
      data || [];

    const ids = [
      ...new Set(
        rows.map(
          (row) =>
            row.user_id
        )
      ),
    ];

    let profileRows: Profile[] =
      [];

    if (ids.length) {
      const {
        data:
          profilesData,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
          )
          .in(
            "id",
            ids
          );

      profileRows =
        (profilesData ||
          []) as Profile[];
    }

    const map =
      new Map(
        profileRows.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    setComments(
      (current) => ({
        ...current,
        [postId]:
          rows.map(
            (row) => ({
              ...row,
              profile:
                map.get(
                  row.user_id
                ),
            })
          ),
      })
    );
  }

  async function toggleComments(
    postId: string
  ) {
    const open =
      !!openComments[
        postId
      ];

    setOpenComments(
      (current) => ({
        ...current,
        [postId]:
          !open,
      })
    );

    if (!open) {
      await loadComments(
        postId
      );
    }
  }

  async function submitComment(
    postId: string
  ) {
    if (!userId) return;

    const text =
      commentText[
        postId
      ]?.trim();

    if (!text) return;

    if (text.length > 500) {
      notify(
        "Comment 500 characters se chhota rakho."
      );
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "post_comments"
        )
        .insert({
          post_id:
            postId,
          user_id:
            userId,
          content:
            text,
        });

    if (error) {
      notify(
        error.message
      );
      return;
    }

    setCommentText(
      (current) => ({
        ...current,
        [postId]:
          "",
      })
    );

    await loadComments(
      postId
    );

    setBits(
      (current) =>
        current.map(
          (bit) =>
            bit.id ===
            postId
              ? {
                  ...bit,
                  comments:
                    bit.comments +
                    1,
                }
              : bit
        )
    );
  }

  async function shareBit(
    bit: Bit
  ) {
    const url =
      `${window.location.origin}/community/bits#${bit.id}`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share(
          {
            title:
              "TRIANGLES Bit",
            text:
              bit.content ||
              "Professional Bit on TRIANGLES",
            url,
          }
        );
      } else {
        await navigator.clipboard.writeText(
          url
        );

        notify(
          "Bit link copied."
        );
      }
    } catch {
      // cancelled
    }
  }

  async function linkUp(
    bit: Bit
  ) {
    if (
      !userId ||
      bit.user_id === userId
    ) {
      return;
    }

    if (
      bit.connected
    ) {
      notify(
        "Already linked."
      );
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "connections"
        )
        .insert({
          requester_id:
            userId,
          receiver_id:
            bit.user_id,
          status:
            "pending",
        });

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        notify(
          "Link Up request already sent."
        );
      } else {
        notify(
          error.message
        );
      }

      return;
    }

    notify(
      "Link Up request sent."
    );
  }

  function messageCreator(
    bit: Bit
  ) {
    if (
      !userId ||
      bit.user_id === userId
    ) {
      return;
    }

    router.push(
      `/messages?user=${bit.user_id}`
    );
  }

  async function createBit() {
    if (!userId) return;

    if (!selectedFile) {
      notify(
        "Video select karo."
      );
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "video/"
      )
    ) {
      notify(
        "Bit ke liye video select karo."
      );
      return;
    }

    setUploading(true);

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "mp4";

    const path =
      `${userId}/bits/${Date.now()}.${extension}`;

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          "community-media"
        )
        .upload(
          path,
          selectedFile,
          {
            upsert: false,
            cacheControl:
              "3600",
          }
        );

    if (uploadError) {
      notify(
        uploadError.message
      );
      setUploading(false);
      return;
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          "community-media"
        )
        .getPublicUrl(
          path
        );

    const {
      error,
    } =
      await supabase
        .from("posts")
        .insert({
          user_id:
            userId,
          content:
            caption.trim(),
          media_url:
            data.publicUrl,
          image_url:
            data.publicUrl,
          media_type:
            "video",
        });

    if (error) {
      notify(
        error.message
      );
      setUploading(false);
      return;
    }

    setSelectedFile(
      null
    );

    setPreview(
      null
    );

    setCaption("");

    setShowCreate(
      false
    );

    if (
      fileInput.current
    ) {
      fileInput.current.value =
        "";
    }

    await loadBits();

    notify(
      "Bit published."
    );

    setUploading(false);
  }

  const visibleBits =
    mode ===
    "following"
      ? bits.filter(
          (bit) =>
            bit.connected ||
            bit.user_id ===
              userId
        )
      : bits;

  if (loading) {
    return (
      <LoadingLogo
        text="Loading Bits..."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* TOP BAR */}

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            onClick={() =>
              router.push(
                "/community"
              )
            }
            className="flex items-center gap-2 font-semibold"
          >
            <span className="text-xl text-[var(--accent)]">
              △
            </span>

            <span className="hidden sm:inline tracking-[0.16em] text-sm">
              TRIANGLES
            </span>
          </button>

          <div className="mx-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              onClick={() =>
                setMode(
                  "for-you"
                )
              }
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                mode ===
                "for-you"
                  ? "bg-[var(--brand)] text-[var(--background)]"
                  : "text-[var(--muted)]"
              }`}
            >
              For You
            </button>

            <button
              onClick={() =>
                setMode(
                  "following"
                )
              }
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                mode ===
                "following"
                  ? "bg-[var(--brand)] text-[var(--background)]"
                  : "text-[var(--muted)]"
              }`}
            >
              Following
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setShowCreate(
                  true
                )
              }
              className="hidden sm:flex h-10 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-xs font-semibold text-[var(--background)]"
            >
              <Icon
                name="plus"
                size={16}
              />
              Create Bit
            </button>

            <ThemeToggle compact />

            <button
              onClick={() =>
                router.push(
                  "/dashboard/profile"
                )
              }
              className="h-10 w-10 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)]"
            >
              {profile?.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--accent)]">
                  {initials(
                    profile?.full_name ||
                      null
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <div className="pt-16 pb-20">
        {visibleBits.length ===
        0 ? (
          <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
                <Icon
                  name="play"
                  size={30}
                />
              </div>

              <h1 className="mt-6 text-2xl font-semibold">
                No Bits yet
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Share a short professional video and let your work speak.
              </p>

              <button
                onClick={() =>
                  setShowCreate(
                    true
                  )
                }
                className="mt-6 rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--background)]"
              >
                Create your first Bit
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[520px]">
            {visibleBits.map(
              (bit) => (
                <article
                  key={bit.id}
                  id={bit.id}
                  data-bit-id={
                    bit.id
                  }
                  className="relative min-h-[calc(100svh-64px)] snap-start border-b border-[var(--border)] bg-black sm:my-3 sm:min-h-[820px] sm:overflow-hidden sm:rounded-[28px] sm:border"
                >
                  {/* VIDEO */}

                  <div className="absolute inset-0">
                    {bit.media_url ||
                    bit.image_url ? (
                      <video
                        ref={(
                          element
                        ) => {
                          videoRefs.current[
                            bit.id
                          ] =
                            element;
                        }}
                        src={
                          bit.media_url ||
                          bit.image_url ||
                          ""
                        }
                        muted={
                          muted
                        }
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                        onDoubleClick={() =>
                          toggleLike(
                            bit
                          )
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[var(--surface)] p-10 text-center text-xl font-semibold">
                        {
                          bit.content
                        }
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />
                  </div>

                  {/* TOP VIDEO CONTROLS */}

                  <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-4">
                    <button
                      onClick={() =>
                        router.push(
                          "/community"
                        )
                      }
                      className="h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-xl"
                    >
                      ←
                    </button>

                    <div className="rounded-full bg-black/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                      BIT
                    </div>

                    <button
                      onClick={() =>
                        setMuted(
                          !muted
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl"
                    >
                      <Icon
                        name={
                          muted
                            ? "mute"
                            : "volume"
                        }
                        size={18}
                      />
                    </button>
                  </div>

                  {/* RIGHT ACTIONS */}

                  <div className="absolute bottom-32 right-3 z-20 flex flex-col items-center gap-3 sm:right-4">
                    <button
                      onClick={() =>
                        toggleLike(
                          bit
                        )
                      }
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl transition ${
                          bit.liked
                            ? "bg-red-500/20 text-red-400"
                            : "bg-black/30 text-white"
                        }`}
                      >
                        <Icon
                          name="heart"
                          size={23}
                        />
                      </span>

                      <span className="text-[10px] font-semibold text-white drop-shadow">
                        {bit.likes}
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        toggleComments(
                          bit.id
                        )
                      }
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl">
                        <Icon
                          name="comment"
                          size={22}
                        />
                      </span>

                      <span className="text-[10px] font-semibold text-white">
                        {
                          bit.comments
                        }
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        toggleSave(
                          bit
                        )
                      }
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl ${
                          bit.saved
                            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                            : "bg-black/30 text-white"
                        }`}
                      >
                        <Icon
                          name="bookmark"
                          size={22}
                        />
                      </span>

                      <span className="text-[10px] font-semibold text-white">
                        {bit.saves}
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        shareBit(
                          bit
                        )
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl"
                    >
                      <Icon
                        name="share"
                        size={21}
                      />
                    </button>

                    {bit.user_id !==
                      userId && (
                      <>
                        <button
                          onClick={() =>
                            messageCreator(
                              bit
                            )
                          }
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl"
                        >
                          <Icon
                            name="message"
                            size={20}
                          />
                        </button>

                        <button
                          onClick={() =>
                            linkUp(
                              bit
                            )
                          }
                          className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl ${
                            bit.connected
                              ? "bg-emerald-400/20 text-emerald-300"
                              : "bg-black/30 text-white"
                          }`}
                        >
                          <Icon
                            name="link"
                            size={20}
                          />
                        </button>
                      </>
                    )}
                  </div>

                  {/* CREATOR INFO */}

                  <div className="absolute bottom-5 left-4 right-20 z-20 text-white sm:left-5">
                    <button
                      onClick={() =>
                        router.push(
                          `/community/profile/${bit.user_id}`
                        )
                      }
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/70 bg-black/30">
                        {bit
                          .profile
                          ?.avatar_url ? (
                          <img
                            src={
                              bit
                                .profile
                                .avatar_url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                            {initials(
                              bit
                                .profile
                                ?.full_name ||
                                null
                            )}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {bit
                              .profile
                              ?.full_name ||
                              bit
                                .profile
                                ?.username ||
                              "Professional"}
                          </span>

                          {bit
                            .profile
                            ?.verified && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-black">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 text-xs text-white/65">
                          {bit
                            .profile
                            ?.skill ||
                            bit
                              .profile
                              ?.role ||
                            "Professional"}

                          {bit
                            .profile
                            ?.location
                            ? ` · ${bit.profile.location}`
                            : ""}
                        </div>
                      </div>
                    </button>

                    {bit
                      .profile
                      ?.professional_level && (
                      <div className="mt-3 inline-flex rounded-full bg-black/30 px-3 py-1 text-[10px] text-white/75 backdrop-blur-xl">
                        {
                          bit
                            .profile
                            .professional_level
                        }
                      </div>
                    )}

                    {bit.content && (
                      <p className="mt-3 max-w-[430px] text-sm leading-6 text-white/90">
                        {bit.content}
                      </p>
                    )}

                    <div className="mt-2 text-[10px] text-white/45">
                      {new Date(
                        bit.created_at
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </div>
                  </div>

                  {/* COMMENTS */}

                  {openComments[
                    bit.id
                  ] && (
                    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[65%] overflow-hidden rounded-t-[28px] border-t border-white/10 bg-black/90 backdrop-blur-2xl">
                      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Comments
                          </h3>

                          <p className="text-[10px] text-white/40">
                            Professional conversation
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setOpenComments(
                              (
                                current
                              ) => ({
                                ...current,
                                [bit.id]:
                                  false,
                              })
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                        >
                          <Icon
                            name="close"
                            size={17}
                          />
                        </button>
                      </div>

                      <div className="max-h-[calc(65vh-130px)] overflow-y-auto px-5 py-4">
                        {(
                          comments[
                            bit.id
                          ] ||
                          []
                        ).length ===
                        0 ? (
                          <p className="py-10 text-center text-xs text-white/35">
                            No comments yet.
                            Start the conversation.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {(
                              comments[
                                bit.id
                              ] ||
                              []
                            ).map(
                              (
                                comment
                              ) => (
                                <div
                                  key={
                                    comment.id
                                  }
                                  className="flex gap-3"
                                >
                                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                                    {comment
                                      .profile
                                      ?.avatar_url ? (
                                      <img
                                        src={
                                          comment
                                            .profile
                                            .avatar_url
                                        }
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="flex h-full w-full items-center justify-center text-[10px]">
                                        {initials(
                                          comment
                                            .profile
                                            ?.full_name ||
                                            null
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white">
                                      {comment
                                        .profile
                                        ?.username ||
                                        comment
                                          .profile
                                          ?.full_name ||
                                        "Professional"}
                                    </p>

                                    <p className="mt-1 break-words text-sm leading-5 text-white/65">
                                      {
                                        comment.content
                                      }
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/10 p-4">
                        <div className="flex gap-2">
                          <input
                            value={
                              commentText[
                                bit.id
                              ] ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              setCommentText(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [bit.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                submitComment(
                                  bit.id
                                );
                              }
                            }}
                            placeholder="Add a professional comment..."
                            maxLength={
                              500
                            }
                            className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white outline-none placeholder:text-white/25"
                          />

                          <button
                            onClick={() =>
                              submitComment(
                                bit.id
                              )
                            }
                            className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-black"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </div>

      {/* MOBILE NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
          <button
            onClick={() =>
              router.push(
                "/community"
              )
            }
            className="flex flex-col items-center gap-1 text-[9px] text-[var(--muted)]"
          >
            <Icon
              name="home"
              size={19}
            />
            Community
          </button>

          <button
            className="flex flex-col items-center gap-1 text-[9px] font-semibold text-[var(--foreground)]"
          >
            <Icon
              name="play"
              size={19}
            />
            Bits
          </button>

          <button
            onClick={() =>
              setShowCreate(
                true
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--background)]"
          >
            <Icon
              name="plus"
              size={20}
            />
          </button>

          <button
            onClick={() =>
              router.push(
                "/messages"
              )
            }
            className="flex flex-col items-center gap-1 text-[9px] text-[var(--muted)]"
          >
            <Icon
              name="message"
              size={19}
            />
            Messages
          </button>

          <button
            onClick={() =>
              router.push(
                "/dashboard/profile"
              )
            }
            className="flex flex-col items-center gap-1 text-[9px] text-[var(--muted)]"
          >
            <div className="h-[19px] w-[19px] overflow-hidden rounded-full border border-[var(--border)]">
              {profile?.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[7px]">
                  {initials(
                    profile?.full_name ||
                      null
                  )}
                </span>
              )}
            </div>
            Profile
          </button>
        </div>
      </nav>

      {/* CREATE BIT */}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="font-semibold">
                  Create Bit
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Share something useful, professional and real.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCreate(
                    false
                  )
                }
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)]"
              >
                <Icon
                  name="close"
                  size={17}
                />
              </button>
            </div>

            <div className="p-5">
              <input
                ref={fileInput}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(
                  event
                ) => {
                  const file =
                    event.target
                      .files?.[0];

                  if (!file)
                    return;

                  setSelectedFile(
                    file
                  );

                  setPreview(
                    URL.createObjectURL(
                      file
                    )
                  );
                }}
              />

              {!selectedFile ? (
                <button
                  onClick={() =>
                    fileInput.current?.click()
                  }
                  className="flex h-64 w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)]"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)] text-[var(--background)]">
                    <Icon
                      name="play"
                      size={28}
                    />
                  </div>

                  <p className="mt-5 text-sm font-semibold">
                    Choose a video
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    MP4, MOV or WebM
                  </p>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-[28px] bg-black">
                  <video
                    src={
                      preview ||
                      ""
                    }
                    controls
                    playsInline
                    className="max-h-[460px] w-full object-contain"
                  />

                  <button
                    onClick={() => {
                      setSelectedFile(
                        null
                      );

                      setPreview(
                        null
                      );

                      if (
                        fileInput.current
                      ) {
                        fileInput.current.value =
                          "";
                      }
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <Icon
                      name="close"
                      size={17}
                    />
                  </button>
                </div>
              )}

              <textarea
                value={
                  caption
                }
                onChange={(
                  event
                ) =>
                  setCaption(
                    event.target
                      .value
                  )
                }
                maxLength={
                  500
                }
                placeholder="Write a professional caption..."
                className="mt-4 min-h-[110px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm outline-none"
              />

              <button
                disabled={
                  uploading
                }
                onClick={
                  createBit
                }
                className="mt-4 w-full rounded-2xl bg-[var(--brand)] py-3.5 text-sm font-semibold text-[var(--background)] disabled:opacity-50"
              >
                {uploading
                  ? "Publishing..."
                  : "Publish Bit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}

      {actionMessage && (
        <div className="fixed left-1/2 top-20 z-[150] w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-medium shadow-2xl">
            {actionMessage}
          </div>
        </div>
      )}
    </main>
  );
}