import { useOutletContext } from "react-router-dom";
import AlertsPanel from "../components/AlertsPanel.jsx";
import FleetTable from "../components/FleetTable.jsx";
import KpiGrid from "../components/KpiGrid.jsx";
import SystemMetrics from "../components/SystemMetrics.jsx";

export default function OverviewPage() {
  const dashboard = useOutletContext();

  return (
    <div className="page-stack">
      <KpiGrid summary={dashboard.summary} metrics={dashboard.metrics} />
      <div className="overview-grid">
        <FleetTable
          trucks={dashboard.trucks.slice(0, 8)}
          selectedTruckId={dashboard.selectedTruckId}
          onSelect={dashboard.selectTruck}
        />
        <AlertsPanel alerts={dashboard.alerts.slice(0, 6)} />
      </div>
      <SystemMetrics metrics={dashboard.metrics} />
    </div>
  );
}

