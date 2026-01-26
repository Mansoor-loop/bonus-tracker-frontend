import axios from "axios";

// set this in .env as REACT_APP_BACKEND_URL=https://your-backend.onrender.com
const BASE = process.env.REACT_APP_BACKEND_URL || "https://bonus-tracker-backend-1wjh.onrender.com";

export async function fetchQueueToday() {
  const url = `${BASE}/api/queue/today`;
  const res = await axios.get(url, {
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  });
//   console.log(res.data)
  return res.data;
}
