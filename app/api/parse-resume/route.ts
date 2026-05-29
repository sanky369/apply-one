import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runToolCall, ApiError } from "@/lib/anthropic";
import { errorJson } from "@/lib/server";
import { extractPdfText } from "@/lib/pdf";
import { MODELS, GEN_PARAMS, LIMITS } from "@/lib/config";
import { PARSE_SYSTEM, PARSE_TOOL } from "@/lib/prompts";
import type { MasterResume } from "@/lib/types";
import type Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  pdfBase64: z.string().optional(),
  text: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(
        "Invalid request body.",
        "Send either { pdfBase64 } or { text }.",
        400,
      );
    }
    const { pdfBase64, text } = parsed.data;

    let userContent: Anthropic.MessageParam["content"];

    if (text && text.trim().length >= LIMITS.thinResumeTextChars) {
      // Caller supplied text directly.
      userContent = `RESUME TEXT:\n${text}`;
    } else if (pdfBase64) {
      const bytes = Buffer.from(pdfBase64, "base64");
      if (bytes.byteLength > LIMITS.maxPdfBytes) {
        throw new ApiError("PDF is too large.", "Keep the file under 10 MB.", 413);
      }
      const extracted = await extractPdfText(new Uint8Array(bytes));

      if (extracted.length >= LIMITS.thinResumeTextChars) {
        userContent = `RESUME TEXT:\n${extracted}`;
      } else {
        // Scanned/garbled PDF — let Claude read the document natively.
        userContent = [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: "Parse this resume PDF into the schema via the emit_resume tool.",
          },
        ];
      }
    } else {
      throw new ApiError(
        "No resume provided.",
        "Upload a PDF or paste resume text.",
        400,
      );
    }

    const resume = await runToolCall<MasterResume>({
      model: MODELS.utility,
      system: PARSE_SYSTEM,
      userContent,
      tool: PARSE_TOOL,
      temperature: GEN_PARAMS.temperatureUtility,
    });

    return NextResponse.json(resume);
  } catch (err) {
    return errorJson(err);
  }
}
