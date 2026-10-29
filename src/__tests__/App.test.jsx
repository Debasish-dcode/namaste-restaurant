import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Fake camera scanner: "scans" whatever text we set in scan.text
const scan = vi.hoisted(() => ({ text: "Table 7" }));
vi.mock("html5-qrcode", () => ({
  Html5Qrcode: class {
    async start(_camera, _options, onScan) { onScan(scan.text); }
    async stop() {}
    clear() {}
  },
}));

import App from "../App";
import { R, MENU, ALL } from "../data";

const first = ALL[0];
const bar = () => document.getElementById("bar");

// The demo button finishes a moment later, so we wait for the menu to appear
const openMenu = async () => {
  render(<App />);
  fireEvent.click(screen.getByText("Try demo (Table 1)"));
  await screen.findByText(/Dining at Table 1/);
};
const addFirstDish = () => fireEvent.click(screen.getAllByText("Add")[0]);
const openCart = () => fireEvent.click(screen.getByText(/View order/));

describe("scanner screen", () => {
  it("is the first thing customers see", () => {
    render(<App />);
    expect(screen.getByText("Open camera & scan")).toBeTruthy();
    expect(screen.getByText(/Scan the QR code/)).toBeTruthy();
  });
  it("a valid table QR opens the menu for that table", async () => {
    scan.text = "Table 7";
    render(<App />);
    fireEvent.click(screen.getByText("Open camera & scan"));
    expect(await screen.findByText(/Dining at Table 7/)).toBeTruthy();
  });
  it("a QR code from somewhere else is rejected", async () => {
    scan.text = "hello";
    render(<App />);
    fireEvent.click(screen.getByText("Open camera & scan"));
    expect(await screen.findByText(/not a Namaste Restaurant QR/)).toBeTruthy();
  });
  it("home delivery is locked for a first-time customer", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Already visited us/));
    expect(await screen.findByText(/unlocks after you scan/)).toBeTruthy();
  });
  it("home delivery opens the menu (not dine-in) for a returning customer", async () => {
    localStorage.setItem("namaste_scanned", "true");
    render(<App />);
    fireEvent.click(screen.getByText(/Already visited us/));
    expect((await screen.findAllByText("Starters")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dining at Table/)).toBeNull();
  });
  it("a link like /?table=5 skips the scanner", () => {
    window.history.pushState({}, "", "/?table=5");
    try {
      render(<App />);
      expect(screen.getByText(/Dining at Table 5/)).toBeTruthy();
    } finally {
      window.history.pushState({}, "", "/");
    }
  });
});

describe("menu", () => {
  it("shows the restaurant name and all three sections", async () => {
    await openMenu();
    expect(screen.getAllByText(R.name).length).toBeGreaterThan(0);
    MENU.forEach((c) => expect(screen.getAllByText(c.title).length).toBeGreaterThan(0));
  });
  it("shows every dish", async () => {
    await openMenu();
    ALL.forEach((d) => expect(screen.getAllByText(d.name).length).toBeGreaterThan(0));
  });
  it("has no order bar until something is added", async () => {
    await openMenu();
    expect(bar()).toBeNull();
  });
});

describe("ordering", () => {
  it("adding a dish shows the item count and price", async () => {
    await openMenu();
    addFirstDish();
    expect(bar().textContent).toContain("View order (1 item)");
    expect(bar().textContent).toContain(`₹${first.price}`);
  });
  it("plus and minus change the quantity, and zero removes the bar", async () => {
    await openMenu();
    addFirstDish();
    fireEvent.click(screen.getByLabelText("Add one"));
    expect(bar().textContent).toContain("(2 items)");
    fireEvent.click(screen.getByLabelText("Remove one"));
    fireEvent.click(screen.getByLabelText("Remove one"));
    expect(bar()).toBeNull();
  });
    it("dine-in order shows a confirmation and a correct WhatsApp link", async () => {
    await openMenu();
    addFirstDish();
    openCart();
    fireEvent.click(screen.getByText("Place order"));
    expect(await screen.findByText(/Order #\d{4} placed/, {}, { timeout: 3000 })).toBeTruthy();
    let digits = R.whatsapp.replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    const href = screen.getByText("Send order on WhatsApp").getAttribute("href");
    expect(href).toContain(`phone=${digits}`);
    expect(href).toContain("Table%201");
  });
  it("home delivery adds the delivery fee", async () => {
    await openMenu();
    addFirstDish();
    openCart();
    fireEvent.click(screen.getByText("🛵 Home delivery"));
    const fee = first.price < R.freeDeliveryAbove ? R.deliveryFee : 0;
    expect(document.querySelector(".panel").textContent).toContain(`₹${first.price + fee}`);
  });
  it("home delivery needs name, phone and address", async () => {
    await openMenu();
    addFirstDish();
    openCart();
    fireEvent.click(screen.getByText("🛵 Home delivery"));
    fireEvent.click(screen.getByText("Place order"));
    expect(screen.getByText(/Please enter your name/)).toBeTruthy();
  });
});

describe("ratings", () => {
  it("rating a dish is shown and remembered", async () => {
    await openMenu();
    fireEvent.click(screen.getAllByLabelText("Rate 5 star")[0]);
    expect(screen.getAllByLabelText("Rate 5 star")[0].className).toBe("mine");
    expect(JSON.parse(localStorage.getItem("namaste_ratings"))[first.id]).toBe(5);
  });
});