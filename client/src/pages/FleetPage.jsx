import { lazy, Suspense } from "react";
import { useOutletContext } from "react-router-dom";
import FleetTable from "../components/FleetTable.jsx";
import TruckDetails from "../components/TruckDetails.jsx";

const FleetMap = lazy(() => import("../components/FleetMap.jsx"));
const TemperatureChart = lazy(() => import("../components/TemperatureChart.jsx"));

export default function FleetPage() {
  const dashboard = useOutletContext();
  const visibleTruckIds = new Set(dashboard.trucks.map((truck) => truck.truckId));

  return (
    <div className="page-stack">
      <div className="fleet-map-grid">
        <Suspense fallback={<section className="panel map-panel map-state-inline">Loading live map…</section>}>
          <FleetMap
            trucks={dashboard.trucks}
            visibleTruckIds={visibleTruckIds}
            selectedTruckId={dashboard.selectedTruckId}
            onSelect={dashboard.selectTruck}
          />
        </Suspense>
        <TruckDetails
          truck={dashboard.selectedTruck}
          onTrigger={dashboard.triggerExcursion}
          demoPending={dashboard.demoPending}
        />
      </div>
      <FleetTable
        trucks={dashboard.trucks}
        selectedTruckId={dashboard.selectedTruckId}
        onSelect={dashboard.selectTruck}
      />
      <Suspense fallback={<section className="panel chart-panel chart-empty">Loading chart…</section>}>
        <TemperatureChart truck={dashboard.selectedTruck} series={dashboard.series} loading={dashboard.historyLoading} />
      </Suspense>
    </div>
  );
}

