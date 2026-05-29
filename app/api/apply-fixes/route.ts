import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runToolCall, ApiError } from "@/lib/anthropic";
import { errorJson } from "@/lib/server";
import { MODELS, GEN_PARAMS } from "@/lib/config";
import {
  APPLY_FIXES_SYSTEM,
  APPLY_ANSWERS_SYSTEM,
  APPLY_FIXES_TOOL,
  applyFixesUserContent,
  applyAnswersUserContent,
} from "@/lib/prompts";
import type { ApplyFixesResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

const Body = z.object({
  resume: z.any(),
  fixes: z.array(z.string()).optional(),
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success || !parsed.data.resume) {
      throw new ApiError("Invalid request body.", "Send { resume, fixes }.", 400);
    }
    const { resume, fixes, answers } = parsed.data;

    // Phase 2: the user answered our questions — incorporate them.
    if (answers && answers.length > 0) {
      const result = await runToolCall<ApplyFixesResult>({
        model: MODELS.generation,
        system: APPLY_ANSWERS_SYSTEM,
        userContent: applyAnswersUserContent(resume, answers),
        tool: APPLY_FIXES_TOOL,
        temperature: GEN_PARAMS.temperatureUtility,
        maxTokens: GEN_PARAMS.maxTokens,
      });
      return NextResponse.json({ ...result, questions: [] });
    }

    // Phase 1: apply what we can, ask for the rest.
    if (!fixes || fixes.length === 0) {
      throw new ApiError("No fixes to apply.", "Score the résumé first.", 400);
    }

    const result = await runToolCall<ApplyFixesResult>({
      model: MODELS.generation,
      system: APPLY_FIXES_SYSTEM,
      userContent: applyFixesUserContent(resume, fixes),
      tool: APPLY_FIXES_TOOL,
      temperature: GEN_PARAMS.temperatureUtility,
      maxTokens: GEN_PARAMS.maxTokens,
    });

    return NextResponse.json(result);
  } catch (err) {
    return errorJson(err);
  }
}
