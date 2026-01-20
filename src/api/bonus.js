import { apiFetch } from "./client";

export function getAdminKey() {
  return localStorage.getItem("ADMIN_KEY") || "";
}
export function setAdminKey(k) {
  localStorage.setItem("ADMIN_KEY", k);
}
export function clearAdminKey() {
  localStorage.removeItem("ADMIN_KEY");
}

export async function upsertBonus(payload) {
  const key = getAdminKey();
  return apiFetch("/api/bonus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": key,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteBonus(id) {
  const key = getAdminKey();
  return apiFetch(`/api/bonus/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": key },
  });
}

export async function fetchBonusRange({ start_date, end_date, team }) {
  const qs = new URLSearchParams();
  qs.set("start_date", start_date);
  if (end_date) qs.set("end_date", end_date);
  if (team) qs.set("team", team);

  return apiFetch(`/api/bonus/range?${qs.toString()}`);
}
