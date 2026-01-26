// frontend/src/pages/QueueManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import MoneyLoader from "../components/MoneyLoader";
import { fetchQueueToday } from "../api/queue";

const AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 mins

/* =========================
   UI helpers
========================= */
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

function pillStyle(bg = "#fff") {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "3px solid #000",
    fontWeight: 1000,
    background: bg,
    minWidth: 90,
    boxShadow: "4px 4px 0 #000",
    whiteSpace: "nowrap",
  };
}

// team colors
function teamBg(team) {
  const t = String(team || "").toLowerCase();
  if (t.includes("legends")) return "#BFF7C6";
  if (t.includes("maserati")) return "#B7E6FF";
  if (t.includes("falcons")) return "#C7B7FF";
  if (t.includes("sharks")) return "#FFE7B7";
  return "#fff";
}

// outcome colors
function stageBg(outcome) {
  const s = String(outcome || "").toLowerCase();
  if (s.includes("sale")) return "#BFF7C6"; // light green
  if (s.includes("returned")) return "#FFC9C9"; // light red
  if (s.includes("processing")) return "#FFF8DE"; // neon green
  return "#E5E7EB";
}

/* =========================
   Data helpers
========================= */
function safeStr(v) {
  return String(v ?? "").trim();
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseTimeToMinutes(t) {
  const s = safeStr(t);
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function firstName(full) {
  const s = safeStr(full);
  if (!s) return "-";
  return s.split(/\s+/)[0] || "-";
}

// you said you already have this — kept here for complete file
function normalizeOutcome(raw) {
  const s = String(raw || "").trim();

  if (/^lead$/i.test(s)) return "Returned";
  if (/^deal$/i.test(s)) return "Sale";
  if (/^processing$/i.test(s)) return "Processing";

  return s || "-";
}

export default function QueueManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true); // only for initial load
  const [refreshing, setRefreshing] = useState(false); // silent refresh
  const [err, setErr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // sort state
  const [sort, setSort] = useState({ key: "time", dir: "asc" }); // asc | desc

  async function load({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErr("");
    try {
      const data = await fetchQueueToday();
      setRows(data?.rows || []);
      setLastRefreshedAt(Date.now());
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    load({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto refresh every 2 mins (no loader, keep old data visible)
  useEffect(() => {
    const id = setInterval(() => {
      // avoid overlapping refreshes
      if (!refreshing) load({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  // columns config
  const columns = useMemo(
    () => [
      { key: "sr", label: "Sr #", get: (_r, idx) => idx + 1, type: "number" },
      { key: "time", label: "Time", get: (r) => r.time, type: "time" },
      { key: "customerId", label: "Customer ID", get: (r) => r.customerId, type: "string" },
      { key: "state", label: "State", get: (r) => r.state, type: "string" },
      { key: "carrier", label: "Carrier", get: (r) => r.carrier, type: "string" },
      { key: "product", label: "Product", get: (r) => r.product, type: "string" },
      { key: "qualifierName", label: "Qualifier", get: (r) => firstName(r.qualifierName), type: "string" },
      { key: "team", label: "Team", get: (r) => r.team, type: "string" },
      { key: "Validator", label: "Validator", get: (r) => firstName(r.Validator), type: "string" },
      {
        key: "outcome",
        label: "Outcome",
        get: (r) => normalizeOutcome(r.processingStage),
        type: "string",
      },
    ],
    []
  );

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  }

  const sortedRows = useMemo(() => {
    const data = [...rows];
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;

    const dirMul = sort.dir === "asc" ? 1 : -1;

    data.sort((a, b) => {
      const av = col.get(a, 0);
      const bv = col.get(b, 0);

      if (col.type === "time") {
        const am = parseTimeToMinutes(av);
        const bm = parseTimeToMinutes(bv);
        if (am === null && bm === null) return 0;
        if (am === null) return 1;
        if (bm === null) return -1;
        return (am - bm) * dirMul;
      }

      if (col.type === "number") {
        const an = safeNum(av);
        const bn = safeNum(bv);
        if (an === null && bn === null) return 0;
        if (an === null) return 1;
        if (bn === null) return -1;
        return (an - bn) * dirMul;
      }

      const as = safeStr(av).toLowerCase();
      const bs = safeStr(bv).toLowerCase();
      if (as < bs) return -1 * dirMul;
      if (as > bs) return 1 * dirMul;
      return 0;
    });

    return data;
  }, [rows, sort.key, sort.dir, columns]);

  // counts above table
  const counts = useMemo(() => {
    const total = rows.length;
    let sale = 0;
    let processing = 0;
    let returned = 0;

    for (const r of rows) {
      const out = normalizeOutcome(r.processingStage);
      if (out === "Sale") sale += 1;
      else if (out === "Processing") processing += 1;
      else if (out === "Returned") returned += 1;
    }

    return { total, sale, processing, returned };
  }, [rows]);

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F2", padding: 18, fontFamily: "system-ui" }}>
      {loading && <MoneyLoader text="Loading Queue..." />}

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <SketchCard bg="#FFD400">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 1200 }}>QUEUE MANAGEMENT</div>
              <div style={{ fontWeight: 900 }}>Today • FE Only (Legends / Maserati / Falcons / Sharks)</div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pillStyle("#fff")}>Validations: {counts.total}</span>
                <span style={pillStyle("#BFF7C6")}>Sale: {counts.sale}</span>
                <span style={pillStyle("#39FF14")}>Processing: {counts.processing}</span>
                <span style={pillStyle("#FFC9C9")}>Returned: {counts.returned}</span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => load({ silent: false })}
                disabled={loading || refreshing}
                style={{
                  cursor: loading || refreshing ? "not-allowed" : "pointer",
                  border: "4px solid #000",
                  borderRadius: 14,
                  background: "#fff",
                  padding: "10px 14px",
                  fontWeight: 1000,
                  boxShadow: "6px 6px 0 #000",
                  opacity: loading || refreshing ? 0.6 : 1,
                }}
              >
                {loading ? "Loading..." : refreshing ? "Refreshing..." : "Manual Refresh"}
              </button>

              <div style={{ marginTop: 8, fontWeight: 900 }}>
                {lastRefreshedAt ? `Last refreshed: ${new Date(lastRefreshedAt).toLocaleTimeString()}` : "Not refreshed yet"}
              </div>

              <div style={{ marginTop: 6, fontWeight: 900, color: err ? "red" : "#111" }}>
                {err ? `Error: ${err}` : refreshing ? "Live updating…" : "Live"}
              </div>
            </div>
          </div>
        </SketchCard>

        <div style={{ marginTop: 18 }}>
          <SketchCard bg="#FFFFFF">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
                <thead>
                  <tr style={{ background: "#FFA500" }}>
                    {columns.map((c) => {
                      const active = sort.key === c.key;
                      const arrow = active ? (sort.dir === "asc" ? " ▲" : " ▼") : "";
                      return (
                        <th
                          key={c.key}
                          onClick={() => toggleSort(c.key)}
                          title="Click to sort"
                          style={{
                            textAlign: "left",
                            padding: 10,
                            border: "3px solid #000",
                            fontWeight: 1200,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          {c.label}
                          {arrow}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {sortedRows.map((r, idx) => {
                    const outcome = normalizeOutcome(r.processingStage);

                    return (
                      <tr key={`${r.customerId || idx}`}>
                        {/* Sr # */}
                        <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1200, textAlign: "center" }}>
                          {idx + 1}
                        </td>

                        {/* Time */}
                        <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1000 }}>
                          {r.time || "-"}
                        </td>

                        {/* Customer ID */}
                        <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1100 }}>
                          {r.customerId || "-"}
                        </td>

                        {/* State */}
                        <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1100 }}>
                          {r.state || "-"}
                        </td>

                        {/* Carrier */}
                        <td style={{ padding: 10, border: "3px solid #000" }}>
                          <span style={pillStyle("#D1FAE5")}>{r.carrier || "-"}</span>
                        </td>

                        {/* Product */}
                        <td style={{ padding: 10, border: "3px solid #000" }}>
                          <span style={pillStyle("#E0F2FE")}>{r.product || "-"}</span>
                        </td>

                        {/* Qualifier first name */}
                        <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1200 }}>
                        <span style={pillStyle("#E0F2FE")}> {firstName(r.qualifierName)} </span>
                          
                        </td>

                        {/* Team */}
                        <td style={{ padding: 10, border: "3px solid #000" }}>
                          <span style={pillStyle(teamBg(r.team))}>{r.team || "-"}</span>
                        </td>

                        {/* Validator first name */}
                        <td style={{ padding: 10, border: "3px solid #000" }}>
                          <span style={pillStyle("#E0F2FE")}>{firstName(r.Validator)}</span>
                        </td>

                        {/* Outcome */}
                        <td style={{ padding: 10, border: "3px solid #000" }}>
                          <span style={pillStyle(stageBg(outcome))}>{outcome}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && !err && sortedRows.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: 12, fontWeight: 900 }}>
                        No rows returned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SketchCard>
        </div>
      </div>
    </div>
  );
}
