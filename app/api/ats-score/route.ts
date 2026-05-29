import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runToolCall, ApiError } from "@/lib/anthropic";
import { errorJson } from "@/lib/server";
import { MODELS, GEN_PARAMS } from "@/lib/config";
import { ATS_SYSTEM, ATS_TOOL } from "@/lib/prompts";
import { resumeToPlainText } from "@/lib/utils";
import type { ATSReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success || !parsed.data.resume) {
      throw new ApiError("Invalid request body.", "Send { resume }.", 400);
    }

    const plain = resumeToPlainText(parsed.data.resume);

    const report = await runToolCall<ATSReport>({
      model: MODELS.utility,
      system: ATS_SYSTEM,
      userContent: `RESUME:\n${plain}`,
      tool: ATS_TOOL,
      temperature: GEN_PARAMS.temperatureUtility,
    });

    return NextResponse.json(report);
  } catch (err) {
    return errorJson(err);
  }
}
