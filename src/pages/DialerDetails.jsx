// frontend/src/pages/DialerDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchDialerLatest } from "../api/dialer";
import { getQualifierImage } from "../data/agentImagesDialer";

export default function DialerDetails() {
  const [loading, setLoading] = useState(true);       // initial load only
  const [refreshing, setRefreshing] = useState(false); // seamless refresh state
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ✅ sorting
  const [sort, setSort] = useState({ key: "campaign", dir: "asc" }); // campaign|status, asc|desc

  // ✅ popups
  const [popups, setPopups] = useState([]);

  // prev snapshot to detect threshold crossing
  const prevMapRef = useRef(new Map()); // key -> { status, campaign, durationMin }

  function SketchCard({ bg, children }) {
    return (
      <div
        style={{
          background: bg,
          border: "5px solid #000",
          borderRadius: 22,
          boxShadow: "10px 10px 0 #000",
          padding: 18,
        }}
      >
        {children}
      </div>
    );
  }

  function safeStr(v) {
    return String(v ?? "").trim();
  }

  function normalizeCampaign(s) {
    return safeStr(s).toLowerCase();
  }

  function normalizeStatus(s) {
    return safeStr(s).toLowerCase();
  }

  // Accepts: "10m", "10 m", "00:10:12", "00:10", "10:12", "600" (seconds), "600s"
  function parseDurationMinutes(raw) {
    const s = safeStr(raw).toLowerCase();
    if (!s) return null;

    // "10m" or "10 m"
    let m = s.match(/^(\d+(?:\.\d+)?)\s*m$/);
    if (m) return Number(m[1]);

    // "600s"
    m = s.match(/^(\d+(?:\.\d+)?)\s*s$/);
    if (m) return Number(m[1]) / 60;

    // "600" (assume seconds)
    if (/^\d+$/.test(s)) return Number(s) / 60;

    // "hh:mm:ss"
    m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = Number(m[3]);
      return hh * 60 + mm + ss / 60;
    }

    // "mm:ss"
    m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const mm = Number(m[1]);
      const ss = Number(m[2]);
      return mm + ss / 60;
    }
    
    return null;
  }

  function getRowKey(r) {
    // stable key per person + campaign bucket
    const q = safeStr(r.qualifierName).toUpperCase();
    const c = safeStr(r.campaign).toUpperCase();
    return `${q}__${c}`;
  }

  function enqueuePopup({ title, subtitle }) {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setPopups((prev) => [{ id, title, subtitle }, ...prev].slice(0, 4)); // keep max 4 visible

    window.setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 6000);
  }

  function evaluatePopups(newRows) {
    const prevMap = prevMapRef.current;
    const nextMap = new Map();

    for (const r of newRows) {
      const key = getRowKey(r);

      const status = safeStr(r.status);
      const campaign = safeStr(r.campaign);
      const durMin = parseDurationMinutes(r.duration);

      nextMap.set(key, {
        status,
        campaign,
        durMin: durMin ?? null,
      });

      const prev = prevMap.get(key);
      const prevMin = prev?.durMin ?? null;

      // must have duration parsed now and previously
      if (durMin === null) continue;
      const isAvailable = normalizeStatus(status).includes("available");

      // Rule 1: Available + JR CLOSED + crosses 10m
      const isJrClosed = normalizeCampaign(campaign) === "JR CLOSED";
      if (
        isAvailable &&
        isJrClosed &&
        durMin >= 10 &&
        (prevMin === null || prevMin < 10)
      ) {
        enqueuePopup({
          title: `${r.qualifierName} needs attention`,
          subtitle: `JR CLOSED • Available for ${Math.floor(durMin)}m+`,
        });
      }

      // Rule 2: Available + Platinum + crosses 2m
      const isPlatinum = normalizeCampaign(campaign) === "platinum";
      if (
        isAvailable &&
        isPlatinum &&
        durMin >= 2 &&
        (prevMin === null || prevMin < 2)
      ) {
        enqueuePopup({
          title: `${r.qualifierName} is waiting`,
          subtitle: `Platinum • Available for ${Math.floor(durMin)}m+`,
        });
      }
        const isTorpedo = normalizeCampaign(campaign) === "torpedo";
      if (
        isAvailable &&
        isTorpedo &&
        durMin >= 2 &&
        (prevMin === null || prevMin < 2)
      ) {
        enqueuePopup({
          title: `${r.qualifierName} is waiting`,
          subtitle: `Torpedo • Available for ${Math.floor(durMin)}m+`,
        });
      }
    }


    prevMapRef.current = nextMap;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      return (
        (r.qualifierName || "").toLowerCase().includes(q) ||
        (r.campaign || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q) ||
        (r.duration || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const filteredAndSorted = useMemo(() => {
    const data = [...filtered];
    const dirMul = sort.dir === "asc" ? 1 : -1;

    data.sort((a, b) => {
      const av = safeStr(a?.[sort.key]).toLowerCase();
      const bv = safeStr(b?.[sort.key]).toLowerCase();
      if (av < bv) return -1 * dirMul;
      if (av > bv) return 1 * dirMul;
      return 0;
    });

    return data;
  }, [filtered, sort.key, sort.dir]);

  async function load(signal, { silent = false } = {}) {
  setError("");
  if (!silent) setLoading(true);
  else setRefreshing(true);

  try {
    const data = await fetchDialerLatest(signal);
    const newRows = Array.isArray(data?.aaData) ? data.aaData : [];


    evaluatePopups(newRows);

    setRows(newRows);
    setMeta(data?.meta || null);
    
  } catch (e) {
    if (e?.name === "AbortError") return;
    setError(String(e?.message || e));
  } finally {
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }
}


  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal, { silent: false });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto refresh (seamless)
  const inFlightRef = useRef(false);

useEffect(() => {
  if (!autoRefresh) return;

  const t = setInterval(async () => {
    if (inFlightRef.current) return; // prevent overlap
    inFlightRef.current = true;

    const controller = new AbortController();
    try {
      await load(controller.signal, { silent: true });
    } finally {
      inFlightRef.current = false;
    }
  }, 30000);

  return () => clearInterval(t);
  // ✅ only depends on autoRefresh
}, [autoRefresh]);


  return (
    <div style={page}>
      {/* Popups */}
      <div style={popupWrap}>
        {popups.map((p) => (
          <div key={p.id} style={popupCard}>
            <div style={{ fontWeight: 1000 }}>{p.title}</div>
            <div style={{ opacity: 0.85, marginTop: 4, fontWeight: 800 }}>{p.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <SketchCard bg="#FFD400">
      <div style={topBar}>
        <div>
          <div style={title}>Dialer Details</div>
          <div style={subTitle}>
            {meta?.updatedAt ? (
              <>
                Last Updated: <b>{new Date(meta.updatedAt).toLocaleString()}</b> • Age:{" "}
                <b>{meta.ageSeconds}s</b> • Stale: <b>{String(meta.stale)}</b>{" "}
                {refreshing ? <span style={{ marginLeft: 8 }}>• Updating…</span> : null}
              </>
            ) : (
              <>No data received yet (office PC hasn’t pushed).</>
            )}
          </div>
        </div>

        <div style={controls}>
          <button
            onClick={() => {
              const controller = new AbortController();
              load(controller.signal, { silent: true });
            }}
            style={btn}
          >
            Refresh
          </button>

          <label style={toggle}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (30s)
          </label>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / campaign / status..."
            style={input}
          />

          {/* ✅ Sort controls */}
          <div style={sortBar}>
            <select
              value={sort.key}
              onChange={(e) => setSort((prev) => ({ ...prev, key: e.target.value }))}
              style={select}
            >
              <option value="campaign">Sort: Campaign</option>
              <option value="status">Sort: Status</option>
            </select>

            <button
              onClick={() =>
                setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }))
              }
              style={sortBtn}
              title="Toggle sort direction"
            >
              {sort.dir === "asc" ? "▲" : "▼"}
            </button>
          </div>

          <div style={count}>
            Showing <b>{filteredAndSorted.length}</b>
          </div>
        </div>
      </div>
      </SketchCard>
      {loading && <div style={{ marginTop: 12, opacity: 0.9 }}>Loading...</div>}
      {error && <div style={errBox}>{error}</div>}

      {/* Cards */}
      <div style={{marginTop: 15 }}></div>
      <SketchCard bg="#FFFFFF">
        <div style={gridWrap}>
          {filteredAndSorted.map((r, idx) => {
            const name = r.qualifierName || "-";
            const campaign = r.campaign || "-";
            const status = r.status || "-";
            const duration = r.duration || "-";
            const img = getQualifierImage(name);

            return (
              <div key={`${name}-${campaign}-${idx}`} style={card}>
                <div style={avatarWrap}>
                  <img src={img} alt={name} style={avatar} />
                </div>

                <div style={nameStyle}>{name}</div>

                <div style={campaignStyle} title={campaign}>
                  {campaign}
                </div>

                <div style={metaRow}>
                  <span style={statusPill(status)}>{status}</span>
                  <span style={dot}>•</span>
                  <span style={durationStyle}>{duration}</span>
                </div>
              </div>
            );
          })}

          {!loading && filteredAndSorted.length === 0 && (
            <div style={{ opacity: 0.8, padding: 18 }}>No results</div>
          )}
        </div>
      </SketchCard>
    </div>
  );
}

/* =========================
   Styles
========================= */
const page = { padding: 18 };

const popupWrap = {
  position: "fixed",
  top: 14,
  right: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  zIndex: 9999,
};

const popupCard = {
  width: 320,
  border: "4px solid #000",
  borderRadius: 16,
  background: "#FFD400",
  boxShadow: "10px 10px 0 #000",
  padding: 12,
};

const topBar = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};

const title = { fontSize: 22, fontWeight: 900, marginBottom: 4 };
const subTitle = { fontSize: 13, opacity: 0.85, lineHeight: 1.3 };

const controls = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const btn = {
  padding: "9px 12px",
  cursor: "pointer",
  borderRadius: 10,
  border: "1px solid #222",
  background: "#fff",
  fontWeight: 700,
};

const toggle = { display: "flex", alignItems: "center", gap: 8, fontSize: 13 };

const input = {
  padding: "9px 12px",
  minWidth: 260,
  borderRadius: 10,
  border: "1px solid #222",
};

const sortBar = { display: "flex", alignItems: "center", gap: 6 };

const select = {
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid #222",
  background: "#fff",
  fontWeight: 800,
};

const sortBtn = {
  width: 40,
  height: 38,
  borderRadius: 10,
  border: "1px solid #222",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const count = { opacity: 0.9 };

const errBox = {
  marginTop: 12,
  color: "crimson",
  whiteSpace: "pre-wrap",
  border: "1px solid rgba(220,20,60,0.35)",
  background: "rgba(220,20,60,0.06)",
  padding: 12,
  borderRadius: 10,
};

const gridWrap = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const card = {
  border: "1px solid #222",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
  boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const avatarWrap = {
  width: 86,
  height: 86,
  borderRadius: 999,
  overflow: "hidden",
  border: "2px solid #111",
  boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
  background: "#f3f3f3",
};

const avatar = { width: "100%", height: "100%", objectFit: "cover" };

const nameStyle = { marginTop: 10, fontWeight: 900, fontSize: 16 };

const campaignStyle = {
  marginTop: 6,
  fontSize: 13,
  opacity: 0.85,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const metaRow = {
  marginTop: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "center",
};

const dot = { opacity: 0.55 };
const durationStyle = { fontSize: 13, opacity: 0.9, fontWeight: 700 };

function statusPill(status) {
  const s = (status || "").toLowerCase();

  let border = "#555";
  let bg = "rgba(0,0,0,0.04)";

  if (s.includes("busy") || s.includes("in call") || s.includes("incall")) {
    border = "#16a34a";
    bg = "rgba(22, 163, 74, 0.10)";
  } else if (s.includes("paused")) {
    border = "#f59e0b";
    bg = "rgba(245, 158, 11, 0.12)";
  } else if (s.includes("ready")) {
    border = "#2563eb";
    bg = "rgba(37, 99, 235, 0.10)";
  } else if (s.includes("available")) {
    border = "#111";
    bg = "rgba(0,0,0,0.06)";
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: bg,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    boxShadow: "4px 4px 0 #000",
  };
}
