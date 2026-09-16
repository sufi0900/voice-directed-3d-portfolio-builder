# Voice-Directed 3D Portfolio Builder

An implementation-ready portfolio builder in which authenticated cloud projects, manual editing, and AssemblyAI voice tools use the same validated, reversible command pipeline.

## Included in this milestone

- Next.js App Router and strict TypeScript
- Versioned, schema-validated portfolio document
- Manual content, design and 3D scene controls
- Shared command bus with bounded tokens and validation
- Undo, redo and browser persistence
- Reusable React Three Fiber `OrbitalShowcase` scene
- Three scene presets, three motion modes and four colour systems
- Clickable 3D skill nodes
- Reduced-motion and WebGL error fallback
- AssemblyAI Voice Agent browser integration
- Single-use temporary tokens issued server-side
- Live user/agent transcript and spoken output
- Client-side voice tools mapped into the command bus
- Explicit end-session control and interruption cleanup
- Automatic provider-session soft deletion after a clean call ends
- Unit tests for validation and reversible commands
- Supabase email authentication and PostgreSQL project storage
- Guided Creation and Choose a Template entry paths
- Owner-only row-level security and immutable project revisions
- Optimistic revision protection against cross-tab overwrites
- Governed PDF, DOCX and TXT CV ingestion
- Explicit candidate review and approval before CV facts enter a portfolio
- Saved fact provenance without retaining the original CV file
- Optional OpenAI layout-aware CV extraction with strict structured output
- Grounding validation, timeout protection and automatic local-parser recovery
- Buffered studio text editing with five-second idle commits
- Editable featured skills and project names
- Accessible loading feedback and a site-wide readability pass
- Actionable AI fallback diagnostics for keys, quota, models and timeouts
- Five-turn CV-grounded design interview with governed goal, audience, tone, motion and emphasis decisions
- Immutable publication snapshots and public `/p/[slug]` portfolio routes
- Visual revision timeline with non-destructive restore controls
- Session-aware homepage, guest-draft claiming and publication-aware project dashboard

## Setup

Requirements: Node.js 20.9+ and pnpm.

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Add your private key to `.env.local`:

```dotenv
ASSEMBLYAI_API_KEY=your_private_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_anon_key
OPENAI_API_KEY=your_private_openai_key
OPENAI_CV_MODEL=gpt-5-mini
OPENAI_CV_TIMEOUT_MS=60000
```

Create a Supabase project, then run the SQL files in order: `supabase/migrations/001_projects.sql`, `002_publications.sql`, and `003_revision_restore.sql`. Existing Milestone 7 installations only need to run `003_revision_restore.sql`. The anonymous key is safe to expose only because the migrations enable row-level security: drafts and revision history remain owner-only and anonymous visitors can select only live publication snapshots. Never expose a service-role key.

Routes: `/` is the no-account demo, `/start` offers both creation paths, `/login` handles accounts, `/projects` lists saved work, and `/studio/[projectId]` opens the cloud-saved editor.
The homepage is lifecycle-aware: guests receive an editable local demo and authenticate only when choosing Save & publish; signed-in owners with projects open their latest cloud project directly. `/claim` validates and moves a guest draft into private cloud storage before publishing. `/projects` exposes separate editing and live-portfolio actions. See `ROADMAP.md` for the V9–V15 delivery plan and major/sub-version rules.

In Guided Creation, an authenticated user may optionally upload a PDF, DOCX or TXT CV up to 5 MB. Extraction proposes reviewable identity, role, summary, skill, education and experience facts. Candidates are unapproved by default; only checked facts are saved, together with a short source excerpt. The original CV is processed in memory and is not retained by Voxfolio. A five-turn interview then captures the portfolio goal, primary audience, visual tone, motion preference and presentation emphasis. Those answers configure only allowlisted design fields; they never rewrite professional claims.

AI-enhanced extraction is opt-in. When enabled, the server sends extracted CV text to the OpenAI Responses API with `store: false` for the fast path, requests schema-constrained facts, rejects facts whose excerpts are not grounded in locally extracted text, and merges missing fields from the deterministic parser. Scanned or image-only documents use file input as a visual recovery path. A timeout, incomplete response, API error, rate limit, missing key, invalid JSON or ungrounded response automatically returns safe local candidates instead of failing the upload, with a specific diagnostic shown in the interface. The structured-output budget leaves room for both model reasoning and the complete evidence-backed JSON result.

If AI extraction falls back, read the visible notice: it distinguishes a missing key, rejected key, exhausted/rate-limited quota, unsupported model/request, timeout, invalid structured response, ungrounded result, and provider connectivity. `OPENAI_CV_TIMEOUT_MS` defaults to 60 seconds for text-based CV analysis and may be set between 15,000 and 120,000 milliseconds; scanned documents receive a 90-second default. After changing `.env.local`, stop and restart `pnpm dev`; Next.js does not reliably reload server secrets into an already-running process.

Open `http://localhost:3000` in Chrome or Edge. Microphone access requires HTTPS or localhost.

Never prefix private AssemblyAI or OpenAI keys with `NEXT_PUBLIC_`, commit `.env.local`, or paste either key into client code.

## Voice commands to test

- “Switch the accent to violet.”
- “Give the portfolio a dark ink background.”
- “Center the hero section.”
- “Make the orbital scene more dynamic.”
- “Use the architect scene.”
- “Focus on AI automation.”
- “Change my introduction to: I build accessible AI-powered digital products.”
- “Undo that change.”

Voice is intentionally unable to publish, delete projects, upload assets, execute arbitrary code or invent professional facts.

## Verification

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Architectural invariant

Every visible change is a typed command applied to a validated site document. Manual controls and voice tools cannot directly modify the Three.js scene, DOM or generated source code. Authentication, server persistence, governed CV ingestion, recovery-safe AI extraction, the design interview, immutable publishing and non-destructive revision restoration are active. Publishing snapshots a saved revision; subsequent edits and restored drafts stay private until explicitly republished.

## AssemblyAI integration notes

The server mints a single-use token immediately before each connection. The browser sends 24 kHz PCM produced by an AudioWorklet, receives transcripts and synthesized PCM audio, runs allowlisted client-side tools, and returns `tool.result` only at a safe turn boundary. Ending a session sends `session.end` before closing to avoid the billable resume grace period. After `session.ended`, the app asks its server to soft-delete the AssemblyAI session. If the network or browser terminates before that request completes, deletion cannot be guaranteed; production must add a scheduled server-side cleanup job.
