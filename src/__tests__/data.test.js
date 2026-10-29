import { describe, it, expect } from "vitest";
import { R, MENU, ALL } from "../data";

describe("restaurant details (R)", () => {
  it("has a name and a tagline", () => {
    expect(R.name.length).toBeGreaterThan(0);
    expect(R.tagline.length).toBeGreaterThan(0);
  });
  it("WhatsApp number has 10 to 13 digits once cleaned", () => {
    const digits = R.whatsapp.replace(/\D/g, "");
    expect(digits.length).toBeGreaterThanOrEqual(10);
    expect(digits.length).toBeLessThanOrEqual(13);
  });
  it("website is a full web address", () => {
    expect(R.website).toMatch(/^https?:\/\//);
  });
  it("Instagram id is written without @", () => {
    expect(R.instagram.startsWith("@")).toBe(false);
  });
  it("delivery fee and free-delivery limit are positive numbers", () => {
    expect(R.deliveryFee).toBeGreaterThan(0);
    expect(R.freeDeliveryAbove).toBeGreaterThan(R.deliveryFee);
  });
  it("starting rating is between 1 and 5", () => {
    expect(R.baseRating).toBeGreaterThanOrEqual(1);
    expect(R.baseRating).toBeLessThanOrEqual(5);
    expect(R.baseReviews).toBeGreaterThan(0);
  });
});

describe("menu", () => {
  it("has the three sections in order", () => {
    expect(MENU.map((c) => c.id)).toEqual(["starters", "mains", "desserts"]);
  });
  it("every section has dishes", () => {
    MENU.forEach((c) => expect(c.items.length).toBeGreaterThan(0));
  });
  it("ALL contains every dish of every section", () => {
    expect(ALL).toHaveLength(MENU.reduce((n, c) => n + c.items.length, 0));
  });
  it("dish ids are unique", () => {
    expect(new Set(ALL.map((d) => d.id)).size).toBe(ALL.length);
  });
  it("dish ids are safe photo file names (a-z, 0-9, dash)", () => {
    ALL.forEach((d) => expect(d.id).toMatch(/^[a-z0-9-]+$/));
  });
  it("every dish has a name, description and photo search words", () => {
    ALL.forEach((d) => {
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.desc.length).toBeGreaterThan(0);
      expect(d.q.length).toBeGreaterThan(0);
    });
  });
  it("every price is a whole number above zero", () => {
    ALL.forEach((d) => {
      expect(Number.isInteger(d.price)).toBe(true);
      expect(d.price).toBeGreaterThan(0);
    });
  });
  it("every dish is marked veg (true) or non-veg (false)", () => {
    ALL.forEach((d) => expect(typeof d.veg).toBe("boolean"));
  });
  it("each section's scene matches a vector background", () => {
    MENU.forEach((c) => expect(["starters", "mains", "desserts"]).toContain(c.scene));
  });
});
