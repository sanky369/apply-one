"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, Skeleton } from "./ui";
import { ScoreRing } from "./ScoreRing";
import { CheckIcon } from "./icons";
import { EASE } from "./motion";
import type { ATSReport } from "@/lib/types";

const BREAKDOWN_LABELS: Record<string, string> = {
  formatting: "Formatting",
  keywords: "Keywords",
  clarity: "Clarity",
  quantification: "Quantification",
  structure: "Structure",
};

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink-soft">{label}</span>
        <span className="tabular-nums text-ink font-medium">{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>
    </div>
  );
}

export function ATSScoreCard({
  report,
  loading,
}: {
  report: ATSReport | null;
  loading: boolean;
}) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Card className="p-6 sm:p-7">
      <p className="eyebrow mb-4">ATS score</p>

      {loading && !report ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[132px] w-[132px] rounded-full" />
          <div className="w-full space-y-3 mt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
      ) : report ? (
        <>
          <div className="flex flex-col items-center">
            <ScoreRing score={report.score} />
          </div>

          <div className="mt-6 space-y-3">
            {Object.entries(report.breakdown).map(([key, value]) => (
              <Bar key={key} label={BREAKDOWN_LABELS[key] ?? key} value={value} />
            ))}
          </div>

          {report.fixes.length > 0 && (
            <div className="mt-6 pt-5 border-t border-line">
              <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-3">
                Suggested fixes
              </p>
              <ul className="space-y-2">
                {report.fixes.map((fix, i) => {
                  const done = ticked.has(i);
                  return (
                    <li key={i}>
                      <button
                        onClick={() => toggle(i)}
                        className="flex items-start gap-2.5 text-left w-full group focus-ring rounded"
                      >
                        <span
                          className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                            done
                              ? "bg-success border-success text-white"
                              : "border-line group-hover:border-accent"
                          }`}
                        >
                          {done && <CheckIcon width={11} height={11} />}
                        </span>
                        <span
                          className={`text-sm leading-snug transition-colors ${
                            done ? "text-ink-soft line-through" : "text-ink"
                          }`}
                        >
                          {fix}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-ink-soft py-8 text-center">
          Your ATS score will appear here once your résumé is parsed.
        </p>
      )}
    </Card>
  );
}
