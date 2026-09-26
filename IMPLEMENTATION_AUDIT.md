> **V26 cumulative update:** read [RELEASE_V26.md](RELEASE_V26.md) for required migration 016, setup, changes and manual acceptance tests. Implementation details: [V26_ARCHITECTURE.md](V26_ARCHITECTURE.md). Earlier milestones below are historical.

# Voxfolio Implementation Audit (Post-V20.1)

> Historical OpenCode snapshot. Its failing-test counts and missing V20.2 items describe the state **before** V20.2 remediation. Read `V20_2_RELEASE_NOTES.md` for current implementation and verification. V20.3 and V21 remain pending.

**Date:** 2026-09-23  
**Baseline Version:** V20.1 (voice-directed-3d-portfolio-builder)  
**Purpose:** Document actual current state vs. requirements for V20.2–V21

---

## 1. Repository Overview

### Working Directory
```
C:\Users\sufia\Downloads\Ai Assembly\voice-directed-3d-portfolio-builder
```

### Tech Stack Verified
- Next.js 15.5.2 (App Router)
- React 19.1.1, TypeScript 5.9.2
- pnpm 11.19.0, Vitest 3.2.4, ESLint 9.35.0
- Supabase (SSR, RLS, Storage)
- AssemblyAI (streaming voice), Gemini 3.8 Flash, OpenAI fallback
- Three.js / React Three Fiber (Orbital, Constellation, Kinetic, Velocity scenes)

---

## 2. Existing Baseline Features (Verified)

| Feature | Status | Notes |
|---------|--------|-------|
| **SiteDocument** (Zod schema v1) | ✅ | `src/domain/site-document.ts` – single source of truth |
| **SiteCommand** (allowlisted, discriminated union) | ✅ | `src/domain/commands.ts` – 50+ command types |
| **Command bus + undo/redo** | ✅ | `studio-reducer.ts` – 30 history depth |
| **Revision history + restore** | ✅ | `project_revisions` table + RPC `save_project` |
| **Immutable publication snapshots** | ✅ | `project_publications` table + RPC `publish_project` |
| **Supabase auth + RLS** | ✅ | Owner isolation enforced at DB level |
| **AssemblyAI streaming voice** | ✅ | Single-use tokens, AudioWorklet PCM, tool calls |
| **Gemini intent planning + copy refinement** | ✅ | Server-side `/api/assistant/chat`, `/api/content/polish` |
| **OpenAI fallback (CV + content)** | ✅ | Automatic on Gemini failure |
| **Deterministic local commands** | ✅ | `local-assistant.ts` – nav, undo, exact-text, skills, socials |
| **Studio (bounded Live Canvas, responsive)** | ✅ | `portfolio-studio.tsx` – 3-panel editor |
| **5 cinematic templates + 4 scene families** | ✅ | Orbital, Constellation, Kinetic, Velocity |
| **Canonical portfolio + opportunity variants (V20)** | ✅ | `opportunity-variant.ts`, migration `006` |
| **V20.1: Source snapshot + review checklist** | ✅ | `opportunity-review.ts`, `OpportunityEditor` |
| **Public routes (`/p/[slug]`, case studies, blog, pages)** | ✅ | Read from immutable snapshots only |
| **SEO basics (OG, Person schema, canonical URL)** | ✅ | `generateMetadata` on public routes |
| **Reduced-motion / WebGL fallback** | ✅ | Scene renderer respects preference |

---

## 3. Test Baseline (Current)

```
Test Files: 19
Tests:      114 total, 108 passing, 6 FAILING
Failures:   All in `src/domain/opportunity-variant.test.ts` (6/9)
```

### Failing Tests Analysis

| Test | Issue | Root Cause |
|------|-------|------------|
| `builds an independent variant...` | Expected `confidentiality`, `name`, `type`, `variantOfProjectId` | Schema mismatch: `opportunity-variant.ts` writes fields not in `site-document.ts` `opportunitySchema` |
| `de-duplicates the slug...` | `variant.opportunity.slug` is `undefined` | Schema drops `slug` field |
| `is false for a document that is not a variant` | Returns `true` for canonical | `DEFAULT_SITE_DOCUMENT.opportunity` exists (status="canonical") so `Boolean(variant.opportunity)` passes |
| `refreshVariantFromCanonical` (3 tests) | `Cannot read properties of undefined (reading 'filter')` | `variant.opportunity.projectOrder` doesn't exist in schema |

**Schema Mismatch:** `opportunity-variant.ts` assumes an expanded opportunity object with fields (`variantOfProjectId`, `slug`, `name`, `type`, `objective`, `deadline`, `confidentiality`, `heroOverride`, `projectOrder`) that **do not exist** in the Zod schema (`site-document.ts:54-73`). The actual schema only has: `status`, `canonicalProjectId`, `sourceRevision`, `title`, `brief`, `audience`, `visibility`, `includedProjectIds`, `approvalNotes`, `sourceSnapshot`.

---

## 4. Gap Analysis: V20.2 Requirements vs. Current State

### V20.2 — Evidence-aware Opportunity Planner & Owner Diff

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **AI Planning Layer** (provider-neutral interface) | ❌ | No planner module; assistant only does single-turn tool planning |
| **Evidence States** (`source_backed`, `user_confirmed`, `ai_polished`, `unconfirmed`, `private`) | ❌ | No evidence tracking on facts/claims |
| **Structured Proposal** (variant metadata, evidence IDs, project visibility/order, hero/intro overrides, missing-info questions, warnings, typed `SiteCommand[]`) | ❌ | `manage_opportunity_variant` tool only does basic field edits |
| **Zod Validation of AI Output** | ❌ | Assistant chat validates tool calls individually, not batch plans |
| **Diff/Review UI** (canonical vs proposed, field-level, accept/reject per change, batch undo, canonical isolation) | ⚠️ Partial | `reviewOpportunity` shows text diff only; no field-level UI, no accept/reject granularity |
| **Private facts excluded from public output** | ❌ | No private evidence model |
| **Tests for planner validation, warnings, accept/reject, batch undo, canonical isolation** | ❌ | Only basic variant creation tests (and they fail) |

### V20.3 — Secure Publication, SEO, Sharing, Analytics

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **Visibility modes**: `public_indexable`, `private_share_noindex` | ⚠️ Partial | Schema has `visibility: private\|shared\|public`; no signed share tokens, no `noindex` enforcement beyond robots meta |
| **Unguessable share token / signed route** | ❌ | Not implemented |
| **Sitemap includes variants** | ❌ | `sitemap.ts` only returns homepage + `/start` |
| **Structured data**: `CreativeWork`/`SoftwareSourceCode` (projects), `Article` (blog) | ❌ | Only `Person` on homepage |
| **Social preview image route / reliable fallback** | ❌ | Uses headshot only |
| **Analytics events** (variant created, plan proposed/accepted/rejected, fallback used, published, share opened, failed, AI warning, undo) | ❌ | No analytics layer |

### V20.4 — Focused Static/Accessibility Delivery Mode

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **Non-3D mode** (low-powered, reduced-motion, WebGL failure, a11y-first) | ⚠️ Partial | `reducedMotion` respected; static fallback exists but no explicit "focused delivery mode" toggle |
| **Content parity with cinematic templates** | ✅ | Same `SiteDocument` rendered |
| **Keyboard navigation, contrast, heading hierarchy** | ✅ | Already implemented in public components |
| **No full-window scroll for Studio navigation** | ✅ | Bounded Live Canvas scroll |

### V20.5 — AssemblyAI Demo Lock

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **Golden demo workflow** (14 steps) | ⚠️ Partial | Pieces exist but not integrated as a documented, tested flow |
| **`DEMO_RUNBOOK.md`** | ❌ | Not created |

### V21 — Nebius/NVIDIA Multi-step Opportunity Agent

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **Provider Gateway** (AssemblyAI, Nebius Nemotron, Gemini/OpenAI fallback, local deterministic) | ❌ | Only AssemblyAI + Gemini/OpenAI; no Nebius adapter |
| **Professional Memory** (identity facts, tone, boundaries, briefs, accepted/rejected proposals, template prefs) | ❌ | No memory system |
| **Multi-step Workflow State Machine** (brief → inspect → retrieve → identify missing → ask → plan → confirm → variant → diff → revise → prepare → approve) | ❌ | Single-turn assistant only |
| **Evaluation Dashboard** (command success, parse failures, fallback rate, warning rate, correction rate, completion rate, voice/text ratio, latency, cost, publish success) | ❌ | Not implemented |

---

## 5. Database Migrations Status

| Migration | Applied | Purpose |
|-----------|---------|---------|
| `001_projects.sql` | ✅ | Base projects table |
| `002_publications.sql` | ✅ | Immutable snapshots |
| `003_revision_restore.sql` | ✅ | Revision history |
| `004_portfolio_media.sql` | ✅ | Media library |
| `005_fix_portfolio_media_policies.sql` | ✅ | Storage policies |
| `006_opportunity_variants.sql` | ✅ | Adds `variant_of_project_id`, `source_revision`, `opportunity_status` |

**Needed for V20.2–V21:**
- Evidence tracking tables (fact provenance, evidence states)
- Variant share tokens table
- Professional memory table
- Analytics events table
- Workflow state persistence (if server-side)

---

## 6. Environment Variables (Current `.env.example`)

```dotenv
ASSEMBLYAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_CV_MODEL=gpt-5-mini
OPENAI_CONTENT_MODEL=gpt-5-mini
GEMINI_API_KEY=
GEMINI_CONTENT_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
OPENAI_CV_TIMEOUT_MS=60000
```

**Needed for V21:**
```dotenv
AI_PLANNER_PROVIDER=nebius
NEBIUS_API_KEY=
NEBIUS_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

---

## 7. Immediate Blockers (Must Fix Before V20.2)

1. **Schema vs. Code Mismatch** in `opportunity-variant.ts` — the opportunity object written by `createOpportunityVariant` and read by `refreshVariantFromCanonical` contains fields not in the Zod schema. This causes:
   - Test failures (6/9)
   - Runtime validation errors when `siteDocumentSchema.parse()` runs
   - Data loss (extra fields stripped on parse)

2. **`isCanonicalDriftDetected` Logic Bug** — returns `true` for canonical documents because `DEFAULT_SITE_DOCUMENT.opportunity` exists (status="canonical"). Should check `status !== "canonical"`.

3. **Missing `projectOrder` in Schema** — required for variant project ordering feature.

---

## 8. Implementation Order (Safe Dependency Sequence)

### Phase 0: Stabilize Baseline (Pre-V20.2)
1. Fix `opportunitySchema` in `site-document.ts` to include all fields used by `opportunity-variant.ts`
2. Fix `isCanonicalDriftDetected` logic
3. Fix `refreshVariantFromCanonical` to use schema-compliant fields
4. Update tests to match corrected schema
5. Run full verification (`typecheck`, `lint`, `test`, `build`)

### Phase V20.2: Evidence-aware Planner & Diff
1. Define evidence state types + Zod schemas (`src/domain/evidence.ts`)
2. Create planner interface + provider adapters (`src/domain/planner.ts`, `src/lib/planner/`)
3. Implement structured proposal Zod schema + validation
4. Add "Plan" tool to voice tools + assistant chat endpoint
5. Build Diff/Review UI component (`OpportunityDiffReview`)
6. Add accept/reject/undo per-change + batch
7. Tests: planner validation, warnings, accept/reject, batch undo, canonical isolation

### Phase V20.3: Publication Hardening
1. Add share token column + RLS policy
2. Implement signed share route (`/s/[token]`)
3. Complete sitemap generation (canonical + variants + pages + posts)
4. Add structured data schemas (`CreativeWork`, `Article`, etc.)
5. Social preview image generation/fallback route
6. Analytics event emitter + owner dashboard

### Phase V20.4: Focused Delivery Mode
1. Add "Focused" template variant (static CSS-only, no Three.js)
2. Ensure content parity + keyboard/contrast/heading compliance
3. Add mode toggle in Studio Design panel

### Phase V20.5: Demo Lock
1. Write `DEMO_RUNBOOK.md` with exact steps
2. Verify all 14 workflow steps work end-to-end
3. Freeze unrelated features

### Phase V21: Nebius/Nemotron Agent
1. Provider gateway abstraction + Nebius adapter
2. Professional memory system (CRUD + provenance)
3. Multi-step workflow state machine (persisted)
4. Evaluation dashboard + telemetry

---

## 9. Files Likely to Change (High-Level)

| Area | Files |
|------|-------|
| Domain schemas | `site-document.ts`, `commands.ts`, `evidence.ts` (new), `planner.ts` (new) |
| Planner/AI | `lib/planner/` (new), `app/api/assistant/plan/route.ts` (new), `app/api/assistant/chat/route.ts` |
| Voice tools | `features/voice/voice-tools.ts`, `features/voice/local-assistant.ts` |
| Studio UI | `features/studio/manual-controls.tsx` (OpportunityEditor → DiffReview), `portfolio-studio.tsx` |
| Public routes | `app/p/[slug]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/p/[slug]/share/[token]/page.tsx` (new) |
| Database | New migrations for evidence, shares, memory, analytics |
| Tests | `domain/opportunity-variant.test.ts` (fix), `domain/planner.test.ts` (new), `domain/evidence.test.ts` (new) |
| Docs | `IMPLEMENTATION_AUDIT.md`, `DEMO_RUNBOOK.md`, `V20.2_V21_RELEASE_NOTES.md`, `.env.example` |

---

## 10. Verification Checklist (Per Milestone)

```bash
pnpm typecheck    # TypeScript strict mode
pnpm lint         # ESLint (no warnings)
pnpm test         # Vitest (all passing)
pnpm check:bundle # Bundle budget
pnpm build        # Next.js production build
```

**Current Status:** ❌ `pnpm test` fails (6 tests)

---

## 11. Risk Notes

- **Schema migration required** for opportunity fields — must be backward-compatible with existing variants
- **No Nebius credentials available** — V21 gateway must work with local fallback; real Nebius call cannot be verified
- **AssemblyAI token minting** — server-side cleanup job still needed for production (noted in README)
- **Bundle budget** — new planner/analytics code must stay within limits

---

## 12. Next Action

Start **Phase 0**: Fix the schema/code mismatch in `site-document.ts` and `opportunity-variant.ts`, then run full verification.
