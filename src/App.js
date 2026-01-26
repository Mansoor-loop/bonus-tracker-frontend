import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminBonus from "./pages/AdminBonus";
import TopNav from "./components/TopNav";
import TopGuns from "./pages/TopGuns";
import QueueManagement from "./pages/QueueManagement";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", padding: 18, fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <TopNav />
          <Routes>
            <Route path="/" element={<Dashboard />} />           
            <Route path="/top-guns" element={<TopGuns />} />
            <Route path="/admin" element={<AdminBonus />} />
            <Route path="/queue" element={<QueueManagement />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
