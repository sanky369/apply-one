"use client";

import { useState } from "react";
import { Button } from "./ui";
import { CopyIcon, CheckIcon } from "./icons";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label={label}>
      {copied ? (
        <>
          <CheckIcon width={15} height={15} /> Copied
        </>
      ) : (
        <>
          <CopyIcon width={15} height={15} /> {label}
        </>
      )}
    </Button>
  );
}
