"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadIcon, FileIcon, XIcon } from "./icons";
import { Button } from "./ui";
import { useToast } from "./Toast";
import { formatBytes } from "@/lib/utils";
import { LIMITS } from "@/lib/config";
import { EASE } from "./motion";

export function Dropzone({
  onFile,
  busy,
}: {
  onFile: (pdfBase64: string, fileName: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast("That's not a PDF.", { hint: "Upload a .pdf résumé.", tone: "error" });
        return;
      }
      if (file.size > LIMITS.maxPdfBytes) {
        toast("File too large.", { hint: "Keep it under 10 MB.", tone: "error" });
        return;
      }
      setPicked({ name: file.name, size: file.size });
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] ?? "";
        onFile(base64, file.name);
      };
      reader.onerror = () =>
        toast("Couldn't read that file.", { tone: "error" });
      reader.readAsDataURL(file);
    },
    [onFile, toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div>
      <motion.div
        animate={{ scale: dragOver ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload résumé PDF"
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`relative flex flex-col items-center justify-center text-center rounded-card border border-dashed px-6 py-16 cursor-pointer transition-colors duration-200 focus-ring ${
          dragOver
            ? "border-accent bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
            : "border-line bg-surface hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <div className="h-12 w-12 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent flex items-center justify-center mb-4">
          <UploadIcon width={22} height={22} />
        </div>
        <p className="font-medium text-ink">
          Drop your résumé here, or <span className="text-accent">browse</span>
        </p>
        <p className="text-sm text-ink-soft mt-1">PDF only · up to 10 MB</p>
      </motion.div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
          >
            <FileIcon className="text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{picked.name}</p>
              <p className="text-xs text-ink-soft">{formatBytes(picked.size)}</p>
            </div>
            {!busy && (
              <Button
                variant="subtle"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPicked(null);
                }}
                aria-label="Remove file"
              >
                <XIcon width={16} height={16} />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
