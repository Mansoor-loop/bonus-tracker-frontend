// frontend/src/pages/QueueManagement.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MoneyLoader from "../components/MoneyLoader";
import { fetchQueueToday } from "../api/queue";
import "../QueueManagement.css";
import { getQualifierImage, normalizeQualifierKey } from "../data/agentImages";
import saleSound from "../assests/sounds/Sale.mp3";

const AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 mins
const POPUP_MS = 40 * 1000; // 40 seconds

// storage keys (so events show only once)
const SHOWN_SALES_STORAGE_KEY = "qm_shown_sales_v1";
const SEEN_RECORDS_STORAGE_KEY = "qm_seen_records_v1";
const SHOWN_STATUS_STORAGE_KEY = "qm_shown_status_v1";

/* =========================
   UI helpers (UNCHANGED)
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
  if (s.includes("returned")) return "#E57373"; // light red
  if (s.includes("processing")) return "#FFF1A8"; // neon
  if (s.includes("home office")) return "#c6b1ee";
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

// kept as-is (your logic)
function normalizeOutcome(raw, closerStatus) {
  const s = String(raw || "").trim();
  const cs = String(closerStatus || "").trim();
  if (/^processing$/i.test(s) && /^home\s*office$/i.test(cs)) return "Home Office";
  if (/^lead$/i.test(s)) return "Returned";
  if (/^deal$/i.test(s)) return "Sale";
  if (/^processing$/i.test(s)) return "Processing";
  return s || "-";
}

function rowBgByOutcome(outcome) {
  if (outcome === "Sale") return "#E9FBEF"; // green row
  else if (outcome === "Processing") return "#FFF8DE";
  else if (outcome === "Returned") return "#FFC9C9";
  return "#FFFFFF";
}

/* =========================
   LocalStorage Set helpers
========================= */
function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key, set, max = 800) {
  try {
    const arr = Array.from(set);
    const trimmed = arr.length > max ? arr.slice(arr.length - max) : arr;
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

/* =========================
   Unique record key
========================= */
function recordKey(r) {
  const cid = safeStr(r.customerId);
  const time = safeStr(r.time);
  const qualifier = normalizeQualifierKey(r.qualifierName);
  const team = safeStr(r.team).toUpperCase();
  return `${cid || "NOID"}|${time || "NOTIME"}|${qualifier || "NOQUAL"}|${team || "NOTEAM"}`;
}

/* =========================
   Random quotes (edit freely)
========================= */
const ENTERED_CHAT_QUOTES = [
  "{name} has entered the chat 😎",
  "{name} just spawned in 🔥",
  "{name} joined the lobby 🎮",
  "{name} is online ✅",
  "{name} pulled up 🚗💨",
];

const PROCESSING_QUOTES = [
  "{name} has been sent to processing ⚙️",
  "{name} is cooking in processing 🍳",
  "{name} moved to processing ✅",
  "{name} is in processing mode 🧠",
  "{name} is getting processed 🚀",
];

const RETURNED_QUOTES = [
  "{name} got returned ↩️",
  "{name} bounced back 🟥",
  "{name} returned to queue 📥",
  "{name} reset the play 🔄",
];

const HOME_OFFICE_QUOTES = [
  "{name} went to Home Office 🏢",
  "Home Office got {name} 🏢",
  "{name} is with Home Office now ✅",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeMessage(templateArr, name) {
  const tpl = pickRandom(templateArr);
  return tpl.replaceAll("{name}", name);
}

/* =========================
   Page
========================= */
export default function QueueManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true); // initial load only
  const [refreshing, setRefreshing] = useState(false); // silent refresh
  const [err, setErr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const [sort, setSort] = useState({ key: "time", dir: "asc" });

  // track previous outcomes for transitions
  const prevOutcomeByKeyRef = useRef(new Map());

  // “show once” sets
  const shownSalesRef = useRef(loadSet(SHOWN_SALES_STORAGE_KEY));
  const seenRecordsRef = useRef(loadSet(SEEN_RECORDS_STORAGE_KEY));
  const shownStatusRef = useRef(loadSet(SHOWN_STATUS_STORAGE_KEY));

  // unified popup queue (sale + status)
  const [popup, setPopup] = useState(null);
  const popupQueueRef = useRef([]);
  const popupTimerRef = useRef(null);

  function enqueuePopup(item) {
    popupQueueRef.current.push(item);
    if (!popup) showNextPopup();
  }

  function showNextPopup() {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    const next = popupQueueRef.current.shift();
    if (!next) {
      setPopup(null);
      return;
    }

    setPopup(next);

    popupTimerRef.current = setTimeout(() => {
      setPopup(null);
      showNextPopup();
    }, POPUP_MS);
  }

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);
 let saleAudio;

function playSaleSound() {
  try {
    if (!saleAudio) {
      saleAudio = new Audio(saleSound );
      saleAudio.volume = 0.7; 
    }

    
    saleAudio.currentTime = 0;
    saleAudio.play().catch(() => {
      // autoplay blocked — will work after first user interaction
    });
  } catch (e) {
    // fail silently
  }
}

  async function load({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErr("");
    try {
      const data = await fetchQueueToday();
      const newRows = data?.rows || [];

      const prevMap = prevOutcomeByKeyRef.current;
      const shownSales = shownSalesRef.current;
      const seen = seenRecordsRef.current;
      const shownStatus = shownStatusRef.current;

      for (const r of newRows) {
        const key = recordKey(r);
        const outcome = normalizeOutcome(r.processingStage, r.closerStatus);
        const prevOutcome = prevMap.get(key);

        const qName = firstName(r.qualifierName);
        const imageUrl = getQualifierImage(r.qualifierName);

        // 1) NEW RECORD ADDED -> show random "entered the chat" ONCE
        if (!seen.has(key)) {
          seen.add(key);
          saveSet(SEEN_RECORDS_STORAGE_KEY, seen);

          // message depends on initial outcome
          let msg = makeMessage(ENTERED_CHAT_QUOTES, qName);
          if (outcome === "Processing") msg = makeMessage(PROCESSING_QUOTES, qName);
          if (outcome === "Returned") msg = makeMessage(RETURNED_QUOTES, qName);
          if (outcome === "Home Office") msg = makeMessage(HOME_OFFICE_QUOTES, qName);

          enqueuePopup({
            type: "status",
            title: msg,
            name: qName,
            team: safeStr(r.team),
            time: safeStr(r.time),
            customerId: safeStr(r.customerId),
            imageUrl,
            bg: outcome === "Returned" ? "#FFC9C9" : outcome === "Processing" ? "#FFF1A8" : outcome === "Home Office" ? "#c6b1ee" : "#E0F2FE",
          });
        }

        // 2) OUTCOME CHANGED -> show status toast ONCE per key+newOutcome
        // (prevents repeating on every refresh)
        if (prevOutcome && prevOutcome !== outcome) {
          const statusKey = `${key}::${outcome}`;
          if (!shownStatus.has(statusKey)) {
            shownStatus.add(statusKey);
            saveSet(SHOWN_STATUS_STORAGE_KEY, shownStatus);
            playSaleSound();
            let msg = "";
            if (outcome === "Processing") msg = makeMessage(PROCESSING_QUOTES, qName);
            else if (outcome === "Returned") msg = makeMessage(RETURNED_QUOTES, qName);
            else if (outcome === "Home Office") msg = makeMessage(HOME_OFFICE_QUOTES, qName);
            else if (outcome === "Sale") {
              // Sale handled below as special popup
              msg = "";
            } else {
              msg = `${qName} status changed: ${outcome}`;
            }

            if (msg) {
              enqueuePopup({
                type: "status",
                title: msg,
                name: qName,
                team: safeStr(r.team),
                time: safeStr(r.time),
                customerId: safeStr(r.customerId),
                imageUrl,
                bg: outcome === "Returned" ? "#FFC9C9" : outcome === "Processing" ? "#FFF1A8" : outcome === "Home Office" ? "#c6b1ee" : "#E0F2FE",
              });
            }
          }
        }

        // 3) BECOMES SALE -> show sale popup ONCE
        if (outcome === "Sale" && prevOutcome !== "Sale" && !shownSales.has(key)) {
          shownSales.add(key);
          
          saveSet(SHOWN_SALES_STORAGE_KEY, shownSales);
          playSaleSound();
          enqueuePopup({
            type: "sale",
            title: `${qName} MADE A SALE! ✅`,
            name: qName,
            team: safeStr(r.team),
            time: safeStr(r.time),
            customerId: safeStr(r.customerId),
            imageUrl,
            bg: "#BFF7C6",
          });
        }

        // store latest outcome
        prevMap.set(key, outcome);
        
      }

      // cap prevMap growth
      if (prevMap.size > 5000) {
        const fresh = new Map();
        for (const r of newRows) {
          fresh.set(recordKey(r), normalizeOutcome(r.processingStage, r.closerStatus));
        }
        prevOutcomeByKeyRef.current = fresh;
      }

      setRows(newRows);
      setLastRefreshedAt(Date.now());
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    load({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!refreshing) load({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const columns = useMemo(
    () => [
      { key: "sr", label: "Sr #", get: (_r, idx) => idx + 1, type: "number" },
      { key: "time", label: "Time", get: (r) => r.time, type: "time" },
      { key: "customerId", label: "Customer ID", get: (r) => r.customerId, type: "string" },
      { key: "qualifierName", label: "Qualifier", get: (r) => firstName(r.qualifierName), type: "string" },
      { key: "state", label: "State", get: (r) => r.state, type: "string" },
      { key: "carrier", label: "Carrier", get: (r) => r.carrier, type: "string" },
      { key: "product", label: "Product", get: (r) => r.product, type: "string" },
      { key: "team", label: "Team", get: (r) => r.team, type: "string" },
      { key: "Validator", label: "Validator", get: (r) => firstName(r.Validator), type: "string" },
      {
        key: "outcome",
        label: "Outcome",
        get: (r) => normalizeOutcome(r.processingStage, r.closerStatus),
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

  const counts = useMemo(() => {
    const total = rows.length;
    let sale = 0;
    let processing = 0;
    let returned = 0;
    let homeOffice = 0;

    for (const r of rows) {
      const out = normalizeOutcome(r.processingStage, r.closerStatus);
      if (out === "Sale") sale += 1;
      else if (out === "Processing") processing += 1;
      else if (out === "Returned") returned += 1;
      else if (out === "Home Office") homeOffice += 1;
    }

    return { total, sale, processing, returned, homeOffice };
  }, [rows]);

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F2", padding: 18, fontFamily: "system-ui" }}>
      {loading && <MoneyLoader text="Loading Queue..." />}

      {/* ✅ Popup (Sale + Status messages) */}
      {popup && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 9999,
            width: 280,
            border: "5px solid #000",
            borderRadius: 18,
            boxShadow: "10px 10px 0 #000",
            background: popup.bg || "#E0F2FE",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img
              src={popup.imageUrl}
              alt={popup.name || "Agent"}
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                border: "4px solid #000",
                objectFit: "cover",
                background: "#fff",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 1200, fontSize: 16, lineHeight: 1.15 }}>
                {popup.title}
              </div>
              <div style={{ fontWeight: 900, marginTop: 6 }}>
                {popup.team || "-"}
              </div>
              <div style={{ fontWeight: 900, marginTop: 4, fontSize: 13 }}>
                {popup.customerId ? `ID: ${popup.customerId}` : ""}{" "}
                {popup.time ? `• ${popup.time}` : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <SketchCard bg="#FFD400">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 1200 }}>QUEUE MANAGEMENT</div>
              <div style={{ fontWeight: 900 }}>Today • FE Only (Legends / Maserati / Falcons / Sharks)</div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pillStyle("#fff")}>Validations: {counts.total}</span>
                <span style={pillStyle("#BFF7C6")}>Sale: {counts.sale}</span>
                <span style={pillStyle("#FFF8DE")}>Processing: {counts.processing}</span>
                <span style={pillStyle("#FFC9C9")}>Returned: {counts.returned}</span>
                <span style={pillStyle("#c6b1ee")}>Home Office: {counts.homeOffice}</span>
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
            <div className="qm-tableViewport">
              <div className="qm-tableScale">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                      const outcome = normalizeOutcome(r.processingStage, r.closerStatus);

                      return (
                        <tr key={`${r.customerId || idx}`} style={{ background: rowBgByOutcome(outcome) }}>
                          <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1200, textAlign: "center" }}>
                            {idx + 1}
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1000 }}>
                            {r.time || "-"}
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1100 }}>
                            {r.customerId || "-"}
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1200 }}>
                            <span style={pillStyle("#E0F2FE")}>{firstName(r.qualifierName)}</span>
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000", fontWeight: 1100 }}>
                            {r.state || "-"}
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000" }}>
                            <span>{r.carrier || "-"}</span>
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000" }}>
                            <span>{r.product || "-"}</span>
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000" }}>
                            <span>{r.team || "-"}</span>
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000" }}>
                            <span style={pillStyle("#E0F2FE")}>{firstName(r.Validator)}</span>
                          </td>

                          <td style={{ padding: 10, border: "3px solid #000" }}>
                            <span style={pillStyle(stageBg(outcome))}>{outcome}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SketchCard>
        </div>
      </div>

    </div>
  );
}
