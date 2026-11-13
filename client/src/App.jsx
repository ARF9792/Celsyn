const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  return (
    <main className="shell">
      <section className="status-card">
        <p className="eyebrow">Cold-chain telemetry</p>
        <h1>ChainPulse</h1>
        <p>
          The project scaffold is running. Live fleet telemetry, historical charts,
          anomaly alerts, and pipeline metrics are next.
        </p>
        <a href={`${API_URL}/api/health`} target="_blank" rel="noreferrer">
          Check API health
        </a>
      </section>
    </main>
  );
}

