"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, Skeleton } from "./ui";
import { CopyButton } from "./CopyButton";
import { ScoreRing } from "./ScoreRing";
import { DownloadIcon, CheckIcon } from "./icons";
import { useToast } from "./Toast";
import { extractStreamingString } from "@/lib/stream";
import { resumeToPlainText } from "@/lib/utils";
import { downloadResumePdf } from "@/lib/pdf-export";
import { sectionReveal } from "./motion";
import type { GeneratedPackage, JobPosting } from "@/lib/types";

function Caret() {
  return (
    <motion.span
      aria-hidden
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="inline-block w-[2px] h-[1em] align-[-0.1em] bg-accent ml-0.5"
    />
  );
}

function ProseCard({
  title,
  text,
  streaming,
  meta,
}: {
  title: string;
  text: string;
  streaming: boolean;
  meta?: string;
}) {
  return (
    <Card className="p-6 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="eyebrow !mb-0">{title}</p>
          {meta && <p className="text-sm text-ink mt-1 font-medium">{meta}</p>}
        </div>
        {text && !streaming && <CopyButton text={meta ? `${meta}\n\n${text}` : text} />}
      </div>
      {text || streaming ? (
        <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap flex-1">
          {text}
          {streaming && <Caret />}
        </p>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}
    </Card>
  );
}

export function Results({
  pkg,
  streaming,
  partial,
  job,
  onSave,
  saved,
}: {
  pkg: GeneratedPackage | null;
  streaming: boolean;
  partial: string;
  job: JobPosting | null;
  onSave: () => void;
  saved: boolean;
}) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  // Live prose during streaming; final values once parsed.
  const coverLetter = pkg?.coverLetter ?? extractStreamingString(partial, "coverLetter");
  const emailSubject = pkg?.coldEmail.subject ?? extractStreamingString(partial, "subject");
  const emailBody = pkg?.coldEmail.body ?? extractStreamingString(partial, "body");

  const resumeText = useMemo(
    () => (pkg ? resumeToPlainText(pkg.tailoredResume) : ""),
    [pkg],
  );

  const handleDownload = async () => {
    if (!pkg) return;
    setDownloading(true);
    try {
      await downloadResumePdf(pkg.tailoredResume, job?.company);
    } catch {
      toast("Couldn't generate PDF.", { tone: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div variants={sectionReveal} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">Your application package</p>
          <h2
            className="font-serif font-light tracking-tight mt-1"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
          >
            Tailored for {job?.title ?? "this role"}
          </h2>
        </div>
        {pkg && (
          <Button variant={saved ? "ghost" : "primary"} onClick={onSave} disabled={saved}>
            {saved ? (
              <>
                <CheckIcon width={16} height={16} /> Saved
              </>
            ) : (
              "Save to history"
            )}
          </Button>
        )}
      </div>

      {/* Match score panel */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          <div className="flex flex-col items-center shrink-0">
            {pkg ? (
              <ScoreRing score={pkg.matchScore.score} label="Match score" size={120} />
            ) : (
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            )}
            <p className="text-xs text-ink-soft mt-2">Job match</p>
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            {pkg ? (
              <>
                {pkg.matchScore.matchedKeywords.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-2">
                      Matched keywords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.matchScore.matchedKeywords.map((k, i) => (
                        <Chip key={i} tone="matched">
                          {k}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {pkg.matchScore.missingKeywords.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-2">
                      Gaps to address
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.matchScore.missingKeywords.map((k, i) => (
                        <Chip key={i} tone="missing">
                          {k}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {pkg.matchScore.notes.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {pkg.matchScore.notes.map((n, i) => (
                      <li key={i} className="text-sm text-ink-soft leading-snug flex gap-2">
                        <span className="text-accent">→</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tailored resume */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow !mb-0">Tailored résumé</p>
          {pkg && (
            <div className="flex items-center gap-2">
              <CopyButton text={resumeText} />
              <Button onClick={handleDownload} disabled={downloading} size="sm">
                <DownloadIcon width={15} height={15} />
                {downloading ? "Building…" : "Download PDF"}
              </Button>
            </div>
          )}
        </div>
        {pkg ? (
          <pre className="text-sm leading-relaxed text-ink whitespace-pre-wrap font-sans max-h-[420px] overflow-auto scroll-thin">
            {resumeText}
          </pre>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        )}
      </Card>

      {/* Cover letter + cold email */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProseCard title="Cover letter" text={coverLetter} streaming={streaming && !pkg} />
        <ProseCard
          title="Cold email"
          text={emailBody}
          streaming={streaming && !pkg}
          meta={emailSubject ? `Subject: ${emailSubject}` : undefined}
        />
      </div>
    </motion.div>
  );
}
