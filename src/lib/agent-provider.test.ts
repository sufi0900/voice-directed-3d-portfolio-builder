import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AgentProvidersUnavailable, generateValidatedAgentJson } from "./agent-provider";

const original = { nebius: process.env.NEBIUS_API_KEY, model: process.env.NEBIUS_MODEL, router: process.env.OPENROUTER_API_KEY, routerModel: process.env.OPENROUTER_MODEL, gemini: process.env.GEMINI_API_KEY, openai: process.env.OPENAI_API_KEY };
afterEach(() => {
  if (original.nebius === undefined) delete process.env.NEBIUS_API_KEY; else process.env.NEBIUS_API_KEY = original.nebius;
  if (original.model === undefined) delete process.env.NEBIUS_MODEL; else process.env.NEBIUS_MODEL = original.model;
  if (original.router === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = original.router;
  if (original.routerModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = original.routerModel;
  if (original.gemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = original.gemini;
  if (original.openai === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original.openai;
  vi.unstubAllGlobals();
});

describe("server-side agent gateway", () => {
  it("never calls Nebius without both credentials and a model", async () => {
    delete process.env.NEBIUS_API_KEY;
    delete process.env.NEBIUS_MODEL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(generateValidatedAgentJson({ system: "system", prompt: "prompt", validate: z.object({ reply: z.string() }).parse })).rejects.toBeInstanceOf(AgentProvidersUnavailable);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("tries Nebius with a server-only key and validates structured output", async () => {
    process.env.NEBIUS_API_KEY = "unit-test-private-key";
    process.env.NEBIUS_MODEL = "configured/model";
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"Done"}' } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const result = await generateValidatedAgentJson({ system: "system", prompt: "prompt", validate: z.object({ reply: z.string() }).parse });
    expect(result).toEqual({ value: { reply: "Done" }, provider: "nebius", attempted: ["nebius"] });
    expect(fetch.mock.calls[0][0]).toBe("https://api.tokenfactory.nebius.com/v1/chat/completions");
    expect(fetch.mock.calls[0][1].headers.authorization).toBe("Bearer unit-test-private-key");
  });
  it("falls through to a configured OpenRouter model when Nebius fails", async () => {
    process.env.NEBIUS_API_KEY = "nebius-key";
    process.env.NEBIUS_MODEL = "configured/neb-model";
    process.env.OPENROUTER_API_KEY = "router-key";
    process.env.OPENROUTER_MODEL = "configured/router-model";
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const fetch = vi.fn().mockResolvedValueOnce(new Response("unavailable", { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"Fallback"}' } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const result = await generateValidatedAgentJson({ system: "system", prompt: "prompt", validate: z.object({ reply: z.string() }).parse });
    expect(result).toEqual({ value: { reply: "Fallback" }, provider: "openrouter", attempted: ["nebius", "openrouter"] });
    expect(fetch.mock.calls[1][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
  });
});
