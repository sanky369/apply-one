"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./motion";
import { makeId } from "@/lib/utils";

type ToastTone = "neutral" | "success" | "error";
type Toast = { id: string; message: string; hint?: string; tone: ToastTone };

type ToastCtx = {
  toast: (message: string, opts?: { hint?: string; tone?: ToastTone }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback<ToastCtx["toast"]>(
    (message, opts) => {
      const id = makeId();
      const t: Toast = { id, message, hint: opts?.hint, tone: opts?.tone ?? "neutral" };
      setToasts((prev) => [...prev, t]);
      const ttl = opts?.tone === "error" ? 6000 : 3500;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ttl),
      );
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 w-[min(92vw,420px)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={() => dismiss(t.id)}
              className="w-full text-left rounded-full bg-surface border border-line shadow-card px-4 py-2.5 cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      t.tone === "success"
                        ? "var(--success)"
                        : t.tone === "error"
                          ? "var(--warn)"
                          : "var(--accent)",
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{t.message}</p>
                  {t.hint && (
                    <p className="text-xs text-ink-soft mt-0.5 leading-snug">{t.hint}</p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
