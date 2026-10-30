
import Reception from "./Reception";
import { useEffect, useMemo, useState } from "react";
import { R, MENU, ALL } from "./data";
import { tile, TINT } from "./vectors";
import { store } from "./store";
import { supabase, supabaseConfigError } from "./supabase";
import Scanner from "./components/Scanner";
import Photo from "./components/Photo";
import Stars, { useRatings, stat } from "./components/Stars";
import { Cart, Done, RateSheet } from "./components/Sheets";


const rs = (n) => "₹" + Number(n).toFixed(2);

const waNumber = (n) => {
  const d = String(n).replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
};

function RestaurantApp() {
  const urlTable = new URLSearchParams(location.search).get("table");
  const savedTable = store.get("namaste_table", null);
  const savedMode = store.get("namaste_mode", null);
  const hasVisited = Boolean(urlTable || store.get("namaste_scanned", false));

  const [screen, setScreen] = useState(hasVisited ? "menu" : "scan");
  const [table, setTable] = useState(urlTable || savedTable);
  const [mode, setMode] = useState(
    urlTable ? "dine" : savedMode === "delivery" ? "delivery" : "dine"
  );
  const [cart, setCart] = useState({});
  const [sheet, setSheet] = useState(null);
  const [startCheckout, setStartCheckout] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [tab, setTab] = useState("all");
  const [ratings, rate] = useRatings();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState("");
  const [barPulse, setBarPulse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(window.scrollY > 80);
      setShowBackToTop(window.scrollY > 400);
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (isLoading || screen !== "menu") return;
    const cards = document.querySelectorAll(".reveal-card");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index * 45, 320)}ms`);
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, [isLoading, screen, search]);

  const filteredMenu = useMemo(() => MENU.map((category) => ({
    ...category,
    items: category.items.filter((dish) => {
      const matchesSearch = !search || `${dish.name} ${dish.desc}`.toLowerCase().includes(search);
      return matchesSearch;
    }),
  })), [search]);
  const visibleMenu = filteredMenu.filter((category) => tab === "all" || category.id === tab);
  const filteredCount = visibleMenu.reduce((count, category) => count + category.items.length, 0);

  useEffect(() => {
    if (urlTable) {
      store.set("namaste_scanned", true);
      store.set("namaste_table", urlTable);
      store.set("namaste_mode", "dine");
    }
  }, [urlTable]);

  const lines = ALL.filter((d) => cart[d.id]).map((d) => ({
    ...d,
    q: cart[d.id],
  }));

  const count = lines.reduce((a, x) => a + x.q, 0);

  const sub = lines.reduce((a, x) => a + x.q * x.price, 0);

  useEffect(() => {
    if (!count) return;
    setBarPulse(true);
    const timer = setTimeout(() => setBarPulse(false), 450);
    return () => clearTimeout(timer);
  }, [count, sub]);

  const fee =
    mode === "delivery" && sub > 0 && sub < R.freeDeliveryAbove
      ? R.deliveryFee
      : 0;

  useEffect(() => {
    if (sheet === "cart" && !count) setSheet(null);
  }, [count, sheet]);

  const change = (id, d) => {
    if (isSubmitting) return;

    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + d);
      const n = { ...c };

      if (q) n[id] = q;
      else delete n[id];

      return n;
    });
    if (d > 0) setToast("Item added");
  };

  const enterDine = (t) => {
    setTable(t);
    setMode("dine");
    store.set("namaste_scanned", true);
    store.set("namaste_table", t);
    store.set("namaste_mode", "dine");
    setScreen("menu");
    window.scrollTo(0, 0);
  };

  const enterDelivery = () => {
    if (!store.get("namaste_scanned", false)) return false;

    setTable(null);
    setMode("delivery");
    store.set("namaste_mode", "delivery");
    store.set("namaste_table", null);
    setScreen("menu");
    window.scrollTo(0, 0);

    return true;
  };

  const placeOrder = async () => {
    if (isSubmitting) return;

    if (!lines.length) {
      setError("Please add an item to your order.");
      return;
    }

    const del = mode === "delivery";

    if (
      del &&
      (!form.name.trim() ||
        form.phone.replace(/\D/g, "").slice(-10).length !== 10 ||
        form.address.trim().length < 8)
    ) {
      setError(
        "Please enter your name, a 10-digit mobile number and full address."
      );
      return;
    }

    setError("");

    // Delivery remains separate from the Supabase dine-in flow.
    if (del) {
      const id = Math.floor(1000 + Math.random() * 9000);
      const total = sub + fee;

      const text =
        `*New Order #${id} - ${R.name}*\n` +
        `Name: ${form.name}\nPhone: ${form.phone}\n` +
        `Address: ${form.address}\n` +
        lines
          .map((x) => `• ${x.name} - ${rs(x.price)} x ${x.q} = ${rs(x.q * x.price)}`)
          .join("\n") +
        `\nDelivery: ${rs(fee)}\n*Total: ${rs(total)}*` +
        (form.note.trim() ? `\nNote: ${form.note.trim()}` : "");

      setOrder({
        id,
        total,
        table: null,
        delivery: true,
        wa: `https://api.whatsapp.com/send?phone=${waNumber(
          R.whatsapp
        )}&text=${encodeURIComponent(text)}`,
      });

      setCart({});
      setSheet("done");

      return;
    }

    // Validate the QR/dine-in table before calling Supabase.
    const tableNumber = Number(table);

    if (
      !Number.isInteger(tableNumber) ||
      tableNumber < 1 ||
      tableNumber > 10
    ) {
      setError("Please scan a valid restaurant table QR code.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) {
        throw new Error(supabaseConfigError);
      }

      // Submit the dine-in order.
      // Supabase returns the order ID and database-calculated total.
      const { data: result, error: dbError } = await supabase.rpc(
        "submit_dine_in_order",
        {
          p_table_number: tableNumber,
          p_items: lines.map((item) => ({
            id: item.id,
            quantity: item.q,
          })),
          p_customer_note: form.note.trim() || null,
        }
      );

      if (dbError) throw dbError;

      // Validate the response returned by the database.
      if (
        !result ||
        typeof result.id !== "string" ||
        !result.id
      ) {
        throw new Error("The database did not return an order ID.");
      }

      const orderId = result.id;
      const total = Number(result.total);

      if (
        result.total === null ||
        result.total === undefined ||
        !Number.isFinite(total)
      ) {
        throw new Error("Could not verify the saved order total.");
      }

      // Prepare the restaurant's WhatsApp order message.
      const text =
        `*New Order #${orderId} - ${R.name}*\n` +
        `Dining table: Table ${tableNumber}\n` +
        lines
          .map((x) => `• ${x.name} - ${rs(x.price)} x ${x.q} = ${rs(x.q * x.price)}`)
          .join("\n") +
        `\n*Total: ${rs(total)}*` +
        (form.note.trim() ? `\nNote: ${form.note.trim()}` : "");

      // Show confirmation only after Supabase successfully returns
      // the saved order ID and calculated total.
      setOrder({
        id: orderId,
        total,
        table: tableNumber,
        delivery: false,
        wa: `https://api.whatsapp.com/send?phone=${waNumber(
          R.whatsapp
        )}&text=${encodeURIComponent(text)}`,
      });

      setCart({});
      setSheet("done");
    } catch (err) {
      console.error("Order submission failed:", err);

      setError(
        "We couldn't verify your order. Your cart has been kept. Please ask restaurant staff to check before retrying."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (screen === "scan") {
    return (
      <Scanner
        onTable={enterDine}
        onDemo={() => enterDine("1")}
        onDelivery={enterDelivery}
      />
    );
  }

  const rest = stat("rest", ratings);

  return (
    <>
    <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />
    <div className="page">
        <header className="hero">
          <Photo
            local="/images/restaurant.jpg"
            query="indian restaurant interior"
            fallback="hero"
            alt="Namaste Restaurant"
          />

          <div className="hero-shade" />

          <div className="hero-body">
            <h1>{R.name}</h1>
            <p>{R.tagline}</p>

            <button className="rate-chip" onClick={() => setSheet("rate")}>
              ★ {rest.avg.toFixed(1)} ({rest.n}) ·{" "}
              {rest.mine ? `Your rating: ${rest.mine}` : "Rate us"}
            </button>
          </div>
        </header>

        <div className={`contact ${isScrolled ? "scrolled" : ""}`}>
          <a href={`tel:${R.phone.replace(/\s/g, "")}`}>
            ☎ {R.phone}
          </a>
        </div>

        <div className="section-divider" aria-hidden="true">
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none">
            <path d="M0 35C180 4 320 4 520 35s340 31 520 0 300-31 400 0v35H0Z" />
          </svg>
        </div>

        <nav aria-label="Menu categories">
          <button
            className={tab === "all" ? "on" : ""}
            onClick={() => setTab("all")}
          >
            All
          </button>
          {MENU.map((c) => (
            <button
              key={c.id}
              className={tab === c.id ? "on" : ""}
              onClick={() => setTab(c.id)}
            >
              {c.title}
            </button>
          ))}
        </nav>

        <div className="menu-tools">
          <div className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes, e.g. paneer" aria-label="Search dishes" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}>×</button>}</div>
        </div>

        <main>
          {isLoading ? <div className="skeleton-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><span /><div><i /><i /><b /></div></div>)}</div> : filteredCount === 0 ? <div className="empty-state">No dishes found for '{search}'<button onClick={() => setQuery("")}>Clear search</button></div> : visibleMenu.filter((category) => category.items.length).map((c) => (
            <section
              key={c.id}
              id={c.id}
              style={{
                backgroundColor: TINT[c.scene],
                backgroundImage: `url("${tile(c.scene)}")`,
              }}
            >
              <div className="sec-head">
                <h2>{c.title}</h2>
                <p>{c.note}</p>
              </div>

              {c.items.map((d) => (
                <article className="item reveal-card" key={d.id}>
                  <div className="dish-photo"><Photo local={`/images/dishes/${d.id}.jpg`} query={d.q} alt={d.name} />{d.badges?.slice(0, 2).map((badge) => <span className={`badge ${badge}`} key={badge}>{badge === "spicy" ? "🌶️ Spicy" : badge === "chef" ? "Chef's Special" : badge === "bestseller" ? "Bestseller" : "New"}</span>)}</div>

                  <div className="info">
                    <div className="name">
                      <span className={"dot" + ((d.isVeg ?? d.veg) ? "" : " nv")} />
                      {d.name}
                    </div>

                    <div className="desc">{d.desc}</div>

                    <Stars id={d.id} ratings={ratings} onRate={rate} />

                    <div className="buy">
                      <span className="price">{rs(d.price)}</span>

                      {cart[d.id] ? (
                        <div className="qty">
                          <button
                            onClick={() => change(d.id, -1)}
                            aria-label={`Decrease quantity of ${d.name}`}
                            disabled={isSubmitting}
                          >
                            −
                          </button>

                          <span>{cart[d.id]}</span>

                          <button
                            onClick={() => change(d.id, 1)}
                            aria-label={`Increase quantity of ${d.name}`}
                            disabled={isSubmitting}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add"
                          onClick={() => change(d.id, 1)}
                          disabled={isSubmitting}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </main>

        <footer>
          <div className="footer-grid">
            <div>
              <strong>{R.name}</strong>
              <p>{R.tagline}</p>
            </div>
            <div>
              <h3>Visit us</h3>
              <p>Fresh Indian flavours, served daily.</p>
            </div>
            <div>
              <h3>Contact</h3>
              <a href={`tel:${R.phone.replace(/\s/g, "")}`}>☎ {R.phone}</a>
            </div>
          </div>
          <small>© Namaste Restaurant · Made with love ♥</small>
        </footer>
      </div>

      {count > 0 && (
        <div id="bar" className={barPulse ? "pulse" : ""}>
          <div className="view-order">
            <span>
              View order ({count} item{count > 1 ? "s" : ""})
            </span>
            <span>{rs(sub)}</span>
          </div>
          <button
            className="continue-order"
            onClick={() => {
              setStartCheckout(true);
              setSheet("cart");
            }}
          >
            Continue
          </button>
          <button
            className="cancel-order"
            onClick={() => {
              if (!isSubmitting) {
                setCart({});
                setSheet(null);
              }
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
      {showBackToTop && <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">↑</button>}

      {sheet === "cart" && (
        <Cart
          {...{
            lines,
            mode,
            startCheckout,
            setMode,
            table,
            form,
            setForm,
            change,
            sub,
            fee,
            error,
            isSubmitting,
          }}
          onPlace={placeOrder}
          onClose={() => {
            if (!isSubmitting) setSheet(null);
          }}
        />
      )}

      {sheet === "done" && order && (
        <Done order={order} onClose={() => setSheet(null)} />
      )}

      {sheet === "rate" && (
        <RateSheet
          mine={ratings.rest || 0}
          onRate={rate}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  return path === "/reception" ? <Reception /> : <RestaurantApp />;
}