import React from "react";

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.25)",
  backdropFilter: "blur(2px)",
};

const card = {
  width: "min(520px, 92vw)",
  border: "5px solid #000",
  borderRadius: 22,
  background: "#fff",
  boxShadow: "10px 10px 0 #000",
  padding: 18,
};

const title = { fontWeight: 1100, fontSize: 20 };
const subtitle = { fontWeight: 900, marginTop: 6 };

function Bill({ left, delay, size, rotate }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: -80,
        width: size,
        height: size * 0.55,
        border: "4px solid #000",
        borderRadius: 14,
        background: "#D9F99D",
        boxShadow: "6px 6px 0 #000",
        transform: `rotate(${rotate}deg)`,
        animation: `moneyFall 1.2s linear infinite`,
        animationDelay: delay,
        opacity: 0.95,
      }}
    >
      <div style={{ padding: 10, fontWeight: 1100 }}>
        <span style={{ fontSize: 22 }}>$</span>
        <span style={{ marginLeft: 6 }}>BILL</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 8,
          fontWeight: 1100,
        }}
      >
        💸
      </div>
    </div>
  );
}

export default function MoneyLoader({ text = "Fetching data..." }) {
  return (
    <div style={overlay}>
      {/* keyframes */}
      <style>{`
        @keyframes moneyFall {
          0%   { transform: translateY(0) rotate(var(--rot)); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(520px) rotate(calc(var(--rot) + 22deg)); opacity: 0; }
        }
        @keyframes pulseDots {
          0%, 20% { opacity: 0.2; }
          50%     { opacity: 1; }
          100%    { opacity: 0.2; }
        }
      `}</style>

      <div style={card}>
        <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
          {/* bills */}
          <div style={{ ["--rot"]: "-12deg" }}>
            <Bill left="6%" delay="0s" size={120} rotate={-12} />
          </div>
          <div style={{ ["--rot"]: "8deg" }}>
            <Bill left="28%" delay="0.15s" size={140} rotate={8} />
          </div>
          <div style={{ ["--rot"]: "-4deg" }}>
            <Bill left="54%" delay="0.3s" size={110} rotate={-4} />
          </div>
          <div style={{ ["--rot"]: "14deg" }}>
            <Bill left="74%" delay="0.45s" size={130} rotate={14} />
          </div>

          {/* message */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={title}>💰 Bonus Tracker</div>
            <div style={subtitle}>
              {text}
              <span style={{ marginLeft: 6 }}>
                <span style={{ animation: "pulseDots 1s infinite" }}>.</span>
                <span style={{ animation: "pulseDots 1s infinite", animationDelay: "0.2s" }}>.</span>
                <span style={{ animation: "pulseDots 1s infinite", animationDelay: "0.4s" }}>.</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, fontWeight: 900 }}>
          Tip:  backend may take ~10–30s on first load.
        </div>
      </div>
    </div>
  );
}
