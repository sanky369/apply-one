"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Dropzone } from "@/components/Dropzone";
import { MasterResumeEditor } from "@/components/MasterResumeEditor";
import { ATSScoreCard } from "@/components/ATSScoreCard";
import { JobTarget } from "@/components/JobTarget";
import { Results } from "@/components/Results";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ToastProvider, useToast } from "@/components/Toast";
import { Button, Card, TopProgress } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { sectionReveal, VIEWPORT, EASE } from "@/components/motion";
import {
  loadMaster,
  saveMaster,
  clearMaster,
  loadReport,
  saveReport,
  listHistory,
  saveToHistory,
  deleteHistory,
} from "@/lib/db";
import { makeId } from "@/lib/utils";
import type {
  AppPhase,
  ApplicationPackage,
  ATSReport,
  GeneratedPackage,
  JobPosting,
  MasterResume,
} from "@/lib/types";

function Reveal({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <motion.section
      id={id}
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className="mx-auto max-w-content px-6 sm:px-8 py-8 sm:py-12"
    >
      {children}
    </motion.section>
  );
}

function AppInner() {
  const { toast } = useToast();

  const [phase, setPhase] = useState<AppPhase>("idle");
  const [resume, setResume] = useState<MasterResume | null>(null);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [savedPill, setSavedPill] = useState(false);

  const [job, setJob] = useState<JobPosting | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [forcePaste, setForcePaste] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [partial, setPartial] = useState("");
  const [pkg, setPkg] = useState<GeneratedPackage | null>(null);
  const [pkgSaved, setPkgSaved] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ApplicationPackage[]>([]);

  const uploadRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // ---- Hydrate from IndexedDB on mount ----
  useEffect(() => {
    (async () => {
      try {
        const [m, r, h] = await Promise.all([
          loadMaster(),
          loadReport(),
          listHistory(),
        ]);
        if (m) {
          setResume(m);
          setReport(r);
          setPhase("ready");
        }
        setHistory(h);
      } catch {
        /* fresh browser */
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // ---- ATS scoring ----
  const scoreResume = useCallback(
    async (r: MasterResume) => {
      setAtsLoading(true);
      try {
        const res = await fetch("/api/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume: r }),
        });
        const data = await res.json();
        if (!res.ok) throw data;
        setReport(data as ATSReport);
        void saveReport(data as ATSReport);
      } catch (e) {
        const err = e as { hint?: string };
        toast("Couldn't score résumé.", {
          hint: err?.hint ?? "Check your API key.",
          tone: "error",
        });
      } finally {
        setAtsLoading(false);
      }
    },
    [toast],
  );

  // ---- Autosave + debounced re-score on edit ----
  useEffect(() => {
    if (!hydrated.current || !resume) return;
    const t = setTimeout(() => {
      void saveMaster(resume);
      setSavedPill(true);
      setTimeout(() => setSavedPill(false), 1800);
      void scoreResume(resume);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume]);

  // ---- Parse uploaded PDF ----
  const handleFile = useCallback(
    async (pdfBase64: string, _fileName: string) => {
      setPhase("parsing");
      try {
        const res = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64 }),
        });
        const data = await res.json();
        if (!res.ok) throw data;
        const parsed = data as MasterResume;
        setResume(parsed);
        setPhase("ready");
        await saveMaster(parsed);
        void scoreResume(parsed);
        toast("Résumé parsed.", { tone: "success" });
      } catch (e) {
        const err = e as { error?: string; hint?: string };
        setPhase("idle");
        toast(err?.error ?? "Couldn't parse that résumé.", {
          hint: err?.hint ?? "Try another PDF.",
          tone: "error",
        });
      }
    },
    [scoreResume, toast],
  );

  // ---- Replace / start over ----
  const handleReplace = useCallback(async () => {
    await clearMaster();
    setResume(null);
    setReport(null);
    setJob(null);
    setPkg(null);
    setPartial("");
    setPhase("idle");
    setTimeout(
      () => uploadRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, []);

  // ---- Extract job ----
  const handleExtract = useCallback(
    async (payload: { url?: string; text?: string }) => {
      setExtracting(true);
      setForcePaste(false);
      setPhase("extracting-job");
      try {
        const res = await fetch("/api/extract-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422) setForcePaste(true);
          throw data;
        }
        setJob(data.job as JobPosting);
        // Reset any prior generation for the new target.
        setPkg(null);
        setPartial("");
        setPkgSaved(false);
        toast("Job extracted.", { tone: "success" });
      } catch (e) {
        const err = e as { error?: string; hint?: string };
        toast(err?.error ?? "Couldn't read that job.", {
          hint: err?.hint,
          tone: "error",
        });
      } finally {
        setExtracting(false);
        setPhase((p) => (p === "extracting-job" ? "ready" : p));
      }
    },
    [toast],
  );

  // ---- Generate (streaming NDJSON) ----
  const handleGenerate = useCallback(async () => {
    if (!resume || !job) return;
    setGenerating(true);
    setPkg(null);
    setPartial("");
    setPkgSaved(false);
    setPhase("generating");
    setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterResume: resume, jobPosting: job }),
      });
      if (!res.body) throw { error: "No response stream." };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          const evt = JSON.parse(trimmed) as
            | { type: "delta"; text: string }
            | { type: "done"; package: GeneratedPackage }
            | { type: "error"; error: string; hint?: string };
          if (evt.type === "delta") {
            acc += evt.text;
            setPartial(acc);
          } else if (evt.type === "done") {
            setPkg(evt.package);
            setPhase("results");
          } else if (evt.type === "error") {
            throw evt;
          }
        }
      }
    } catch (e) {
      const err = e as { error?: string; hint?: string };
      toast(err?.error ?? "Generation failed.", {
        hint: err?.hint ?? "Please try again.",
        tone: "error",
      });
      setPhase("ready");
    } finally {
      setGenerating(false);
    }
  }, [resume, job, toast]);

  // ---- Save package to history ----
  const handleSave = useCallback(async () => {
    if (!pkg || !job) return;
    const record: ApplicationPackage = {
      id: makeId(),
      createdAt: Date.now(),
      job,
      tailoredResume: pkg.tailoredResume,
      coverLetter: pkg.coverLetter,
      coldEmail: pkg.coldEmail,
      match: pkg.matchScore,
    };
    await saveToHistory(record);
    setHistory(await listHistory());
    setPkgSaved(true);
    toast("Saved to history.", { tone: "success" });
  }, [pkg, job, toast]);

  const handleOpenHistory = useCallback(async () => {
    setHistory(await listHistory());
    setHistoryOpen(true);
  }, []);

  const handleOpenItem = useCallback((item: ApplicationPackage) => {
    setJob(item.job);
    setPkg({
      tailoredResume: item.tailoredResume,
      coverLetter: item.coverLetter,
      coldEmail: item.coldEmail,
      matchScore: item.match,
    });
    setPartial("");
    setPkgSaved(true);
    setPhase("results");
    setHistoryOpen(false);
    setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    await deleteHistory(id);
    setHistory(await listHistory());
  }, []);

  const scrollToUpload = () =>
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });

  const busy = phase === "parsing";
  const showResults = generating || partial.length > 0 || pkg !== null;

  return (
    <main className="min-h-dvh">
      <AnimatePresence>
        <TopProgress show={busy || extracting || generating || atsLoading} />
      </AnimatePresence>

      <Hero onStart={scrollToUpload} onOpenHistory={handleOpenHistory} />

      {/* Upload / Master */}
      <div ref={uploadRef} className="scroll-mt-8">
        <Reveal>
          {!resume ? (
            <Card className="p-6 sm:p-10">
              <div className="max-w-2xl mx-auto text-center mb-8">
                <p className="eyebrow">Step 1</p>
                <h2
                  className="font-serif font-light tracking-tight mt-2"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
                >
                  Start with your résumé
                </h2>
                <p className="text-ink-soft mt-3">
                  We&apos;ll parse it into an editable, ATS-optimized master you
                  can reuse for every application.
                </p>
              </div>
              <div className="max-w-xl mx-auto">
                <Dropzone onFile={handleFile} busy={busy} />
                {busy && (
                  <p className="text-center text-sm text-ink-soft mt-4 animate-pulse">
                    Reading and structuring your résumé…
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
              <Card className="p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="eyebrow !mb-0">Master résumé</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AnimatePresence>
                      {savedPill && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className="inline-flex items-center gap-1 text-xs text-success"
                        >
                          <CheckIcon width={13} height={13} /> Saved
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <Button variant="subtle" size="sm" onClick={handleReplace}>
                      Replace
                    </Button>
                  </div>
                </div>
                <MasterResumeEditor resume={resume} onChange={setResume} />
              </Card>

              <div className="lg:sticky lg:top-6">
                <ATSScoreCard report={report} loading={atsLoading} />
              </div>
            </div>
          )}
        </Reveal>
      </div>

      {/* Target a job */}
      {resume && (
        <Reveal>
          <JobTarget
            job={job}
            extracting={extracting}
            generating={generating}
            forcePaste={forcePaste}
            onExtract={handleExtract}
            onGenerate={handleGenerate}
          />
        </Reveal>
      )}

      {/* Results */}
      {showResults && (
        <div ref={resultsRef} className="scroll-mt-8">
          <Reveal>
            <Results
              pkg={pkg}
              streaming={generating}
              partial={partial}
              job={job}
              onSave={handleSave}
              saved={pkgSaved}
            />
          </Reveal>
        </div>
      )}

      <Footer />

      <HistoryDrawer
        open={historyOpen}
        items={history}
        onClose={() => setHistoryOpen(false)}
        onOpenItem={handleOpenItem}
        onDelete={handleDeleteItem}
      />
    </main>
  );
}

export default function Page() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </MotionConfig>
  );
}
