import { NextResponse } from "next/server";
import { ApiError } from "./anthropic";

/** Standard friendly error JSON: { error, hint }. See plan §6.4. */
export function errorJson(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message, hint: err.hint },
      { status: err.status },
    );
  }
  // Anthropic SDK errors carry a status + message.
  const anyErr = err as { status?: number; message?: string };
  if (anyErr?.status === 401) {
    return NextResponse.json(
      {
        error: "Authentication with the AI provider failed.",
        hint: "Check that ANTHROPIC_API_KEY in .env.local is valid.",
      },
      { status: 401 },
    );
  }
  if (anyErr?.status === 429) {
    return NextResponse.json(
      {
        error: "Rate limited by the AI provider.",
        hint: "Wait a few seconds and try again.",
      },
      { status: 429 },
    );
  }
  const message =
    typeof anyErr?.message === "string" ? anyErr.message : "Something went wrong.";
  return NextResponse.json(
    { error: message, hint: "Please try again." },
    { status: 500 },
  );
}
