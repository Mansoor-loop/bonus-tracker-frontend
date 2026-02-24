// src/api/dialer.js

// If your frontend is hosted with the backend (same domain), keep "".
// If not, set REACT_APP_API_BASE_URL=https://your-render-app.onrender.com
const BASE =  "https://bonus-tracker-backend-1wjh.onrender.com";

export async function fetchDialerLatest(signal) {
  const res = await fetch(`${BASE}/api/dialer/latest`, { signal });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dialer latest failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json(); // { count, aaData, meta }
}
