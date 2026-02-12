import React, { useEffect, useMemo, useState } from "react";
// import { fetchBonusRange } from "../api/bonus";
import { fetchFeAgents, fetchFeSummary, refreshBackend } from "../api/summary";
import MoneyLoader from "../components/MoneyLoader";

const TEAMS = ["ALL", "Legends", "Maserati", "Falcons", "Sharks"];
const AUTO_REFRESH_MS = 10 * 60 * 1000;

function fmtUSD0(n) {
  const x = Number(n || 0);
  return "$" + Math.round(x).toLocaleString();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function weekStartISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

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

function PillButton({ active, children, onClick, disabled, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        border: "4px solid #000",
        borderRadius: 14,
        background: active ? color || "#FF4D4D" : "#fff",
        padding: "10px 14px",
        fontWeight: 1000,
        boxShadow: "6px 6px 0 #000",
        marginRight: 10,
        marginBottom: 10,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState("today"); // today | week | custom
  const [team, setTeam] = useState("ALL");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const [feAgents, setFeAgents] = useState({
    totalRecords: 0,
    teamBreakdown: {},
  });
  const [summaryRows, setSummaryRows] = useState([]);
  const inFlightRef = React.useRef(false);

  const dateInputStyle = {
    border: "4px solid #000",
    borderRadius: 12,
    padding: "8px 10px",
    fontWeight: 900,
    background: "#fff",
  };

  // compute range (today/week/custom)
  const effectiveRange = useMemo(() => {
    if (range === "today") {
      const d = todayISO();
      return { start_date: d, end_date: d };
    }
    if (range === "week") {
      return { start_date: weekStartISO(), end_date: todayISO() };
    }
    // custom
    const s = startDate || "";
    const e = endDate || startDate || "";
    return { start_date: s, end_date: e };
  }, [range, startDate, endDate]);

  const canFetchCustom = useMemo(() => {
    if (range !== "custom") return true;
    return !!effectiveRange.start_date && !!effectiveRange.end_date;
  }, [range, effectiveRange.start_date, effectiveRange.end_date]);

  const totalAP = useMemo(
    () => summaryRows.reduce((s, r) => s + Number(r.apSum || 0), 0),
    [summaryRows]
  );

  // BONUS: commented out all bonus aggregation
  // const totalBonus = useMemo(
  //   () => summaryRows.reduce((s, r) => s + Number(r.bonus || 0), 0),
  //   [summaryRows]
  // );

  async function loadAll() {
    if (!canFetchCustom) return;

    setLoading(true);
    setErr("");
    try {
      // Pull FE agents + FE summary
      const [agents, summary] = await Promise.all([
        fetchFeAgents({
          range,
          team,
          startDate: effectiveRange.start_date,
          endDate: effectiveRange.end_date,
        }),
        fetchFeSummary({
          range,
          team,
          startDate: effectiveRange.start_date,
          endDate: effectiveRange.end_date,
        }),
        // BONUS: bonus range fetch commented
        // fetchBonusRange({
        //   start_date: effectiveRange.start_date,
        //   end_date: effectiveRange.end_date,
        //   team,
        // }),
      ]);

      // BONUS: commented out bonus mapping + merge
      // const bonusMap = bonus?.bonusByQualifier || {};
      // const rows = (summary.rows || []).map((r) => {
      //   const b = Number(bonusMap[r.qualifier] || 0);
      //   return { ...r, bonus: b };
      // });

      // Keep summary rows as-is (no bonus merge)
      const rows = summary?.rows || [];

      setFeAgents(agents);
      setSummaryRows(rows);
      setLastRefreshedAt(Date.now());
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, team, effectiveRange.start_date, effectiveRange.end_date]);

  useEffect(() => {
    // only auto-refresh for today/week (not custom)
    if (range === "custom") return;

    const id = setInterval(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await loadAll();
      } finally {
        inFlightRef.current = false;
      }
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, team]);

  async function handleManualRefresh() {
    setLoading(true);
    setErr("");
    try {
      // NOTE: for custom, we do NOT call refreshBackend (unless you add refresh/range on backend)
      if (range === "today" || range === "week") {
        await refreshBackend(range);
      }
      await loadAll();
    } catch (e) {
      setErr(String(e.message || e));
      setLoading(false);
    }
  }

  const topRows = useMemo(() => summaryRows.slice(0, 25), [summaryRows]);

  const MEDALS = {
    1: "https://cdn-icons-png.flaticon.com/128/13461/13461118.png", // Gold
    2: "https://cdn-icons-png.flaticon.com/128/13461/13461115.png", // Silver
    3: "https://cdn-icons-png.flaticon.com/128/13461/13461099.png", // Bronze
  };

  function RankCell({ idx }) {
    const rank = idx + 1;
    const medal = MEDALS[rank];

    if (medal) {
      return (
        <img
          src={medal}
          alt={`Rank ${rank}`}
          style={{
            width: 25,
            height: 26,
            display: "block",
          }}
        />
      );
    }

    return <span style={{ fontWeight: 1200 }}>{rank}</span>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: 18,
        fontFamily: "system-ui",
      }}
    >
      {loading && (
        <MoneyLoader
          text={range === "custom" ? "Loading custom range..." : "Loading dashboard..."}
        />
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* HEADER */}
        <SketchCard bg="#FFD400">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 1100 }}>BONUS TRACKER</div>
              <div style={{ fontWeight: 900 }}>Today / Weekly / Custom • FE only</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                style={{
                  cursor: loading ? "not-allowed" : "pointer",
                  border: "4px solid #000",
                  borderRadius: 14,
                  background: "#fff",
                  padding: "10px 14px",
                  fontWeight: 1000,
                  boxShadow: "6px 6px 0 #000",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Refreshing..." : "Manual Refresh"}
              </button>

              <div style={{ marginTop: 8, fontWeight: 900 }}>
                {lastRefreshedAt
                  ? `Last refreshed: ${new Date(lastRefreshedAt).toLocaleTimeString()}`
                  : "Not refreshed yet"}
              </div>
            </div>
          </div>

          {/* RANGE BUTTONS */}
          <div style={{ marginTop: 14 }}>
            <PillButton active={range === "today"} onClick={() => setRange("today")} disabled={loading}>
              TODAY
            </PillButton>

            <PillButton active={range === "week"} onClick={() => setRange("week")} disabled={loading}>
              WEEKLY
            </PillButton>

            <PillButton
              active={range === "custom"}
              onClick={() => {
                setRange("custom");
                if (!startDate) setStartDate(todayISO());
                if (!endDate) setEndDate(todayISO());
              }}
              disabled={loading}
            >
              CUSTOM
            </PillButton>

            {range === "custom" && (
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 1000, marginBottom: 6 }}>Start</div>
                  <input
                    type="date"
                    value={effectiveRange.start_date}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 1000, marginBottom: 6 }}>End</div>
                  <input
                    type="date"
                    value={effectiveRange.end_date}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TEAM BUTTONS */}
          <div style={{ marginTop: 10 }}>
            {TEAMS.map((t) => (
              <PillButton
                key={t}
                active={team === t}
                onClick={() => setTeam(t)}
                disabled={loading}
                color="#4F8BFF"
              >
                {t.toUpperCase()}
              </PillButton>
            ))}
          </div>

          <div style={{ fontWeight: 1000 }}>
            {!canFetchCustom
              ? "Select start + end date for custom range."
              : loading
              ? "Loading..."
              : err
              ? `Error: ${err}`
              : `Showing: ${range.toUpperCase()} • ${team} • ${effectiveRange.start_date} → ${effectiveRange.end_date}`}
          </div>
        </SketchCard>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 18, marginTop: 18 }}>
          <div style={{ gridColumn: "span 6" }}>
            <SketchCard bg="#4F8BFF">
              <div style={{ fontWeight: 1100 }}>TOTAL SALES ({range.toUpperCase()})</div>
              <div style={{ fontSize: 54, fontWeight: 1200 }}>{feAgents.totalRecords || 0}</div>
            </SketchCard>

            <div style={{ marginTop: 14 }}>
              <SketchCard bg="#8B5CF6">
                <div style={{ fontWeight: 1100 }}>TOTAL AP ({range.toUpperCase()})</div>
                <div style={{ fontSize: 46, fontWeight: 1200 }}>{fmtUSD0(totalAP)}</div>
              </SketchCard>
            </div>

            <div style={{ marginTop: 14 }}>
              <SketchCard bg="#22C55E">
                <div style={{ fontWeight: 1100 }}>TOTAL BONUS ({range.toUpperCase()})</div>
                {/* BONUS: total bonus display commented */}
                {/* <div style={{ fontSize: 40, fontWeight: 1200 }}>{fmtUSD0(totalBonus)}</div> */}
              </SketchCard>
            </div>
          </div>

          <div style={{ gridColumn: "span 6" }}>
            <SketchCard bg="#FF4D4D">
              <div style={{ fontWeight: 1100 }}>TEAM BREAKDOWN</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
                {["Legends", "Maserati", "Falcons", "Sharks"].map((t) => (
                  <div
                    key={t}
                    style={{
                      background: "#fff",
                      border: "4px solid #000",
                      borderRadius: 16,
                      boxShadow: "6px 6px 0 #000",
                      padding: 12,
                      fontWeight: 1000,
                    }}
                  >
                    <div>{t}</div>
                    <div style={{ fontSize: 26 }}>{feAgents.teamBreakdown?.[t] || 0}</div>
                  </div>
                ))}
              </div>
            </SketchCard>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ marginTop: 18 }}>
          <SketchCard bg="#FFFFFF">
            <div style={{ fontSize: 20, fontWeight: 1200 }}>
              QUALIFIER SUMMARY ({range.toUpperCase()}) — FE ONLY
            </div>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FFD400" }}>
                    {["#", "Qualifier", "Total Sales", "Total AP", "Bonus"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: 10,
                          border: "3px solid #000",
                          fontWeight: 1200,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {topRows.map((r, idx) => (
                    <tr key={`${r.qualifier}-${idx}`} style={{ borderBottom: "3px solid #000" }}>
                      <td style={{ padding: 10, fontWeight: 1000, border: "3px solid #000" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                          }}
                        >
                          <RankCell idx={idx} />
                        </div>
                      </td>

                      <td style={{ padding: 10, fontWeight: 1000, border: "3px solid #000" }}>
                        {r.qualifier}
                      </td>

                      <td style={{ padding: 10, fontWeight: 1000, border: "3px solid #000" }}>
                        {Number(r.salesCount || 0)}
                      </td>

                      <td style={{ padding: 10, fontWeight: 1200, border: "3px solid #000" }}>
                        {fmtUSD0(r.apSum)}
                      </td>

                      {/* BONUS: per-row bonus cell commented */}
                      <td style={{ padding: 10, fontWeight: 1200, border: "3px solid #000" }}>
                        {/* {fmtUSD0(r.bonus)} */}
                      </td>
                    </tr>
                  ))}

                  {!loading && !err && topRows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 12, fontWeight: 900 }}>
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
