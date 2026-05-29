import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runToolCall, ApiError } from "@/lib/anthropic";
import { errorJson } from "@/lib/server";
import { MODELS, GEN_PARAMS, LIMITS, TAVILY_EXTRACT_URL, JINA_READER_BASE } from "@/lib/config";
import { JOB_CLEAN_SYSTEM, JOB_TOOL } from "@/lib/prompts";
import { getEnv } from "@/lib/env";
import type { JobPosting } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().url().optional(),
  text: z.string().optional(),
});

type CleanedJob = { title: string; company: string; location?: string; description: string };

// --- Tavily Extract (primary) ---
async function viaTavily(url: string): Promise<string> {
  const key = getEnv("TAVILY_API_KEY");
  if (!key) return "";
  try {
    const res = await fetch(TAVILY_EXTRACT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        urls: [url],
        extract_depth: "advanced",
        format: "markdown",
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      results?: { raw_content?: string }[];
    };
    return data.results?.[0]?.raw_content?.trim() ?? "";
  } catch {
    return "";
  }
}

// --- Jina Reader (fallback) ---
async function viaJina(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = { "x-respond-with": "markdown" };
    const jinaKey = getEnv("JINA_API_KEY");
    if (jinaKey) {
      headers.Authorization = `Bearer ${jinaKey}`;
    }
    const res = await fetch(`${JINA_READER_BASE}${url}`, {
      headers,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return "";
    return (await res.text()).trim();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(
        "Invalid request.",
        "Send a valid { url } or { text }.",
        400,
      );
    }
    const { url, text } = parsed.data;

    let raw = "";
    let source: "paste" | "tavily" | "jina" = "paste";

    if (text && text.trim().length >= LIMITS.thinJobContentChars) {
      raw = text.trim();
      source = "paste";
    } else if (url) {
      raw = await viaTavily(url);
      source = "tavily";
      if (raw.length < LIMITS.thinJobContentChars) {
        const jina = await viaJina(url);
        if (jina.length > raw.length) {
          raw = jina;
          source = "jina";
        }
      }
      if (raw.length < LIMITS.thinJobContentChars) {
        // Both automated readers failed (LinkedIn/Indeed block bots).
        throw new ApiError(
          "Couldn't read that page automatically.",
          "Some sites (LinkedIn, Indeed) block automated reading. Paste the description and we'll take it from there.",
          422,
        );
      }
    } else if (text && text.trim().length > 0) {
      raw = text.trim();
      source = "paste";
    } else {
      throw new ApiError(
        "Nothing to extract.",
        "Provide a job URL or paste the description.",
        400,
      );
    }

    // Claude cleanup pass → typed JobPosting.
    const cleaned = await runToolCall<CleanedJob>({
      model: MODELS.utility,
      system: JOB_CLEAN_SYSTEM,
      userContent: `EXTRACTED PAGE CONTENT:\n${raw.slice(0, 24000)}`,
      tool: JOB_TOOL,
      temperature: GEN_PARAMS.temperatureUtility,
    });

    const job: JobPosting = {
      url,
      title: cleaned.title || "Untitled role",
      company: cleaned.company || "Unknown company",
      location: cleaned.location,
      description: cleaned.description || raw,
    };

    return NextResponse.json({ job, source });
  } catch (err) {
    return errorJson(err);
  }
}
