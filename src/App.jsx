
import Reception from "./Reception";
import { useEffect, useState } from "react";
import { R, MENU, ALL } from "./data";
import { tile, TINT } from "./vectors";
import { store } from "./store";
import { supabase } from "./supabase";
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

  const [screen, setScreen] = useState(urlTable ? "menu" : "scan");
  const [table, setTable] = useState(urlTable);
  const [mode, setMode] = useState("dine");
  const [cart, setCart] = useState({});
  const [sheet, setSheet] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [tab, setTab] = useState(MENU[0].id);
  const [ratings, rate] = useRatings();

  useEffect(() => {
    if (urlTable) store.set("namaste_scanned", true);
  }, [urlTable]);

  useEffect(() => {
    if (screen !== "menu") return;

    const onScroll = () => {
      let cur = MENU[0].id;

      MENU.forEach((c) => {
        const el = document.getElementById(c.id);

        if (el && el.getBoundingClientRect().top < 120) {
          cur = c.id;
        }
      });

      setTab(cur);
    };

    addEventListener("scroll", onScroll, { passive: true });

    return () => removeEventListener("scroll", onScroll);
  }, [screen]);

  const lines = ALL.filter((d) => cart[d.id]).map((d) => ({
    ...d,
    q: cart[d.id],
  }));

  const count = lines.reduce((a, x) => a + x.q, 0);

  const sub = lines.reduce((a, x) => a + x.q * x.price, 0);

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
  };

  const enterDine = (t) => {
    setTable(t);
    setMode("dine");
    store.set("namaste_scanned", true);
    setScreen("menu");
    window.scrollTo(0, 0);
  };

  const enterDelivery = () => {
    if (!store.get("namaste_scanned", false)) return false;

    setTable(null);
    setMode("delivery");
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
        `*New delivery order #${id}* - ${R.name}\n` +
        `Name: ${form.name}\nPhone: ${form.phone}\n` +
        `Address: ${form.address}\n` +
        lines
          .map((x) => `• ${x.name} x ${x.q} = ${rs(x.q * x.price)}`)
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
        `*New dine-in order #${orderId}* - ${R.name}\n` +
        `Table: ${tableNumber}\n` +
        lines
          .map((x) => `• ${x.name} x ${x.q} = ${rs(x.q * x.price)}`)
          .join("\n") +
        `\n*Database total: ${rs(total)}*` +
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
      <div className="mosaic" aria-hidden="true">
        {ALL.map((d) => (
          <Photo
            key={d.id}
            local={`/images/dishes/${d.id}.jpg`}
            query={d.q}
          />
        ))}
      </div>

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

        <div className="contact">
          <a href={`tel:${R.phone.replace(/\s/g, "")}`}>
            ☎ {R.phone}
          </a>

          <a href={R.website} target="_blank" rel="noopener noreferrer">
            {mode === "dine" && table
              ? `Dining at Table ${table}`
              : "Home delivery"}
          </a>
        </div>

        <nav>
          {MENU.map((c) => (
            <button
              key={c.id}
              className={tab === c.id ? "on" : ""}
              onClick={() =>
                document
                  .getElementById(c.id)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {c.title}
            </button>
          ))}
        </nav>

        <main>
          {MENU.map((c) => (
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
                <article className="item" key={d.id}>
                  <Photo
                    local={`/images/dishes/${d.id}.jpg`}
                    query={d.q}
                    alt={d.name}
                  />

                  <div className="info">
                    <div className="name">
                      <span className={"dot" + (d.veg ? "" : " nv")} />
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
                            aria-label="Remove one"
                            disabled={isSubmitting}
                          >
                            −
                          </button>

                          <span>{cart[d.id]}</span>

                          <button
                            onClick={() => change(d.id, 1)}
                            aria-label="Add one"
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

        <footer>© Namaste Restaurant · Made with love ♥</footer>
      </div>

      {count > 0 && (
        <div id="bar">
          <button onClick={() => setSheet("cart")}>
            <span>
              View order ({count} item{count > 1 ? "s" : ""})
            </span>
            <span>{rs(sub)}</span>
          </button>
        </div>
      )}

      {sheet === "cart" && (
        <Cart
          {...{
            lines,
            mode,
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