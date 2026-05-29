"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------- Button ----------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle";
  size?: "sm" | "md";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-premium focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";
    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-4 py-2.5",
    };
    const variants = {
      primary:
        "bg-accent text-white hover:brightness-110 shadow-[0_1px_2px_rgba(79,70,229,.3)]",
      ghost:
        "border border-line text-ink hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]",
      subtle:
        "text-ink-soft hover:text-ink hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]",
    };
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

// ---------- IconButton ----------

export function IconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-9 w-9 rounded-lg text-ink-soft hover:text-ink hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] transition-colors focus-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------- Card ----------

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-card shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------- Eyebrow ----------

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

// ---------- Chip ----------

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "matched" | "missing" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "border-line text-ink-soft",
    matched:
      "border-transparent bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success",
    missing:
      "border-transparent bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-warn",
    accent:
      "border-transparent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium font-mono",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

// ---------- TopProgress ----------

export function TopProgress({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] top-progress"
      role="progressbar"
      aria-label="Working"
    />
  );
}
