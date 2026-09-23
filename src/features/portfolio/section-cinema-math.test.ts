import { describe, expect, it } from "vitest";
import { TEMPLATE_CONTRACTS } from "@/domain/template-contracts";
import { CINEMATIC_TEMPLATES, damp, isCinematicTemplate, sectionProgress, tiltFromPointer, toSigned } from "./section-cinema-math";

describe("section cinema math", () => {
  it("applies the cinematic system to the orbital templates and Velocity Atelier only", () => {
    expect(CINEMATIC_TEMPLATES).toEqual(["cinematic-orbit", "architectural-grid", "editorial-depth", "velocity-atelier"]);
    expect(isCinematicTemplate("cinematic-orbit")).toBe(true);
    expect(isCinematicTemplate("kinetic-gallery")).toBe(false);
    expect(isCinematicTemplate("velocity-atelier")).toBe(true);
    for (const template of CINEMATIC_TEMPLATES) expect(TEMPLATE_CONTRACTS.some((contract) => contract.id === template)).toBe(true);
  });

  it("reports section progress from entering to leaving the frame", () => {
    expect(sectionProgress(0, 800, 800, 600)).toBe(0);
    expect(sectionProgress(0, 800, 100, 600)).toBeCloseTo(700 / 1400);
    expect(sectionProgress(0, 800, -600, 600)).toBe(1);
    expect(sectionProgress(0, 800, 5000, 600)).toBe(0);
    expect(sectionProgress(0, 800, -5000, 600)).toBe(1);
  });

  it("is container relative so the Studio's bounded canvas scrolls correctly", () => {
    // A 500px tall preview frame that starts 120px below the top of the window.
    expect(sectionProgress(120, 500, 620, 400)).toBe(0);
    expect(sectionProgress(120, 500, 120 - 400, 400)).toBe(1);
  });

  it("never divides by zero", () => {
    expect(sectionProgress(0, 0, 0, 0)).toBe(0.5);
  });

  it("maps progress to a signed range", () => {
    expect(toSigned(0)).toBe(-1);
    expect(toSigned(0.5)).toBe(0);
    expect(toSigned(1)).toBe(1);
    expect(toSigned(4)).toBe(1);
  });

  it("smooths towards the target without overshooting", () => {
    let value = 0;
    for (let frame = 0; frame < 120; frame += 1) value = damp(value, 1, 1 / 60, 6);
    expect(value).toBeGreaterThan(0.99);
    expect(value).toBeLessThanOrEqual(1);
    expect(damp(0.4, 0.4, 0.016)).toBe(0.4);
  });

  it("derives tilt and glare from pointer position", () => {
    expect(tiltFromPointer(0.5, 0.5, 7)).toEqual({ tx: 0, ty: 0, gx: 50, gy: 50 });
    const corner = tiltFromPointer(1, 0, 7);
    expect(corner.tx).toBe(7);
    expect(corner.ty).toBe(7);
    expect(tiltFromPointer(-3, 9, 7).tx).toBe(-7);
  });
});
