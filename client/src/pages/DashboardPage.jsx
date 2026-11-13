import { lazy, Suspense } from "react";
import AlertsPanel from "../components/AlertsPanel.jsx";
import ConnectionBadge from "../components/ConnectionBadge.jsx";
import FleetTable from "../components/FleetTable.jsx";
import KpiGrid from "../components/KpiGrid.jsx";
import SystemMetrics from "../components/SystemMetrics.jsx";
import TruckDetails from "../components/TruckDetails.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

const TemperatureChart = lazy(() => import("../components/TemperatureChart.jsx"));

export default function DashboardPage() {
  const dashboard = useDashboardData();
  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">CP</div>
          <div><h1>ChainPulse</h1><p>Cold-chain telemetry command center</p></div>
        </div>
        <ConnectionBadge status={dashboard.connectionStatus} />
      </header>
      {dashboard.error && <div className="error-banner">{dashboard.error}</div>}
      <KpiGrid summary={dashboard.summary} metrics={dashboard.metrics} />
      <div className="primary-grid">
        <FleetTable trucks={dashboard.trucks} selectedTruckId={dashboard.selectedTruckId} onSelect={dashboard.selectTruck} />
        <TruckDetails truck={dashboard.selectedTruck} onTrigger={dashboard.triggerExcursion} demoPending={dashboard.demoPending} />
      </div>
      <Suspense fallback={<section className="panel chart-panel chart-empty">Loading chart…</section>}>
        <TemperatureChart truck={dashboard.selectedTruck} series={dashboard.series} loading={dashboard.historyLoading} />
      </Suspense>
      <div className="secondary-grid">
        <AlertsPanel alerts={dashboard.alerts} />
        <SystemMetrics metrics={dashboard.metrics} />
      </div>
    </main>
  );
}

