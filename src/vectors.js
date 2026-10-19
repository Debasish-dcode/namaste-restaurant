// Vector artwork: section background patterns, restaurant fallback picture, photo placeholder
export const uri = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s);

const DEFS = {
  starters: `<defs>
   <g id="bowl"><path d="M-45 0h90a45 40 0 0 1-90 0z" fill="#2f7d4f"/><ellipse rx="45" ry="7" fill="#e8553a"/><path d="M-15-12q-8-14 0-26M5-12q-8-14 0-26M22-10q-8-12 0-22" stroke="#2f7d4f" stroke-width="3" fill="none" stroke-linecap="round"/></g>
   <g id="leaf"><path d="M0 0q20-30 50-20q-10 30-50 20z" fill="#4aa56b"/><path d="M0 0l40-16" stroke="#e4f3e6" stroke-width="2"/></g>
   <g id="skewer"><line x1="-50" x2="50" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/><circle cx="-25" r="11" fill="#e8553a"/><circle r="11" fill="#f2b84b"/><circle cx="25" r="11" fill="#7a4a2a"/></g>
   <g id="roll"><rect x="-38" y="-12" width="76" height="24" rx="12" fill="#e0a24a"/><path d="M-20-12v24M0-12v24M20-12v24" stroke="#c48230" stroke-width="2"/></g></defs>`,
  mains: `<defs>
   <g id="plate"><circle r="45" fill="#fff"/><circle r="34" fill="#f5d9a8"/><circle r="22" fill="#d9531e"/><circle cx="-7" cy="-5" r="5" fill="#f2b84b"/><circle cx="8" cy="7" r="4" fill="#f2b84b"/></g>
   <g id="naan"><path d="M-45 0q0-40 45-40t45 40q0 30-45 30t-45-30z" fill="#e9b56b"/><circle cx="-12" cy="-8" r="4" fill="#b9792f"/><circle cx="14" cy="4" r="4" fill="#b9792f"/></g>
   <g id="chili"><path d="M0 0q30 0 40 40q-40-10-40-40z" fill="#c62828"/><path d="M0 0q-4-12 6-14" stroke="#2f7d4f" stroke-width="4" fill="none"/></g>
   <g id="cloche"><path d="M-50 0a50 45 0 0 1 100 0z" fill="#9aa2aa"/><rect x="-58" width="116" height="8" rx="4" fill="#7d858d"/><circle cy="-48" r="6" fill="#7d858d"/></g></defs>`,
  desserts: `<defs>
   <g id="cone"><path d="M-22 0h44l-22 60z" fill="#e0a458"/><circle cy="-8" r="26" fill="#f48fb1"/><circle cy="-34" r="20" fill="#fff3e0"/><circle cy="-52" r="5" fill="#c62828"/></g>
   <g id="cup"><path d="M-30 0h60l-8 40h-44z" fill="#8d5a97"/><path d="M-34 0q4-36 34-36t34 36z" fill="#ffd1dc"/><circle cy="-40" r="6" fill="#c62828"/></g>
   <g id="jamun"><path d="M-45 0h90a45 38 0 0 1-90 0z" fill="#c0392b"/><circle cx="-20" cy="-6" r="14" fill="#6d3b1f"/><circle cx="8" cy="-8" r="14" fill="#6d3b1f"/><circle cx="28" cy="-2" r="12" fill="#6d3b1f"/></g>
   <g id="star"><path d="M0-10l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#f2b84b"/></g></defs>`,
};
const LAYOUT = {
  starters: `<use href="#bowl" x="70" y="80"/><use href="#skewer" x="240" y="55" transform="rotate(-15 240 55)"/><use href="#roll" x="90" y="235" transform="rotate(10 90 235)"/><use href="#leaf" x="190" y="140"/><use href="#bowl" x="250" y="275"/><use href="#leaf" x="10" y="165" transform="rotate(30 10 165)"/>`,
  mains: `<use href="#plate" x="70" y="75"/><use href="#naan" x="235" y="85"/><use href="#cloche" x="80" y="250"/><use href="#plate" x="250" y="260"/><use href="#chili" x="160" y="160"/><use href="#chili" x="20" y="150" transform="rotate(-30 20 150)"/>`,
  desserts: `<use href="#cone" x="70" y="85"/><use href="#cup" x="240" y="85"/><use href="#jamun" x="90" y="260"/><use href="#cone" x="250" y="235"/><use href="#star" x="165" y="40"/><use href="#star" x="170" y="170"/><use href="#star" x="20" y="180"/><use href="#star" x="300" y="170"/>`,
};
// semi-transparent tints so the dish-photo background shows through
export const TINT = { starters: "rgba(228,243,230,.82)", mains: "rgba(253,234,207,.82)", desserts: "rgba(253,228,236,.82)" };
export const tile = (k) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">${DEFS[k]}<g opacity=".4">${LAYOUT[k]}</g></svg>`);

export const HERO_FB = uri(`<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
 <rect width="800" height="400" fill="#7a1f2b"/><rect y="300" width="800" height="100" fill="#5a1520"/>
 <rect x="160" y="110" width="480" height="200" fill="#fff1d6"/><path d="M140 110h520l-30-60H170z" fill="#f2a33a"/>
 <path d="M170 50h65l-12 60h-65zM300 50h65l-8 60h-65zM430 50h65l-4 60h-65zM560 50h65v60h-65z" fill="#c8402a"/>
 <rect x="360" y="190" width="80" height="120" rx="6" fill="#7a1f2b"/><circle cx="428" cy="255" r="5" fill="#f2a33a"/>
 <rect x="190" y="160" width="140" height="90" rx="6" fill="#9ed0e6"/><rect x="470" y="160" width="140" height="90" rx="6" fill="#9ed0e6"/>
 <circle cx="80" cy="80" r="34" fill="#f2a33a"/><text x="400" y="95" text-anchor="middle" font-size="26" font-family="Georgia,serif" fill="#fff">NAMASTE</text></svg>`);

export const DISH_FB = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#efe3cf"/><circle cx="50" cy="44" r="26" fill="none" stroke="#c9b595" stroke-width="3"/><circle cx="50" cy="44" r="14" fill="none" stroke="#c9b595" stroke-width="3"/><text x="50" y="88" font-size="10" text-anchor="middle" fill="#9c8868" font-family="sans-serif">Add photo</text></svg>`);
