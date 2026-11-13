import { lazy, Suspense } from "react";
import { useOutletContext } from "react-router-dom";
import FleetTable from "../components/FleetTable.jsx";
import MapPlaceholder from "../components/MapPlaceholder.jsx";
import TruckDetails from "../components/TruckDetails.jsx";

const TemperatureChart = lazy(() => import("../components/TemperatureChart.jsx"));

export default function FleetPage() {
  const dashboard = useOutletContext();

  return (
    <div className="page-stack">
      <div className="fleet-map-grid">
        <MapPlaceholder trucks={dashboard.trucks} />
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

