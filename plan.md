# Build Prompt — "ApplyOne": ATS Resume Tailoring Web App

> It is written to be executed end-to-end. Decisions are already made; follow them unless a section says "your call."

---

## 0. One-line summary

Build a clean, premium, **single-page web app** where a user uploads a PDF resume, gets
it parsed into an editable ATS-optimized master, sees an ATS score, then pastes any job
URL — the app extracts the job description and uses the **Claude API** to generate a
bespoke tailored resume, cover letter, and cold email, plus a per-job ATS match score.

## 1. Hard decisions (do not re-litigate)

- **Stack:** Next.js (App Router, TypeScript) + Tailwind CSS + Framer Motion. Deploy to Vercel.
- **Persistence:** **Local-only, no accounts.** Store the master resume, settings, and
  generated application history in the browser via **IndexedDB** (use `idb` or `Dexie`).
  No database, no auth. Data never leaves the browser except for the API calls described below.
- **Secrets stay server-side:** all Claude API and Tavily calls go through **Next.js Route
  Handlers** (`app/api/*`). The browser never sees `ANTHROPIC_API_KEY` or `TAVILY_API_KEY`.
- **ATS scope:** full — a master ATS score with fixes, **plus** a per-job match score with
  keyword-gap analysis on every generation.
- **Models:** generation = `claude-sonnet-4-6`; parsing/scoring/extraction-cleanup =
  `claude-haiku-4-5` (cheaper). Make the model a constant in one config file so it's swappable.
- **Anthropic SDK:** use `@anthropic-ai/sdk`. Use **streaming** for the generation route so
  output reveals progressively in the UI.

## 2. Core user flow (the whole app is one page)

1. **Land** → hero + a dropzone. Upload a PDF resume (or drag-drop).
2. **Parse** → server extracts text → Claude structures it into typed sections → render an
   **editable master resume** + an **ATS score card** with concrete fixes.
3. **Edit** → user can edit any field anytime; changes autosave to IndexedDB. ATS score
   re-computes (debounced).
4. **Target a job** → user pastes a **job URL** (or pastes the description text directly).
   App extracts the job description (Tavily → fallbacks).
5. **Generate** → Claude produces, streamed live: (a) tailored resume, (b) cover letter,
   (c) cold email to hiring manager, plus (d) a **per-job ATS match score + keyword gaps**.
6. **Use** → copy each output, download resume as clean ATS PDF, or save to history.
   Re-run with another URL anytime.

## 3. Feature spec

### 3.1 Resume upload & parse
- Dropzone accepts a single `.pdf` (≤10 MB). Show filename, size, and a remove button.
- **Text extraction:** primary = `pdfjs-dist` (or `pdf-parse`) on the server route to pull
  raw text. If extracted text is empty/garbled (scanned resume), **fall back** to sending the
  PDF as a base64 `document` content block to Claude (the Anthropic API reads PDFs natively).
- **Structuring:** pass the text to Claude (`claude-haiku-4-5`) with a JSON-schema prompt
  (see §6.1). Output a typed `MasterResume` object (§5). Persist to IndexedDB immediately.

### 3.2 Editable master resume
- Render structured sections: contact, summary, skills (grouped), experience (array of
  roles with bullet arrays), projects, education, certifications, keywords.
- Every field is inline-editable (contenteditable or controlled inputs). Bullet lists support
  add/remove/reorder (drag handle). **Autosave** to IndexedDB on change (debounce 600ms) with a
  subtle "Saved" pill.
- A "Re-upload / replace" affordance to start over.

### 3.3 Master ATS score
- Compute on parse and after edits (debounced). Use Claude (`claude-haiku-4-5`) returning
  structured JSON: `{ score: 0-100, breakdown: {formatting, keywords, clarity, quantification,
  structure}, fixes: string[] }`.
- Display as an animated radial/score card (count-up) + a checklist of fixes the user can tick.

### 3.4 Job URL ingestion (the Tavily piece — read carefully)
- Input: a text field for a **job URL** + a toggle/secondary "Paste description instead".
- **Extraction order (server route `app/api/extract-job`):**
  1. **Tavily Extract** (`POST https://api.tavily.com/extract`, `extract_depth: "advanced"`
     for JS-rendered pages). Cheap (1 credit / 5 URLs; 1,000 free credits/month).
  2. If Tavily returns thin/empty content, **fall back to Jina Reader**: `GET https://r.jina.ai/<url>`
     (zero-config, free tier, returns LLM-friendly text).
  3. If both fail (common for **LinkedIn / Indeed**, which are aggressively anti-bot), surface
     a friendly message and **auto-open the "Paste description" box**. This fallback must always
     be available — never let the user hit a dead end.
- After raw extraction, run a quick Claude (`claude-haiku-4-5`) pass to isolate just the
  **job title, company, location, and the job-description body** from page noise → typed
  `JobPosting` object (§5).
- Honesty note to keep in the UI copy: "Some sites (LinkedIn, Indeed) block automated reading —
  if extraction looks off, paste the description and we'll take it from there."

### 3.5 Generation (resume + cover letter + cold email)
- Server route `app/api/generate` takes `{ masterResume, jobPosting }`, calls Claude
  (`claude-sonnet-4-6`) **with streaming**, returns three artifacts + a match score.
- Use **tool/structured output** (a single `tool` with a JSON schema) so the result is reliably
  shaped: `{ tailoredResume: MasterResume-shape, coverLetter: string, coldEmail: {subject, body},
  matchScore: {score, matchedKeywords[], missingKeywords[], notes[]} }`. Stream the prose fields.
- Apply the tailoring rules in §6.3 verbatim. **Truthfulness is non-negotiable:** the model may
  only use facts present in the master resume; if a required skill is missing, position adjacent
  experience honestly — never invent employers, dates, or metrics.

### 3.6 Outputs & export
- Three result cards (Resume / Cover Letter / Cold Email), each with copy-to-clipboard.
- **Download tailored resume as PDF**: render with `@react-pdf/renderer` into a clean,
  single-column, selectable-text, ATS-friendly layout (no tables/columns/graphics that break
  parsers). Filename: `Resume_<Name>_<Company>.pdf`.
- "Save to history" stores the full application package (job + 3 docs + score) in IndexedDB;
  a History drawer lists past runs with re-open/copy/delete.

## 4. Single-page layout & states

One scrolling page with smooth section reveals (no route changes). Sections, top to bottom:

1. **Hero** — product name, one-line value prop, primary CTA scrolls to the dropzone.
2. **Upload / Master** — empty state = dropzone; filled state = editable resume + ATS score
   card side by side (stacked on mobile).
3. **Target a job** — URL field + paste fallback; shows extracted `JobPosting` summary chip
   once parsed.
4. **Results** — appears after generation: three artifact cards + match-score panel.
5. **History drawer** — slide-in from the right.
6. **Footer** — "Runs locally in your browser. Your resume never leaves your device except to
   generate documents." + GitHub link.

State machine (drive UI + animations off this): `idle → parsing → ready → extracting-job →
generating → results`. Always allow returning to `ready` to target another job.

## 5. Data model (TypeScript — put in `lib/types.ts`)

```ts
type Contact = { name: string; title?: string; email?: string; phone?: string;
  location?: string; links?: { label: string; url: string }[] };

type Role = { company: string; title: string; location?: string; start?: string;
  end?: string; bullets: string[] };

type Project = { name: string; url?: string; stack?: string; bullets: string[] };

type MasterResume = {
  contact: Contact;
  summary: string;
  skills: { group: string; items: string[] }[];
  experience: Role[];
  projects: Project[];
  education: { school: string; credential: string; year?: string }[];
  certifications: string[];
  keywords: string[];
};

type JobPosting = { url?: string; title: string; company: string;
  location?: string; description: string };

type MatchScore = { score: number; matchedKeywords: string[];
  missingKeywords: string[]; notes: string[] };

type ATSReport = { score: number;
  breakdown: { formatting: number; keywords: number; clarity: number;
    quantification: number; structure: number };
  fixes: string[] };

type ApplicationPackage = { id: string; createdAt: number; job: JobPosting;
  tailoredResume: MasterResume; coverLetter: string;
  coldEmail: { subject: string; body: string }; match: MatchScore };
```

## 6. Claude API — exact prompts & route behavior

Keep all prompts in `lib/prompts.ts`. Always set `system` separately from user content.
Use `max_tokens` generously (e.g. 4096) and `temperature` 0.4 for generation, 0 for parsing/scoring.

### 6.1 Parse PDF → MasterResume (`claude-haiku-4-5`, structured output)
> **System:** "You are a precise resume parser. Extract the resume into the provided JSON
> schema. Use only information present in the text. Do not invent, embellish, or infer facts.
> Preserve the candidate's wording for bullets; only normalize obvious formatting noise.
> Return via the `emit_resume` tool."
Provide the `MasterResume` JSON schema as a tool. User content = extracted text (or PDF document block).

### 6.2 ATS score (`claude-haiku-4-5`, structured output)
> **System:** "You are an ATS (applicant tracking system) auditor. Score this resume 0–100 on
> ATS-friendliness across formatting, keyword presence, clarity, quantification, and structure.
> Return a breakdown and a list of specific, actionable fixes (each ≤140 chars). Be strict but
> fair. Return via the `emit_ats_report` tool."

### 6.3 Generate package (`claude-sonnet-4-6`, streaming + structured output)
> **System:**
> "You are an expert career counselor and resume writer. Given a MASTER RESUME (the only source
> of truth) and a JOB POSTING, produce a tailored application package.
>
> Rules (non-negotiable):
> - TRUTHFUL: use only facts present in the master resume. Never invent employers, titles,
>   dates, metrics, or skills. If a required skill is absent, honestly position adjacent
>   experience; you may note fast-ramp readiness, but do not claim the skill.
> - REORDER experience and bullets by relevance to this role.
> - HIGHLIGHT matching skills; weave in the posting's exact keywords/phrasing naturally.
> - REWRITE the professional summary specifically for this role.
> - QUANTIFY achievements wherever the master resume supports it (no fabricated numbers).
> - ATS-OPTIMIZE: clean structure, standard section names, good keyword density.
> - Cover letter: ~250–320 words, specific, confident, no clichés, no 'I am writing to apply'.
> - Cold email: subject ≤9 words; body ≤140 words; direct; ends with a low-friction ask;
>   addresses the named recruiter/hiring manager if the posting provides one, else a neutral greeting.
> - Match score: compute 0–100 fit, list matched and missing keywords, and 2–4 honest notes.
> Return everything via the `emit_package` tool."
> **User:** `MASTER RESUME:\n<json>\n\nJOB POSTING:\n<json>`

Stream `coverLetter` and `coldEmail.body` token-by-token into the UI; fill structured fields on completion.

### 6.4 Route handlers
- `POST /api/parse-resume` → `{ text? | pdfBase64 }` → `MasterResume`
- `POST /api/ats-score` → `{ resume }` → `ATSReport`
- `POST /api/extract-job` → `{ url }` → `{ raw }` then clean → `JobPosting`
- `POST /api/generate` → `{ masterResume, jobPosting }` → streamed → `ApplicationPackage` minus id
Add request validation (zod), timeouts, and graceful error JSON `{ error, hint }`.

## 7. Design system — clean & premium

The vibe: **editorial, calm, confident** — think a high-end SaaS landing page, not a busy
dashboard. Lots of whitespace, one accent color, restrained motion, crisp type.

### 7.1 Color (CSS variables; support light default + optional dark)
```
--bg:        #FBFBF9   (warm off-white paper)
--surface:   #FFFFFF
--ink:       #14110F   (near-black, warm)
--ink-soft:  #5B5650
--line:      #ECE9E2   (hairline borders)
--accent:    #4F46E5   (electric indigo — the ONLY accent)
--accent-ink:#3730A3
--success:   #15803D
--warn:      #B45309
```
Dark mode (optional, behind a toggle): bg `#0C0B0A`, surface `#15130F`, ink `#F5F3EE`,
line `#26231D`, keep the same indigo accent.

### 7.2 Typography
- **Display/headlines:** a refined serif — **Fraunces** (or **Instrument Serif**) for the hero
  H1 and section titles. Gives the "premium editorial" feel.
- **UI/body:** **Inter** (or **Geist Sans**). Resume preview + code-ish chips: **Geist Mono**
  / `ui-monospace`.
- Scale: H1 clamp(2.5rem, 6vw, 4.5rem), tight leading (1.05) and slight negative tracking on
  the serif; body 16/1.6; labels 13px uppercase tracking-wide for section eyebrows.

### 7.3 Layout & components
- Max content width ~1100px, generous side padding; 8px spacing grid.
- Cards: `--surface`, 1px `--line` border, 16–20px radius, very soft shadow
  (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)`), 24–32px padding.
- Buttons: primary = solid indigo, white text, 12px radius, subtle scale-on-press;
  secondary = ghost with hairline border. Focus-visible rings (accessibility).
- Dropzone: large dashed `--line` border that turns indigo + faint tint on drag-over.
- ATS score: animated radial ring (SVG stroke-dashoffset) with a count-up number.
- Inputs: borderless-feel with a bottom hairline that animates to indigo on focus.
- Chips/tags for skills & keywords: pill, `--line` border; matched=green tint, missing=amber tint.

### 7.4 Animation spec (Framer Motion — tasteful, never gratuitous)
- **Page load:** hero text does a staggered fade+rise (`y: 12 → 0`, 0.5s, stagger 0.06).
- **Section reveal on scroll:** `whileInView` fade+rise, once, easeOut, small (16px) travel.
- **Dropzone:** spring scale 1→1.01 on drag-over; success = check-mark draw-in (SVG path).
- **Parsing/extracting/generating:** a slim top progress bar + a shimmer skeleton of the
  resume sections. Use a looping subtle gradient sweep, not a spinner.
- **Score count-up:** animate number 0→score over 0.8s with the ring filling in sync.
- **Tab/result transitions:** crossfade + 8px slide; `AnimatePresence` between states.
- **Streaming text:** new tokens fade in (opacity 0→1, 120ms) for a "typing" feel.
- **History drawer:** slide-in from right with spring; backdrop fade.
- Respect `prefers-reduced-motion`: disable travel/spring, keep instant opacity changes.
- Keep durations 150–500ms; one shared easing (`[0.22, 1, 0.36, 1]`). No bounce on UI chrome.

### 7.5 Micro-details that sell "premium"
- Hairline 1px dividers, not heavy borders. Generous line-height. Optical alignment of the
  hero. A faint paper-grain or subtle radial gradient behind the hero (very low opacity).
- Consistent 8px grid; never cramped. Empty states have a single calm illustration or icon,
  not clutter. Toasts are minimal pills, top-center, auto-dismiss.

## 8. Accessibility, performance, errors
- Semantic landmarks, labelled inputs, keyboard-navigable dropzone & drawer, visible focus.
- Color contrast ≥ WCAG AA. `prefers-reduced-motion` honored throughout.
- Stream responses so the UI feels instant; optimistic "Saved" states; debounce autosave/scoring.
- Every API route returns friendly `{ error, hint }`; UI shows a non-blocking toast + the
  paste-fallback where relevant. Never lose the user's edited resume on an API failure.

## 9. Env, setup, deploy
```
ANTHROPIC_API_KEY=...
TAVILY_API_KEY=...
# optional: JINA is keyless via r.jina.ai
```
- `.env.local` for dev; set the same in Vercel project settings. Add `.env.example`.
- `README.md`: what it is, local-only privacy note, setup, run (`pnpm dev`), deploy to Vercel,
  cost notes (Claude per-generation, Tavily 1k free credits/mo), and the LinkedIn/Indeed caveat.

## 10. Build order (milestones — ship each before the next)
1. Scaffold Next.js + Tailwind + Framer Motion + fonts + design tokens + the one-page shell.
2. Dropzone → `/api/parse-resume` → editable master resume in IndexedDB (autosave).
3. `/api/ats-score` → animated score card + fixes checklist.
4. `/api/extract-job` with Tavily → Jina → paste fallback → `JobPosting` chip.
5. `/api/generate` (streaming, structured) → three result cards + match-score panel.
6. PDF export (`@react-pdf/renderer`) + History drawer (IndexedDB).
7. Polish pass: animations, reduced-motion, empty/error states, mobile, dark mode (optional).

## 11. Acceptance criteria
- Upload a PDF → editable structured resume appears, persists across refresh (IndexedDB), edits autosave.
- Master ATS score renders with a number + breakdown + actionable fixes.
- Paste a typical job URL → description extracted (or clean paste fallback) → `JobPosting` shown.
- Generate → tailored resume + cover letter + cold email stream in, plus a per-job match score
  with matched/missing keywords. Outputs are copyable; resume downloads as a clean ATS PDF.
- No API keys exposed to the client. No backend DB. Works fully from a fresh browser with no login.
- Looks premium: serif display headers, single indigo accent, whitespace-rich, tasteful motion,
  reduced-motion respected. Mobile responsive.

## 12. Nice-to-haves (only if time remains; don't block v1)
- Diff view: highlight what changed between master and tailored resume.
- Multiple master variants (e.g. "FDE", "Product") the user can pick before generating.
- Tone selector for cover letter (formal ↔ builder-casual).
- Export the whole package as a `.zip`.
```
```
```

---

### Appendix — Tavily call shape (for reference)
```
POST https://api.tavily.com/extract
Authorization: Bearer $TAVILY_API_KEY
{ "urls": ["<job-url>"], "extract_depth": "advanced", "format": "markdown" }
→ { "results": [ { "url": "...", "raw_content": "..." } ], "failed_results": [...] }
```
Jina fallback: `GET https://r.jina.ai/<job-url>` → returns markdown text (optionally send
`x-respond-with: markdown`). Treat <~400 chars of body as "thin" → escalate to next fallback.
