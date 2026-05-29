import Anthropic from "@anthropic-ai/sdk";
import { getEnv, getEnvFileOnly } from "./env";

const OFFICIAL_BASE_URL = "https://api.anthropic.com";

let client: Anthropic | null = null;

/** Lazily construct the Anthropic client so missing keys surface as a clean error. */
export function getAnthropic(): Anthropic {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new ApiError(
      "Anthropic API key is not configured.",
      "Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
      500,
    );
  }
  if (!client) {
    // Pin the official endpoint unless the user explicitly sets ANTHROPIC_BASE_URL
    // in .env.local — this prevents a stray shell-level base URL (e.g. an agent
    // proxy) from hijacking requests made with the user's own key.
    const baseURL = getEnvFileOnly("ANTHROPIC_BASE_URL") ?? OFFICIAL_BASE_URL;
    client = new Anthropic({ apiKey, baseURL });
  }
  return client;
}

/** Error carrying a user-friendly hint + HTTP status for route responses. */
export class ApiError extends Error {
  hint: string;
  status: number;
  constructor(message: string, hint: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.hint = hint;
    this.status = status;
  }
}

/**
 * Run a non-streaming tool call and return the validated tool input.
 * Forces the model to call exactly `toolName` so output is reliably shaped.
 */
export async function runToolCall<T>(opts: {
  model: string;
  system: string;
  userContent: Anthropic.MessageParam["content"];
  tool: Anthropic.Tool;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0,
    system: opts.system,
    tools: [opts.tool],
    tool_choice: { type: "tool", name: opts.tool.name },
    messages: [{ role: "user", content: opts.userContent }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new ApiError(
      "Model did not return structured output.",
      "Try again in a moment.",
      502,
    );
  }
  return block.input as T;
}
