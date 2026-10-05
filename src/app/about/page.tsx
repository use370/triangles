"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

function TriangleMark() {
  return (
    <div className="h-10 w-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-sm overflow-hidden">
      <img
        src="/triangles-logo.png"
        alt="TRIANGLES logo"
        className="h-8 w-8 object-contain"
      />
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Background geometry */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[120px] h-[420px] w-[420px] rounded-full bg-[var(--accent)] opacity-[0.035] blur-[120px]" />
        <div className="absolute right-[-160px] bottom-[80px] h-[420px] w-[420px] rounded-full bg-[var(--brand)] opacity-[0.04] blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 mr-auto"
          >
            <TriangleMark />

            <div className="text-left">
              <div className="text-sm font-semibold tracking-[0.18em]">
                TRIANGLES
              </div>

              <div className="text-[9px] tracking-[0.16em] text-[var(--muted)]">
                THE NETWORK FOR PEOPLE WHO BUILD
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm text-[var(--muted)]">
            <button
              onClick={() => router.push("/")}
              className="hover:text-[var(--foreground)] transition"
            >
              Home
            </button>

            <button
              onClick={() => router.push("/community")}
              className="hover:text-[var(--foreground)] transition"
            >
              Community
            </button>

            <button
              onClick={() => router.push("/needs")}
              className="hover:text-[var(--foreground)] transition"
            >
              Opportunities
            </button>

            <button
              className="text-[var(--foreground)]"
              onClick={() => router.push("/about")}
            >
              About
            </button>
          </nav>

          <ThemeToggle compact />

          <button
            onClick={() => router.push("/login")}
            className="hidden sm:block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            Log in
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-[1180px] px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="max-w-[850px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--muted)] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Built for people with something to offer
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">
            The network behind
            <span className="block text-[var(--accent)]">
              your potential.
            </span>
          </h1>

          <p className="mt-7 max-w-[680px] text-lg leading-8 text-[var(--muted)] sm:text-xl">
            TRIANGLES exists for people who can build, create, solve and
            contribute — but need the right network to turn those skills into
            real opportunities.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/join")}
              className="rounded-2xl bg-[var(--brand)] px-6 py-3.5 text-sm font-semibold text-[var(--background)] shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
            >
              Join TRIANGLES
            </button>

            <button
              onClick={() => router.push("/community")}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              Explore Community
            </button>
          </div>
        </div>
      </section>

      <div className="heritage-line mx-auto max-w-[1080px]" />

      {/* THE PROBLEM */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              The problem
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Talent alone isn't always enough.
            </h2>
          </div>

          <div className="space-y-5 text-[var(--muted)] leading-8">
            <p>
              Someone can build an incredible product and still struggle to
              find the right people.
            </p>

            <p>
              A developer can have strong skills but no clients. A designer
              can have great work but no audience. A founder can have an idea
              but no team.
            </p>

            <p className="text-[var(--foreground)] font-medium">
              The missing piece is often the network.
            </p>
          </div>
        </div>
      </section>

      {/* PURPOSE */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-soft)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
          <div className="max-w-[760px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Our purpose
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Make useful connections easier to find.
            </h2>

            <p className="mt-6 text-base leading-8 text-[var(--muted)] sm:text-lg">
              TRIANGLES is designed to connect skills with people,
              opportunities and projects — without making networking feel
              complicated.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Show your work",
                text: "Build a professional presence around what you actually know and create.",
              },
              {
                number: "02",
                title: "Find your people",
                text: "Discover professionals based on skills, roles, interests and opportunities.",
              },
              {
                number: "03",
                title: "Build together",
                text: "Turn conversations into collaborations, projects and meaningful work.",
              },
            ].map((item) => (
              <article
                key={item.number}
                className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="text-xs font-semibold tracking-[0.15em] text-[var(--accent)]">
                  {item.number}
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Trust
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Professional first.
            </h2>

            <p className="mt-6 max-w-[600px] leading-8 text-[var(--muted)]">
              TRIANGLES is built around useful professional interaction.
              Profiles, skills, projects and conversations should help people
              understand who they are connecting with and why.
            </p>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <span className="text-xl">△</span>
              </div>

              <div>
                <h3 className="font-semibold">
                  TRIANGLES verification
                </h3>

                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Verification and skill-based signals are designed to help
                  people make more informed professional connections.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Emerging Professional",
                "Mid-Level Professional",
                "Professional",
                "Senior Professional",
              ].map((level) => (
                <div
                  key={level}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm"
                >
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY PHILOSOPHY */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-soft)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
          <div className="max-w-[760px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Community
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Less noise. More useful connections.
            </h2>

            <p className="mt-6 leading-8 text-[var(--muted)]">
              Community on TRIANGLES is designed around professional
              conversations, projects, ideas and opportunities. The goal is
              simple: make it easier to find people worth building with.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            {[
              "Projects",
              "Skills",
              "Ideas",
              "Opportunities",
              "Professional Posts",
              "Collaboration",
              "Networking",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm text-[var(--muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PEOPLE */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Built by
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            A small team with a big idea.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Coding & Idea
            </div>

            <h3 className="mt-4 text-2xl font-semibold">
              Arya Soni
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Coding, product idea and the core direction behind TRIANGLES.
            </p>
          </article>

          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Web Design
            </div>

            <h3 className="mt-4 text-2xl font-semibold">
              Ayushman Sharma
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Web design, visual direction and additional design touches.
            </p>
          </article>

          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Final Touches
            </div>

            <h3 className="mt-4 text-2xl font-semibold">
              Kartik Naga
            </h3>

            {/* Small name under Kartik Naga */}
            <p className="mt-1 text-xs text-[var(--muted)]">
              Parikshit Sharma
            </p>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Final touches and details that help bring the experience
              together.
            </p>
          </article>
        </div>
      </section>

      {/* VISION */}
      <section className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--brand)] px-7 py-16 text-[var(--background)] shadow-[var(--shadow)] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute right-[-40px] top-[-80px] text-[260px] font-thin opacity-[0.035]">
            △
          </div>

          <div className="relative max-w-[760px]">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">
              The vision
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
              Your work should create your network.
            </h2>

            <p className="mt-6 max-w-[650px] leading-8 opacity-70">
              We believe your ability to create something valuable should
              make it easier for the right people to discover you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 text-center sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Ready to build your network?
          </h2>

          <p className="mx-auto mt-4 max-w-[560px] text-[var(--muted)]">
            Join people who build, create, solve and collaborate.
          </p>

          <button
            onClick={() => router.push("/join")}
            className="mt-8 rounded-2xl bg-[var(--brand)] px-7 py-3.5 text-sm font-semibold text-[var(--background)] shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
          >
            Join TRIANGLES
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-8 text-xs text-[var(--muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="tracking-[0.12em]">
            © {new Date().getFullYear()} TRIANGLES
          </div>

          <div className="flex gap-5">
            <button
              onClick={() => router.push("/")}
              className="hover:text-[var(--foreground)]"
            >
              Home
            </button>

            <button
              onClick={() => router.push("/community")}
              className="hover:text-[var(--foreground)]"
            >
              Community
            </button>

            <button
              onClick={() => router.push("/login")}
              className="hover:text-[var(--foreground)]"
            >
              Log in
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}