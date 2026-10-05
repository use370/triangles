"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        theme === "dark"
          ? "Light mode"
          : "Dark mode"
      }
      className={
        compact
          ? `
            shrink-0
            h-10
            w-10
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-[var(--foreground)]
            flex
            items-center
            justify-center
            shadow-sm
            hover:-translate-y-0.5
            hover:shadow-md
            transition-all
          `
          : `
            h-10
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-3
            text-sm
            text-[var(--foreground)]
            flex
            items-center
            gap-2
            shadow-sm
            hover:-translate-y-0.5
            hover:shadow-md
            transition-all
          `
      }
    >
      <span
        className="text-base leading-none"
        aria-hidden="true"
      >
        {theme === "dark" ? "☀" : "☾"}
      </span>

      {!compact && (
        <span>
          {theme === "dark" ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}