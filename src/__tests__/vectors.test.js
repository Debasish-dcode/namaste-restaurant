import { describe, it, expect } from "vitest";
import { tile, TINT, HERO_FB, DISH_FB } from "../vectors";

const scenes = ["starters", "mains", "desserts"];

describe("vector backgrounds", () => {
  it("each section has a tint colour", () => {
    scenes.forEach((s) => expect(TINT[s]).toMatch(/^rgba\(/));
  });
  it("each section tile is a valid SVG image", () => {
    scenes.forEach((s) => {
      expect(tile(s)).toMatch(/^data:image\/svg\+xml/);
      expect(decodeURIComponent(tile(s))).toContain("<svg");
    });
  });
  it("the three tiles are different pictures", () => {
    expect(new Set(scenes.map(tile)).size).toBe(3);
  });
  it("tiles contain no quote marks, so the CSS url(\"...\") cannot break", () => {
    scenes.forEach((s) => expect(tile(s)).not.toContain('"'));
  });
  it("fallback restaurant and dish pictures exist", () => {
    expect(HERO_FB).toMatch(/^data:image\/svg\+xml/);
    expect(DISH_FB).toMatch(/^data:image\/svg\+xml/);
  });
});
