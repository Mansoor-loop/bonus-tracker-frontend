// src/pages/AdminBonus.jsx
import React, { useMemo, useState } from "react";
import {
  clearAdminKey,
  deleteBonus,
  fetchBonusRange,
  getAdminKey,
  setAdminKey as persistAdminKey,
  upsertBonus,
} from "../api/bonus";

const TEAMS = ["ALL", "Legends", "Maserati", "Falcons", "Sharks"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function weekStartISO() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun ... 6 Sat
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

function SmallBtn({ children, onClick, bg = "#fff", disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        border: "4px solid #000",
        borderRadius: 14,
        background: bg,
        padding: "10px 14px",
        fontWeight: 1000,
        boxShadow: "6px 6px 0 #000",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Pill({ active, children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        border: "4px solid #000",
        borderRadius: 14,
        background: active ? "#FF4D4D" : "#fff",
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

export default function AdminBonus() {
  // auth (simple)
  const [adminKeyInput, setAdminKeyInput] = useState(getAdminKey());
  const [isAuthed, setIsAuthed] = useState(!!getAdminKey());

  // filters
  const [mode, setMode] = useState("today"); // today | week | custom
  const [team, setTeam] = useState("ALL");
  const [startDate, setStartDate] = useState(weekStartISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [qSearch, setQSearch] = useState("");

  // table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // form (add/edit)
  const [editId, setEditId] = useState(null);
  const [bonusDate, setBonusDate] = useState(todayISO());
  const [qualifier, setQualifier] = useState("");
  const [formTeam, setFormTeam] = useState("Legends");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const effectiveRange = useMemo(() => {
    if (mode === "today") return { start_date: todayISO(), end_date: todayISO() };
    if (mode === "week") return { start_date: weekStartISO(), end_date: todayISO() };
    return { start_date: startDate, end_date: endDate };
  }, [mode, startDate, endDate]);

  const filteredRows = useMemo(() => {
    const s = qSearch.trim().toLowerCase();
    const base = rows;
    if (!s) return base;
    return base.filter((r) => String(r.qualifier || "").toLowerCase().includes(s));
  }, [rows, qSearch]);
console.log("bonus rows sample:", rows?.[0]);
  function login() {
    persistAdminKey(adminKeyInput);
    setIsAuthed(true);
  }

  function logout() {
    clearAdminKey();
    setIsAuthed(false);
  }

  function resetForm() {
    setEditId(null);
    setBonusDate(todayISO());
    setQualifier("");
    setFormTeam("Legends");
    setAmount("");
    setNote("");
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchBonusRange({
        start_date: effectiveRange.start_date,
        end_date: effectiveRange.end_date,
        team,
      });
      setRows(data.rows || []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setErr("");
    try {
      await upsertBonus({
        bonus_date: bonusDate,
        qualifier: qualifier.trim(),
        team: formTeam,
        amount: Number(amount),
        note,
      });
      await load();
      resetForm();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(r) {
    setEditId(r.id);
    setBonusDate(r.bonus_date);
    setQualifier(r.qualifier || "");
    setFormTeam(r.team || "Legends");
    setAmount(String(r.amount ?? ""));
    setNote(r.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!window.confirm("Delete this bonus record?")) return;
    setLoading(true);
    setErr("");
    try {
      await deleteBonus(id);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F7" }}>
      {/* Page header */}
      <SketchCard bg="#FFD400">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 1200 }}>ADMIN — BONUS</div>
            <div style={{ fontWeight: 900 }}>Add / Edit / Delete • Daily / Weekly / Custom</div>
          </div>

          {isAuthed ? (
            <SmallBtn onClick={logout} bg="#fff" disabled={loading}>
              Logout
            </SmallBtn>
          ) : null}
        </div>

        {/* Auth */}
        {!isAuthed ? (
          <div
            style={{
              marginTop: 14,
              background: "#fff",
              border: "4px solid #000",
              borderRadius: 16,
              boxShadow: "6px 6px 0 #000",
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Enter ADMIN_KEY</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="ADMIN_KEY"
                style={{
                  flex: 1,
                  minWidth: 260,
                  padding: 12,
                  border: "3px solid #000",
                  borderRadius: 14,
                  fontWeight: 900,
                  boxSizing: "border-box",
                }}
              />
              <SmallBtn onClick={login} bg="#4F8BFF">
                Login
              </SmallBtn>
            </div>
          </div>
        ) : (
          <>
            {/* ADD / EDIT BONUS */}
            <div
              style={{
                marginTop: 14,
                background: "#fff",
                border: "4px solid #000",
                borderRadius: 16,
                boxShadow: "6px 6px 0 #000",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1200, fontSize: 18 }}>{editId ? "EDIT BONUS" : "ADD BONUS"}</div>

              {/* Responsive form layout (no overlap) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: 12,
                  marginTop: 12,
                  alignItems: "end",
                }}
              >
                <div style={{ gridColumn: "span 12", maxWidth: 260 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Date</div>
                  <input
                    type="date"
                    value={bonusDate}
                    onChange={(e) => setBonusDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "3px solid #000",
                      borderRadius: 14,
                      fontWeight: 900,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "span 12", minWidth: 260 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Qualifier</div>
                  <input
                    value={qualifier}
                    onChange={(e) => setQualifier(e.target.value)}
                    placeholder="Exact qualifier name"
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "3px solid #000",
                      borderRadius: 14,
                      fontWeight: 900,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "span 12", maxWidth: 240 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Team</div>
                  <select
                    value={formTeam}
                    onChange={(e) => setFormTeam(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "3px solid #000",
                      borderRadius: 14,
                      fontWeight: 900,
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  >
                    {TEAMS.filter((t) => t !== "ALL").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "span 12", maxWidth: 240 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Amount</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    inputMode="numeric"
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "3px solid #000",
                      borderRadius: 14,
                      fontWeight: 900,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "span 12" }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Note (optional)</div>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "3px solid #000",
                      borderRadius: 14,
                      fontWeight: 900,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <SmallBtn onClick={save} bg="#22C55E" disabled={loading}>
                  {editId ? "Save Changes" : "Add Bonus"}
                </SmallBtn>
                <SmallBtn onClick={resetForm} bg="#fff" disabled={loading}>
                  Clear
                </SmallBtn>
                <SmallBtn onClick={load} bg="#4F8BFF" disabled={loading}>
                  Load Records
                </SmallBtn>
              </div>

              <div style={{ marginTop: 10, fontWeight: 900 }}>
                {loading ? "Loading..." : err ? `Error: ${err}` : "Ready"}
              </div>
            </div>

            {/* FILTERS */}
            <div
              style={{
                marginTop: 14,
                background: "#fff",
                border: "4px solid #000",
                borderRadius: 16,
                boxShadow: "6px 6px 0 #000",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 1200, fontSize: 18 }}>FILTERS</div>

              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Pill active={mode === "today"} onClick={() => setMode("today")} disabled={loading}>
                  TODAY
                </Pill>
                <Pill active={mode === "week"} onClick={() => setMode("week")} disabled={loading}>
                  WEEK
                </Pill>
                <Pill active={mode === "custom"} onClick={() => setMode("custom")} disabled={loading}>
                  CUSTOM
                </Pill>

                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  style={{
                    border: "4px solid #000",
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontWeight: 1000,
                    boxShadow: "6px 6px 0 #000",
                    background: "#fff",
                  }}
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <input
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  placeholder="Search qualifier..."
                  style={{
                    minWidth: 240,
                    padding: "10px 14px",
                    border: "4px solid #000",
                    borderRadius: 14,
                    fontWeight: 900,
                    boxShadow: "6px 6px 0 #000",
                    boxSizing: "border-box",
                  }}
                />

                {mode === "custom" && (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        border: "4px solid #000",
                        borderRadius: 14,
                        fontWeight: 900,
                        boxShadow: "6px 6px 0 #000",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        border: "4px solid #000",
                        borderRadius: 14,
                        fontWeight: 900,
                        boxShadow: "6px 6px 0 #000",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                  </>
                )}

                <SmallBtn onClick={load} bg="#4F8BFF" disabled={loading}>
                  Apply / Refresh
                </SmallBtn>
              </div>

              <div style={{ marginTop: 10, fontWeight: 900 }}>
                Range: {effectiveRange.start_date} → {effectiveRange.end_date} • Team: {team}
              </div>
            </div>
        

            {/* BONUS RECORDS TABLE */}
            <div style={{ marginTop: 14 }}>
              <SketchCard bg="#FFFFFF">
                <div style={{ fontSize: 20, fontWeight: 1200 }}>BONUS RECORDS</div>
                <div style={{ marginTop: 6, fontWeight: 900 }}>
                  {loading ? "Loading..." : err ? `Error: ${err}` : `Records: ${filteredRows.length}`}
                </div>

                <div style={{ marginTop: 12, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FFD400" }}>
                        {["Date", "Qualifier", "Team", "Amount", "Note", "Actions"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: 10, border: "4px solid #000", fontWeight: 1200 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "3px solid #000" }}>
                          <td style={{ padding: 10, fontWeight: 900, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            {r.bonus_date}
                          </td>
                          <td style={{ padding: 10, fontWeight: 900, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            {r.qualifier}
                          </td>
                          <td style={{ padding: 10, fontWeight: 900, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            {r.team || "-"}
                          </td>
                          <td style={{ padding: 10, fontWeight: 1200, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            ${Math.round(Number(r.amount || 0)).toLocaleString()}
                          </td>
                          <td style={{ padding: 10, fontWeight: 900, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            {r.note || ""}
                          </td>
                          <td style={{ padding: 10, borderLeft: "3px solid #000", borderRight: "3px solid #000" }}>
                            <button
                              onClick={() => startEdit(r)}
                              disabled={loading}
                              style={{
                                border: "3px solid #000",
                                borderRadius: 12,
                                padding: "6px 10px",
                                fontWeight: 1000,
                                cursor: "pointer",
                                marginRight: 8,
                                opacity: loading ? 0.6 : 1,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(r.id)}
                              disabled={loading}
                              style={{
                                border: "3px solid #000",
                                borderRadius: 12,
                                padding: "6px 10px",
                                fontWeight: 1000,
                                cursor: "pointer",
                                background: "#FF4D4D",
                                opacity: loading ? 0.6 : 1,
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!loading && !err && filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: 12, fontWeight: 900 }}>
                            No records for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SketchCard>
            </div>
          </>
        )}
      </SketchCard>
    </div>
  );
}
