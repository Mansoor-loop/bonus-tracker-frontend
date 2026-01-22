import React from "react";
import "./topGunCard.css";
import { getQualifierImage } from "../data/agentImages";
import { getAgentLogo } from "../data/agentLogo";
function fmtUSD0(n) {
  const x = Number(n || 0);
  return "$" + Math.round(x).toLocaleString();
}

export default function TopGunCard({
  rank = 1,
  name = "Agent Name",
  sales = 0,
  ap = 0,
  ovr = 60,
  // logoUrl,  // optional "/phoenix.png"
}) {
    const imageUrl = getQualifierImage(name);
    const logoUrl = getAgentLogo(name);
  return (
    <div className="tg-card">
      {/* fire/glow overlay */}
      <div className="tg-fire" />

      {/* border frame */}
      <div className="tg-frame" />

      {/* Left column */}
      <div className="tg-left">
        <div className="tg-hash">#{rank}</div>

        {logoUrl ? (
          <img className="tg-logo" src={logoUrl} alt="logo" />
        ) : (
          <div className="tg-logo-placeholder" />
        )}

        <div className="tg-rank-label">RANK</div>
        <div className="tg-rank-num">{rank}</div>
      </div>

      {/* Portrait */}
      <div className="tg-portraitWrap">
        <img className="tg-portrait" src={imageUrl} alt={name} />
      </div>

      {/* Bottom info */}
      <div className="tg-bottom">
        <div className="tg-name">{name}</div>

        <div className="tg-statsRow">
          <div className="tg-statBlock">
            <div className="tg-statLabel">Sales</div>
            <div className="tg-statValue">{sales}</div>
          </div>

          <div className="tg-divider" />

          <div className="tg-statBlock">
            <div className="tg-statLabel">Total AP</div>
            <div className="tg-statValue">{fmtUSD0(ap)}</div>
          </div>
        </div>

        <div className="tg-ovrBar">
          <div className="tg-ovrText">OVR {ovr}</div>
        </div>
      </div>
    </div>
  );
}
