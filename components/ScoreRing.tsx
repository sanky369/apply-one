"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./motion";

export function ScoreRing({
  score,
  size = 132,
  stroke = 10,
  label = "ATS score",
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);

  const color =
    clamped >= 80 ? "var(--success)" : clamped >= 55 ? "var(--accent)" : "var(--warn)";

  const [display, setDisplay] = useState(reduce ? clamped : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) {
      setDisplay(clamped);
      return;
    }
    const start = performance.now();
    const from = 0;
    const dur = 800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (clamped - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clamped, reduce]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 0.8, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl leading-none tabular-nums text-ink">
          {display}
        </span>
        <span className="text-[11px] text-ink-soft mt-1">/ 100</span>
      </div>
    </div>
  );
}
