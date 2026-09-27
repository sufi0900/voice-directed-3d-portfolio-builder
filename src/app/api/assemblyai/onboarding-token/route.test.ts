import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));

import { POST } from "./route";

describe("voice onboarding session tokens", () => {
  beforeEach(() => {
    vi.stubEnv("ASSEMBLYAI_API_KEY", "test-key");
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: "temporary" }), { status: 200 })));
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns a token only after the owner's daily allowance is claimed", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ token: "temporary" });
    expect(mocks.rpc).toHaveBeenCalledWith("claim_vox_interview_use");
  });

  it("does not consume a session when AssemblyAI refuses the token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    const response = await POST();
    expect(response.status).toBe(429);
    expect((await response.json()).error).toMatch(/voice provider/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("distinguishes a missing limit function from a spent allowance", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    const response = await POST();
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/setup/i);
  });

  it("explains the actual app allowance without losing saved answers", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    const response = await POST();
    expect(response.status).toBe(429);
    expect((await response.json()).error).toMatch(/20 voice interview starts/);
  });
});
