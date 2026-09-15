# Voice-Directed 3D Portfolio Builder

An implementation-ready vertical slice of a portfolio builder in which manual editing and AssemblyAI voice tools use the same validated, reversible command pipeline.

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
```

Open `http://localhost:3000` in Chrome or Edge. Microphone access requires HTTPS or localhost.

Never prefix the key with `NEXT_PUBLIC_`, commit `.env.local`, or paste the key into client code.

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

Every visible change is a typed command applied to a validated site document. Manual controls and voice tools cannot directly modify the Three.js scene, DOM or generated source code. Public publishing, authentication, CV ingestion and server persistence remain scheduled for later milestones defined in the approved SDLC.

## AssemblyAI integration notes

The server mints a single-use token immediately before each connection. The browser sends 24 kHz PCM produced by an AudioWorklet, receives transcripts and synthesized PCM audio, runs allowlisted client-side tools, and returns `tool.result` only at a safe turn boundary. Ending a session sends `session.end` before closing to avoid the billable resume grace period. After `session.ended`, the app asks its server to soft-delete the AssemblyAI session. If the network or browser terminates before that request completes, deletion cannot be guaranteed; production must add a scheduled server-side cleanup job.
