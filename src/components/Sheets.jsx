import { R } from "../data";

const rs = (n) => "₹" + Number(n).toFixed(2);
function Sheet({ onClose, children }) {
  return (
    <div className="sheet" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">{children}</div>
    </div>
  );
}

export function Cart({
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
  onPlace,
  onClose,
}) {
  const del = mode === "delivery";
  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <Sheet onClose={onClose}>
      <h2>Your order</h2>
      <div className="seg">
        <button className={!del ? "on" : ""} disabled={!table} onClick={() => setMode("dine")}>🍽️ Dine-in{table ? ` (Table ${table})` : ""}</button>
        <button className={del ? "on" : ""} onClick={() => setMode("delivery")}>🛵 Home delivery</button>
      </div>
      {lines.map((x) => (
        <div className="row" key={x.id}>
          <div>{x.name}<br /><small>{rs(x.price)} each</small></div>
          <div className="qty"><button onClick={() => change(x.id, -1)}>−</button><span>{x.q}</span><button onClick={() => change(x.id, 1)}>+</button></div>
          <b>{rs(x.q * x.price)}</b>
        </div>
      ))}
      <div className="row"><span>Subtotal</span><span>{rs(sub)}</span></div>
      {del && (
        <>
          <div className="row"><span>Delivery {fee ? "" : "(free)"}</span><span>{rs(fee)}</span></div>
          <input placeholder="Your name" {...field("name")} />
          <input type="tel" placeholder="Mobile number" {...field("phone")} />
          <textarea rows="2" placeholder="Full delivery address" {...field("address")} />
          <small>Free delivery above {rs(R.freeDeliveryAbove)}</small>
        </>
      )}
      <div className="row big"><span>Total</span><span>{rs(sub + fee)}</span></div>
      <textarea rows="2" placeholder="Any request? e.g. less spicy" {...field("note")} />
      <div className="err">{error}</div>
      
<button
  className="primary"
  onClick={onPlace}
  disabled={isSubmitting}
>
  {isSubmitting ? "Saving order..." : "Place order"}
</button>

      <button className="link" onClick={onClose}>Keep browsing</button>
    </Sheet>
  );
}

export function Done({ order, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div className="center">
        <h2>Order #{order.id} placed 🎉</h2>
        <p>{order.delivery ? "We will call you to confirm your delivery." : `Your food is being prepared for Table ${order.table}.`}</p>
        <p>Total to pay: <b>{rs(order.total)}</b></p>
        <a className="wa" href={order.wa} target="_blank" rel="noopener noreferrer">Send order on WhatsApp</a>
        <button className="link" onClick={onClose}>Done</button>
      </div>
    </Sheet>
  );
}

export function RateSheet({ mine, onRate, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div className="center">
        <h2>How was your experience?</h2>
        <p>Tap a star to rate Namaste Restaurant</p>
        <div className="bigstars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={n <= mine ? "f" : ""} onClick={() => { onRate("rest", n); setTimeout(onClose, 600); }}>★</button>
          ))}
        </div>
        <button className="link" onClick={onClose}>Close</button>
      </div>
    </Sheet>
  );
}
