# ApplyOne

**Tailor your résumé to any job, in one click.**

ApplyOne is a single-page web app that turns your résumé into an editable,
ATS-optimized master, scores it, and — for any job you point it at — generates a
bespoke tailored résumé, cover letter, and cold email, plus a per-job match
score with keyword-gap analysis.

It is built around one promise: **your data stays on your device.** The master
résumé, settings, and your application history live entirely in your browser via
IndexedDB. There is no database and no account. Your résumé only ever leaves the
browser as part of an API call to generate documents.

---

## How it works

1. **Upload** a PDF résumé (drag-and-drop, ≤ 10 MB).
2. **Parse** — the server extracts the text and Claude structures it into a typed,
   editable master résumé. Scanned/garbled PDFs fall back to Claude reading the
   PDF natively.
3. **Edit** anything inline. Changes autosave to IndexedDB and the **ATS score**
   re-computes (debounced).
4. **Target a job** — paste a job URL (extracted via Tavily → Jina Reader) or
   paste the description directly.
5. **Generate** — Claude streams back a tailored résumé, a cover letter, and a
   cold email, plus a match score with matched/missing keywords.
6. **Use** — copy any output, download the résumé as a clean ATS-friendly PDF, or
   save the whole package to your local history.

### Truthfulness

The generator may only use facts present in your master résumé. It reorders and
re-emphasizes to fit the role, but it never invents employers, dates, metrics, or
skills. Missing skills are positioned honestly against adjacent experience.

---

## Tech

- **Next.js** (App Router, TypeScript) · **Tailwind CSS** · **Framer Motion**
- **Claude** via `@anthropic-ai/sdk` — generation uses `claude-sonnet-4-6`
  (streamed); parsing / scoring / job-cleanup use `claude-haiku-4-5`. Models are
  centralized in [`lib/config.ts`](lib/config.ts) so they're swappable.
- **Tavily Extract** → **Jina Reader** → paste, for job-URL ingestion.
- **IndexedDB** (via `idb`) for all local persistence.
- **`@react-pdf/renderer`** for the ATS-friendly PDF export.
- All secrets stay server-side in Next.js Route Handlers — the browser never sees
  `ANTHROPIC_API_KEY` or `TAVILY_API_KEY`.

---

## Setup

Requires Node 18+ and [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env.local   # then fill in your keys
pnpm dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable            | Required | Notes                                                            |
| ------------------- | -------- | ---------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | yes      | Parsing, scoring, and generation. [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `TAVILY_API_KEY`    | yes\*    | Job-URL extraction. 1,000 free credits/month. [app.tavily.com](https://app.tavily.com/) |
| `JINA_API_KEY`      | no       | Jina Reader is keyless; a key only raises rate limits.           |

\* You can still use the app without Tavily by pasting job descriptions directly.

---

## Deploy to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Add `ANTHROPIC_API_KEY` and `TAVILY_API_KEY` under **Project → Settings →
   Environment Variables**.
3. Deploy. The default Next.js build settings work as-is.

---

## Cost notes

- **Claude:** each generation is one `claude-sonnet-4-6` call (~a few cents);
  parsing and each ATS re-score are cheaper `claude-haiku-4-5` calls. ATS scoring
  is debounced and cached in IndexedDB so editing doesn't re-bill on every refresh.
- **Tavily:** free tier is 1,000 credits/month (1 credit per ~5 URLs).

---

## A caveat about LinkedIn / Indeed

Some sites — notably **LinkedIn** and **Indeed** — aggressively block automated
page reading. If a URL extracts poorly, ApplyOne automatically opens the
**"Paste description"** box so you're never stuck. Paste the text and everything
downstream works identically.

---

## Privacy

Your résumé, edits, and saved applications are stored only in your browser's
IndexedDB. Clearing site data removes everything. The only network calls that
carry your content are the document-generation API calls described above.
