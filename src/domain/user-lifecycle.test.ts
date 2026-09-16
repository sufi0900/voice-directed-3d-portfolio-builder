import { describe, expect, it } from "vitest";
import { guestClaimPath, safeNextPath } from "./user-lifecycle";

describe("user lifecycle routing", () => {
  it("keeps internal post-auth destinations", () => {
    expect(safeNextPath("/claim")).toBe("/claim");
    expect(safeNextPath("/studio/project-id")).toBe("/studio/project-id");
  });

  it("rejects external and malformed redirect targets", () => {
    expect(safeNextPath("https://example.com")).toBe("/projects");
    expect(safeNextPath("//example.com")).toBe("/projects");
    expect(safeNextPath("/\\example.com")).toBe("/projects");
  });

  it("routes guest and authenticated drafts through the correct claim gate", () => {
    expect(guestClaimPath(false)).toBe("/login?next=/claim");
    expect(guestClaimPath(true)).toBe("/claim");
  });
});
