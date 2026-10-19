import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Accepts: "Table 5", "5", or a link like https://yoursite.com/?table=5
function parseTable(text) {
  try { const t = new URL(text).searchParams.get("table"); if (t) return t; } catch { /* not a URL */ }
  const m = text.match(/table\D*(\d+)/i) || text.match(/^\s*(\d+)\s*$/);
  if (m) return m[1];
  return /namaste/i.test(text) ? "1" : null;
}

export default function Scanner({ onTable, onDemo, onDelivery }) {
  const scanner = useRef(null);
  const [msg, setMsg] = useState("");

  const stop = async () => {
    try { if (scanner.current) { await scanner.current.stop(); scanner.current.clear(); } } catch { /* ignore */ }
    scanner.current = null;
  };
  useEffect(() => () => { stop(); }, []);

  const start = async () => {
    setMsg("");
    try {
      scanner.current = new Html5Qrcode("reader");
      await scanner.current.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, async (text) => {
        const t = parseTable(text);
        if (!t) { setMsg("This is not a Namaste Restaurant QR code. Try again."); return; }
        await stop(); onTable(t);
      });
    } catch {
      setMsg("Camera not available. Allow camera access (use localhost or https), or try the demo.");
    }
  };

  return (
    <div className="scan">
      <div className="scan-card">
        <div className="logo">🙏</div>
        <h1>Namaste Restaurant</h1>
        <p>Scan the QR code on your table to open the menu</p>
        <div id="reader" />
        <p className="msg">{msg}</p>
        <button className="primary" onClick={start}>Open camera &amp; scan</button>
        <button className="ghost" onClick={async () => { await stop(); onDemo(); }}>Try demo (Table 1)</button>
        <button className="ghost" onClick={() => { const ok = onDelivery(); if (!ok) setMsg("Home delivery unlocks after you scan the QR code at our restaurant once."); }}>
          Already visited us? Order home delivery
        </button>
      </div>
    </div>
  );
}
