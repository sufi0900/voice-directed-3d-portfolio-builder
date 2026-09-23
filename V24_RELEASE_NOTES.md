# Voxfolio V24 — opportunity delivery and private feedback

## Implemented

- Shared opportunity links remain opaque, hashed, expiring bearer links pinned to one immutable publication.
- Added recipient feedback with bounded rating, message, and optional contact fields.
- Feedback submission is available only through an active shared token and never records IP addresses or device fingerprints.
- Added owner-scoped feedback inspection and deletion endpoints.
- Shared metadata remains `noindex`, `nofollow`, `noarchive`, and `no-referrer`.
- Added migration `012_opportunity_feedback.sql` and domain validation tests.

## Acceptance gate

1. Apply migration 012.
2. Publish a variant as Shared and create a link.
3. Open the link in a private browser, submit feedback, and confirm no draft fields are exposed.
4. Revoke or expire the link and confirm both portfolio and feedback submission return unavailable.
5. Confirm another account cannot inspect or delete feedback.
