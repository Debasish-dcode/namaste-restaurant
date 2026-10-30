import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

window.scrollTo = () => {}; // jsdom has no scrolling

if (typeof globalThis.localStorage === "undefined") {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => Array.from(values.keys())[index] ?? null,
    get length() { return values.size; },
  };
}

afterEach(() => {
  cleanup();            // remove the rendered page after each test
  localStorage.clear(); // every test starts as a brand-new customer
});
