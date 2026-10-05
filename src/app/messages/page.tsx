"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill: string | null;
  role: string | null;
  location: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Connection = {
  requester_id: string;
  receiver_id: string;
};

type ChatUser = Profile & {
  conversationId?: string;
  lastMessage?: Message;
};

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [connections, setConnections] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [darkMode, setDarkMode] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  /* =====================================================
     LOAD THEME
  ===================================================== */

  useEffect(() => {
    const savedTheme = localStorage.getItem("triangles-theme");

    if (savedTheme === "light") {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.background = darkMode
      ? "#11100e"
      : "#f2eee5";

    localStorage.setItem(
      "triangles-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  /* =====================================================
     GET CURRENT USER
  ===================================================== */

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    await loadConnections(user.id);

    setLoading(false);
  }

  /* =====================================================
     LOAD CONNECTIONS
  ===================================================== */

  async function loadConnections(currentUserId: string) {
    const { data, error } = await supabase
      .from("connections")
      .select("requester_id, receiver_id")
      .or(
        `requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
      )
      .not("status", "in", "(pending,rejected,declined,blocked,cancelled)");

    if (error) {
      console.error("Connections error:", error);
      return;
    }

    const rows = (data || []) as Connection[];

    const otherIds = rows.map((row) =>
      row.requester_id === currentUserId
        ? row.receiver_id
        : row.requester_id
    );

    const uniqueIds = [...new Set(otherIds)];

    if (!uniqueIds.length) {
      setConnections([]);
      return;
    }

    const { data: profiles, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url, skill, role, location"
        )
        .in("id", uniqueIds);

    if (profileError) {
      console.error("Profiles error:", profileError);
      return;
    }

    const users = (profiles || []) as Profile[];

    const finalUsers: ChatUser[] = users.map((profile) => ({
      ...profile,
    }));

    setConnections(finalUsers);

    if (finalUsers.length > 0 && !selectedUser) {
      setSelectedUser(finalUsers[0]);
    }
  }

  /* =====================================================
     GET / CREATE CONVERSATION
  ===================================================== */

  async function getConversation(otherUserId: string) {
    const { data, error } = await supabase.rpc(
      "get_or_create_conversation",
      {
        p_other_user: otherUserId,
      }
    );

    if (error) {
      console.error("Conversation error:", error);
      return null;
    }

    return data as string;
  }

  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  async function loadMessages(otherUser: ChatUser) {
    if (!userId) return;

    setMessageLoading(true);

    const conversationId = await getConversation(otherUser.id);

    if (!conversationId) {
      setMessages([]);
      setMessageLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("Messages error:", error);
      setMessageLoading(false);
      return;
    }

    setMessages((data || []) as Message[]);
    setMessageLoading(false);
  }

  /* =====================================================
     SELECT CHAT
  ===================================================== */

  useEffect(() => {
    if (!selectedUser) return;

    loadMessages(selectedUser);
    setShowDetails(false);
  }, [selectedUser]);

  /* =====================================================
     REALTIME
  ===================================================== */

  useEffect(() => {
    if (!selectedUser || !userId) return;

    const channel = supabase
      .channel(`messages-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload.new as Message;

          if (
            incoming.sender_id === userId ||
            incoming.sender_id === selectedUser.id
          ) {
            setMessages((current) => {
              const exists = current.some(
                (item) => item.id === incoming.id
              );

              if (exists) return current;

              return [...current, incoming];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, userId]);

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function sendMessage() {
    if (!message.trim() || !selectedUser || !userId) {
      return;
    }

    const conversationId = await getConversation(
      selectedUser.id
    );

    if (!conversationId) return;

    const text = message.trim();

    setMessage("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: text,
      })
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .single();

    if (error) {
      console.error("Send message error:", error);
      setMessage(text);
      return;
    }

    if (data) {
      setMessages((current) => {
        const exists = current.some(
          (item) => item.id === data.id
        );

        if (exists) return current;

        return [...current, data as Message];
      });
    }
  }

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return connections;

    return connections.filter((person) => {
      return (
        person.full_name
          ?.toLowerCase()
          .includes(query) ||
        person.username
          ?.toLowerCase()
          .includes(query) ||
        person.skill
          ?.toLowerCase()
          .includes(query) ||
        person.role
          ?.toLowerCase()
          .includes(query) ||
        person.location
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [connections, search]);

  /* =====================================================
     AVATAR
  ===================================================== */

  function initials(person: ChatUser | null) {
    if (!person) return "T";

    const name =
      person.full_name ||
      person.username ||
      "Triangles";

    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <>
        <style>{`
          body {
            margin: 0;
          }

          .loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #11100e;
            color: #c9bea8;
            font-family: Arial, sans-serif;
            font-size: 13px;
          }
        `}</style>

        <div className="loading">
          Loading Triangles Messages...
        </div>
      </>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        body {
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        .page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(156, 133, 91, .10),
              transparent 32%
            ),
            var(--bg);
          color: var(--text);
          transition:
            background .25s ease,
            color .25s ease;
        }

        .page.dark {
          --bg: #11100e;
          --panel: #191714;
          --panel-2: #211e1a;
          --panel-3: #29251f;
          --border: #373129;
          --border-strong: #514838;
          --text: #eee7db;
          --muted: #81786b;
          --muted-2: #625c52;
          --accent: #cbbd9f;
          --green: #879b78;
          --bubble: #2c2720;
          --mine: #373026;
        }

        .page.light {
          --bg: #eee9de;
          --panel: #f8f4eb;
          --panel-2: #eee9de;
          --panel-3: #e5ded1;
          --border: #d7cfc0;
          --border-strong: #bcb19e;
          --text: #27241f;
          --muted: #756d61;
          --muted-2: #968c7e;
          --accent: #7c6b50;
          --green: #657b5d;
          --bubble: #e8e1d5;
          --mine: #ded4c3;
        }

        .app {
          width: 100%;
          max-width: 1500px;
          height: calc(100vh - 40px);
          min-height: 650px;
          margin: auto;

          display: grid;
          grid-template-columns: 360px 1fr;

          overflow: hidden;

          border: 1px solid var(--border);
          border-radius: 22px;

          background: var(--panel);

          box-shadow:
            0 30px 100px rgba(0, 0, 0, .30);
        }

        /* =========================
           SIDEBAR
        ========================= */

        .sidebar {
          min-width: 0;

          display: flex;
          flex-direction: column;

          border-right: 1px solid var(--border);
          background: var(--panel);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 26px 23px 18px;
        }

        .brand {
          color: var(--accent);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .30em;
        }

        .title {
          margin: 5px 0 0;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 27px;
          font-weight: 500;
        }

        .new-button {
          width: 38px;
          height: 38px;

          border: 1px solid var(--border-strong);
          border-radius: 50%;

          background: transparent;
          color: var(--accent);

          cursor: pointer;
        }

        .new-button:hover {
          background: var(--panel-3);
        }

        .search {
          height: 43px;
          margin: 0 18px 17px;

          display: flex;
          align-items: center;
          gap: 8px;

          padding: 0 12px;

          border: 1px solid var(--border);
          border-radius: 10px;

          background: var(--panel-2);
        }

        .search-icon {
          color: var(--muted);
          font-size: 19px;
        }

        .search input {
          width: 100%;

          border: 0;
          outline: 0;

          background: transparent;
          color: var(--text);

          font-size: 11px;
        }

        .search input::placeholder {
          color: var(--muted-2);
        }

        .connection-label {
          display: flex;
          justify-content: space-between;

          padding: 0 20px 9px;

          color: var(--muted-2);

          font-size: 8px;
          font-weight: 800;
          letter-spacing: .17em;
        }

        .chat-list {
          flex: 1;
          overflow-y: auto;

          padding: 0 8px 8px;
        }

        .chat-item {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 12px 10px;

          border: 0;
          border-radius: 13px;

          background: transparent;
          color: var(--text);

          text-align: left;
          cursor: pointer;
        }

        .chat-item:hover {
          background: var(--panel-2);
        }

        .chat-item.active {
          background: var(--panel-3);
        }

        .avatar {
          width: 46px;
          height: 46px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          overflow: hidden;

          border: 1px solid var(--border-strong);
          border-radius: 50%;

          background: var(--panel-3);

          color: var(--accent);

          font-family: Georgia, serif;
          font-size: 12px;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .person-info {
          min-width: 0;
          flex: 1;
        }

        .person-name-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .person-name {
          overflow: hidden;

          color: var(--text);

          font-size: 12px;
          font-weight: 650;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .person-role {
          margin-top: 4px;

          color: var(--muted);

          font-size: 9px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .person-location {
          margin-top: 5px;

          color: var(--muted-2);

          font-size: 8px;
        }

        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: 7px;

          padding: 13px 18px;

          border-top: 1px solid var(--border);

          color: var(--muted-2);

          font-size: 8px;
        }

        .triangle-mark {
          color: var(--accent);
          font-size: 15px;
        }

        /* =========================
           CHAT
        ========================= */

        .chat {
          min-width: 0;

          display: flex;
          flex-direction: column;

          background: var(--panel);
        }

        .chat-header {
          min-height: 85px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 16px 27px;

          border-bottom: 1px solid var(--border);
        }

        .chat-person {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-person-name {
          display: flex;
          align-items: center;
          gap: 6px;

          font-family: Georgia, serif;
          font-size: 18px;
        }

        .verify {
          width: 16px;
          height: 16px;

          display: grid;
          place-items: center;

          background: var(--green);
          color: #12110e;

          border-radius: 50%;

          font-size: 9px;
          font-weight: 900;
        }

        .chat-sub {
          margin-top: 5px;

          color: var(--muted);

          font-size: 9px;
        }

        .active {
          color: var(--green);
        }

        .header-actions {
          display: flex;
          gap: 7px;
        }

        .icon-button {
          width: 35px;
          height: 35px;

          border: 1px solid var(--border);
          border-radius: 9px;

          background: transparent;
          color: var(--muted);

          cursor: pointer;
        }

        .icon-button:hover {
          background: var(--panel-2);
        }

        /* =========================
           THEME
        ========================= */

        .theme-toggle {
          position: relative;

          width: 61px;
          height: 31px;

          margin-right: 4px;

          border: 1px solid var(--border-strong);
          border-radius: 30px;

          background: var(--panel-2);

          cursor: pointer;
        }

        .theme-dot {
          position: absolute;
          top: 4px;
          left: 4px;

          width: 21px;
          height: 21px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background: var(--accent);
          color: var(--panel);

          font-size: 11px;

          transition: transform .2s ease;
        }

        .theme-toggle.light .theme-dot {
          transform: translateX(29px);
        }

        /* =========================
           DETAILS
        ========================= */

        .details {
          position: absolute;
          z-index: 20;

          top: 75px;
          right: 25px;

          width: 240px;

          padding: 18px;

          border: 1px solid var(--border-strong);
          border-radius: 14px;

          background: var(--panel-3);

          box-shadow: 0 25px 70px rgba(0, 0, 0, .30);
        }

        .detail-row {
          margin-bottom: 14px;
        }

        .detail-row span {
          display: block;

          margin-bottom: 4px;

          color: var(--muted-2);

          font-size: 8px;
          letter-spacing: .15em;
        }

        .detail-row strong {
          color: var(--text);

          font-size: 11px;
          font-weight: 500;
        }

        /* =========================
           BODY
        ========================= */

        .chat-body {
          flex: 1;

          overflow-y: auto;

          padding: 32px;
        }

        .profile {
          display: flex;
          flex-direction: column;
          align-items: center;

          padding-bottom: 26px;

          text-align: center;
        }

        .profile-avatar {
          width: 67px;
          height: 67px;

          display: grid;
          place-items: center;

          overflow: hidden;

          border: 1px solid var(--border-strong);
          border-radius: 50%;

          background: var(--panel-3);

          color: var(--accent);

          font-family: Georgia, serif;
          font-size: 17px;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile h2 {
          margin: 11px 0 4px;

          font-family: Georgia, serif;

          font-size: 19px;
          font-weight: 500;
        }

        .profile p {
          margin: 0;

          color: var(--muted);

          font-size: 9px;
        }

        .profile small {
          margin-top: 6px;

          color: var(--muted-2);

          font-size: 8px;
        }

        .divider {
          max-width: 850px;

          margin: 0 auto 23px;

          display: flex;
          align-items: center;
          gap: 11px;

          color: var(--muted-2);

          font-size: 7px;
          letter-spacing: .18em;
        }

        .divider::before,
        .divider::after {
          content: "";

          flex: 1;

          height: 1px;

          background: var(--border);
        }

        .messages {
          max-width: 850px;

          margin: auto;

          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .message-row.mine {
          justify-content: flex-end;
        }

        .small-avatar {
          width: 27px;
          height: 27px;

          display: grid;
          place-items: center;

          border: 1px solid var(--border);
          border-radius: 50%;

          background: var(--panel-3);

          color: var(--accent);

          font-family: Georgia, serif;
          font-size: 8px;
        }

        .message-content {
          max-width: min(68%, 560px);
        }

        .bubble {
          padding: 11px 14px;

          border: 1px solid var(--border);
          border-radius: 15px 15px 15px 4px;

          background: var(--bubble);

          color: var(--text);

          font-size: 11px;
          line-height: 1.55;
        }

        .mine .bubble {
          border-radius: 15px 15px 4px 15px;

          background: var(--mine);
          border-color: var(--border-strong);
        }

        .message-time {
          margin-top: 4px;

          color: var(--muted-2);

          font-size: 7px;
        }

        .mine .message-time {
          text-align: right;
        }

        /* =========================
           COMPOSER
        ========================= */

        .composer-area {
          padding: 12px 27px 17px;

          border-top: 1px solid var(--border);

          background: var(--panel);
        }

        .composer {
          max-width: 850px;
          height: 51px;

          margin: auto;

          display: flex;
          align-items: center;
          gap: 7px;

          padding: 5px 6px;

          border: 1px solid var(--border);
          border-radius: 13px;

          background: var(--panel-2);
        }

        .composer:focus-within {
          border-color: var(--border-strong);
        }

        .composer-button {
          width: 35px;
          height: 35px;

          border: 0;
          border-radius: 8px;

          background: transparent;

          color: var(--muted);

          cursor: pointer;
        }

        .composer-button:hover {
          background: var(--panel-3);
        }

        .composer input {
          min-width: 0;
          flex: 1;

          border: 0;
          outline: 0;

          background: transparent;
          color: var(--text);

          font-size: 11px;
        }

        .composer input::placeholder {
          color: var(--muted-2);
        }

        .send {
          width: 38px;
          height: 38px;

          border: 0;
          border-radius: 9px;

          background: var(--panel-3);
          color: var(--muted-2);

          cursor: pointer;
        }

        .send.ready {
          background: var(--accent);
          color: var(--panel);
        }

        .send:disabled {
          cursor: default;
        }

        .composer-note {
          max-width: 850px;

          margin: 6px auto 0;

          display: flex;
          justify-content: space-between;

          color: var(--muted-2);

          font-size: 7px;
        }

        /* =========================
           EMPTY
        ========================= */

        .empty {
          flex: 1;

          display: grid;
          place-items: center;

          text-align: center;

          color: var(--muted);
        }

        .empty-icon {
          width: 70px;
          height: 70px;

          margin: auto;

          display: grid;
          place-items: center;

          border: 1px solid var(--border-strong);
          border-radius: 50%;

          color: var(--accent);

          font-size: 26px;
        }

        .empty h2 {
          margin: 17px 0 5px;

          font-family: Georgia, serif;
          font-weight: 500;

          color: var(--text);
        }

        .empty p {
          margin: 0;

          color: var(--muted);

          font-size: 10px;
        }

        .empty-list {
          padding: 35px 15px;

          text-align: center;

          color: var(--muted);

          font-size: 10px;
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 850px) {

          .page {
            padding: 0;
          }

          .app {
            height: 100vh;
            min-height: 0;

            border: 0;
            border-radius: 0;

            grid-template-columns: 78px 1fr;
          }

          .sidebar-header {
            justify-content: center;
            padding: 20px 8px;
          }

          .sidebar-header > div {
            display: none;
          }

          .search {
            margin: 0 10px 15px;

            justify-content: center;

            border: 0;
            background: transparent;
          }

          .search input {
            display: none;
          }

          .connection-label span:first-child {
            display: none;
          }

          .connection-label {
            justify-content: center;
          }

          .chat-item {
            justify-content: center;
            padding: 10px 3px;
          }

          .person-info {
            display: none;
          }

          .sidebar-footer {
            justify-content: center;
          }

          .sidebar-footer span:last-child {
            display: none;
          }

          .chat-header {
            padding: 14px;
          }

          .chat-body {
            padding: 24px 14px;
          }

          .composer-area {
            padding: 10px 12px 13px;
          }

          .composer-note {
            display: none;
          }

          .message-content {
            max-width: 82%;
          }

          .theme-toggle {
            display: none;
          }
        }

      `}</style>

      <main
        className={`page ${
          darkMode ? "dark" : "light"
        }`}
      >

        <div className="app">

          {/* =============================================
              SIDEBAR
          ============================================= */}

          <aside className="sidebar">

            <div className="sidebar-header">

              <div>
                <div className="brand">
                  TRIANGLES
                </div>

                <h1 className="title">
                  Messages
                </h1>
              </div>

              <button
                className="new-button"
                onClick={() => setShowNewChat(true)}
              >
                +
              </button>

            </div>

            <div className="search">
              <span className="search-icon">
                ⌕
              </span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search connections..."
              />
            </div>

            <div className="connection-label">
              <span>YOUR NETWORK</span>

              <span>
                {filteredConnections.length}
              </span>
            </div>

            <div className="chat-list">

              {filteredConnections.map((person) => (
                <button
                  key={person.id}
                  className={`chat-item ${
                    selectedUser?.id === person.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedUser(person)
                  }
                >

                  <div className="avatar">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                      />
                    ) : (
                      initials(person)
                    )}
                  </div>

                  <div className="person-info">

                    <div className="person-name-row">

                      <span className="person-name">
                        {person.full_name ||
                          person.username ||
                          "Triangle User"}
                      </span>

                    </div>

                    <div className="person-role">
                      {person.role ||
                        person.skill ||
                        "Professional"}
                    </div>

                    <div className="person-location">
                      {person.location ||
                        "Location not added"}
                    </div>

                  </div>

                </button>
              ))}

              {filteredConnections.length === 0 && (
                <div className="empty-list">
                  No connections yet.
                </div>
              )}

            </div>

            <div className="sidebar-footer">
              <span className="triangle-mark">
                △
              </span>

              <span>
                Professional conversations only
              </span>
            </div>

          </aside>

          {/* =============================================
              CHAT
          ============================================= */}

          <section className="chat">

            {selectedUser ? (
              <>

                <header className="chat-header">

                  <div className="chat-person">

                    <div className="avatar">

                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt=""
                        />
                      ) : (
                        initials(selectedUser)
                      )}

                    </div>

                    <div>

                      <div className="chat-person-name">

                        {selectedUser.full_name ||
                          selectedUser.username ||
                          "Triangle User"}

                        <span className="verify">
                          ✓
                        </span>

                      </div>

                      <div className="chat-sub">

                        {selectedUser.role ||
                          selectedUser.skill ||
                          "Professional"}

                        {" · "}

                        {selectedUser.location ||
                          "Location not added"}

                        {" · "}

                        <span className="active">
                          Connected
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="header-actions">

                    <button
                      className={`theme-toggle ${
                        darkMode ? "" : "light"
                      }`}
                      onClick={() =>
                        setDarkMode(!darkMode)
                      }
                      aria-label="Toggle theme"
                    >
                      <span className="theme-dot">
                        {darkMode ? "☾" : "☀"}
                      </span>
                    </button>

                    <button
                      className="icon-button"
                      onClick={() =>
                        setShowDetails(!showDetails)
                      }
                    >
                      ⋯
                    </button>

                  </div>

                </header>

                {showDetails && (
                  <div className="details">

                    <div className="detail-row">
                      <span>NAME</span>

                      <strong>
                        {selectedUser.full_name ||
                          selectedUser.username ||
                          "Triangle User"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>PROFESSION</span>

                      <strong>
                        {selectedUser.role ||
                          selectedUser.skill ||
                          "Professional"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>LOCATION</span>

                      <strong>
                        {selectedUser.location ||
                          "Not added"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>USERNAME</span>

                      <strong>
                        {selectedUser.username
                          ? `@${selectedUser.username}`
                          : "Not added"}
                      </strong>
                    </div>

                  </div>
                )}

                <div className="chat-body">

                  <div className="profile">

                    <div className="profile-avatar">

                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt=""
                        />
                      ) : (
                        initials(selectedUser)
                      )}

                    </div>

                    <h2>
                      {selectedUser.full_name ||
                        selectedUser.username ||
                        "Triangle User"}
                    </h2>

                    <p>
                      {selectedUser.role ||
                        selectedUser.skill ||
                        "Professional"}

                      {" · "}

                      {selectedUser.location ||
                        "Location not added"}
                    </p>

                    <small>
                      Connected on Triangles
                    </small>

                  </div>

                  <div className="divider">
                    CONVERSATION
                  </div>

                  <div className="messages">

                    {messageLoading ? (
                      <div className="empty-list">
                        Loading conversation...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="empty-list">
                        Start a professional
                        conversation.
                      </div>
                    ) : (
                      messages.map((item) => {

                        const mine =
                          item.sender_id === userId;

                        return (
                          <div
                            key={item.id}
                            className={`message-row ${
                              mine
                                ? "mine"
                                : "theirs"
                            }`}
                          >

                            {!mine && (
                              <div className="small-avatar">
                                {initials(selectedUser)}
                              </div>
                            )}

                            <div className="message-content">

                              <div className="bubble">
                                {item.content}
                              </div>

                              <div className="message-time">
                                {formatTime(
                                  item.created_at
                                )}

                                {mine && (
                                  <span>
                                    {" "}
                                    ✓✓
                                  </span>
                                )}
                              </div>

                            </div>

                          </div>
                        );
                      })
                    )}

                  </div>

                </div>

                <div className="composer-area">

                  <div className="composer">

                    <button
                      className="composer-button"
                      type="button"
                    >
                      +
                    </button>

                    <input
                      value={message}
                      onChange={(e) =>
                        setMessage(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={`Message ${
                        (
                          selectedUser.full_name ||
                          selectedUser.username ||
                          "user"
                        ).split(" ")[0]
                      }...`}
                    />

                    <button
                      className={`send ${
                        message.trim()
                          ? "ready"
                          : ""
                      }`}
                      onClick={sendMessage}
                      disabled={!message.trim()}
                    >
                      ↑
                    </button>

                  </div>

                  <div className="composer-note">

                    <span>
                      Enter to send
                    </span>

                    <span>
                      Keep it professional.
                    </span>

                  </div>

                </div>

              </>
            ) : (

              <div className="empty">

                <div>

                  <div className="empty-icon">
                    △
                  </div>

                  <h2>
                    Your network,
                    in conversation.
                  </h2>

                  <p>
                    Connect with a professional
                    to start messaging.
                  </p>

                </div>

              </div>

            )}

          </section>

        </div>

      </main>

      {/* ===============================================
          NEW CHAT
      =============================================== */}

      {showNewChat && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(0,0,0,.65)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setShowNewChat(false)}
        >

          <div
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 25,
              border: `1px solid ${
                darkMode ? "#514838" : "#bcb19e"
              }`,
              borderRadius: 18,
              background: darkMode
                ? "#1e1b18"
                : "#f8f4eb",
              color: darkMode
                ? "#eee7db"
                : "#27241f",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >

              <div>

                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: ".22em",
                    color: darkMode
                      ? "#8c806d"
                      : "#756d61",
                  }}
                >
                  TRIANGLES
                </div>

                <h2
                  style={{
                    margin: "6px 0 0",
                    fontFamily: "Georgia, serif",
                    fontWeight: 500,
                  }}
                >
                  Start a conversation
                </h2>

              </div>

              <button
                onClick={() =>
                  setShowNewChat(false)
                }
                style={{
                  width: 31,
                  height: 31,
                  borderRadius: "50%",
                  border: `1px solid ${
                    darkMode
                      ? "#40392f"
                      : "#cfc5b6"
                  }`,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

            </div>

            <p
              style={{
                margin: "15px 0 18px",
                color: darkMode
                  ? "#766e62"
                  : "#756d61",
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              Choose someone from your
              Triangles network.
            </p>

            {connections.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: darkMode
                    ? "#766e62"
                    : "#756d61",
                  fontSize: 11,
                }}
              >
                No connections available.
              </div>
            ) : (
              connections.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedUser(person);
                    setShowNewChat(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: 10,
                    border: 0,
                    borderRadius: 10,
                    background: "transparent",
                    color: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >

                  <div className="avatar">

                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                      />
                    ) : (
                      initials(person)
                    )}

                  </div>

                  <div style={{ flex: 1 }}>

                    <strong
                      style={{
                        display: "block",
                        fontSize: 11,
                      }}
                    >
                      {person.full_name ||
                        person.username ||
                        "Triangle User"}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        color: darkMode
                          ? "#746c61"
                          : "#756d61",
                        fontSize: 9,
                      }}
                    >
                      {person.role ||
                        person.skill ||
                        "Professional"}
                    </span>

                  </div>

                  <span
                    style={{
                      color: darkMode
                        ? "#928570"
                        : "#7c6b50",
                    }}
                  >
                    →
                  </span>

                </button>
              ))
            )}

          </div>

        </div>
      )}

    </>
  );
}