// All Claude prompts + tool JSON schemas live here. See plan §6.
import type Anthropic from "@anthropic-ai/sdk";

type Tool = Anthropic.Tool;

// ---------- Shared JSON Schema fragments ----------

const masterResumeSchema = {
  type: "object",
  properties: {
    contact: {
      type: "object",
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              url: { type: "string" },
            },
            required: ["label", "url"],
          },
        },
      },
      required: ["name"],
    },
    summary: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          group: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["group", "items"],
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          location: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["company", "title", "bullets"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: { type: "string" },
          stack: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["name", "bullets"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string" },
          credential: { type: "string" },
          year: { type: "string" },
        },
        required: ["school", "credential"],
      },
    },
    certifications: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: [
    "contact",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "keywords",
  ],
} as const;

// ---------- 6.1 Parse PDF → MasterResume ----------

export const PARSE_SYSTEM =
  "You are a precise resume parser. Extract the resume into the provided JSON schema. " +
  "Use only information present in the text. Do not invent, embellish, or infer facts. " +
  "Preserve the candidate's wording for bullets; only normalize obvious formatting noise. " +
  "If a section is absent, return an empty array or empty string for it. " +
  "Return via the `emit_resume` tool.";

export const PARSE_TOOL: Tool = {
  name: "emit_resume",
  description: "Emit the structured master resume.",
  input_schema: masterResumeSchema as unknown as Tool["input_schema"],
};

// ---------- 6.2 ATS score ----------

export const ATS_SYSTEM =
  "You are an ATS (applicant tracking system) auditor. Score this resume 0-100 on " +
  "ATS-friendliness across formatting, keyword presence, clarity, quantification, and structure. " +
  "Return a breakdown (each sub-score 0-100) and a list of specific, actionable fixes " +
  "(each ≤140 chars). Be strict but fair. Return via the `emit_ats_report` tool.";

export const ATS_TOOL: Tool = {
  name: "emit_ats_report",
  description: "Emit the ATS audit report.",
  input_schema: {
    type: "object",
    properties: {
      score: { type: "number", description: "Overall 0-100." },
      breakdown: {
        type: "object",
        properties: {
          formatting: { type: "number" },
          keywords: { type: "number" },
          clarity: { type: "number" },
          quantification: { type: "number" },
          structure: { type: "number" },
        },
        required: [
          "formatting",
          "keywords",
          "clarity",
          "quantification",
          "structure",
        ],
      },
      fixes: {
        type: "array",
        items: { type: "string" },
        description: "Specific, actionable fixes, each ≤140 chars.",
      },
    },
    required: ["score", "breakdown", "fixes"],
  } as unknown as Tool["input_schema"],
};

// ---------- 6.x Clean extracted job page → JobPosting ----------

export const JOB_CLEAN_SYSTEM =
  "You isolate a job posting from noisy extracted web-page text. Identify the job title, " +
  "company, location, and the job-description body. Strip navigation, cookie banners, " +
  "related-jobs, and other page noise. Keep the description faithful and complete " +
  "(responsibilities, requirements, qualifications). Use only what is present in the text; " +
  "if a field is genuinely absent, use an empty string. Return via the `emit_job` tool.";

export const JOB_TOOL: Tool = {
  name: "emit_job",
  description: "Emit the cleaned job posting.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      company: { type: "string" },
      location: { type: "string" },
      description: { type: "string" },
    },
    required: ["title", "company", "description"],
  } as unknown as Tool["input_schema"],
};

// ---------- 6.3 Generate package ----------

export const GENERATE_SYSTEM =
  "You are an expert career counselor and resume writer. Given a MASTER RESUME (the only " +
  "source of truth) and a JOB POSTING, produce a tailored application package.\n\n" +
  "Rules (non-negotiable):\n" +
  "- TRUTHFUL: use only facts present in the master resume. Never invent employers, titles, " +
  "dates, metrics, or skills. If a required skill is absent, honestly position adjacent " +
  "experience; you may note fast-ramp readiness, but do not claim the skill.\n" +
  "- REORDER experience and bullets by relevance to this role.\n" +
  "- HIGHLIGHT matching skills; weave in the posting's exact keywords/phrasing naturally.\n" +
  "- REWRITE the professional summary specifically for this role.\n" +
  "- QUANTIFY achievements wherever the master resume supports it (no fabricated numbers).\n" +
  "- ATS-OPTIMIZE: clean structure, standard section names, good keyword density.\n" +
  "- Cover letter: ~250-320 words, specific, confident, no clichés, no 'I am writing to apply'.\n" +
  "- Cold email: subject ≤9 words; body ≤140 words; direct; ends with a low-friction ask; " +
  "addresses the named recruiter/hiring manager if the posting provides one, else a neutral greeting.\n" +
  "- Match score: compute 0-100 fit, list matched and missing keywords, and 2-4 honest notes.\n" +
  "Return everything via the `emit_package` tool.";

export const GENERATE_TOOL: Tool = {
  name: "emit_package",
  description: "Emit the tailored application package.",
  input_schema: {
    type: "object",
    properties: {
      tailoredResume: masterResumeSchema,
      coverLetter: { type: "string" },
      coldEmail: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["subject", "body"],
      },
      matchScore: {
        type: "object",
        properties: {
          score: { type: "number" },
          matchedKeywords: { type: "array", items: { type: "string" } },
          missingKeywords: { type: "array", items: { type: "string" } },
          notes: { type: "array", items: { type: "string" } },
        },
        required: ["score", "matchedKeywords", "missingKeywords", "notes"],
      },
    },
    required: ["tailoredResume", "coverLetter", "coldEmail", "matchScore"],
  } as unknown as Tool["input_schema"],
};

export function generateUserContent(
  masterResume: unknown,
  jobPosting: unknown,
): string {
  return (
    `MASTER RESUME:\n${JSON.stringify(masterResume, null, 2)}\n\n` +
    `JOB POSTING:\n${JSON.stringify(jobPosting, null, 2)}`
  );
}
