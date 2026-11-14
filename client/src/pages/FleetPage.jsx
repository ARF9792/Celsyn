import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import FleetFilters from "../components/FleetFilters.jsx";
import FleetTable from "../components/FleetTable.jsx";
import TruckDetails from "../components/TruckDetails.jsx";

const FleetMap = lazy(() => import("../components/FleetMap.jsx"));
const TemperatureChart = lazy(() => import("../components/TemperatureChart.jsx"));

export default function FleetPage() {
  const dashboard = useOutletContext();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusRequest, setFocusRequest] = useState(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTrucks = useMemo(() => dashboard.trucks.filter((truck) => {
    if (statusFilter !== "all" && truck.status !== statusFilter) return false;
    if (!normalizedQuery) return true;
    const searchable = [
      truck.truckId,
      truck.displayName,
      truck.cargoType,
      truck.route?.origin,
      truck.route?.destination,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedQuery);
  }), [dashboard.trucks, normalizedQuery, statusFilter]);

  const visibleTruckIds = useMemo(
    () => new Set(filteredTrucks.map((truck) => truck.truckId)),
    [filteredTrucks],
  );
  const statusCounts = useMemo(() => dashboard.trucks.reduce((counts, truck) => {
    counts[truck.status] = (counts[truck.status] || 0) + 1;
    return counts;
  }, { healthy: 0, warning: 0, critical: 0, offline: 0 }), [dashboard.trucks]);

  const selectAndFocus = useCallback((truckId) => {
    dashboard.selectTruck(truckId);
    setFocusRequest((current) => ({ truckId, key: (current?.key || 0) + 1 }));
  }, [dashboard]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  return (
    <div className="page-stack fleet-page" data-enter>
      <FleetFilters
        query={query}
        onQueryChange={setQuery}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        counts={statusCounts}
        visibleCount={filteredTrucks.length}
        totalCount={dashboard.trucks.length}
        onReset={resetFilters}
      />
      <div className="fleet-map-grid">
        <Suspense fallback={<section className="panel map-panel map-state-inline">Loading live map…</section>}>
          <FleetMap
            trucks={dashboard.trucks}
            visibleTruckIds={visibleTruckIds}
            selectedTruckId={dashboard.selectedTruckId}
            onSelect={selectAndFocus}
            focusRequest={focusRequest}
          />
        </Suspense>
        <TruckDetails
          truck={dashboard.selectedTruck}
          onTrigger={dashboard.triggerExcursion}
          demoPending={dashboard.demoPending}
          onLocate={() => selectAndFocus(dashboard.selectedTruckId)}
        />
      </div>
      <FleetTable
        trucks={filteredTrucks}
        selectedTruckId={dashboard.selectedTruckId}
        onSelect={selectAndFocus}
        heading="Fleet directory"
        kicker={normalizedQuery || statusFilter !== "all" ? "Filtered live state" : "Complete live state"}
        totalCount={dashboard.trucks.length}
        emptyMessage="No trucks match the current fleet filters."
      />
      <Suspense fallback={<section className="panel chart-panel chart-empty">Loading chart…</section>}>
        <TemperatureChart truck={dashboard.selectedTruck} series={dashboard.series} loading={dashboard.historyLoading} />
      </Suspense>
    </div>
  );
}

