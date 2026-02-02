// frontend/src/components/TopNav.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TopNav.css";

export default function TopNav() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isGoldRush = loc.pathname.startsWith("/goldrush");

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  // Toggle body class for mobile menu + goldrush page theme
  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);

    // if you already use body.goldrush-page for background:
    document.body.classList.toggle("goldrush-page", isGoldRush);

    return () => {
      document.body.classList.remove("menu-open");
      document.body.classList.remove("goldrush-page");
    };
  }, [menuOpen, isGoldRush]);

  const links = useMemo(
    () => [
      { to: "/goldrush", label: "GOLD RUSH" },
      { to: "/top-guns", label: "TOP GUNS" },
      { to: "/queue", label: "QUEUE" },
      { to: "/admin", label: "ADMIN LOGIN", admin: true },
    ],
    []
  );

  // treat "/" same as dashboard if you want
  const isDashboard = loc.pathname === "/" || loc.pathname.startsWith("/dashboard");

  function isActive(to) {
    if (to === "/dashboard") return isDashboard;
    return loc.pathname.startsWith(to);
  }

  return (
    <header className={`navWrap ${isGoldRush ? "goldrush" : ""}`}>
      <nav className="navBar">
        <Link to="/" className="brand" style={{ textDecoration: "none" }}>
          <span className="brandText">DASHBOARD</span>
        </Link>

        <button
          className="burger"
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          <span></span><span></span><span></span>
        </button>

        <div className="navLinks">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={[
                "navBtn",
                isActive(l.to) ? "active" : "",
                l.admin ? "admin" : "",
              ].join(" ")}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
