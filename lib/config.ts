// Centralized, swappable model + tuning config. See plan §1, §6.

export const MODELS = {
  // Generation — highest quality.
  generation: "claude-sonnet-4-6",
  // Parsing / scoring / extraction-cleanup — cheaper + fast.
  utility: "claude-haiku-4-5",
} as const;

export const GEN_PARAMS = {
  maxTokens: 4096,
  // Generation gets a little creative latitude; parsing/scoring stays at 0.
  temperatureGeneration: 0.4,
  temperatureUtility: 0,
} as const;

export const LIMITS = {
  maxPdfBytes: 10 * 1024 * 1024, // 10 MB
  // Below this many chars of extracted job body, escalate to the next fallback.
  thinJobContentChars: 400,
  // Below this many chars of extracted PDF text, fall back to native PDF reading.
  thinResumeTextChars: 120,
} as const;

export const TAVILY_EXTRACT_URL = "https://api.tavily.com/extract";
export const JINA_READER_BASE = "https://r.jina.ai/";
