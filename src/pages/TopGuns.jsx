import React, { useEffect, useMemo, useState } from "react";
import { fetchFeSummary } from "../api/summary";
import MoneyLoader from "../components/MoneyLoader";
import TopGunCard from "../components/TopGunCard";
import "../TopGun.css";

/* =========================
   Date helpers
========================= */
function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function startOfThisWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - diff);
  return toISO(d);
}

function endOfThisWeekISO() {
  const d = new Date(startOfThisWeekISO() + "T00:00:00Z");
  d.setDate(d.getDate() + 6);
  return toISO(d);
}

function thisWeekRangeISO() {
  return { start_date: startOfThisWeekISO(), end_date: endOfThisWeekISO() };
}

function lastWeekRangeISO() {
  const thisMon = new Date(startOfThisWeekISO() + "T00:00:00Z");
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);
  const lastSun = new Date(lastMon);
  lastSun.setDate(lastMon.getDate() + 6);
  return { start_date: toISO(lastMon), end_date: toISO(lastSun) };
}

function thisMonthRangeISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { start_date: toISO(start), end_date: toISO(end) };
}

function lastMonthRangeISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return { start_date: toISO(start), end_date: toISO(end) };
}

/* =========================
   UI: period selector
========================= */
const RANGE_OPTIONS = [
  { key: "this_week", label: "THIS WEEK" },
  { key: "last_week", label: "LAST WEEK" },
  // { key: "this_month", label: "THIS MONTH" },
  // { key: "last_month", label: "LAST MONTH" },
];

function RangePill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: "4px solid #000",
        borderRadius: 14,
        padding: "10px 12px",
        fontWeight: 1000,
        boxShadow: "6px 6px 0 #000",
        background: active ? "#4F8BFF" : "#fff",
        color: "#000",
        minWidth: 130,
        textAlign: "center",
      }}
    >
      {children}
    </button>
  );
}

/* =========================
   Page
========================= */
export default function TopGuns() {
  const [period, setPeriod] = useState("last_week"); // ✅ default last week
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Period -> actual dates
  const effectiveRange = useMemo(() => {
    if (period === "this_week") return thisWeekRangeISO();
    if (period === "last_week") return lastWeekRangeISO();
    if (period === "this_month") return thisMonthRangeISO();
    return lastMonthRangeISO();
  }, [period]);

  // ✅ Fetch whenever period changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetchFeSummary({
          range: "custom",
          startDate: effectiveRange.start_date,
          endDate: effectiveRange.end_date,
          team: "ALL",
        });

        if (!cancelled) setRows(res?.rows || []);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [effectiveRange.start_date, effectiveRange.end_date]);

  const topPlayers = useMemo(() => {
    return [...rows]
      .sort((a, b) => (b.apSum || 0) - (a.apSum || 0))
      .slice(0, 15);
  }, [rows]);

  const subtitle =
    period === "this_week"
      ? "This Week • Ranking"
      : period === "last_week"
      ? "Last Week • Ranking"
      : period === "this_month"
      ? "This Month • Ranking"
      : "Last Month • Ranking";

  return (
    <div style={{ padding: 20 }}>
      {loading && <MoneyLoader text="Loading Top Guns..." />}

      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            background: "#FFD400",
            border: "5px solid #000",
            borderRadius: 20,
            boxShadow: "10px 10px 0 #000",
            padding: 16,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 1200 }}>TOP GUNS</div>
            <div style={{ fontWeight: 900 }}>{subtitle}</div>
            <div style={{ fontWeight: 900, opacity: 0.9 }}>
              {effectiveRange.start_date} → {effectiveRange.end_date}
            </div>
          </div>

          {/* ✅ Buttons on right */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {RANGE_OPTIONS.map((opt) => (
              <RangePill key={opt.key} active={period === opt.key} onClick={() => setPeriod(opt.key)}>
                {opt.label}
              </RangePill>
            ))}
          </div>
        </div>

        {err && (
          <div style={{ fontWeight: 900, color: "red", marginBottom: 12 }}>
            Error: {err}
          </div>
        )}

        <div className="tg-wrap">
          {topPlayers.map((p, idx) => (
            <TopGunCard
              key={`${p.qualifier}-${idx}`}
              rank={idx + 1}
              name={p.qualifier}
              sales={p.salesCount}
              ap={p.apSum}
              ovr={Math.round((p.salesCount || 0) * 10 + (p.apSum || 0) / 1000)}
              // imageUrl={getAgentImage(p.qualifier)} // optional mapping
            />
          ))}
        </div>
      </div>
    </div>
  );
}
