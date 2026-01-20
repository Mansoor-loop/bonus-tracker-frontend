import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminBonus from "./pages/AdminBonus";
import TopNav from "./components/TopNav";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", padding: 18, fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <TopNav />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminBonus />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
