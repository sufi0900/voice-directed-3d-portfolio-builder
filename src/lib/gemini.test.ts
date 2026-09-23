import { afterEach, describe, expect, it, vi } from "vitest";
import { aiUnavailableMessage, GeminiApiError, generateWithGemini } from "./gemini";

describe("Gemini resilience", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_CONTENT_MODEL;
    delete process.env.GEMINI_FALLBACK_MODEL;
  });

  it("retries a 503 and then uses the configured Flash-Lite fallback", async () => {
    vi.useFakeTimers();
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_CONTENT_MODEL = "primary-model";
    process.env.GEMINI_FALLBACK_MODEL = "fallback-model";
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{\"reply\":\"ready\"}" }] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const result = generateWithGemini({ system: "system", prompt: "prompt" });
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe('{"reply":"ready"}');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(String(fetch.mock.calls[2][0])).toContain("fallback-model");
  });

  it("distinguishes a quota response from temporary unavailability", () => {
    expect(aiUnavailableMessage(new GeminiApiError(429, "RESOURCE_EXHAUSTED", "limited", true)).code).toBe("AI_RATE_LIMITED");
    expect(aiUnavailableMessage(new GeminiApiError(503, "UNAVAILABLE", "down", true)).code).toBe("AI_TEMPORARILY_UNAVAILABLE");
  });
});
