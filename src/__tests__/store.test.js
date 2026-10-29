import { describe, it, expect, beforeEach } from "vitest";
import { store } from "../store";

beforeEach(() => localStorage.clear());

describe("browser storage helper", () => {
  it("gives the default when nothing is saved", () => {
    expect(store.get("missing", "default")).toBe("default");
  });
  it("saves and reads back values", () => {
    store.set("ratings", { rest: 4 });
    expect(store.get("ratings", {})).toEqual({ rest: 4 });
  });
  it("saves true/false flags", () => {
    store.set("namaste_scanned", true);
    expect(store.get("namaste_scanned", false)).toBe(true);
  });
  it("gives the default if the saved text is broken", () => {
    localStorage.setItem("bad", "{not json");
    expect(store.get("bad", "fallback")).toBe("fallback");
  });
});
