// Resilient server-side env reader.
//
// Next.js loads `.env.local` into process.env, but it will NOT override a
// variable that is already present in the shell environment — even if that
// shell value is an empty string. Some environments (e.g. agent/CI shells)
// pre-set an empty `ANTHROPIC_API_KEY`, which then silently shadows the real
// key in `.env.local`. To keep local dev bulletproof, when a required var is
// empty we fall back to parsing `.env.local` directly.
//
// On Vercel/production the var is non-empty, so the fallback never runs and no
// file is read.
import { readFileSync } from "node:fs";
import { join } from "node:path";

let fileEnv: Record<string, string> | null = null;

function loadFileEnv(): Record<string, string> {
  if (fileEnv) return fileEnv;
  fileEnv = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(join(process.cwd(), file), "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        // strip surrounding quotes
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && !(key in fileEnv) && val) fileEnv[key] = val;
      }
    } catch {
      /* file absent — fine */
    }
  }
  return fileEnv;
}

/** Read an env var, falling back to .env.local if the process value is empty. */
export function getEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess && fromProcess.length > 0) return fromProcess;
  const v = loadFileEnv()[name];
  return v && v.length > 0 ? v : undefined;
}

/** Read an env var ONLY from .env.local / .env (ignoring the shell). */
export function getEnvFileOnly(name: string): string | undefined {
  const v = loadFileEnv()[name];
  return v && v.length > 0 ? v : undefined;
}
