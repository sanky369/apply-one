// IndexedDB persistence (client-only). Résumé drafts, settings, and application history.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ApplicationPackage,
  ATSReport,
  MasterResume,
  ResumeDraft,
} from "./types";

interface ApplyOneDB extends DBSchema {
  meta: {
    key: string;
    value: unknown;
  };
  drafts: {
    key: string;
    value: ResumeDraft;
    indexes: { byUpdatedAt: number };
  };
  history: {
    key: string;
    value: ApplicationPackage;
    indexes: { byCreatedAt: number };
  };
}

const DB_NAME = "applyone";
const DB_VERSION = 2;
const SETTINGS_KEY = "settings";
// Legacy single-master keys (v1) — read once during migration.
const LEGACY_MASTER_KEY = "masterResume";
const LEGACY_REPORT_KEY = "atsReport";

export type Settings = {
  theme: "light" | "dark";
};

let dbPromise: Promise<IDBPDatabase<ApplyOneDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ApplyOneDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }
  if (!dbPromise) {
    dbPromise = openDB<ApplyOneDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
        if (!db.objectStoreNames.contains("history")) {
          const store = db.createObjectStore("history", { keyPath: "id" });
          store.createIndex("byCreatedAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("drafts")) {
          const store = db.createObjectStore("drafts", { keyPath: "id" });
          store.createIndex("byUpdatedAt", "updatedAt");
        }

        // v1 → v2: migrate the single saved master résumé into a draft so it
        // remains reachable from History instead of auto-loading on the page.
        if (oldVersion === 1) {
          try {
            const meta = tx.objectStore("meta");
            const master = (await meta.get(LEGACY_MASTER_KEY)) as
              | MasterResume
              | undefined;
            if (master) {
              const report =
                ((await meta.get(LEGACY_REPORT_KEY)) as ATSReport | undefined) ??
                null;
              const now = Date.now();
              await tx.objectStore("drafts").put({
                id: `migrated-${now}`,
                createdAt: now,
                updatedAt: now,
                name: master.contact?.name || "Imported résumé",
                resume: master,
                report,
              });
              await meta.delete(LEGACY_MASTER_KEY);
              await meta.delete(LEGACY_REPORT_KEY);
            }
          } catch {
            /* migration best-effort */
          }
        }
      },
    });
  }
  return dbPromise;
}

// ---------- Settings ----------

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put("meta", settings, SETTINGS_KEY);
}

export async function loadSettings(): Promise<Settings | null> {
  const db = await getDB();
  return ((await db.get("meta", SETTINGS_KEY)) as Settings) ?? null;
}

// ---------- Résumé drafts ----------

export async function saveDraft(draft: ResumeDraft): Promise<void> {
  const db = await getDB();
  await db.put("drafts", draft);
}

export async function loadDraft(id: string): Promise<ResumeDraft | null> {
  const db = await getDB();
  return (await db.get("drafts", id)) ?? null;
}

export async function listDrafts(): Promise<ResumeDraft[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("drafts", "byUpdatedAt");
  return all.reverse(); // most recently edited first
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("drafts", id);
}

// ---------- Application history ----------

export async function saveToHistory(pkg: ApplicationPackage): Promise<void> {
  const db = await getDB();
  await db.put("history", pkg);
}

export async function listHistory(): Promise<ApplicationPackage[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("history", "byCreatedAt");
  return all.reverse(); // newest first
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("history", id);
}
