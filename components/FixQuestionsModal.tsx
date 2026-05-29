"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, IconButton } from "./ui";
import { XIcon, SparkIcon } from "./icons";
import { EASE } from "./motion";
import type { FixQuestion } from "@/lib/types";

export function FixQuestionsModal({
  open,
  questions,
  appliedCount,
  submitting,
  onSubmit,
  onClose,
}: {
  open: boolean;
  questions: FixQuestion[];
  appliedCount: number;
  submitting: boolean;
  onSubmit: (answers: { id: string; question: string; answer: string }[]) => void;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Reset answers whenever a fresh set of questions arrives.
  useEffect(() => {
    if (open) setAnswers({});
  }, [open, questions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = () =>
    onSubmit(
      questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: (answers[q.id] ?? "").trim(),
      })),
    );

  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim()).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
            aria-hidden
          />
          <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: EASE }}
              role="dialog"
              aria-modal="true"
              aria-label="A few details needed to apply fixes"
              className="pointer-events-auto w-full max-w-lg"
            >
              <Card className="flex max-h-[85vh] flex-col">
                <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-line">
                  <div>
                    <p className="eyebrow !mb-1">Apply fixes</p>
                    <h2 className="font-serif text-xl leading-tight">
                      A few details we can&apos;t guess
                    </h2>
                    <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                      {appliedCount > 0 && (
                        <>
                          Applied {appliedCount} fix{appliedCount === 1 ? "" : "es"}{" "}
                          automatically.{" "}
                        </>
                      )}
                      Fill in what you can — we&apos;ll never invent numbers. Leave a
                      field blank to skip it.
                    </p>
                  </div>
                  <IconButton onClick={onClose} aria-label="Close">
                    <XIcon />
                  </IconButton>
                </div>

                <div className="flex-1 overflow-y-auto scroll-thin p-6 space-y-5">
                  {questions.map((q, i) => (
                    <label key={q.id} className="block">
                      <span className="block text-sm font-medium text-ink mb-2">
                        {i + 1}. {q.question}
                      </span>
                      <textarea
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder={q.placeholder ?? "Your answer (optional)"}
                        rows={2}
                        className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-ink placeholder:text-ink-soft/50 leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 p-6 pt-4 border-t border-line">
                  <span className="text-xs text-ink-soft">
                    {answeredCount} of {questions.length} answered
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={submit} disabled={submitting}>
                      <SparkIcon width={16} height={16} />
                      {submitting
                        ? "Applying…"
                        : answeredCount === 0
                          ? "Skip all & finish"
                          : "Apply answers"}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
