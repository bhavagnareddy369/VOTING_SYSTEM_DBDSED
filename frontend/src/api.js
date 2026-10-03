const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (body) => request("/api/register", { method: "POST", body: JSON.stringify(body) }),
  sendOtp: (body) => request("/api/send-otp", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body) => request("/api/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  candidates: () => request("/api/candidates"),
  vote: (body) => request("/api/vote", { method: "POST", body: JSON.stringify(body) }),
  turnout: () => request("/api/turnout"),
  results: () => request("/api/results"),
  auditLog: () => request("/api/audit-log"),
};
