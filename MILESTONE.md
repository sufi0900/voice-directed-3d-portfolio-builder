# Milestone 10.1 — Storage policy correction

## Completed

1. Headshot upserts now have the Supabase Storage `SELECT`, `INSERT`, `UPDATE` and `DELETE` policies required for owner-folder replacements.
2. Storage policies use the authenticated JWT subject and path ownership rather than mutable object ownership metadata.
3. Media migrations are idempotent and can safely replace the original V10 policies.
4. Upload failures now identify the exact recovery migration instead of exposing the raw PostgreSQL RLS error.

## V10 capability retained

1. The voice assistant can edit Hero, About, Skills, Experience, Education, Projects, Contact, section structure, design and the 3D scene.
2. Every voice mutation uses the same validated commands, revisions, undo/redo and cloud autosave as manual controls.
3. Raw narrative copy can be refined through a server-only OpenAI Responses request with `store: false` before the validated command is applied.
4. AI refinement is fact-preserving: it is instructed not to add metrics, employers, dates, credentials, achievements or skills.
5. Guided Creation includes optional comma-separated skills and line-separated education credentials.
6. Approved CV skills and education facts populate the same portfolio fields, keeping onboarding sources synchronized.
7. Education has complete manual and voice add, update and remove controls and renders with the professional journey.
8. Owners can upload a validated JPG, PNG or WebP headshot up to 3 MB into an owner-scoped Supabase Storage path.
9. The About section renders uploaded headshots with responsive cropping, alignment, spacing and mobile layout.
10. Studio preview uses the headshot as its favicon, with an initial-based fallback; published metadata uses the published headshot.
11. Public navigation identifies the portfolio owner by initials and name, exposes section navigation and removes editor/publishing labels.
12. Legacy V9 documents receive default education and media fields without losing existing content.

## V9 foundation retained

1. V8.2 preserves authenticated state in every saved-project Studio and replaces the incorrect Sign In action with My Projects plus an account indicator.
2. My Projects provides a direct Home navigation path while preserving sign-out and account context.
3. The validated document now includes ordered, visibility-controlled About, Experience, Skills, Projects and Contact sections.
4. Existing V1–V8 documents are upgraded automatically through schema defaults; no SQL migration is required.
5. Every new content mutation uses the same typed command bus, revision history, undo/redo, autosave and immutable publication boundaries.
6. Owners can add, edit and remove repeatable experience and project records within safe limits.
7. Owners can reorder or hide page sections without deleting their content.
8. Studio preview and public snapshots render the same reusable section components and anchored navigation.
9. Empty draft collections have editor guidance while empty public collections remain hidden.
10. Responsive layouts cover navigation, section headings, capability cards, experience timelines, project cards and contact calls to action.

## Earlier foundation retained

1. A strict `SiteDocument` schema is the single source of truth.
2. Manual controls dispatch typed commands rather than modifying components directly.
3. Voice function tools dispatch the same commands with the source recorded as `voice`.
4. Every valid change creates a revision and can be undone or redone.
5. The current site document persists locally and safely falls back if stored data is invalid.
6. `OrbitalShowcase` is reusable and controlled entirely through document parameters.
7. The scene supports approved palettes, presets, motion modes, intensity and skill focus.
8. Reduced-motion preferences and WebGL rendering failures have fallback behavior.
9. AssemblyAI uses a server-only key and single-use browser token.
10. Voice capture, spoken responses, transcripts, interruption, stop and client-side tools are connected.
11. Cleanly ended AssemblyAI sessions are submitted for provider-side deletion.
12. TypeScript, ESLint, seven unit tests and the production build pass.
13. Email accounts and session refresh are integrated through Supabase Auth.
14. Projects and immutable revisions persist in PostgreSQL under owner-only RLS policies.
15. Guided Creation and Choose a Template both produce the same validated document type.
16. Three curated 3D foundations and one restrained 2D foundation are available.
17. Saved projects reopen in the existing manual and voice editor.
18. Optimistic revision checks prevent an older tab from silently overwriting newer work.
19. Authenticated users can upload PDF, DOCX, or TXT CVs up to 5 MB.
20. CV files are parsed in memory and the original file is not persisted.
21. Deterministic extraction proposes identity, role, summary and skill candidates without inventing missing facts.
22. Every candidate remains unapproved until the user checks it and may be corrected before approval.
23. Guided Creation uses only approved CV facts and preserves their source excerpts in the saved document.
24. Invalid, oversized, disguised, or unreadable documents fail safely.
25. TypeScript, ESLint, twelve unit tests and the production build pass.
26. OpenAI-enhanced extraction is an explicit user choice and runs only on the server.
27. PDF inputs include page imagery so the model can interpret visual hierarchy and multi-column layouts.
28. Structured Outputs constrain AI results to supported fact types, confidence and source excerpts.
29. Locally extracted text is used to reject ungrounded AI excerpts before candidates reach the browser.
30. AI and deterministic candidates are reconciled without duplicating singleton identity fields.
31. Missing keys, timeouts, rate limits, provider errors, invalid output and ungrounded output recover automatically to local extraction.
32. Scanned PDFs can recover through visual extraction, with low-confidence facts requiring human approval.
33. The UI states which extraction path completed and never pre-approves a model-generated fact.
34. TypeScript, ESLint and the production build pass.
35. Text fields preserve spaces while editing and commit only on blur or after five idle seconds.
36. Duplicate text commits are ignored, preventing one revision per keystroke.
37. Featured skills can be added, renamed, leveled and removed within safe bounds.
38. Project names are required during creation and can be renamed from the dashboard.
39. AI fallback notices identify configuration, authentication, quota, model/request, timeout and response failures.
40. Text-based CVs use a faster semantic-analysis path; scanned CVs retain visual file recovery.
41. Alternate summary headings such as Career Profile, Professional Overview and Introduction are supported locally.
42. Typography, focus states and extraction progress feedback have been upgraded site-wide.
43. Nineteen automated tests pass across commands, CV ingestion, AI recovery, templates and voice tools.
44. AI CV analysis uses low reasoning effort, bounded output, reduced input context and configurable 60/90-second processing limits.
45. Guided Creation now includes a five-turn design interview covering goal, audience, tone, motion and emphasis.
46. Every interview must be complete before project creation and is validated again on the server.
47. Interview answers configure only governed presentation fields and never rewrite CV-grounded professional claims.
48. Approved CV fact count and safety boundaries remain visible throughout the interview.
49. Interview progress, previous/next navigation and direct question navigation are keyboard accessible.
50. The completed interview is stored in the validated document so its starting rationale remains recoverable.
51. Owners can publish only a fully saved server revision through an explicit confirmation dialog.
52. Every publication stores an immutable document snapshot and its exact revision number.
53. Later Studio edits remain private drafts until the owner publishes again.
54. Public portfolios render at `/p/[slug]` without exposing editor controls or owner data.
55. Live slugs are unique, validated and protected against unsafe URL characters.
56. Republishing supersedes the previous snapshot without mutating its historical record.
57. Owners can copy the public URL, inspect the live revision and unpublish safely.
58. Anonymous database access is restricted to live publication snapshots under RLS.
59. Studio provides a visual, owner-only timeline of the latest fifty immutable revisions.
60. Every history entry shows its source, timestamp, identity, visual system, scene mode and skill count.
61. Current and publicly live revisions are clearly distinguished in the timeline.
62. Restoring copies the selected snapshot into a new latest revision rather than deleting later work.
63. Restore requests require the exact current server revision and reject cross-tab conflicts.
64. Restoration does not alter the public portfolio until the owner explicitly republishes.
65. Revision responses expose compact presentation summaries without returning stored CV provenance.
66. Anonymous visitors can customize the homepage demo before authentication.
67. Save and publish routes guest drafts through authentication and a validated cloud-claim step.
68. Authenticated visitors with existing projects open their latest project directly from the homepage.
69. Authenticated visitors can reach My Projects from the homepage and Studio header.
70. Project cards separate Edit Studio, View Live and Rename actions and show the exact published slug and revision.
71. Post-authentication destinations are allowlisted as internal paths to prevent open redirects.
72. Voxfolio now provides a generated application icon and installable web manifest through Next.js metadata conventions.
73. The committed roadmap formalizes major/sub-version acceptance rules and now records five remaining milestones after V10.

## Manual verification requiring the owner’s environment

- Add the real AssemblyAI key to `.env.local`.
- Grant microphone permission in Chrome or Edge on localhost.
- Run each command in the README and confirm spoken output, visible transcript and scene change.
- Confirm the session disappears from the AssemblyAI session list after ending cleanly.
- Upload one real PDF or DOCX CV through Guided Creation.
- Correct and approve selected candidates, create a project, and confirm they persist after reload.
- Confirm an unchecked candidate does not enter the created portfolio.
- Add `OPENAI_API_KEY` locally, enable AI-enhanced extraction and test at least three visually different CV templates.
- Temporarily use an invalid OpenAI key and confirm the same upload recovers to local extraction with a visible notice.

## V10 owner acceptance gate

- Run `004_portfolio_media.sql`, upload a headshot and verify it survives reload and publication.
- Confirm Studio and published browser tabs use the headshot or initial-based favicon.
- Use voice to edit every section type, then test undo and revision restore.
- Dictate rough About and Introduction copy and confirm OpenAI improves wording without adding facts.
- Create a new project with optional skills and education and confirm both appear in Studio and the published page.
- Confirm the public header shows owner identity and navigation with no Publish Portfolio/editor wording.
- Record corrections as V10.1/V10.2; begin V11 only after this gate passes.
