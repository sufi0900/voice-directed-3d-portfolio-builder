import { describe, expect, it } from "vitest";
import { createShareToken, hashShareToken, validShareToken } from "./opportunity-share";

describe("private opportunity bearer tokens", () => {
  it("generates unique, opaque 256-bit tokens while persisting only hashes", () => {
    const first = createShareToken();
    const second = createShareToken();
    expect(validShareToken(first.token)).toBe(true);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hash).toBe(hashShareToken(first.token));
    expect(second.token).not.toBe(first.token);
    expect(first.hash).not.toContain(first.token);
  });
  it("refuses malformed bearer URLs", () => {
    expect(validShareToken("")).toBe(false);
    expect(validShareToken("abc/../../admin")).toBe(false);
    expect(validShareToken("a".repeat(44))).toBe(false);
    expect(validShareToken("a".repeat(43))).toBe(true);
  });
});
