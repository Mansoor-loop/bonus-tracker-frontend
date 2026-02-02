// frontend/src/pages/GoldRush.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./GoldRush.css";
import MoneyLoader from "../components/MoneyLoader";
import { fetchFeSummary } from "../api/summary";

import bgLoop from "../assests/sounds/theme.mp3";

/* =========================
   IMPORT AGENT IMAGES
========================= */

// GOLD
import stephanie from "../assests/agents/stephaniegold.png";
import mozell from "../assests/agents/mozellgold.png";
import catherine from "../assests/agents/catherinegold.png";
import kevin from "../assests/agents/kevingold.png";
import donovan from "../assests/agents/donovangold.png";

// SILVER
import johnb from "../assests/agents/johnbsilver.png";
import chase from "../assests/agents/chasesilver.png";
import loren from "../assests/agents/lorensilver.png";
import tia from "../assests/agents/tia silver.png";
import verraricka from "../assests/agents/verrasilver.png";

// BRONZE
import robert from "../assests/agents/robertbronze.jpg";
import leader from "../assests/agents/leaderbronze.jpg";
import mustafa from "../assests/agents/mustafabronze.jpg";
import ron from "../assests/agents/ronbronze.jpg";
import rhode from "../assests/agents/rhodebronze.jpg";
import max from "../assests/agents/maxbronze.jpg";

// ROOKIE
import rookie1 from "../assests/agents/shadow.png";
import rookie2 from "../assests/agents/shadow.png";
import rookie3 from "../assests/agents/shadow.png";
import rookie4 from "../assests/agents/shadow.png";
import rookie5 from "../assests/agents/shadow.png";

/* =========================
   HELPERS
========================= */
const AUTO_REFRESH_MS = 3 * 60 * 1000; // ✅ 3 mins

function fmtUSD0(n) {
  const x = Number(n || 0);
  return "$" + Math.round(x).toLocaleString();
}

function normalizeName(name) {
  return String(name || "").trim().toUpperCase();
}

function getISOWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/* =========================
   TIER CONFIG
========================= */
const TIER_MAP = {
  // GOLD
  "STEPHANIE SANTIAGO": "GOLD",
  "DONOVN ROMARIO": "GOLD",
  "MOZELL HARDY": "GOLD",
  "KEVIN GONCALVES": "GOLD",
  "CATHERINE CASSESE": "GOLD",

  // SILVER
  "VERRARICKA HOSEA": "SILVER",
  "JOHN BARNES": "SILVER",
  "CHASE DUROUSSEAU": "SILVER",
  "LOREN MURRAY": "SILVER",
  "TIA SPICER": "SILVER",

  // BRONZE (6 members)
  "ROBERT FRATER": "BRONZE",
  "MICHAEL LEADER": "BRONZE",
  "MUSTAFA PUELLO": "BRONZE",
  "RON MASELKO": "BRONZE",
  "RHODE RAPHAEL": "BRONZE",
  "MAX MUNROE": "BRONZE",

  // ROOKIE
  "JAMAR STRONG": "ROOKIE",
  "NAJEE WILLIAMS": "ROOKIE",
  "JAMEEL GILL": "ROOKIE",
  "MALONE FLEMING": "ROOKIE",
};

const IMAGE_MAP = {
  // GOLD
  "STEPHANIE SANTIAGO": stephanie,
  "DONOVN ROMARIO": donovan,
  "MOZELL HARDY": mozell,
  "KEVIN GONCALVES": kevin,
  "CATHERINE CASSESE": catherine,

  // SILVER
  "VERRARICKA HOSEA": verraricka,
  "JOHN BARNES": johnb,
  "CHASE DUROUSSEAU": chase,
  "LOREN MURRAY": loren,
  "TIA SPICER": tia,

  // BRONZE
  "ROBERT FRATER": robert,
  "MICHAEL LEADER": leader,
  "MUSTAFA PUELLO": mustafa,
  "RON MASELKO": ron,
  "RHODE RAPHAEL": rhode,
  "MAX MUNROE": max,

  // ROOKIE
  "JAMAR STRONG": rookie1,
  "JAMEEL GILL": rookie2,
  "NAJEE WILLIAMS": rookie3,
  "MALONE FLEMING": rookie4,
  "__ROOKIE_FALLBACK__": rookie5,
};

/* =========================
   BUILD TIER LISTS (ALWAYS SHOW CARDS)
   - We build from TIER_MAP (fixed roster)
   - Then merge stats from API rows (ap/sales)
========================= */
function buildTierRankAlwaysShow(rows, tierName, limit) {
  const stats = new Map();

  for (const r of rows || []) {
    const qRaw = r?.qualifier;
    const key = normalizeName(qRaw);
    if (!key) continue;

    stats.set(key, {
      ap: Number(r?.apSum || 0),
      sales: Number(r?.salesCount || 0),
      name: qRaw || key,
    });
  }

  // take the fixed roster for this tier
  const roster = Object.keys(TIER_MAP).filter((k) => TIER_MAP[k] === tierName);

  const items = roster.map((key) => {
    const s = stats.get(key);
    return {
      key,
      name: s?.name || key,
      ap: s?.ap ?? 0,
      sales: s?.sales ?? 0,
      img: IMAGE_MAP[key] || null,
    };
  });

  // rank inside tier by AP (even if all 0)
  items.sort((a, b) => b.ap - a.ap);

  const sliced = typeof limit === "number" ? items.slice(0, limit) : items;

  return sliced.map((x, idx) => ({
    ...x,
    rank: idx + 1,
  }));
}

/* =========================
   CARD RENDER
========================= */
function TierSection({
  tier,
  title,
  subtitle,
  wrapperClass,
  heroClass,
  titleClass,
  subClass,
  rowClass,
  cardClass,
  rankClass,
  avatarClass,
  nameClass,
  statsClass,
}) {
  return (
    <section className={`gold-section ${wrapperClass}`}>
      <div className={`${title}-tier-wrapper`}>
        <div className={heroClass}>
          <h1 className={titleClass}>{title}</h1>
          <p className={subClass}>{subtitle}</p>
        </div>

        <div className={rowClass}>
          {tier.map((a) => (
            <div className={cardClass} key={a.key}>
              <div className={rankClass}>#{a.rank}</div>

              <div className={avatarClass}>
                {a.img ? <img src={a.img} alt={a.name} /> : <div style={{ height: 120 }} />}
              </div>

              <div className={nameClass}>{a.name}</div>

              <div className={statsClass}>
                <div>Total AP: {fmtUSD0(a.ap)}</div>
                <div>Total Sales: {a.sales}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================
   PAGE
========================= */
export default function GoldRush() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);        // initial load only
  const [refreshing, setRefreshing] = useState(false); // seamless refresh state
  const [err, setErr] = useState("");

  // 🔊 toggle sound
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef(null);

  const weekNo = useMemo(() => getISOWeekNumber(new Date()), []);

  function stopLoop() {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {}
  }

  function startLoop() {
    try {
      if (!audioRef.current) {
        const a = new Audio(bgLoop);
        a.loop = true;
        a.volume = 0.35;
        audioRef.current = a;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) startLoop();
      else stopLoop();
      return next;
    });
  }

  async function load({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErr("");
    try {
      const res = await fetchFeSummary({ range: "week", team: "ALL" });
      setRows(res?.rows || []);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    document.body.classList.add("goldrush-page");
    return () => {
      document.body.classList.remove("goldrush-page");
      stopLoop();
    };
  }, []);

  // initial load
  useEffect(() => {
    load({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ auto refresh every 3 mins (no loader)
  useEffect(() => {
    const id = setInterval(() => {
      if (!refreshing) load({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  // ✅ ALWAYS show cards, even if rows empty
  const goldTier = useMemo(() => buildTierRankAlwaysShow(rows, "GOLD", 5), [rows]);
  const silverTier = useMemo(() => buildTierRankAlwaysShow(rows, "SILVER", 5), [rows]);
  const bronzeTier = useMemo(() => buildTierRankAlwaysShow(rows, "BRONZE", 6), [rows]);
  const rookieTier = useMemo(() => buildTierRankAlwaysShow(rows, "ROOKIE", 5), [rows]);

  return (
    <div className="goldrush-wrapper">
      {loading && <MoneyLoader text="Loading tiers..." />}

      {/* Poster */}
      <section className="poster-section">
        <div className="poster-overlay" />
        <div className="poster-card">
          <h1 className="poster-title">Golden Week</h1>

          <p className="poster-line">All players are divided into tiers.</p>
          <p className="poster-line">You will compete only against players in your tier.</p>

          <p className="poster-line poster-line-strong">
            The player with the highest AP for the week wins the cash prize
          </p>

          {/* ✅ Center aligned sound button + status */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
            }}
          >
            <button
              onClick={toggleSound}
              className={`goldrush-sound-btn ${soundEnabled ? "on" : ""}`}
            >
              {soundEnabled ? "SOUND ON 🔊" : "ENABLE SOUND"}
            </button>

            <div style={{ fontWeight: 900 }}>
              {refreshing ? "Updating…" : "Live"}
            </div>
          </div>

          {err && (
            <p className="poster-line" style={{ color: "red", fontWeight: 900 }}>
              Error: {err}
            </p>
          )}
        </div>
      </section>

      {/* GOLD */}
      <TierSection
        tier={goldTier}
        title="GOLD TIER"
        subtitle="Winner Gets $300"
        wrapperClass="plain-bg"
        heroClass="gold-hero"
        titleClass="gold-title"
        subClass="gold-subtitle"
        rowClass="gold-card-row"
        cardClass="gold-card"
        rankClass="gold-rank"
        avatarClass="gold-avatar"
        nameClass="gold-name"
        statsClass="gold-stats"
      />

      {/* SILVER */}
      <TierSection
        tier={silverTier}
        title="SILVER TIER"
        subtitle="Winner Gets $200"
        wrapperClass="image-bg"
        heroClass="silver-hero"
        titleClass="silver-title"
        subClass="silver-subtitle"
        rowClass="silver-card-row"
        cardClass="silver-card"
        rankClass="silver-rank"
        avatarClass="silver-avatar"
        nameClass="silver-name"
        statsClass="silver-stats"
      />

      {/* BRONZE */}
      <TierSection
        tier={bronzeTier}
        title="BRONZE TIER"
        subtitle="Winner Gets $100"
        wrapperClass="bronze-bg"
        heroClass="silver-hero"
        titleClass="bronze-title"
        subClass="silver-subtitle"
        rowClass="silver-card-row"
        cardClass="bronze-card"
        rankClass="bronze-rank"
        avatarClass="bronze-avatar"
        nameClass="bronze-name"
        statsClass="silver-stats"
      />

      {/* ROOKIE */}
      <TierSection
        tier={rookieTier}
        title="ROOKIE TIER"
        subtitle="Winner Gets $50"
        wrapperClass="rookie-bg"
        heroClass="silver-hero"
        titleClass="silver-title"
        subClass="silver-subtitle"
        rowClass="silver-card-row"
        cardClass="rookie-card"
        rankClass="rookie-rank"
        avatarClass="rookie-avatar"
        nameClass="rookie-name"
        statsClass="silver-stats"
      />
    </div>
  );
}
