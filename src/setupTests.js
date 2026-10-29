import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

window.scrollTo = () => {}; // jsdom has no scrolling

afterEach(() => {
  cleanup();            // remove the rendered page after each test
  localStorage.clear(); // every test starts as a brand-new customer
});
