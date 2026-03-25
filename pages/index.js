import { useState, useEffect, useRef } from "react";

const INTERVAL_SECONDS = 600; // 10 minutes

export default function Home() {
  const [results, setResults] = useState([]);
  const [pinging, setPinging] = useState(false);
  const [lastPingedAt, setLastPingedAt] = useState(null);
  const [countdown, setCountdown] = useState(INTERVAL_SECONDS);
  const countdownRef = useRef(INTERVAL_SECONDS);

  async function pingAll() {
    if (pinging) return;
    setPinging(true);
    setResults([]);
    try {
      const res = await fetch("/api/ping");
      const data = await res.json();
      setResults(data.results);
      setLastPingedAt(data.pingedAt);
    } finally {
      setPinging(false);
      countdownRef.current = INTERVAL_SECONDS;
    }
  }

  // Auto-ping on mount + every 10 minutes
  useEffect(() => {
    pingAll();
    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) pingAll();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Group by project
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.project]) acc[r.project] = [];
    acc[r.project].push(r);
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🛡️ Server Keepalive</h1>
      <p style={styles.sub}>
        Pings all services <strong>sequentially</strong> every 10 minutes.{" "}
        {pinging ? (
          <span style={{ color: "#f97316" }}>⏳ Pinging sequentially...</span>
        ) : (
          <span>Next ping in <strong style={{ color: "#f97316" }}>{formatCountdown(countdown)}</strong></span>
        )}
      </p>
      <button style={styles.btn} onClick={pingAll} disabled={pinging}>
        {pinging ? "Pinging..." : "🔁 Ping All Now"}
      </button>

      {pinging && (
        <p style={{ color: "#a1a1aa", fontSize: "0.8rem", marginBottom: "1rem" }}>
          Waiting for each service one by one — this may take up to 60s...
        </p>
      )}

      {Object.entries(grouped).map(([project, svcs]) => (
        <div key={project} style={styles.group}>
          <h2 style={styles.groupTitle}>{project}</h2>
          <div style={styles.grid}>
            {svcs.map((r) => (
              <div key={r.url} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardName}>{r.name}</span>
                  <span style={{ ...styles.badge, ...(r.status === "ok" ? styles.badgeOk : styles.badgeErr) }}>
                    {r.status === "ok" ? "✅ UP" : "❌ DOWN"}
                  </span>
                </div>
                <div style={styles.url}>{r.url}</div>
                <div style={styles.meta}>
                  HTTP <span style={styles.metaVal}>{r.statusCode ?? "—"}</span> &nbsp;·&nbsp;
                  Latency <span style={styles.metaVal}>{r.ms}ms</span> &nbsp;·&nbsp;
                  {new Date(r.lastPing).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!pinging && results.length === 0 && (
        <p style={{ color: "#52525b" }}>No results yet...</p>
      )}

      <p style={styles.footer}>
        Running 24/7 on Vercel · Pings are sequential · No cold starts ·{" "}
        <a href="https://github.com/Yuvraj404s/server-keepalive" style={{ color: "#52525b" }}>
          GitHub
        </a>
      </p>
    </div>
  );
}

const styles = {
  page: { fontFamily: "system-ui,sans-serif", background: "#18181b", color: "#e4e4e7", minHeight: "100vh", padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center" },
  title: { fontSize: "1.5rem", fontWeight: 800, color: "#f97316", marginBottom: "0.4rem" },
  sub: { color: "#71717a", fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center" },
  btn: { background: "#f97316", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 2rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", marginBottom: "0.6rem" },
  group: { width: "100%", maxWidth: "900px", marginBottom: "2rem" },
  groupTitle: { fontSize: "0.78rem", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "0.85rem" },
  card: { background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", padding: "1.1rem 1.4rem" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  cardName: { fontWeight: 700, fontSize: "0.85rem", color: "#d4d4d8" },
  badge: { fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" },
  badgeOk: { background: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.25)" },
  badgeErr: { background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" },
  url: { fontFamily: "monospace", fontSize: "0.68rem", color: "#52525b", marginBottom: "0.5rem", wordBreak: "break-all" },
  meta: { fontSize: "0.7rem", color: "#52525b" },
  metaVal: { color: "#a1a1aa" },
  footer: { marginTop: "2rem", color: "#3f3f46", fontSize: "0.72rem", textAlign: "center" },
};
