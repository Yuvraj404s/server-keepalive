import { useState, useEffect, useRef } from "react";
import { SERVICES } from "../services";

const INTERVAL_SECONDS = 600;

export default function Home() {
  const [resultMap, setResultMap] = useState({});
  const [pingingMap, setPingingMap] = useState({});
  const [selected, setSelected] = useState(new Set(SERVICES.map((s) => s.url)));
  const [countdown, setCountdown] = useState(INTERVAL_SECONDS);
  const countdownRef = useRef(INTERVAL_SECONDS);

  async function pingServices(services) {
    if (!services.length) return;
    setPingingMap((prev) => {
      const next = { ...prev };
      services.forEach((s) => (next[s.url] = true));
      return next;
    });

    for (const svc of services) {
      try {
        const res = await fetch(`/api/ping?urls=${encodeURIComponent(svc.url)}`);
        const data = await res.json();
        const result = data.results[0];
        setResultMap((prev) => ({ ...prev, [svc.url]: result }));
      } catch (e) {
        setResultMap((prev) => ({
          ...prev,
          [svc.url]: { ...svc, status: "error", statusCode: 0, ms: 0, lastPing: new Date().toISOString() },
        }));
      } finally {
        setPingingMap((prev) => ({ ...prev, [svc.url]: false }));
      }
    }
  }

  function pingAll() { pingServices(SERVICES); countdownRef.current = INTERVAL_SECONDS; }
  function pingSelected() { pingServices(SERVICES.filter((s) => selected.has(s.url))); }
  function pingSingle(svc) { pingServices([svc]); }
  function toggleSelect(url) {
    setSelected((prev) => { const n = new Set(prev); n.has(url) ? n.delete(url) : n.add(url); return n; });
  }
  function selectAll() { setSelected(new Set(SERVICES.map((s) => s.url))); }
  function selectNone() { setSelected(new Set()); }

  useEffect(() => {
    pingAll();
    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) { pingAll(); countdownRef.current = INTERVAL_SECONDS; }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (s) => `${String(Math.floor(Math.max(s,0)/60)).padStart(2,"0")}:${String(Math.max(s,0)%60).padStart(2,"0")}`;
  const grouped = SERVICES.reduce((acc, s) => { if (!acc[s.project]) acc[s.project]=[]; acc[s.project].push(s); return acc; }, {});
  const anyPinging = Object.values(pingingMap).some(Boolean);

  return (
    <div style={S.page}>
      <h1 style={S.title}>🛡️ Server Keepalive</h1>
      <p style={S.sub}>
        Sequential pings every 10 min · Next in <strong style={{color:"#f97316"}}>{fmt(countdown)}</strong>
      </p>
      <div style={S.controls}>
        <button style={S.btnPrimary} onClick={pingAll} disabled={anyPinging}>🔁 Ping All</button>
        <button style={{...S.btnSecondary, opacity: selected.size===0?0.4:1}} onClick={pingSelected} disabled={anyPinging||selected.size===0}>
          ⚡ Ping Selected ({selected.size})
        </button>
        <button style={S.btnGhost} onClick={selectAll}>Select All</button>
        <button style={S.btnGhost} onClick={selectNone}>Select None</button>
      </div>
      {anyPinging && <p style={{color:"#a1a1aa",fontSize:"0.78rem",marginBottom:"1rem"}}>⏳ Pinging sequentially...</p>}

      {Object.entries(grouped).map(([project, svcs]) => (
        <div key={project} style={S.group}>
          <h2 style={S.groupTitle}>{project}</h2>
          <div style={S.grid}>
            {svcs.map((svc) => {
              const r = resultMap[svc.url];
              const isPinging = pingingMap[svc.url];
              const isSelected = selected.has(svc.url);
              const badgeStyle = isPinging ? S.badgePending : r?.status==="ok" ? S.badgeOk : r?.status==="error" ? S.badgeErr : S.badgePending;
              const badgeText = isPinging ? "⏳ Pinging" : r?.status==="ok" ? "✅ UP" : r?.status==="error" ? "❌ DOWN" : "—";
              return (
                <div key={svc.url} style={{...S.card,...(isSelected?S.cardSelected:{}),...(isPinging?S.cardPinging:{})}} onClick={()=>toggleSelect(svc.url)}>
                  <div style={S.cardHeader}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                      <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(svc.url)} onClick={(e)=>e.stopPropagation()} style={{accentColor:"#f97316",cursor:"pointer"}}/>
                      <span style={S.cardName}>{svc.name}</span>
                    </div>
                    <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                      <span style={{...S.badge,...badgeStyle}}>{badgeText}</span>
                      <button style={S.pingBtn} onClick={(e)=>{e.stopPropagation();pingSingle(svc);}} disabled={isPinging} title="Ping now">🔁</button>
                    </div>
                  </div>
                  <div style={S.url}>{svc.url}</div>
                  {r && <div style={S.meta}>HTTP <span style={S.metaVal}>{r.statusCode??"—"}</span> · <span style={S.metaVal}>{r.ms}ms</span> · {new Date(r.lastPing).toLocaleTimeString()}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p style={S.footer}>24/7 on Vercel · Sequential · <a href="https://github.com/Yuvraj404s/server-keepalive" style={{color:"#52525b"}}>GitHub</a></p>
    </div>
  );
}

const S = {
  page:{fontFamily:"system-ui,sans-serif",background:"#18181b",color:"#e4e4e7",minHeight:"100vh",padding:"2.5rem 2rem",display:"flex",flexDirection:"column",alignItems:"center"},
  title:{fontSize:"1.5rem",fontWeight:800,color:"#f97316",marginBottom:"0.4rem"},
  sub:{color:"#71717a",fontSize:"0.85rem",marginBottom:"1.2rem",textAlign:"center"},
  controls:{display:"flex",gap:"0.6rem",flexWrap:"wrap",justifyContent:"center",marginBottom:"0.8rem"},
  btnPrimary:{background:"#f97316",color:"#fff",border:"none",borderRadius:"8px",padding:"0.55rem 1.5rem",fontSize:"0.85rem",fontWeight:700,cursor:"pointer"},
  btnSecondary:{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:"8px",padding:"0.55rem 1.5rem",fontSize:"0.85rem",fontWeight:700,cursor:"pointer"},
  btnGhost:{background:"transparent",color:"#71717a",border:"1px solid #3f3f46",borderRadius:"8px",padding:"0.55rem 1rem",fontSize:"0.8rem",cursor:"pointer"},
  group:{width:"100%",maxWidth:"960px",marginBottom:"2rem"},
  groupTitle:{fontSize:"0.75rem",fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.8rem",borderBottom:"1px solid #27272a",paddingBottom:"0.4rem"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(290px,1fr))",gap:"0.85rem"},
  card:{background:"#27272a",border:"1px solid #3f3f46",borderRadius:"10px",padding:"1.1rem 1.4rem",cursor:"pointer"},
  cardSelected:{borderColor:"#f97316"},
  cardPinging:{borderColor:"#854d0e"},
  cardHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},
  cardName:{fontWeight:700,fontSize:"0.85rem",color:"#d4d4d8"},
  badge:{fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:"4px"},
  badgeOk:{background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)"},
  badgeErr:{background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)"},
  badgePending:{background:"rgba(234,179,8,0.12)",color:"#fde047",border:"1px solid rgba(234,179,8,0.25)"},
  pingBtn:{background:"#3f3f46",border:"none",borderRadius:"5px",padding:"2px 6px",cursor:"pointer",fontSize:"0.75rem"},
  url:{fontFamily:"monospace",fontSize:"0.68rem",color:"#52525b",marginBottom:"0.4rem",wordBreak:"break-all"},
  meta:{fontSize:"0.7rem",color:"#52525b"},
  metaVal:{color:"#a1a1aa"},
  footer:{marginTop:"2rem",color:"#3f3f46",fontSize:"0.72rem",textAlign:"center"},
};
