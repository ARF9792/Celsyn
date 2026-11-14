import { useOutletContext } from "react-router-dom";
import AlertsPanel from "../components/AlertsPanel.jsx";
import FleetTable from "../components/FleetTable.jsx";
import FleetPosture from "../components/FleetPosture.jsx";
import KpiGrid from "../components/KpiGrid.jsx";

const statusPriority = { critical: 0, warning: 1, offline: 2, healthy: 3 };

export default function OverviewPage() {
  const dashboard = useOutletContext();
  const attentionTrucks = [...dashboard.trucks]
    .sort((left, right) => statusPriority[left.status] - statusPriority[right.status])
    .slice(0, 6);

  return (
    <div className="overview-page" data-enter>
      <FleetPosture summary={dashboard.summary} />
      <KpiGrid summary={dashboard.summary} metrics={dashboard.metrics} />
      <div className="overview-content-grid">
        <FleetTable
          trucks={attentionTrucks}
          selectedTruckId={dashboard.selectedTruckId}
          onSelect={dashboard.selectTruck}
          heading="Vehicle attention queue"
          kicker="Prioritized by safety state"
          actionTo="/app/fleet"
          actionLabel="Open live fleet"
          variant="overview"
        />
        <AlertsPanel
          alerts={dashboard.alerts.slice(0, 4)}
          heading="Incoming incidents"
          kicker="Newest first"
          actionTo="/app/incidents"
          actionLabel="Review incidents"
          variant="overview"
        />
      </div>
    </div>
  );
}

