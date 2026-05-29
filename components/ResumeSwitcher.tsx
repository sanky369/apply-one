"use client";

import { motion } from "framer-motion";
import { FileIcon, PlusIcon } from "./icons";
import { cn } from "@/lib/utils";
import type { ResumeDraft } from "@/lib/types";

/**
 * Horizontal switcher of separately-stored résumés. The active one is
 * highlighted; clicking another switches to it; "New" starts a fresh upload.
 */
export function ResumeSwitcher({
  drafts,
  currentId,
  onSwitch,
  onNew,
}: {
  drafts: ResumeDraft[];
  currentId: string | null;
  onSwitch: (draft: ResumeDraft) => void;
  onNew: () => void;
}) {
  // Stable display order (oldest first) so pills don't shuffle as autosave
  // bumps each draft's updatedAt.
  const ordered = [...drafts].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 -mb-1">
      {ordered.map((d) => {
        const active = d.id === currentId;
        return (
          <button
            key={d.id}
            onClick={() => !active && onSwitch(d)}
            aria-current={active}
            title={d.name || "Untitled résumé"}
            className={cn(
              "group inline-flex items-center gap-2 shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring",
              active
                ? "border-transparent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent-ink"
                : "border-line text-ink-soft hover:text-ink hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]",
            )}
          >
            <FileIcon
              width={14}
              height={14}
              className={active ? "text-accent" : "text-ink-soft/70"}
            />
            <span className="max-w-[140px] truncate font-medium">
              {d.name || "Untitled résumé"}
            </span>
            {d.report && (
              <span className="tabular-nums text-xs opacity-70">{d.report.score}</span>
            )}
            {active && (
              <motion.span
                layoutId="switcher-dot"
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
            )}
          </button>
        );
      })}

      <button
        onClick={onNew}
        className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-ink-soft hover:text-accent hover:border-accent transition-colors focus-ring"
        title="Upload a new résumé"
      >
        <PlusIcon width={14} height={14} />
        New
      </button>
    </div>
  );
}
