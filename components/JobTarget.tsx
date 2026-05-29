"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip, Skeleton } from "./ui";
import { TextArea } from "./fields";
import { LinkIcon, SparkIcon } from "./icons";
import { EASE } from "./motion";
import type { JobPosting } from "@/lib/types";

export function JobTarget({
  job,
  extracting,
  generating,
  forcePaste,
  onExtract,
  onGenerate,
}: {
  job: JobPosting | null;
  extracting: boolean;
  generating: boolean;
  forcePaste: boolean;
  onExtract: (payload: { url?: string; text?: string }) => void;
  onGenerate: () => void;
}) {
  const [mode, setMode] = useState<"url" | "paste">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (forcePaste) setMode("paste");
  }, [forcePaste]);

  const submit = () => {
    if (mode === "url" && url.trim()) onExtract({ url: url.trim() });
    else if (mode === "paste" && text.trim()) onExtract({ text: text.trim() });
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="eyebrow">Target a job</p>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded-full transition-colors focus-ring ${
              mode === "url" ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            Job URL
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`px-2.5 py-1 rounded-full transition-colors focus-ring ${
              mode === "paste" ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            Paste description
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "url" ? (
          <motion.div
            key="url"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 border-b border-line focus-within:border-accent transition-colors">
              <LinkIcon className="text-ink-soft shrink-0" width={18} height={18} />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="https://company.com/careers/role"
                className="flex-1 bg-transparent py-2.5 text-ink placeholder:text-ink-soft/50 outline-none"
                inputMode="url"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-ink-soft/80 mt-2 leading-relaxed">
              Some sites (LinkedIn, Indeed) block automated reading — if extraction
              looks off, paste the description and we&apos;ll take it from there.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <TextArea
              value={text}
              onChange={setText}
              rows={6}
              placeholder="Paste the full job description here…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <Button onClick={submit} disabled={extracting} variant="ghost">
          {extracting ? "Reading job…" : "Extract job"}
        </Button>
      </div>

      {/* Extraction skeleton */}
      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-2"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job summary chip */}
      <AnimatePresence>
        {job && !extracting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-5 rounded-xl border border-line bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] p-4"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-serif text-lg leading-tight">{job.title}</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              </div>
              <Chip tone="accent">Ready to tailor</Chip>
            </div>
            <p className="text-sm text-ink-soft mt-3 line-clamp-3 leading-relaxed">
              {job.description}
            </p>
            <div className="mt-4">
              <Button onClick={onGenerate} disabled={generating}>
                <SparkIcon width={16} height={16} />
                {generating ? "Generating…" : "Generate application"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
