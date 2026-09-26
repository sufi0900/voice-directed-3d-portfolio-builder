> **V26 cumulative update:** read [RELEASE_V26.md](RELEASE_V26.md) for required migration 016, setup, changes and manual acceptance tests. Implementation details: [V26_ARCHITECTURE.md](V26_ARCHITECTURE.md). Earlier milestones below are historical.

# Voice-Directed 3D Portfolio Builder

For V24.2 setup, migration 015 and the manual test checklist, read [RELEASE_V24_2.md](RELEASE_V24_2.md) before enabling persistent Visitor Vox knowledge.

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
- Authenticated Studio identity and direct Home/My Projects navigation
- Full About, Experience, Skills, Projects and Contact section model
- Section ordering, visibility and shared Studio/public rendering
- Voice editing parity across every portfolio content section
- Fact-preserving OpenAI copy refinement for raw narrative input
- Optional skills and education during Guided Creation
- Owner-scoped headshot uploads, responsive About media and dynamic favicons
- Identity-led public navigation without editor or publishing controls
- Expanded project case studies with role, period, challenge, approach and outcome fields
- Reusable, accessible project media library with owner-scoped uploads
- Ordered project galleries and project-card cover imagery
- Public case-study routes at `/p/[slug]/projects/[project-slug]`
- Case-study metadata and social preview imagery derived from immutable publication snapshots
- Private custom-page and blog-post drafts with explicit publication status
- Structured heading, paragraph, quote, list and reusable-image blocks
- Editable public slugs, navigation labels, excerpts, tags and SEO metadata
- Immutable public page, blog-index and article routes
- Voice-assisted page/post drafting without voice publication authority
- Direct in-context image uploads with editable alternative text
- Safe rich-text formatting, hyperlinks, bullet lists and numbered lists
- Section-aware live previews and flexible resizable Studio panels
- Dedicated public Projects index and concise four-card homepage showcase
- Viewport-bounded Studio canvas with synchronized homepage and standalone-page navigation
- Deterministic container-relative section routing without standalone-preview flicker
- Inline block insertion, drag/long-press reordering and semantic H2–H6 headings
- Live SEO guidance with search-result and canonical-path previews
- Performance-safe cinematic depth across homepage sections and standalone content
- Five content-preserving reusable portfolio templates, including the non-orbital Kinetic Gallery and bright Velocity Atelier
- Orbital Showcase, Constellation Field, Kinetic Gallery and Velocity Roadster 3D scene families
- Responsive desktop-expanded editor and adaptive media gallery
- Voice/text assistant navigation that focuses the matching Studio editor and Live Canvas section
- Gemini-first intent planning and fact-preserving copy refinement with OpenAI recovery
- Paste-friendly assistant chat, automatic transcript following and optional interaction sounds

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
OPENAI_CONTENT_MODEL=gpt-5-mini
GEMINI_API_KEY=your_private_gemini_key
GEMINI_CONTENT_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
NEBIUS_API_KEY=your_private_nebius_key
NEBIUS_MODEL=the_exact_model_id_from_your_nebius_account
OPENROUTER_API_KEY=your_private_openrouter_key
OPENROUTER_MODEL=the_exact_model_slug_you_enabled
OPENAI_CV_TIMEOUT_MS=60000
```

`GEMINI_FALLBACK_MODEL` is used after bounded retries for retryable Gemini failures. `OPENAI_API_KEY` is an optional second-provider fallback for assistant planning and writing refinement. Navigation, undo, exact-text replacement, skill addition, and complete social-link addition are local deterministic commands and remain available without either writing provider. Gemini HTTP 429 indicates a project rate/quota condition; HTTP 503 is treated as temporary provider unavailability. Assistant conversation history is stored per project in the browser so a recoverable provider failure does not clear the chat.

Create a Supabase project, then run the SQL files in order: `supabase/migrations/001_projects.sql` through `009_professional_memory_agent_events.sql`. If you have already applied `001`–`008`, run only `009_professional_memory_agent_events.sql` before deploying V21. It creates private owner-approved memory and metadata-only agent events. The new model keys are optional and server-only: supply both key and exact model ID for each chosen provider. The planner tries configured Nebius, OpenRouter, Gemini, then OpenAI. AssemblyAI continues to power the live spoken session; the gateway handles typed planning, opportunity planning, and both spoken and typed copy refinement. Published media URLs are intentionally public. Drafts and revision history remain owner-only. Never expose a service-role key.

Routes: `/` is the no-account demo, `/start` offers both creation paths, `/login` handles accounts, `/projects` lists saved work, and `/studio/[projectId]` opens the cloud-saved editor.
The homepage is lifecycle-aware: guests receive an editable local demo and authenticate only when choosing Save & publish; signed-in owners with projects open their latest cloud project directly. `/claim` validates and moves a guest draft into private cloud storage before publishing. `/projects` exposes separate editing and live-portfolio actions. V12 adds governed custom pages and blog publishing; older documents receive compatible defaults. See `ROADMAP.md` for the completed milestone history and major/sub-version rules.

To create standalone content, open Studio → Content → Site pages. Use this area for long-form pages such as a detailed About page, Services, Process or Resources. Open Blog posts for articles; published articles are collected automatically on one Blog page and never become individual navigation tabs. Add an item, set its slug and metadata, then assemble typed content blocks. The item title is its only H1; structured headings support H2 through H6. Paragraphs, quotes and list items support safe inline formatting. Use the inline plus control after any block to insert content at that exact position. Reorder blocks by desktop drag, touch/pen long-press, or the accessible arrow controls. Images can be uploaded directly inside the cover or image block without completing alternative text first. Voxfolio derives a temporary accessible label from the filename, and the owner can replace it immediately in the visible Alt text field.

An item becomes publicly accessible only after two explicit actions: include the Site Page or Blog Post in the next publication, then use the main Publish control to create a new immutable portfolio release. Included Site Pages appear in public navigation at `/p/[portfolio-slug]/pages/[page-slug]`; a page using the `about` slug is also linked from the homepage About section. Included articles are collected at `/p/[portfolio-slug]/blog`, and projects are collected at `/p/[portfolio-slug]/projects`. Public routes always read the immutable release snapshot, so later drafts remain private. Voice can help draft or edit text blocks, but only the owner-facing interface can upload images or change publication status.

The Studio live canvas has its own bounded scrollbar. Selecting Hero, About, Experience, Education, Skills, Projects or Contact targets the exact section inside that canvas and leaves the corresponding editor controls visible. Opening a Site Page or Blog Post swaps the canvas to that standalone draft without a homepage flash; use **Back to homepage preview** or select any homepage section from the Editing menu to restore and position the homepage canvas. If an About Site Page exists, the homepage preview exposes **Preview detailed About**, while the published homepage exposes **Read full profile** after that page is included and the portfolio is republished.

V12.4 adds cinematic depth to non-Hero content using GPU-light CSS layers rather than creating a separate WebGL canvas for every section. This preserves the existing Hero scene, mobile responsiveness, reduced-motion preferences and WebGL fallback while avoiding multiple graphics contexts and unnecessary battery use.

V13 separates portfolio content from presentation. Open Design to switch between Cinematic Orbit, Architectural Grid and Editorial Depth; identity, sections, case studies, media, pages and posts remain intact. Open 3D Scene to choose Orbital Showcase or Constellation Field independently. Only one scene canvas is mounted at a time. Expanding the Content editor now activates a bounded desktop workspace with larger media, multi-column forms and an adaptive Media Library rather than stretching the sidebar controls.

V14 turns that foundation into a release-gated workspace. Expanded editing is editor-only, Preview mode removes all layout customization handles, homepage structure supports exact drag/long-press ordering, voice can request the same validated placement, and template selection includes a responsive preview. Production discovery metadata, security headers and a bundle-budget check are included; run the complete acceptance commands in `MILESTONE.md` before deployment.

V15 completes the publishing experience. Article-level Publish and Draft controls synchronize the immutable portfolio snapshot without a second top-level action, while a visible readiness checklist enforces complete article metadata and content. Studio and public navigation expose one Blog listing rather than one tab per article. Contact social profiles are governed, revisioned, voice-editable and rendered as accessible icons.

V16 adds Kinetic Gallery: a content-preserving, non-orbital cinematic template. Its central illuminated monolith and suspended skill panels use pointer-responsive depth instead of orbital controls. It is selectable during creation, in Studio Design, or through the allowlisted voice command, while reduced-motion and static WebGL fallback remain available.

V18 adds Velocity Atelier, a daylight automotive presentation built around a recognizable cinematic roadster rather than a labeled skills object. The vehicle sits in a warm architectural studio with moving roadway marks, rotating wheels, suspension motion, pointer-responsive lighting and a static fallback. Portfolio identity is presented in an editorial showroom card and the full content system continues below in a light theme. Aurora Archive is removed from the V18 selectable contract. Template and voice selection still preserve governed content and publication state.

To create a case study, open Studio → Content → Projects, complete the project narrative fields and use a unique slug. Upload images once in Content → Media library, then attach them to one or more projects. The first selected image becomes the project-card and case-study cover. Removing an item from the document library removes its references but retains the underlying Storage object for revision and publication recovery; automated retention cleanup is scheduled for the production-readiness milestone.

In Guided Creation, an authenticated user may optionally upload a PDF, DOCX or TXT CV up to 5 MB. Extraction proposes reviewable identity, role, summary, skill, education and experience facts. Candidates are unapproved by default; only checked facts are saved, together with a short source excerpt. The original CV is processed in memory and is not retained by Voxfolio. A five-turn interview then captures the portfolio goal, primary audience, visual tone, motion preference and presentation emphasis. Those answers configure only allowlisted design fields; they never rewrite professional claims.

AI-enhanced extraction is opt-in. When enabled, the server sends extracted CV text to the OpenAI Responses API with `store: false` for the fast path, requests schema-constrained facts, rejects facts whose excerpts are not grounded in locally extracted text, and merges missing fields from the deterministic parser. Scanned or image-only documents use file input as a visual recovery path. A timeout, incomplete response, API error, rate limit, missing key, invalid JSON or ungrounded response automatically returns safe local candidates instead of failing the upload, with a specific diagnostic shown in the interface. The structured-output budget leaves room for both model reasoning and the complete evidence-backed JSON result.

If AI extraction falls back, read the visible notice: it distinguishes a missing key, rejected key, exhausted/rate-limited quota, unsupported model/request, timeout, invalid structured response, ungrounded result, and provider connectivity. `OPENAI_CV_TIMEOUT_MS` defaults to 60 seconds for text-based CV analysis and may be set between 15,000 and 120,000 milliseconds; scanned documents receive a 90-second default. After changing `.env.local`, stop and restart `pnpm dev`; Next.js does not reliably reload server secrets into an already-running process.

Open `http://localhost:3000` in Chrome or Edge. Microphone access requires HTTPS or localhost.

Never prefix private AssemblyAI, Gemini or OpenAI keys with `NEXT_PUBLIC_`, commit `.env.local`, or paste any key into client code.

V19 makes Vox a synchronized multimodal editing assistant. Spoken and typed requests share the same allowlisted tools and validated command bus. Explicit navigation requests move both the Content editor and bounded Live Canvas; successful edits focus their affected section automatically. Gemini plans typed requests and is the primary fact-preserving copy refiner, while the existing OpenAI refinement path remains a recovery provider when configured. The transcript follows new messages automatically, pasted URLs are supported in text chat, and accessible sound cues can be muted from the assistant header. Keep `GEMINI_API_KEY` server-only and restart the dev server after changing it.

V19.2 completes the real-time conversation and publication state model. Vox now renders a visible listening/responding indicator, replaces the user's live utterance as AssemblyAI sends `transcript.user.delta`, and appends agent words from `transcript.agent.delta` in sync with speech. Typed replies reveal progressively as well. Individual pages and articles are compared with the immutable live snapshot, so editing a published item immediately marks it as having pending changes and re-enables **Publish changes**. The main Publish dialog now queues behind autosave and publishes the complete latest portfolio snapshot instead of blocking indefinitely on an unsaved draft.

V20 introduces opportunity variants for AI-native independent builders and makers. A canonical portfolio remains the approved evidence source. From **My projects**, create an Opportunity version with a title, audience and brief; Voxfolio creates a separate cloud project at revision zero, records its source revision, and lets the owner choose which existing case studies to feature. Variants have their own Studio, revision history, voice/text controls, publication state and public URL. They never automatically rewrite or silently refresh the canonical portfolio. Non-public variants emit `noindex`; signed/private sharing is a later hardening milestone.

## Voice commands to test

- “Switch the accent to violet.”
- “Give the portfolio a dark ink background.”
- “Center the hero section.”
- “Make the orbital scene more dynamic.”
- “Use the architect scene.”
- “Focus on AI automation.”
- “Update the Voxfolio project outcome to: A revision-safe portfolio publishing workflow.”
- “Move the Voxfolio project up.”
- “Change my introduction to: I build accessible AI-powered digital products.”
- “Undo that change.”
- “Go to the About section.”
- “Improve my introduction using these facts: …”
- Type “Add my TikTok profile” and paste the full URL when Vox asks for it.

Voice can update and reorder factual case-study content and draft structured pages or posts, but it is intentionally unable to publish, upload assets, execute arbitrary code or invent professional facts.

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
