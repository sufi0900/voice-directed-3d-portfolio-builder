# Voxfolio V25 — product acceptance and launch runbook

V25 is the release hardening milestone. It does not grant voice authority to publish, upload, create shares, or bypass validation.

## End-to-end acceptance

1. Create a canonical portfolio from the guest flow.
2. Claim it after authentication and confirm owner-only Studio access.
3. Create an opportunity variant with a brief, audience, and selected evidence.
4. Use text and AssemblyAI voice to navigate and edit the variant.
5. Confirm provider failure falls back to deterministic navigation/exact edits.
6. Generate evidence-aware suggestions and accept only approved suggestions.
7. Change the canonical portfolio and review source differences from the variant.
8. Apply only selected source updates and confirm the canonical project is unchanged.
9. Publish the variant as Shared.
10. Create a revocable, expiring share link.
11. Open the link as a recipient and verify only the pinned immutable publication is visible.
12. Submit private feedback and inspect/delete it as the owner.
13. Revoke the link and confirm recipient access returns 404.

## Release checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check:bundle
```

Real AssemblyAI, Supabase RLS, storage, provider credentials, browser permissions, deployment headers, mobile layouts, reduced motion, keyboard navigation, and WebGL fallback still require owner-run environment validation.
