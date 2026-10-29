import { describe, it, expect } from "vitest";
import { stat } from "../components/Stars";
import { R, ALL } from "../data";

describe("rating statistics", () => {
  it("restaurant starts at the base rating", () => {
    const s = stat("rest", {});
    expect(s.avg).toBe(R.baseRating);
    expect(s.n).toBe(R.baseReviews);
    expect(s.mine).toBe(0);
  });
  it("a customer's rating is added to the average", () => {
    const s = stat("rest", { rest: 5 });
    expect(s.n).toBe(R.baseReviews + 1);
    expect(s.mine).toBe(5);
    expect(s.avg).toBeCloseTo((R.baseRating * R.baseReviews + 5) / (R.baseReviews + 1), 5);
  });
  it("a low rating pulls the average down", () => {
    expect(stat("rest", { rest: 1 }).avg).toBeLessThan(R.baseRating);
  });
  it("a dish always shows the same starting rating", () => {
    expect(stat(ALL[0].id, {})).toEqual(stat(ALL[0].id, {}));
  });
  it("starting dish ratings stay between 4.0 and 4.8 with 20 to 149 reviews", () => {
    ALL.forEach((d) => {
      const s = stat(d.id, {});
      expect(s.avg).toBeGreaterThanOrEqual(4);
      expect(s.avg).toBeLessThanOrEqual(4.8);
      expect(s.n).toBeGreaterThanOrEqual(20);
      expect(s.n).toBeLessThanOrEqual(149);
    });
  });
  it("rating one dish does not change another dish", () => {
    const before = stat(ALL[1].id, {});
    expect(stat(ALL[1].id, { [ALL[0].id]: 5 })).toEqual(before);
  });
});
