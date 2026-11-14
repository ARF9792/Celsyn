import { useCallback, useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, ScanSearch } from "lucide-react";
import { formatNumber } from "../utils/telemetry.js";

setWorkerUrl(workerUrl);

const MAP_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL
  || "https://tiles.openfreemap.org/styles/positron";

const hasLocation = (truck) => {
  const location = truck?.latestTelemetry?.location;
  return Number.isFinite(location?.lat) && Number.isFinite(location?.lng);
};

const mapDuration = () => (
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500
);

export default function FleetMap({
  trucks,
  visibleTruckIds,
  selectedTruckId,
  onSelect,
  focusRequest,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new globalThis.Map());
  const trucksRef = useRef(trucks);
  const onSelectRef = useRef(onSelect);
  const focusRequestRef = useRef(focusRequest);
  const initialFitRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  trucksRef.current = trucks;
  onSelectRef.current = onSelect;
  focusRequestRef.current = focusRequest;

  const fitTrucks = useCallback((fleet = trucksRef.current, options = {}) => {
    const map = mapRef.current;
    const located = fleet.filter(hasLocation);
    if (!map || !map.loaded() || located.length === 0) return;

    const bounds = new LngLatBounds();
    located.forEach((truck) => {
      const { lng, lat } = truck.latestTelemetry.location;
      bounds.extend([lng, lat]);
    });
    map.fitBounds(bounds, {
      padding: options.padding ?? 64,
      maxZoom: options.maxZoom ?? 7,
      duration: options.duration ?? mapDuration(),
    });
  }, []);

  const focusTruck = useCallback((truckId) => {
    const map = mapRef.current;
    const truck = trucksRef.current.find((item) => item.truckId === truckId);
    if (!map || !map.loaded() || !hasLocation(truck)) return;
    const { lng, lat } = truck.latestTelemetry.location;
    map.easeTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 7.5),
      duration: mapDuration(),
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [78.9629, 20.5937],
      zoom: 3.6,
      attributionControl: true,
      cooperativeGestures: true,
      maxPitch: 0,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-right");

    const onLoad = () => {
      setMapReady(true);
      setMapError("");
      if (!initialFitRef.current) {
        fitTrucks(trucksRef.current, { duration: 0 });
        initialFitRef.current = true;
      }
      if (focusRequestRef.current?.truckId) {
        focusTruck(focusRequestRef.current.truckId);
      }
    };
    const onError = () => {
      if (!map.loaded()) {
        setMapError("The basemap could not be loaded. Live vehicle data is still available in the fleet table.");
      }
    };
    map.on("load", onLoad);
    map.on("error", onError);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach(({ marker, element, clickHandler }) => {
        element.removeEventListener("click", clickHandler);
        marker.remove();
      });
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [fitTrucks, focusTruck]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set();
    trucks.filter(hasLocation).forEach((truck) => {
      currentIds.add(truck.truckId);
      let entry = markersRef.current.get(truck.truckId);
      if (!entry) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "fleet-map-marker";
        const core = document.createElement("span");
        core.className = "fleet-map-marker-core";
        core.textContent = truck.truckId.slice(-2);
        element.append(core);
        const clickHandler = () => onSelectRef.current(truck.truckId);
        element.addEventListener("click", clickHandler);
        const marker = new Marker({ element, anchor: "center" })
          .setLngLat([
            truck.latestTelemetry.location.lng,
            truck.latestTelemetry.location.lat,
          ])
          .addTo(map);
        entry = { marker, element, clickHandler };
        markersRef.current.set(truck.truckId, entry);
      }

      const { lat, lng } = truck.latestTelemetry.location;
      entry.marker.setLngLat([lng, lat]);
      entry.element.className = `fleet-map-marker marker-${truck.status}`;
      entry.element.classList.toggle("is-selected", truck.truckId === selectedTruckId);
      entry.element.classList.toggle(
        "is-filtered-out",
        !visibleTruckIds.has(truck.truckId) && truck.truckId !== selectedTruckId,
      );
      entry.element.setAttribute("aria-pressed", String(truck.truckId === selectedTruckId));
      entry.element.setAttribute(
        "aria-label",
        `${truck.truckId}, ${truck.status}, ${formatNumber(truck.latestTelemetry.temperature, "°C")}`,
      );
      entry.element.title = `${truck.truckId} · ${truck.status}`;
    });

    markersRef.current.forEach((entry, truckId) => {
      if (!currentIds.has(truckId)) {
        entry.element.removeEventListener("click", entry.clickHandler);
        entry.marker.remove();
        markersRef.current.delete(truckId);
      }
    });

    if (map.loaded() && !initialFitRef.current && currentIds.size > 0) {
      fitTrucks(trucks, { duration: 0 });
      initialFitRef.current = true;
    }
  }, [fitTrucks, selectedTruckId, trucks, visibleTruckIds]);

  useEffect(() => {
    if (focusRequest?.truckId) focusTruck(focusRequest.truckId);
  }, [focusRequest, focusTruck]);

  const visibleTrucks = trucks.filter((truck) => visibleTruckIds.has(truck.truckId));
  const locatedCount = trucks.filter(hasLocation).length;

  return (
    <section className="panel map-panel" aria-labelledby="live-map-title">
      <div className="panel-heading map-panel-heading">
        <div>
          <p className="section-kicker">Live geography</p>
          <h2 id="live-map-title">Fleet position</h2>
        </div>
        <div className="map-panel-actions">
          <span className="record-count" aria-live="polite">{visibleTrucks.length} visible</span>
          <button
            className="icon-text-button"
            type="button"
            onClick={() => fitTrucks(visibleTrucks)}
            disabled={visibleTrucks.every((truck) => !hasLocation(truck))}
          >
            <ScanSearch size={16} aria-hidden="true" />Fit fleet
          </button>
          <button
            className="icon-text-button"
            type="button"
            onClick={() => focusTruck(selectedTruckId)}
            disabled={!selectedTruckId}
          >
            <LocateFixed size={16} aria-hidden="true" />Locate selected
          </button>
        </div>
      </div>

      <div className="fleet-map-shell">
        <div ref={containerRef} className="fleet-map-canvas" aria-label="Interactive live fleet map" />
        {!mapReady && !mapError && <div className="map-state" role="status">Loading live map…</div>}
        {mapError && <div className="map-state map-state-error" role="alert">{mapError}</div>}
        {mapReady && locatedCount === 0 && <div className="map-state">Waiting for vehicle positions…</div>}
        <div className="map-legend" aria-label="Vehicle status legend">
          <span><i className="legend-healthy" />Healthy</span>
          <span><i className="legend-warning" />Warning</span>
          <span><i className="legend-critical" />Critical</span>
          <span><i className="legend-offline" />Offline</span>
        </div>
      </div>
    </section>
  );
}
