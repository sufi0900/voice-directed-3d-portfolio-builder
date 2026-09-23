import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CAR, RING, bodyParams, buildBody, buildCabin, buildWheel, line, mirrorZ, ribbon, sOf } from "./car-geometry";
import { buildCarPack } from "./car-parts";
import { pchip, smax } from "./spline";

const allFinite = (geometry: THREE.BufferGeometry) => Array.from(geometry.getAttribute("position").array).every(Number.isFinite);

describe("spline helpers", () => {
  it("pchip passes through control points without overshoot", () => {
    const curve = pchip([[0, 0], [1, 1], [2, 1], [3, 0]]);
    expect(curve(0)).toBeCloseTo(0); expect(curve(1)).toBeCloseTo(1); expect(curve(3)).toBeCloseTo(0);
    for (let x = 0; x <= 3; x += 0.05) { expect(curve(x)).toBeLessThanOrEqual(1.0001); expect(curve(x)).toBeGreaterThanOrEqual(-0.0001); }
  });
  it("smax rounds the corner and never drops below the true max", () => {
    expect(smax(1, 0, 0.1)).toBeGreaterThanOrEqual(1);
    expect(smax(0.5, 0.5, 0.1)).toBeGreaterThan(0.5);
  });
});

describe("procedural GT coupe", () => {
  const body = buildBody();
  const cabin = buildCabin();

  it("builds finite, well-formed geometry", () => {
    expect(allFinite(body.geometry)).toBe(true);
    expect(allFinite(cabin.geometry)).toBe(true);
    const normals = Array.from(body.geometry.getAttribute("normal").array);
    expect(normals.every(Number.isFinite)).toBe(true);
  });

  it("has realistic supercar proportions", () => {
    const box = body.geometry.boundingBox!;
    expect(box.max.x - box.min.x).toBeGreaterThan(4.4);
    expect(box.max.x - box.min.x).toBeLessThan(4.7);
    expect(box.max.z - box.min.z).toBeGreaterThan(1.8);
    expect(box.max.z - box.min.z).toBeLessThan(2.05);
    const roof = cabin.geometry.boundingBox!;
    expect(roof.max.y).toBeGreaterThan(1.1);
    expect(roof.max.y).toBeLessThan(1.22);
  });

  it("is left/right symmetric", () => {
    const a = body.at(0.3, sOf(RING.shoulder));
    const b = body.at(0.3, 1 - sOf(RING.shoulder));
    expect(a.z).toBeCloseTo(-b.z, 4);
    expect(a.y).toBeCloseTo(b.y, 4);
  });

  it("orients normals outward", () => {
    const top = body.normalAt(0, sOf(RING.topCentre));
    expect(top.y).toBeGreaterThan(0.9);
    const flank = body.normalAt(0, sOf(RING.shoulder));
    expect(flank.z).toBeGreaterThan(0.8);
    const otherFlank = body.normalAt(0, 1 - sOf(RING.shoulder));
    expect(otherFlank.z).toBeLessThan(-0.8);
    const roofNormal = cabin.normalAt(-0.2, sOf(32));
    expect(roofNormal.y).toBeGreaterThan(0.9);
  });

  it("opens real wheel arches sized for the wheels", () => {
    for (const axle of [CAR.frontAxleX, CAR.rearAxleX]) {
      const ceiling = bodyParams(axle).yb;
      expect(ceiling).toBeGreaterThan(CAR.wheelRadius * 2);      // above the top of the tyre…
      expect(ceiling).toBeLessThan(CAR.wheelRadius * 2 + 0.1);   // …with a realistic gap
    }
    expect(bodyParams(0).yb).toBeLessThan(0.13);                 // between the wheels the sill is low
  });

  it("keeps the wheel inside the body footprint", () => {
    expect(CAR.frontTrack + CAR.frontTireWidth / 2).toBeLessThan(bodyParams(CAR.frontAxleX).w + 0.02);
    expect(CAR.rearTrack + CAR.rearTireWidth / 2).toBeLessThan(bodyParams(CAR.rearAxleX).w + 0.02);
  });

  it("closes the nose and tail to a point", () => {
    expect(bodyParams(CAR.halfLength).w).toBeLessThan(0.01);
    expect(bodyParams(-CAR.halfLength).w).toBeLessThan(0.01);
  });

  it("hugs the surface with trim ribbons and mirrors them cleanly", () => {
    const strip = ribbon(body, line(0.7, sOf(RING.lowerFlank), -0.4, sOf(RING.lowerFlank), 12), 0.01);
    expect(allFinite(strip)).toBe(true);
    const mirrored = mirrorZ(strip);
    const p = strip.getAttribute("position"), q = mirrored.getAttribute("position");
    expect(q.getZ(3)).toBeCloseTo(-p.getZ(3), 6);
  });

  it("builds wheels with the axle on Z and a plausible radius", () => {
    const wheel = buildWheel(CAR.rearTireWidth);
    wheel.tire.computeBoundingBox();
    const box = wheel.tire.boundingBox!;
    expect(box.max.x).toBeCloseTo(CAR.wheelRadius, 2);
    expect(box.max.z - box.min.z).toBeCloseTo(CAR.rearTireWidth, 1);
    expect(allFinite(wheel.spokes)).toBe(true);
  });

  it("packs the whole car and disposes cleanly", () => {
    const pack = buildCarPack();
    expect(pack.anchors.headlight.x).toBeGreaterThan(1.8);
    expect(pack.anchors.taillight.x).toBeLessThan(-2);
    for (const geometry of Object.values(pack.trim)) expect(allFinite(geometry)).toBe(true);
    expect(() => pack.dispose()).not.toThrow();
  });
});
