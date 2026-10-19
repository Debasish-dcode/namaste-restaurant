import { useState } from "react";
import { store } from "../store";
import { HERO_FB, DISH_FB } from "../vectors";

/* Finds a free-licensed photo on Wikimedia Commons (cached in the browser) */
const pending = new Map();
function commonsPhoto(query) {
  const key = "namaste_img_" + query;
  const cached = store.get(key, null);
  if (cached) return Promise.resolve(cached);
  if (pending.has(query)) return pending.get(query);
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6",
    gsrsearch: query + " filetype:bitmap", gsrlimit: "15", prop: "imageinfo", iiprop: "url|size", iiurlwidth: "500",
  });
  const p = fetch(url)
    .then((r) => r.json())
    .then((d) => {
      const pages = Object.values(d?.query?.pages || {}).sort((a, b) => a.index - b.index);
      const hit = pages.find((x) => /\.jpe?g$/i.test(x.title) && x.imageinfo?.[0]?.width >= 500 && x.imageinfo[0].height >= 400);
      const src = hit?.imageinfo[0].thumburl || null;
      if (src) store.set(key, src);
      return src;
    })
    .catch(() => null);
  pending.set(query, p);
  return p;
}

/* local file -> Wikimedia photo -> placeholder */
export default function Photo({ local, query, alt = "", fallback = "dish", ...rest }) {
  const [src, setSrc] = useState(local);
  const [stage, setStage] = useState(0);
  const fb = fallback === "hero" ? HERO_FB : DISH_FB;

  const onError = async () => {
    if (stage === 0) {
      setStage(1);
      const found = await commonsPhoto(query);
      if (found) setSrc(found);
      else { setStage(2); setSrc(fb); }
    } else if (stage === 1) {
      setStage(2); setSrc(fb);
    }
  };
  return <img src={src} alt={alt} onError={onError} loading="lazy" {...rest} />;
}
