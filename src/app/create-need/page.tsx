"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const needTypes = [
  "Project",
  "Collaboration",
  "Hiring",
  "Service",
];

export default function CreateNeedPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [needType, setNeedType] = useState("Project");
  const [loading, setLoading] = useState(false);

  async function createNeed() {
    if (!title.trim()) {
      alert("Need ka title likho.");
      return;
    }

    if (!description.trim()) {
      alert("Thoda detail mein batao kya chahiye.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("needs").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      skill: skill.trim() || null,
      location: location.trim() || null,
      need_type: needType,
      status: "open",
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/needs");
  }

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-500/8 blur-[130px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.07] bg-[#07080c]/80 backdrop-blur-xl">
        <div className="max-w-[900px] mx-auto h-[68px] px-4 flex items-center">
          <button
            onClick={() => router.push("/needs")}
            className="text-white/50 hover:text-white transition"
          >
            ←
          </button>

          <div className="mx-auto font-semibold tracking-[0.18em] text-sm">
            TRIANGLES
          </div>

          <div className="w-6" />
        </div>
      </header>

      <section className="relative z-10 max-w-[700px] mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">
            Opportunity
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold mt-3">
            What do you need?
          </h1>

          <p className="text-white/40 mt-3 leading-6">
            Tell the network what you are looking for.
            TRIANGLES will help surface relevant professionals.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-7">
          <label className="text-xs text-white/45">
            Need title
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. I need a web developer"
            className="mt-2 w-full h-13 rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-sm outline-none focus:border-cyan-300/30"
          />

          <label className="block text-xs text-white/45 mt-6">
            What exactly do you need?
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Describe the project, work or collaboration..."
            className="mt-2 w-full min-h-[150px] rounded-xl border border-white/[0.08] bg-white/[0.045] p-4 text-sm outline-none resize-none focus:border-cyan-300/30"
          />

          <label className="block text-xs text-white/45 mt-6">
            Skill required
          </label>

          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="e.g. Web Development"
            className="mt-2 w-full h-13 rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-sm outline-none focus:border-cyan-300/30"
          />

          <label className="block text-xs text-white/45 mt-6">
            Location
          </label>

          <input
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            placeholder="e.g. Jaipur, London, Delhi"
            className="mt-2 w-full h-13 rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-sm outline-none focus:border-cyan-300/30"
          />

          <label className="block text-xs text-white/45 mt-6">
            Type
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {needTypes.map((type) => (
              <button
                key={type}
                onClick={() => setNeedType(type)}
                className={`rounded-xl py-3 text-sm border transition ${
                  needType === type
                    ? "bg-white text-black border-white font-semibold"
                    : "bg-white/[0.035] border-white/[0.08] text-white/45 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={createNeed}
            className="mt-7 w-full rounded-2xl bg-white text-black py-4 text-sm font-semibold disabled:opacity-40"
          >
            {loading
              ? "Creating..."
              : "Publish Need"}
          </button>
        </div>
      </section>
    </main>
  );
}