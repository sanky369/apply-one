import { NextRequest } from "next/server";
import { z } from "zod";
import { getAnthropic, ApiError } from "@/lib/anthropic";
import { MODELS, GEN_PARAMS } from "@/lib/config";
import {
  GENERATE_SYSTEM,
  GENERATE_TOOL,
  generateUserContent,
} from "@/lib/prompts";
import type { GeneratedPackage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  masterResume: z.any(),
  jobPosting: z.any(),
});

// NDJSON event helpers.
function line(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request.", hint: "Send { masterResume, jobPosting }." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropic = getAnthropic();
        const apiStream = await anthropic.messages.create({
          model: MODELS.generation,
          max_tokens: GEN_PARAMS.maxTokens,
          temperature: GEN_PARAMS.temperatureGeneration,
          system: GENERATE_SYSTEM,
          tools: [GENERATE_TOOL],
          tool_choice: { type: "tool", name: GENERATE_TOOL.name },
          messages: [
            {
              role: "user",
              content: generateUserContent(body.masterResume, body.jobPosting),
            },
          ],
          stream: true,
        });

        let accumulated = "";
        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "input_json_delta"
          ) {
            const chunk = event.delta.partial_json;
            if (chunk) {
              accumulated += chunk;
              // Stream the raw partial JSON; the client extracts prose progressively.
              controller.enqueue(line({ type: "delta", text: chunk }));
            }
          }
        }

        let pkg: GeneratedPackage;
        try {
          pkg = JSON.parse(accumulated) as GeneratedPackage;
        } catch {
          throw new ApiError(
            "The model returned malformed output.",
            "Try generating again.",
            502,
          );
        }
        controller.enqueue(line({ type: "done", package: pkg }));
      } catch (err) {
        const e = err as { message?: string; hint?: string; status?: number };
        controller.enqueue(
          line({
            type: "error",
            error: e?.message ?? "Generation failed.",
            hint: e?.hint ?? "Please try again.",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
