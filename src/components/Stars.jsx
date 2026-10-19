import { useState } from "react";
import { R } from "../data";
import { store } from "../store";

export function useRatings() {
  const [ratings, setRatings] = useState(() => store.get("namaste_ratings", {}));
  const rate = (id, n) => setRatings((r) => { const next = { ...r, [id]: n }; store.set("namaste_ratings", next); return next; });
  return [ratings, rate];
}

function seed(id) {
  if (id === "rest") return { avg: R.baseRating, n: R.baseReviews };
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return { avg: 4 + (h % 9) / 10, n: 20 + (h % 130) };
}
export function stat(id, ratings) {
  const s = seed(id), mine = ratings[id] || 0;
  return mine ? { avg: (s.avg * s.n + mine) / (s.n + 1), n: s.n + 1, mine } : { ...s, mine: 0 };
}

export default function Stars({ id, ratings, onRate }) {
  const s = stat(id, ratings), on = s.mine || Math.round(s.avg);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} className={n <= on ? (s.mine ? "mine" : "f") : ""} onClick={() => onRate(id, n)} aria-label={`Rate ${n} star`}>★</button>
      ))}
      <span>{s.avg.toFixed(1)} ({s.n})</span>
    </div>
  );
}
