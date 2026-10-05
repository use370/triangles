"use client";

import { useEffect, useRef, useState } from "react";
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

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  status_background: string | null;
  created_at: string;
  profile?: Profile;
  likes: number;
  comments: number;
  saves: number;
  liked: boolean;
  saved: boolean;
};

type Moment = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  profile?: Profile;
};

type Comment = { id: string; content: string; profile?: Profile };

function Icon({ name, size = 20 }: { name: string; size?: number }) {
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

  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9" /><path d="M9 21v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    play: <><rect x="3" y="3" width="18" height="18" rx="5" /><path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" /></>,
    heart: <path d="M20.8 8.8c0 5-8.8 10-8.8 10s-8.8-5-8.8-10A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />,
    comment: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-4-.9L4 20l1.4-3.5A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" />,
    send: <><path d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z" /><path d="M10 14 21 3" /></>,
    bookmark: <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.8L6 21V4.5Z" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    message: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-4-.9L4 20l1.4-3.5A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  };

  return <svg {...p}>{paths[name]}</svg>;
}

const skills = [
  "Web Development",
  "Web Design",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "SEO",
  "Content Writing",
];

export default function CommunityPage() {
  const router = useRouter();
  const momentInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showMoment, setShowMoment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [reporting, setReporting] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const [postMode, setPostMode] = useState<"post" | "status">("post");
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const [momentFile, setMomentFile] = useState<File | null>(null);
  const [momentPreview, setMomentPreview] = useState<string | null>(null);
  const [momentCaption, setMomentCaption] = useState("");
  const [creatingMoment, setCreatingMoment] = useState(false);

  function initials(name?: string | null) {
    return (name || "T").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  }

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function loadCommunity() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    const { data: mine } = await supabase.from("profiles").select("id,full_name,username,avatar_url,skill,role,location,professional_level,verified").eq("id", user.id).maybeSingle();
    setProfile(mine);

    const { data: rows } = await supabase.from("posts").select("id,user_id,content,image_url,media_url,media_type,created_at,status_background").order("created_at", { ascending: false }).limit(40);
    const postRows = rows || [];
    const ids = [...new Set(postRows.map((p) => p.user_id))];
    const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,username,avatar_url,skill,role,location,professional_level,verified").in("id", ids) : { data: [] as Profile[] };
    const pmap = new Map((people || []).map((p) => [p.id, p]));
    const postIds = postRows.map((p) => p.id);

    let likes: { post_id: string; user_id: string }[] = [];
    let saves: { post_id: string; user_id: string }[] = [];
    let commentRows: { post_id: string }[] = [];
    if (postIds.length) {
      const [l, s, c] = await Promise.all([
        supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
        supabase.from("post_saves").select("post_id,user_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
      ]);
      likes = l.data || [];
      saves = s.data || [];
      commentRows = c.data || [];
    }

    setPosts(postRows.map((p) => {
      const pl = likes.filter((x) => x.post_id === p.id);
      const ps = saves.filter((x) => x.post_id === p.id);
      return {
        ...p,
        profile: pmap.get(p.user_id),
        likes: pl.length,
        saves: ps.length,
        comments: commentRows.filter((x) => x.post_id === p.id).length,
        liked: pl.some((x) => x.user_id === user.id),
        saved: ps.some((x) => x.user_id === user.id),
      };
    }));

    const { data: ms } = await supabase.from("moments").select("id,user_id,media_url,media_type,caption,created_at").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
    const mids = [...new Set((ms || []).map((m) => m.user_id))];
    const { data: mp } = mids.length ? await supabase.from("profiles").select("id,full_name,username,avatar_url,skill,role,location,professional_level,verified").in("id", mids) : { data: [] as Profile[] };
    const mmap = new Map((mp || []).map((p) => [p.id, p]));
    setMoments((ms || []).map((m) => ({ ...m, profile: mmap.get(m.user_id) })));
    setLoading(false);
  }

  useEffect(() => { loadCommunity(); }, []);

  async function searchPeople(value: string) {
    setSearch(value);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    const { data } = await supabase.from("profiles").select("id,full_name,username,avatar_url,skill,role,location,professional_level,verified").or(`username.ilike.%${value}%,full_name.ilike.%${value}%,skill.ilike.%${value}%,role.ilike.%${value}%`).neq("id", userId || "").limit(6);
    setSuggestions(data || []);
  }

  async function toggleLike(post: Post) {
    if (!userId) return;
    if (post.liked) await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    else await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    setPosts((all) => all.map((p) => p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
  }

  async function toggleSave(post: Post) {
    if (!userId) return;
    if (post.saved) await supabase.from("post_saves").delete().eq("post_id", post.id).eq("user_id", userId);
    else await supabase.from("post_saves").insert({ post_id: post.id, user_id: userId });
    setPosts((all) => all.map((p) => p.id === post.id ? { ...p, saved: !p.saved, saves: p.saves + (p.saved ? -1 : 1) } : p));
  }

  async function loadComments(postId: string) {
    const { data } = await supabase.from("post_comments").select("id,content,user_id").eq("post_id", postId).order("created_at", { ascending: true });
    const rows = data || [];
    const ids = [...new Set(rows.map((x) => x.user_id))];
    const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,username,avatar_url,skill,role,location,professional_level,verified").in("id", ids) : { data: [] as Profile[] };
    const map = new Map((people || []).map((p) => [p.id, p]));
    setComments((all) => ({ ...all, [postId]: rows.map((x) => ({ id: x.id, content: x.content, profile: map.get(x.user_id) })) }));
  }

  async function toggleComments(postId: string) {
    const next = !commentsOpen[postId];
    setCommentsOpen((x) => ({ ...x, [postId]: next }));
    if (next) await loadComments(postId);
  }

  async function submitComment(postId: string) {
    if (!userId) return;
    const text = commentText[postId]?.trim();
    if (!text) return;
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: userId, content: text });
    if (error) { showNotice(error.message); return; }
    setCommentText((x) => ({ ...x, [postId]: "" }));
    await loadComments(postId);
    setPosts((all) => all.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
  }

  async function sharePost(post: Post) {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "TRIANGLES Community", text: post.content || "Check this post on TRIANGLES.", url });
      else { await navigator.clipboard.writeText(url); showNotice("Post link copied."); }
    } catch {}
  }

  function chooseMedia(file?: File) {
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setPostMode("post");
  }

  async function createPost() {
    if (!userId) return;
    if (postMode === "post" && !mediaFile) { showNotice("Add a photo or video first."); return; }
    if (postMode === "status" && !caption.trim()) { showNotice("Write your status first."); return; }
    setCreatingPost(true);
    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;
    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/posts/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("community-media").upload(path, mediaFile, { upsert: false, cacheControl: "3600" });
      if (error) { showNotice(error.message); setCreatingPost(false); return; }
      mediaUrl = supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
      mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
    }
    const { error } = await supabase.from("posts").insert({ user_id: userId, content: caption.trim(), image_url: mediaUrl, media_url: mediaUrl, media_type: mediaType, status_background: postMode === "status" ? "plain" : null });
    if (error) { showNotice(error.message); setCreatingPost(false); return; }
    setShowCreate(false); setCaption(""); setMediaFile(null); setMediaPreview(null); setPostMode("post");
    setCreatingPost(false); await loadCommunity();
  }

  function chooseMoment(file?: File) {
    if (!file) return;
    setMomentFile(file);
    setMomentPreview(URL.createObjectURL(file));
  }

  async function createMoment() {
    if (!userId || !momentFile) return;
    setCreatingMoment(true);
    const ext = momentFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/moments/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-media").upload(path, momentFile, { upsert: false, cacheControl: "3600" });
    if (error) { showNotice(error.message); setCreatingMoment(false); return; }
    const url = supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
    const { error: insertError } = await supabase.from("moments").insert({ user_id: userId, media_url: url, media_type: momentFile.type.startsWith("video") ? "video" : "image", caption: momentCaption.trim() || null });
    if (insertError) { showNotice(insertError.message); setCreatingMoment(false); return; }
    setShowMoment(false); setMomentFile(null); setMomentPreview(null); setMomentCaption(""); setCreatingMoment(false); await loadCommunity();
  }

  async function deletePost(post: Post) {
    if (!userId || post.user_id !== userId) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id).eq("user_id", userId);
    if (error) { showNotice(error.message); return; }
    setPosts((all) => all.filter((p) => p.id !== post.id));
    setOpenMenu(null); showNotice("Post deleted.");
  }

  async function reportPost() {
    if (!userId || !reporting) return;
    const { error } = await supabase.from("post_reports").insert({ post_id: reporting.id, reporter_id: userId, reason: reportReason.trim() || "Community report" });
    if (error && error.code !== "23505") { showNotice(error.message); return; }
    setReporting(null); setReportReason(""); setOpenMenu(null); showNotice(error?.code === "23505" ? "Already reported." : "Report submitted.");
  }

  function timeAgo(date: string) {
    const diff = Math.max(0, Date.now() - new Date(date).getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  if (loading) return <LoadingLogo size={58} text="Loading Community..." />;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 md:pb-0">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5">
            <img src="/triangles-logo.png" alt="TRIANGLES" className="h-9 w-9 object-contain" />
            <span className="hidden text-sm font-bold tracking-[0.22em] sm:block">TRIANGLES</span>
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            <button className="text-sm font-semibold text-[var(--foreground)]">Community</button>
            <button onClick={() => router.push("/needs")} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">Opportunities</button>
            <button onClick={() => router.push("/messages")} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">Messages</button>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch((x) => !x)} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"><Icon name="search" size={19} /></button>
            <ThemeToggle compact />
            <button onClick={() => router.push("/dashboard/profile")} className="h-9 w-9 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)]">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold">{initials(profile?.full_name)}</span>}
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <div className="relative mx-auto max-w-2xl">
              <Icon name="search" size={17} />
              <input autoFocus value={search} onChange={(e) => searchPeople(e.target.value)} placeholder="Search people, skills or roles..." className="absolute inset-0 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)]" />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                  {suggestions.map((person) => (
                    <button key={person.id} onClick={() => router.push(`/community/profile/${person.id}`)} className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left last:border-0 hover:bg-[var(--surface-soft)]">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-[var(--brand-soft)] text-center text-xs font-bold leading-9 text-[var(--accent)]">{person.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(person.full_name)}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{person.full_name || "Professional"}</p><p className="truncate text-xs text-[var(--muted)]">{person.skill || person.role || "Professional"}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[210px_minmax(0,620px)_210px]">
        {/* LEFT */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {[
              ["Community", "home", "/community"],
              ["Bits", "play", "/community/bits"],
              ["Messages", "message", "/messages"],
              ["Requests", "bookmark", "/community-requests"],
              ["Profile", "user", "/dashboard/profile"],
            ].map(([label, icon, href]) => (
              <button key={label} onClick={() => router.push(href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${label === "Community" ? "bg-[var(--surface-soft)] font-semibold" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"}`}><Icon name={icon} size={19} />{label}</button>
            ))}
          </div>
        </aside>

        {/* FEED */}
        <section className="min-w-0">
          {/* composer */}
          <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/dashboard/profile")} className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--accent)]">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}
              </button>
              <button onClick={() => setShowCreate(true)} className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-left text-sm text-[var(--muted)] hover:border-[var(--accent)]">Share something professional...</button>
              <button onClick={() => setShowCreate(true)} className="hidden h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--background)] sm:flex"><Icon name="plus" size={18} /></button>
            </div>
            <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
              <button onClick={() => setShowCreate(true)} className="flex-1 rounded-lg py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)]">Photo / Video</button>
              <button onClick={() => { setPostMode("status"); setShowCreate(true); }} className="flex-1 rounded-lg py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)]">Text Status</button>
              <button onClick={() => setShowMoment(true)} className="flex-1 rounded-lg py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)]">Moment</button>
            </div>
          </div>

          {/* moments */}
          <div className="mb-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex gap-4">
              <button onClick={() => setShowMoment(true)} className="w-16 shrink-0 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--accent)] text-[var(--accent)]"><Icon name="plus" size={20} /></div>
                <span className="mt-1 block truncate text-[10px] text-[var(--muted)]">Your Moment</span>
              </button>
              {moments.map((m) => (
                <button key={m.id} onClick={() => setActiveMoment(m)} className="w-16 shrink-0 text-center">
                  <div className="mx-auto h-14 w-14 overflow-hidden rounded-full border-2 border-[var(--accent)] p-0.5">
                    {m.profile?.avatar_url ? <img src={m.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--accent)]">{initials(m.profile?.full_name)}</div>}
                  </div>
                  <span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{m.profile?.username || m.profile?.full_name || "Professional"}</span>
                </button>
              ))}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--accent)]"><Icon name="plus" size={22} /></div>
              <h2 className="mt-4 font-semibold">Your community starts here</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Share your work, ideas and professional progress.</p>
              <button onClick={() => setShowCreate(true)} className="mt-5 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]">Create post</button>
            </div>
          ) : posts.map((post) => {
            const author = post.profile;
            const media = post.media_url || post.image_url;
            return (
              <article key={post.id} className="mb-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => router.push(`/community/profile/${post.user_id}`)} className="h-10 w-10 overflow-hidden rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--accent)]">
                    {author?.avatar_url ? <img src={author.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(author?.full_name)}
                  </button>
                  <button onClick={() => router.push(`/community/profile/${post.user_id}`)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5"><span className="truncate text-sm font-semibold">{author?.full_name || "Professional"}</span>{author?.verified && <span className="text-xs text-[var(--accent)]">✓</span>}</div>
                    <div className="truncate text-xs text-[var(--muted)]">{author?.skill || author?.role || "Professional"} · {timeAgo(post.created_at)}</div>
                  </button>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === post.id ? null : post.id); }} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-soft)]"><Icon name="more" size={18} /></button>
                    {openMenu === post.id && <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                      {post.user_id === userId ? <button onClick={() => deletePost(post)} className="w-full px-4 py-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--surface-soft)]">Delete</button> : <button onClick={() => { setReporting(post); setOpenMenu(null); }} className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--surface-soft)]">Report</button>}
                    </div>}
                  </div>
                </div>

                {media ? (
                  post.media_type === "video" ? <video src={media} controls playsInline className="max-h-[680px] w-full bg-black object-contain" /> : <img onDoubleClick={() => toggleLike(post)} src={media} alt="" className="max-h-[680px] w-full object-cover" />
                ) : (
                  <div className="flex min-h-56 items-center justify-center border-y border-[var(--border)] bg-[var(--surface-soft)] px-8 py-12 text-center"><p className="max-w-md text-lg font-medium leading-8">{post.content}</p></div>
                )}

                <div className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleLike(post)} className={`flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--surface-soft)] ${post.liked ? "text-red-500" : "text-[var(--foreground)]"}`}><Icon name="heart" size={22} /></button>
                    <button onClick={() => toggleComments(post.id)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--surface-soft)]"><Icon name="comment" size={21} /></button>
                    <button onClick={() => sharePost(post)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--surface-soft)]"><Icon name="send" size={20} /></button>
                    <button onClick={() => toggleSave(post)} className={`ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--surface-soft)] ${post.saved ? "text-[var(--accent)]" : ""}`}><Icon name="bookmark" size={21} /></button>
                  </div>
                  {(post.likes > 0 || post.saves > 0) && <p className="text-xs font-semibold">{post.likes} {post.likes === 1 ? "like" : "likes"}{post.saves > 0 ? ` · ${post.saves} saved` : ""}</p>}
                  {post.content && media && <p className="mt-2 text-sm leading-6"><span className="font-semibold">{author?.username || author?.full_name || "Professional"}</span>{" "}{post.content}</p>}
                  {post.comments > 0 && <button onClick={() => toggleComments(post.id)} className="mt-2 text-xs text-[var(--muted)]">View {post.comments} comment{post.comments === 1 ? "" : "s"}</button>}

                  {commentsOpen[post.id] && <div className="mt-3 border-t border-[var(--border)] pt-3">
                    <div className="space-y-3">
                      {(comments[post.id] || []).map((c) => <div key={c.id} className="flex gap-2"><div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--brand-soft)] text-center text-[9px] font-bold leading-7 text-[var(--accent)]">{c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(c.profile?.full_name)}</div><p className="text-sm"><span className="font-semibold">{c.profile?.username || c.profile?.full_name || "Professional"}</span>{" "}{c.content}</p></div>)}
                    </div>
                    <div className="mt-3 flex gap-2"><input value={commentText[post.id] || ""} onChange={(e) => setCommentText((x) => ({ ...x, [post.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submitComment(post.id); }} placeholder="Add a professional comment..." className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]" /><button onClick={() => submitComment(post.id)} className="rounded-full bg-[var(--brand)] px-4 text-xs font-semibold text-[var(--background)]">Post</button></div>
                  </div>}
                </div>
              </article>
            );
          })}
        </section>

        {/* RIGHT */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-[var(--brand-soft)] text-center text-sm font-bold leading-[48px] text-[var(--accent)]">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{profile?.full_name || "Your profile"}</p><p className="truncate text-xs text-[var(--muted)]">{profile?.skill || "Add your skill"}</p></div>
              </div>
              <button onClick={() => router.push("/dashboard/profile")} className="mt-4 w-full rounded-xl border border-[var(--border)] py-2 text-xs font-semibold hover:border-[var(--accent)]">View profile</button>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Explore</p>
              <div className="mt-3 space-y-1">{skills.slice(0, 5).map((skill) => <button key={skill} onClick={() => { setSearch(skill); setShowSearch(true); searchPeople(skill); }} className="block w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]">{skill}</button>)}</div>
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl md:hidden">
        <button onClick={() => router.push("/community")} className="text-[var(--foreground)]"><Icon name="home" size={21} /></button>
        <button onClick={() => setShowSearch(true)} className="text-[var(--muted)]"><Icon name="search" size={21} /></button>
        <button onClick={() => setShowCreate(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--background)]"><Icon name="plus" size={19} /></button>
        <button onClick={() => router.push("/messages")} className="text-[var(--muted)]"><Icon name="message" size={21} /></button>
        <button onClick={() => router.push("/dashboard/profile")} className="h-7 w-7 overflow-hidden rounded-full border border-[var(--border)]">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="text-[9px] font-bold">{initials(profile?.full_name)}</span>}</button>
      </nav>

      {/* CREATE POST */}
      {showCreate && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="font-semibold">Create</h2><p className="text-xs text-[var(--muted)]">Share something professional.</p></div><button onClick={() => { setShowCreate(false); setMediaPreview(null); setMediaFile(null); }}><Icon name="close" size={20} /></button></div>
          <div className="p-5">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-soft)] p-1"><button onClick={() => setPostMode("post")} className={`rounded-lg py-2 text-sm ${postMode === "post" ? "bg-[var(--surface)] font-semibold shadow-sm" : "text-[var(--muted)]"}`}>Post</button><button onClick={() => setPostMode("status")} className={`rounded-lg py-2 text-sm ${postMode === "status" ? "bg-[var(--surface)] font-semibold shadow-sm" : "text-[var(--muted)]"}`}>Status</button></div>
            {postMode === "post" && <><button onClick={() => mediaInput.current?.click()} className="mb-4 flex w-full items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] py-10 text-sm text-[var(--muted)]">{mediaFile ? "Change media" : "Choose photo or video"}</button><input ref={mediaInput} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => chooseMedia(e.target.files?.[0])} />{mediaPreview && (mediaFile?.type.startsWith("video") ? <video src={mediaPreview} controls className="mb-4 max-h-80 w-full rounded-xl bg-black object-contain" /> : <img src={mediaPreview} alt="Preview" className="mb-4 max-h-80 w-full rounded-xl object-cover" />)}</>}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={postMode === "status" ? "Write your status..." : "Write a professional caption..."} className="min-h-28 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm outline-none focus:border-[var(--accent)]" />
            <button disabled={creatingPost} onClick={createPost} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-50">{creatingPost ? "Publishing..." : "Publish"}</button>
          </div>
        </div>
      </div>}

      {/* MOMENT */}
      {showMoment && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Create Moment</h2><button onClick={() => setShowMoment(false)}><Icon name="close" size={20} /></button></div><button onClick={() => momentInput.current?.click()} className="mt-5 flex w-full items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] py-10 text-sm text-[var(--muted)]">Choose photo or video</button><input ref={momentInput} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => chooseMoment(e.target.files?.[0])} />{momentPreview && (momentFile?.type.startsWith("video") ? <video src={momentPreview} controls className="mt-4 max-h-72 w-full rounded-xl bg-black object-contain" /> : <img src={momentPreview} alt="Preview" className="mt-4 max-h-72 w-full rounded-xl object-cover" />)}<input value={momentCaption} onChange={(e) => setMomentCaption(e.target.value)} placeholder="Add a caption (optional)" className="mt-4 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm outline-none" /><button disabled={!momentFile || creatingMoment} onClick={createMoment} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-50">{creatingMoment ? "Posting..." : "Share Moment"}</button></div></div>}

      {/* MOMENT VIEWER */}
      {activeMoment && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveMoment(null)}><button onClick={() => setActiveMoment(null)} className="absolute right-5 top-5 text-white"><Icon name="close" size={25} /></button><div className="max-h-[90vh] max-w-lg" onClick={(e) => e.stopPropagation()}>{activeMoment.media_type === "video" ? <video src={activeMoment.media_url} controls autoPlay className="max-h-[78vh] max-w-full rounded-xl" /> : <img src={activeMoment.media_url} alt="" className="max-h-[78vh] max-w-full rounded-xl object-contain" />} {activeMoment.caption && <p className="mt-3 text-center text-sm text-white/80">{activeMoment.caption}</p>}</div></div>}

      {/* REPORT */}
      {reporting && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Report post</h2><button onClick={() => setReporting(null)}><Icon name="close" size={20} /></button></div><p className="mt-2 text-sm text-[var(--muted)]">Tell us briefly why this post should be reviewed.</p><textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Reason" className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm outline-none" /><button onClick={reportPost} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--background)]">Submit report</button></div></div>}

      {notice && <div className="fixed bottom-20 left-1/2 z-[140] -translate-x-1/2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-xs font-semibold text-[var(--background)] shadow-xl md:bottom-6">{notice}</div>}
    </main>
  );
}
