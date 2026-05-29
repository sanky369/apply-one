"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IconButton, Button, Chip } from "./ui";
import { XIcon, TrashIcon, ClockIcon, FileIcon } from "./icons";
import { drawerSpring, EASE } from "./motion";
import { formatDate } from "@/lib/utils";
import type { ApplicationPackage, ResumeDraft } from "@/lib/types";

export function HistoryDrawer({
  open,
  items,
  drafts,
  onClose,
  onOpenItem,
  onDelete,
  onOpenDraft,
  onDeleteDraft,
}: {
  open: boolean;
  items: ApplicationPackage[];
  drafts: ResumeDraft[];
  onClose: () => void;
  onOpenItem: (pkg: ApplicationPackage) => void;
  onDelete: (id: string) => void;
  onOpenDraft: (draft: ResumeDraft) => void;
  onDeleteDraft: (id: string) => void;
}) {
  const empty = items.length === 0 && drafts.length === 0;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={drawerSpring}
            className="fixed top-0 right-0 bottom-0 z-[81] w-[min(92vw,420px)] bg-surface border-l border-line shadow-card flex flex-col"
            role="dialog"
            aria-label="Application history"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2">
                <ClockIcon width={18} height={18} className="text-ink-soft" />
                <h2 className="font-serif text-lg">History</h2>
              </div>
              <IconButton onClick={onClose} aria-label="Close history">
                <XIcon />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4 space-y-6">
              {empty ? (
                <div className="text-center py-16 text-ink-soft">
                  <ClockIcon
                    width={28}
                    height={28}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <p className="text-sm">Nothing saved yet.</p>
                  <p className="text-xs mt-1 opacity-80">
                    Upload a résumé or generate a package — they&apos;ll show up here.
                  </p>
                </div>
              ) : null}

              {drafts.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-3">
                    Your résumés
                  </p>
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {drafts.map((d) => (
                        <motion.li
                          key={d.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="rounded-xl border border-line p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <FileIcon
                                width={16}
                                height={16}
                                className="text-accent mt-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {d.name || "Untitled résumé"}
                                </p>
                                <p className="text-[11px] text-ink-soft/80 mt-0.5">
                                  Edited {formatDate(d.updatedAt)}
                                </p>
                              </div>
                            </div>
                            {d.report && <Chip tone="accent">{d.report.score}</Chip>}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="ghost" onClick={() => onOpenDraft(d)}>
                              Continue
                            </Button>
                            <IconButton
                              onClick={() => onDeleteDraft(d.id)}
                              aria-label="Delete résumé"
                              className="h-8 w-8"
                            >
                              <TrashIcon width={15} height={15} />
                            </IconButton>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-3">
                    Applications
                  </p>
                  <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((pkg) => (
                      <motion.li
                        key={pkg.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="rounded-xl border border-line p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {pkg.job.title}
                            </p>
                            <p className="text-xs text-ink-soft truncate">
                              {pkg.job.company}
                            </p>
                          </div>
                          <Chip tone="accent">{pkg.match.score}</Chip>
                        </div>
                        <p className="text-[11px] text-ink-soft/80 mt-2">
                          {formatDate(pkg.createdAt)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenItem(pkg)}
                          >
                            Open
                          </Button>
                          <IconButton
                            onClick={() => onDelete(pkg.id)}
                            aria-label="Delete"
                            className="h-8 w-8"
                          >
                            <TrashIcon width={15} height={15} />
                          </IconButton>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  </ul>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
