const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "content-type": "application/json", ...options.headers },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
};

export const api = {
  url: API_URL,
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

