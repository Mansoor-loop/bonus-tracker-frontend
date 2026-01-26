import React from "react";
import { Link, useLocation } from "react-router-dom";

function NavButton({ to, label, active, bg }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "inline-block",
        border: "4px solid #000",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 1000,
        boxShadow: "6px 6px 0 #000",
        background: active ? (bg || "#FF4D4D") : "#fff",
        color: "#000",
        minWidth: 120,
        textAlign: "center",
      }}
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  const loc = useLocation();

  // ✅ support both "/" and "/dashboard" as dashboard route
  const isDashboard =
    loc.pathname === "/" || loc.pathname.startsWith("/dashboard");

  const isTopGuns = loc.pathname.startsWith("/top-guns");
  const isAdmin = loc.pathname.startsWith("/admin");
  const isQueue = loc.pathname.startsWith("/queue");
  return (
    <div
      style={{
        background: "#FFD400",
        border: "5px solid #000",
        borderRadius: 18,
        boxShadow: "10px 10px 0 #000",
        padding: "10px 14px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Left brand */}
        <NavButton to="/" label="BONUS TRACKER" active={isDashboard} bg="#FFFFFF" />

        {/* Right buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <NavButton to="/" label="DASHBOARD" active={isDashboard} bg="#FFFFFF" />
          <NavButton to="/top-guns" label="TOP GUNS" active={isTopGuns} bg="#FFFFFF" />
          <NavButton to="/queue" label="QUEUE" active={isQueue} bg="#FFFFFF" />
          <NavButton to="/admin" label="ADMIN LOGIN" active={isAdmin} bg="#FF4D4D" />
        </div>
      </div>
    </div>
  );
}
