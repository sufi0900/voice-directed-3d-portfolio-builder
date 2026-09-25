# Voxfolio V23.1 release notes

Cumulative codebase: start with this ZIP alone; do not layer prior V23/22 patches.

Changes: isolated portfolio styling, bespoke editorial 2D homepage sections, warm dedicated pages, desktop Opportunity editor, content shortcuts and focused rendering regression checks.

No new Supabase migration. Keep all existing migrations already applied. Never include `.env.local` in a commit or ZIP.

Suggested Git commit message:

feat(voxfolio): isolate portfolio themes and rebuild Professional 2D presentation

- give 2D portfolios dedicated section layouts and warm editorial styling
- keep Studio and assistant chrome stable across template changes
- add responsive content and opportunity navigation in expanded editor
- cover public presentation and 3D isolation with rendering tests
