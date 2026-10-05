"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: string;
  requester_id: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    skill: string | null;
    role: string | null;
    location: string | null;
  } | null;
};

type Theme = "dark" | "light";

export default function CommunityRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "triangles-theme"
    ) as Theme | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    loadRequests();
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("triangles-theme", theme);
  }, [theme]);

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data: connectionData, error: connectionError } =
        await supabase
          .from("connections")
          .select("id, requester_id, created_at")
          .eq("receiver_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

      if (connectionError) throw connectionError;

      if (!connectionData || connectionData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const requesterIds = connectionData.map(
        (item) => item.requester_id
      );

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url, skill, role, location"
          )
          .in("id", requesterIds);

      if (profileError) throw profileError;

      const profileMap = new Map(
        (profileData || []).map((profile) => [profile.id, profile])
      );

      const formatted: RequestItem[] = connectionData.map(
        (connection) => ({
          ...connection,
          profile: profileMap.get(connection.requester_id) || null,
        })
      );

      setRequests(formatted);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while loading requests.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(
    request: RequestItem,
    status: "accepted" | "rejected"
  ) {
    setActionId(request.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", request.id);

      if (error) throw error;

      setRequests((current) =>
        current.filter((item) => item.id !== request.id)
      );
    } catch (error) {
      console.error(error);
      setMessage("Could not update this request.");
    } finally {
      setActionId(null);
    }
  }

  const filteredRequests = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return requests;

    return requests.filter((request) => {
      const profile = request.profile;

      const searchable = [
        profile?.full_name,
        profile?.username,
        profile?.skill,
        profile?.role,
        profile?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(value);
    });
  }, [requests, search]);

  function getInitials(name?: string | null) {
    if (!name) return "T";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  function timeAgo(date: string) {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  return (
    <main className={`page ${theme}`}>
      {/* Ambient background */}
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />
      <div className="gridOverlay" />

      {/* NAVBAR */}
      <header className="navbar">
        <Link href="/community" className="brand">
          <div className="logoWrap">
            <Image
              src="/triangles-logo.png"
              alt="Triangles"
              width={42}
              height={42}
              priority
              className="logo"
            />
          </div>

          <div className="brandText">
            <strong>TRIANGLES</strong>
            <span>COMMUNITY</span>
          </div>
        </Link>

        <div className="navRight">
          <Link href="/community" className="backButton">
            <span>←</span>
            Community
          </Link>

          <button
            className="themeButton"
            onClick={() =>
              setTheme((current) =>
                current === "dark" ? "light" : "dark"
              )
            }
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☼" : "◐"}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <section className="content">
        <div className="headingArea">
          <div>
            <div className="eyebrow">
              <span className="eyebrowLine" />
              YOUR NETWORK
            </div>

            <h1>
              Community
              <br />
              <span>Requests.</span>
            </h1>

            <p className="subtitle">
              People who want to connect with you professionally.
            </p>
          </div>

          <div className="requestCount">
            <strong>{requests.length}</strong>
            <span>pending</span>
          </div>
        </div>

        {/* SEARCH */}
        {requests.length > 0 && (
          <div className="toolbar">
            <div className="searchBox">
              <span className="searchIcon">⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search requests..."
              />

              {search && (
                <button
                  className="clearSearch"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="resultText">
              {filteredRequests.length}{" "}
              {filteredRequests.length === 1
                ? "request"
                : "requests"}
            </div>
          </div>
        )}

        {/* ERROR */}
        {message && <div className="message">{message}</div>}

        {/* LOADING */}
        {loading ? (
          <div className="loadingGrid">
            {[1, 2, 3].map((item) => (
              <div className="skeletonCard" key={item}>
                <div className="skeletonAvatar" />
                <div className="skeletonText large" />
                <div className="skeletonText" />
                <div className="skeletonText small" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="emptyState">
            <div className="emptyLogo">
              <Image
                src="/triangles-logo.png"
                alt=""
                width={72}
                height={72}
              />
            </div>

            <div className="emptyEyebrow">
              {search ? "NO MATCHES" : "ALL CLEAR"}
            </div>

            <h2>
              {search
                ? "No requests found."
                : "Your network is quiet."}
            </h2>

            <p>
              {search
                ? "Try another name, skill or location."
                : "When professionals want to connect with you, their requests will appear here."}
            </p>

            <Link href="/community" className="discoverButton">
              Discover Professionals
              <span>↗</span>
            </Link>
          </div>
        ) : (
          <div className="requestGrid">
            {filteredRequests.map((request) => {
              const profile = request.profile;
              const name = profile?.full_name || "Professional";
              const username = profile?.username
                ? `@${profile.username}`
                : "";

              return (
                <article className="requestCard" key={request.id}>
                  {/* card top */}
                  <div className="cardTop">
                    <span className="requestLabel">
                      CONNECTION REQUEST
                    </span>

                    <span className="time">
                      {timeAgo(request.created_at)}
                    </span>
                  </div>

                  {/* profile */}
                  <div className="profileArea">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={name}
                        width={68}
                        height={68}
                        className="avatar"
                      />
                    ) : (
                      <div className="avatar initials">
                        {getInitials(name)}
                      </div>
                    )}

                    <div className="profileInfo">
                      <h2>{name}</h2>

                      {username && (
                        <span className="username">
                          {username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* details */}
                  <div className="details">
                    {profile?.role && (
                      <div className="detail">
                        <span className="detailIcon">◆</span>
                        <span>{profile.role}</span>
                      </div>
                    )}

                    {profile?.skill && (
                      <div className="detail">
                        <span className="detailIcon">◇</span>
                        <span>{profile.skill}</span>
                      </div>
                    )}

                    {profile?.location && (
                      <div className="detail">
                        <span className="detailIcon">⌖</span>
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* buttons */}
                  <div className="actions">
                    <button
                      className="acceptButton"
                      disabled={actionId === request.id}
                      onClick={() =>
                        updateRequest(request, "accepted")
                      }
                    >
                      {actionId === request.id ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          Link Up
                          <span>↗</span>
                        </>
                      )}
                    </button>

                    <button
                      className="declineButton"
                      disabled={actionId === request.id}
                      onClick={() =>
                        updateRequest(request, "rejected")
                      }
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footerBrand">
          <Image
            src="/triangles-logo.png"
            alt="Triangles"
            width={26}
            height={26}
          />
          <span>TRIANGLES</span>
        </div>

        <span className="footerCopy">
          Build your network. Create opportunities.
        </span>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          transition:
            background 0.35s ease,
            color 0.35s ease;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* =========================
           DARK MODE
        ========================= */

        .page.dark {
          --bg: #0d0e0c;
          --bg2: #12130f;
          --card: rgba(24, 25, 21, 0.78);
          --cardHover: rgba(29, 30, 25, 0.92);
          --border: rgba(213, 204, 171, 0.13);
          --borderStrong: rgba(213, 204, 171, 0.24);
          --text: #f2eee3;
          --muted: #aaa798;
          --muted2: #777467;
          --accent: #c8a96b;
          --accentBright: #dfc589;
          --green: #a9c69a;
          --input: rgba(255, 255, 255, 0.045);
          --shadow: rgba(0, 0, 0, 0.45);

          background:
            radial-gradient(
              circle at 75% 10%,
              rgba(151, 122, 65, 0.11),
              transparent 28%
            ),
            radial-gradient(
              circle at 10% 80%,
              rgba(113, 139, 101, 0.07),
              transparent 28%
            ),
            var(--bg);
          color: var(--text);
        }

        /* =========================
           LIGHT MODE
        ========================= */

        .page.light {
          --bg: #f4f1e9;
          --bg2: #eee9dc;
          --card: rgba(255, 253, 247, 0.82);
          --cardHover: #fffdf8;
          --border: rgba(42, 40, 32, 0.11);
          --borderStrong: rgba(42, 40, 32, 0.2);
          --text: #26251f;
          --muted: #68665d;
          --muted2: #969187;
          --accent: #9a7838;
          --accentBright: #795b25;
          --green: #587450;
          --input: rgba(42, 40, 32, 0.045);
          --shadow: rgba(42, 37, 25, 0.1);

          background:
            radial-gradient(
              circle at 80% 5%,
              rgba(190, 157, 92, 0.12),
              transparent 27%
            ),
            var(--bg);
          color: var(--text);
        }

        /* =========================
           BACKGROUND
        ========================= */

        .ambient {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          opacity: 0.2;
        }

        .ambientOne {
          top: 100px;
          right: -220px;
          background: var(--accent);
        }

        .ambientTwo {
          bottom: 50px;
          left: -280px;
          background: var(--green);
          opacity: 0.1;
        }

        .gridOverlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.035;
          background-image:
            linear-gradient(
              var(--text) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              var(--text) 1px,
              transparent 1px
            );
          background-size: 70px 70px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 80%
          );
        }

        /* =========================
           NAV
        ========================= */

        .navbar {
          height: 82px;
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 5;
          border-bottom: 1px solid var(--border);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }

        .logoWrap {
          width: 43px;
          height: 43px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: var(--input);
          border: 1px solid var(--borderStrong);
          box-shadow: 0 8px 25px var(--shadow);
        }

        .logo {
          width: 29px;
          height: 29px;
          object-fit: contain;
        }

        .brandText {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brandText strong {
          font-size: 14px;
          letter-spacing: 0.2em;
        }

        .brandText span {
          margin-top: 5px;
          font-size: 8px;
          letter-spacing: 0.3em;
          color: var(--muted);
        }

        .navRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .backButton,
        .themeButton {
          border: 1px solid var(--border);
          background: var(--input);
          color: var(--text);
          text-decoration: none;
          transition: 0.25s ease;
        }

        .backButton {
          padding: 10px 15px;
          border-radius: 100px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .backButton:hover,
        .themeButton:hover {
          border-color: var(--borderStrong);
          background: var(--cardHover);
        }

        .themeButton {
          width: 39px;
          height: 39px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }

        /* =========================
           CONTENT
        ========================= */

        .content {
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          padding: 72px 0 100px;
          position: relative;
          z-index: 2;
        }

        .headingArea {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--accent);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.25em;
          margin-bottom: 18px;
        }

        .eyebrowLine {
          width: 25px;
          height: 1px;
          background: var(--accent);
        }

        h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 7vw, 82px);
          line-height: 0.91;
          font-weight: 400;
          letter-spacing: -0.055em;
        }

        h1 span {
          color: var(--accent);
          font-style: italic;
        }

        .subtitle {
          margin: 25px 0 0;
          max-width: 520px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .requestCount {
          min-width: 115px;
          text-align: right;
          padding-bottom: 8px;
        }

        .requestCount strong {
          display: block;
          font-family: Georgia, serif;
          font-size: 48px;
          font-weight: 400;
          color: var(--accent);
          line-height: 0.9;
        }

        .requestCount span {
          display: block;
          margin-top: 8px;
          color: var(--muted2);
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 0.2em;
        }

        /* =========================
           TOOLBAR
        ========================= */

        .toolbar {
          margin-top: 55px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .searchBox {
          width: min(460px, 100%);
          height: 48px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 15px;
          border-radius: 14px;
          background: var(--input);
          border: 1px solid var(--border);
          transition: 0.25s ease;
        }

        .searchBox:focus-within {
          border-color: var(--borderStrong);
          box-shadow: 0 0 0 4px rgba(200, 169, 107, 0.05);
        }

        .searchIcon {
          color: var(--accent);
          font-size: 22px;
          line-height: 1;
        }

        .searchBox input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          font-size: 13px;
        }

        .searchBox input::placeholder {
          color: var(--muted2);
        }

        .clearSearch {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 20px;
          cursor: pointer;
        }

        .resultText {
          color: var(--muted2);
          font-size: 11px;
          letter-spacing: 0.08em;
        }

        .message {
          margin-top: 25px;
          padding: 13px 15px;
          border: 1px solid rgba(190, 110, 80, 0.3);
          background: rgba(190, 110, 80, 0.08);
          border-radius: 12px;
          color: #c99480;
          font-size: 13px;
        }

        /* =========================
           CARDS
        ========================= */

        .requestGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .requestCard {
          position: relative;
          padding: 24px;
          min-height: 320px;
          border: 1px solid var(--border);
          border-radius: 22px;
          background: var(--card);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 50px var(--shadow);
          overflow: hidden;
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            background 0.3s ease;
        }

        .requestCard::before {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          right: -80px;
          top: -80px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.06;
          filter: blur(10px);
        }

        .requestCard:hover {
          transform: translateY(-4px);
          border-color: var(--borderStrong);
          background: var(--cardHover);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .requestLabel {
          font-size: 8px;
          letter-spacing: 0.18em;
          color: var(--accent);
          font-weight: 700;
        }

        .time {
          color: var(--muted2);
          font-size: 10px;
        }

        .profileArea {
          margin-top: 30px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          object-fit: cover;
          border: 1px solid var(--borderStrong);
          background: var(--input);
        }

        .initials {
          display: grid;
          place-items: center;
          font-family: Georgia, serif;
          font-size: 23px;
          color: var(--accent);
        }

        .profileInfo {
          min-width: 0;
        }

        .profileInfo h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 400;
          letter-spacing: -0.025em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .username {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 11px;
        }

        .details {
          margin-top: 27px;
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-height: 72px;
        }

        .detail {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-size: 11px;
        }

        .detailIcon {
          color: var(--accent);
          width: 14px;
          text-align: center;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin-top: 25px;
        }

        .acceptButton,
        .declineButton {
          height: 43px;
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .acceptButton {
          border: 1px solid var(--accent);
          background: var(--accent);
          color: #18160f;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .acceptButton:hover {
          background: var(--accentBright);
          border-color: var(--accentBright);
          transform: translateY(-1px);
        }

        .acceptButton:disabled,
        .declineButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .declineButton {
          padding: 0 17px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
        }

        .declineButton:hover {
          border-color: var(--borderStrong);
          color: var(--text);
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.25);
          border-top-color: #18160f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           EMPTY
        ========================= */

        .emptyState {
          margin-top: 45px;
          padding: 80px 25px;
          text-align: center;
          border: 1px solid var(--border);
          border-radius: 25px;
          background: var(--card);
          backdrop-filter: blur(18px);
        }

        .emptyLogo {
          width: 86px;
          height: 86px;
          margin: 0 auto 25px;
          display: grid;
          place-items: center;
          border: 1px solid var(--borderStrong);
          border-radius: 25px;
          background: var(--input);
        }

        .emptyLogo img {
          object-fit: contain;
          opacity: 0.85;
        }

        .emptyEyebrow {
          color: var(--accent);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.25em;
        }

        .emptyState h2 {
          margin: 14px 0 10px;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
        }

        .emptyState p {
          max-width: 470px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .discoverButton {
          margin-top: 28px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 100px;
          background: var(--accent);
          color: #18160f;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        /* =========================
           LOADING
        ========================= */

        .loadingGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 17px;
        }

        .skeletonCard {
          height: 320px;
          padding: 25px;
          border: 1px solid var(--border);
          border-radius: 22px;
          background: var(--card);
        }

        .skeletonAvatar,
        .skeletonText {
          background: var(--input);
          animation: pulse 1.4s ease-in-out infinite;
        }

        .skeletonAvatar {
          width: 68px;
          height: 68px;
          border-radius: 18px;
        }

        .skeletonText {
          width: 75%;
          height: 13px;
          border-radius: 10px;
          margin-top: 22px;
        }

        .skeletonText.large {
          width: 50%;
          height: 18px;
          margin-top: 25px;
        }

        .skeletonText.small {
          width: 35%;
        }

        @keyframes pulse {
          50% {
            opacity: 0.45;
          }
        }

        /* =========================
           FOOTER
        ========================= */

        .footer {
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          padding: 22px 0 30px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 2;
        }

        .footerBrand {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--text);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
        }

        .footerBrand img {
          object-fit: contain;
        }

        .footerCopy {
          color: var(--muted2);
          font-size: 10px;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 950px) {
          .requestGrid,
          .loadingGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 680px) {
          .navbar {
            height: 72px;
          }

          .backButton {
            font-size: 0;
            width: 39px;
            height: 39px;
            padding: 0;
            justify-content: center;
          }

          .backButton span {
            font-size: 17px;
          }

          .content {
            padding-top: 52px;
          }

          .headingArea {
            align-items: flex-start;
          }

          .requestCount {
            min-width: auto;
          }

          .requestCount strong {
            font-size: 34px;
          }

          .requestGrid,
          .loadingGrid {
            grid-template-columns: 1fr;
          }

          .toolbar {
            align-items: stretch;
            flex-direction: column;
            gap: 10px;
          }

          .searchBox {
            width: 100%;
          }

          .resultText {
            padding-left: 3px;
          }

          .footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 450px) {
          .navbar,
          .content,
          .footer {
            width: min(100% - 28px, 1240px);
          }

          .brandText span {
            display: none;
          }

          h1 {
            font-size: 48px;
          }

          .subtitle {
            font-size: 12px;
          }

          .requestCard {
            padding: 20px;
          }

          .emptyState {
            padding: 60px 18px;
          }
        }
      `}</style>
    </main>
  );
}