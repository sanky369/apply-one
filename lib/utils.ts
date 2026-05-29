// Small shared helpers (client + server safe).

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Debounce a function by `wait` ms. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Crypto-strong-ish id without external deps. */
export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Sanitize a string into a safe filename fragment. */
export function slug(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 60) || "Resume"
  );
}

/** Flatten a MasterResume into plain text (for ATS scoring / copy). */
export function resumeToPlainText(r: {
  contact: { name: string; title?: string; email?: string; phone?: string; location?: string };
  summary: string;
  skills: { group: string; items: string[] }[];
  experience: { company: string; title: string; start?: string; end?: string; bullets: string[] }[];
  projects: { name: string; stack?: string; bullets: string[] }[];
  education: { school: string; credential: string; year?: string }[];
  certifications: string[];
  keywords: string[];
}): string {
  const lines: string[] = [];
  lines.push(r.contact.name);
  if (r.contact.title) lines.push(r.contact.title);
  const meta = [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean);
  if (meta.length) lines.push(meta.join(" • "));
  if (r.summary) lines.push("\nSUMMARY\n" + r.summary);
  if (r.skills.length) {
    lines.push("\nSKILLS");
    for (const g of r.skills) lines.push(`${g.group}: ${g.items.join(", ")}`);
  }
  if (r.experience.length) {
    lines.push("\nEXPERIENCE");
    for (const e of r.experience) {
      lines.push(`${e.title} — ${e.company} (${e.start ?? ""}–${e.end ?? ""})`);
      for (const b of e.bullets) lines.push(`• ${b}`);
    }
  }
  if (r.projects.length) {
    lines.push("\nPROJECTS");
    for (const p of r.projects) {
      lines.push(`${p.name}${p.stack ? ` (${p.stack})` : ""}`);
      for (const b of p.bullets) lines.push(`• ${b}`);
    }
  }
  if (r.education.length) {
    lines.push("\nEDUCATION");
    for (const ed of r.education)
      lines.push(`${ed.credential}, ${ed.school}${ed.year ? ` (${ed.year})` : ""}`);
  }
  if (r.certifications.length)
    lines.push("\nCERTIFICATIONS\n" + r.certifications.join(", "));
  if (r.keywords.length) lines.push("\nKEYWORDS\n" + r.keywords.join(", "));
  return lines.join("\n");
}
