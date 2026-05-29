"use client";

import { motion } from "framer-motion";
import { Button } from "./ui";
import { ArrowDownIcon, ClockIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { heroItem, stagger } from "./motion";

export function Hero({
  onStart,
  onOpenHistory,
}: {
  onStart: () => void;
  onOpenHistory: () => void;
}) {
  return (
    <header className="relative">
      <div className="hero-wash absolute inset-0 -z-10" aria-hidden />

      <nav className="mx-auto max-w-content px-6 sm:px-8 flex items-center justify-between py-5">
        <span className="font-serif text-lg tracking-tight">ApplyOne</span>
        <div className="flex items-center gap-1">
          <Button variant="subtle" size="sm" onClick={onOpenHistory}>
            <ClockIcon width={16} height={16} />
            History
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-content px-6 sm:px-8 pt-16 sm:pt-24 pb-14 text-center"
      >
        <motion.p variants={heroItem} className="eyebrow">
          ATS-grade résumé tailoring
        </motion.p>
        <motion.h1
          variants={heroItem}
          className="font-serif font-light tracking-[-0.02em] leading-[1.05] mt-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
        >
          Tailor your résumé to
          <br className="hidden sm:block" /> any job, in one click.
        </motion.h1>
        <motion.p
          variants={heroItem}
          className="mx-auto mt-6 max-w-xl text-lg text-ink-soft leading-relaxed"
        >
          Upload your résumé, paste a job link, and get a bespoke résumé, cover
          letter, and cold email — each scored against the role. Everything runs
          locally in your browser.
        </motion.p>
        <motion.div
          variants={heroItem}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <Button onClick={onStart}>
            Upload your résumé
            <ArrowDownIcon width={16} height={16} />
          </Button>
          <Button variant="ghost" onClick={onOpenHistory}>
            View past runs
          </Button>
        </motion.div>
      </motion.div>
    </header>
  );
}
