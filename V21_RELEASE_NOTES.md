# V21 — Configurable professional agent

This archive is cumulative: it includes V20.2, V20.3 and V21. The V20.3 source was restored from the exact previously delivered ZIP. No earlier source migration should be rerun if it has already been applied.

## Database and configuration

Apply **only** `supabase/migrations/009_professional_memory_agent_events.sql` if migrations 001–008 are already in your Supabase project. This migration creates owner-scoped approved facts and private, content-free agent outcome events. Run it before using V21's Professional Memory or Agent Activity controls.

Set a real model and matching server-side API key for any provider you want enabled:

```dotenv
NEBIUS_API_KEY=your_private_key
NEBIUS_MODEL=exact_model_id_from_your_nebius_account
OPENROUTER_API_KEY=your_private_key
OPENROUTER_MODEL=exact_model_slug_from_your_openrouter_account
```

These are optional. The gateway uses each configured pair in this order: Nebius, OpenRouter, Gemini, OpenAI. The gateway does not hardcode an unverified Nemotron model ID. No API key belongs in `NEXT_PUBLIC_*` variables. When all providers are unavailable, direct navigation and exact text commands remain local. AssemblyAI still handles the live audio session and needs `ASSEMBLYAI_API_KEY`.

## What changed

- Owner-approved professional memory is scoped to the canonical portfolio and available across its opportunity variants. Owners enter a fact and the source they checked; they can revoke the fact. The opportunity planner can cite these facts, checks citation IDs, asks the owner to review suggested wording, and rechecks cited memory before accepting a proposal.
- Typed planning and copy refinement use one server-side model gateway with output validation and provider fallback. Voice requests use AssemblyAI's live voice and the same governed command tools; approved memory is included in the spoken session as data.
- Typed agent actions execute in sequence and stop on a rejected step, reporting earlier completed edits. Live voice tool calls are serialized to prevent stale document revisions during bursts.
- The owner can view 30-day activity counts by provider and outcome in the Opportunity editor. Events store no prompts, responses, links, or approved facts. The view samples up to 1,000 recent events, so counts are approximate for busy accounts.

## Manual acceptance

1. Apply `009`; in a canonical portfolio add a verified fact and source note, then open a variant and confirm it appears there. Revoke it, and confirm it is unavailable on both projects.
2. Configure your chosen provider's real API key and exact model slug. Ask the typed agent to refine content and generate an opportunity plan; confirm the provider shown and manually review every claim. Disconnect that provider and confirm the next configured provider is tried; when all are unavailable, direct navigation and exact edits should work.
3. Ask for two edits in one typed request, then intentionally make the second invalid; check that the assistant reports partial completion and stops, and that undo/history still work. Repeat with spoken actions to check ordering.
4. Use another account to try to read or revoke the first owner's memory and events. The request must be denied. Confirm no provider key, prompt, or professional fact is present in the event table.
5. Browser-test the voice session, mobile editing, and an existing published portfolio. Automated checks cannot prove live provider compatibility or live Supabase RLS without your accounts.

**Provider documentation consulted:** Nebius Token Factory chat-completions examples and JSON-output guide; OpenRouter's official API quickstart. The exact model ID must come from your own provider account.
