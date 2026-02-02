// frontend/src/components/TopNav.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TopNavGold.css";

export default function TopNav() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  // Close menu on route change
  useEffect(() => setOpen(false), [loc.pathname]);

  // Active route helper
  const isActive = (path) => {
    if (path === "/") return loc.pathname === "/" || loc.pathname.startsWith("/dashboard");
    return loc.pathname.startsWith(path);
  };

  return (
    <header className="goldNavWrap">
      <nav className={`goldNav ${open ? "open" : ""}`}>
        {/* Brand */}
        <Link to="/" className="goldBrand" onClick={() => setOpen(false)}>
          <span className="goldCrown" aria-hidden="true">👑</span>
          <span className="goldBrandText">Bonus Tracker</span>
        </Link>

        {/* Links */}
        <div className={`goldLinks ${open ? "show" : ""}`}>
          <Link className={`goldBtn ${isActive("/") ? "active" : ""}`} to="/">Dashboard</Link>
          <Link className={`goldBtn ${isActive("/goldrush") ? "active" : ""}`} to="/goldrush">Gold Rush</Link>
          <Link className={`goldBtn ${isActive("/top-guns") ? "active" : ""}`} to="/top-guns">Top Guns</Link>
          <Link className={`goldBtn ${isActive("/queue") ? "active" : ""}`} to="/queue">Queue</Link>
          <Link className={`goldBtn admin ${isActive("/admin") ? "active" : ""}`} to="/admin">Admin</Link>
        </div>

        {/* Burger */}
        <button
          className="goldBurger"
          aria-label="Open menu"
          aria-expanded={open ? "true" : "false"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}
