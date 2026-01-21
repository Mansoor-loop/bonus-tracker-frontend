const API_BASE = process.env.REACT_APP_API_BASE || "https://bonus-tracker-backend-1wjh.onrender.com";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  return json;
}
