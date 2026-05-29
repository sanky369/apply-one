// IndexedDB persistence (client-only). Master resume, settings, and history.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ApplicationPackage, ATSReport, MasterResume } from "./types";

interface ApplyOneDB extends DBSchema {
  meta: {
    key: string;
    value: unknown;
  };
  history: {
    key: string;
    value: ApplicationPackage;
    indexes: { byCreatedAt: number };
  };
}

const DB_NAME = "applyone";
const DB_VERSION = 1;
const MASTER_KEY = "masterResume";
const SETTINGS_KEY = "settings";
const REPORT_KEY = "atsReport";

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
      upgrade(db) {
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
        if (!db.objectStoreNames.contains("history")) {
          const store = db.createObjectStore("history", { keyPath: "id" });
          store.createIndex("byCreatedAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

// ---------- Master resume ----------

export async function saveMaster(resume: MasterResume): Promise<void> {
  const db = await getDB();
  await db.put("meta", resume, MASTER_KEY);
}

export async function loadMaster(): Promise<MasterResume | null> {
  const db = await getDB();
  return ((await db.get("meta", MASTER_KEY)) as MasterResume) ?? null;
}

export async function clearMaster(): Promise<void> {
  const db = await getDB();
  await db.delete("meta", MASTER_KEY);
  await db.delete("meta", REPORT_KEY);
}

// ---------- Cached ATS report ----------

export async function saveReport(report: ATSReport): Promise<void> {
  const db = await getDB();
  await db.put("meta", report, REPORT_KEY);
}

export async function loadReport(): Promise<ATSReport | null> {
  const db = await getDB();
  return ((await db.get("meta", REPORT_KEY)) as ATSReport) ?? null;
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

// ---------- History ----------

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
