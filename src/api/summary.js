import { apiFetch } from "./client";

function buildQs({ team, startDate, endDate }) {
  const p = new URLSearchParams();
  if (team && team !== "ALL") p.set("team", team);
  if (startDate) p.set("start_date", startDate);
  if (endDate) p.set("end_date", endDate);
  const s = p.toString();
  return s ? `?${s}` : "";
}


export async function fetchFeAgents({ range, team, startDate, endDate }) {
  // today/week stay same
  if (range === "today") {
    const qs = buildQs({ team });
    return apiFetch(`/api/today/fe-agents${qs}`);
  }

  if (range === "week") {
    const qs = buildQs({ team });
    return apiFetch(`/api/week/fe-agents${qs}`);
  }

  // custom range
  const qs = buildQs({ team, startDate, endDate: endDate || startDate });
  return apiFetch(`/api/range/fe-agents${qs}`);

}

export async function fetchFeSummary({ range, team, startDate, endDate }) {
  if (range === "today") {
    const qs = buildQs({ team });
    return apiFetch(`/api/summary/today/fe${qs}`);
  }

  if (range === "week") {
    const qs = buildQs({ team });
    return apiFetch(`/api/summary/week/fe${qs}`);
  }

  // custom range
  const qs = buildQs({ team, startDate, endDate: endDate || startDate });
  return apiFetch(`/api/range/summary/fe${qs}`);

}

export async function refreshBackend(range) {
  // only valid for today/week unless you build refresh/range on backend
  const path = range === "today" ? "/api/refresh/today" : "/api/refresh/week";
  return apiFetch(path); 
}
