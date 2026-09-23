# Voxfolio V19.1 — Resilient Assistant

V19.1 is a stabilization release for the V19 Gemini voice-agent milestone. It keeps deterministic portfolio controls available during AI-provider outages and prevents invalid generated commands from crashing the Studio.

## Fixed

- Navigation, undo, exact-text replacement, skill addition, and complete social-link addition now use a local deterministic planner before any AI request.
- Gemini HTTP 408, 429, and 5xx failures retry with bounded backoff; retryable failures can fall back from `GEMINI_CONTENT_MODEL` to `GEMINI_FALLBACK_MODEL`.
- When configured, OpenAI provides an optional second-provider fallback for assistant planning and existing writing refinement.
- If all writing providers are unavailable, Vox returns a professional local-only response and explains that navigation and exact-text edits remain available.
- AI tool commands are synchronously prevalidated against the current portfolio before dispatch.
- The Studio reducer now contains all command-validation failures, preserves the last valid document, and displays a field-specific message instead of triggering the Next.js error overlay.
- Voice command prevalidation reuses the exact validated document, preventing generated IDs from diverging during batched multi-command updates.
- Assistant transcripts persist per project in local storage and survive refreshes, remounts, and recoverable provider failures.
- Assistant prompts now explicitly respect field limits and explain the exact-text fallback when AI polishing is unavailable.

## Provider behavior

- HTTP 429 is treated as project rate/quota exhaustion.
- HTTP 503 is treated as temporary provider overload/unavailability, not as proof that project quota is exhausted.
- `gemini-3.8-flash` remains the default primary model.
- `gemini-3.5-flash-lite` is the default retryable fallback model and may be overridden with `GEMINI_FALLBACK_MODEL`.
- The local deterministic command layer is provider-free and is the guaranteed fallback for supported direct actions.

## Verification

- `pnpm test` — 100 tests passing.
- `pnpm typecheck` — passing.
- The regression suite covers provider-independent navigation, exact-text routing, social links, skills, undo, and containment of an 81-character value in an 80-character field.

## Suggested Git commit

```text
fix(assistant): add resilient local-first commands and AI fallbacks

- route navigation and exact edits without an AI provider
- retry Gemini and support Flash-Lite/OpenAI fallbacks
- contain invalid commands without crashing the Studio
- persist project-scoped assistant transcripts
```
