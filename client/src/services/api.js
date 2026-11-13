const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "chainpulse-access-token";

export const getAccessToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearAccessToken = () => sessionStorage.removeItem(TOKEN_KEY);

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(getAccessToken() ? { authorization: `Bearer ${getAccessToken()}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
};

export const api = {
  url: API_URL,
  login: (credentials) => request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  getCurrentUser: () => request("/api/auth/me"),
  getTrucks: () => request("/api/trucks"),
  getFleetSummary: () => request("/api/fleet/summary"),
  getTruckHistory: (truckId) => request(`/api/trucks/${truckId}/history?minutes=30&limit=300`),
  getAlerts: () => request("/api/alerts?limit=30"),
  getMetrics: () => request("/api/system/metrics"),
  triggerExcursion: (truckId) => request(
    `/api/demo/trucks/${truckId}/temperature-excursion`,
    { method: "POST", body: "{}" },
  ),
};
