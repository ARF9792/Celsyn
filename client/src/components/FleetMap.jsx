import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, ScanSearch } from "lucide-react";
import { formatNumber } from "../utils/telemetry.js";

const MAP_TILE_URL = import.meta.env.VITE_MAP_TILE_URL
  || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION
  || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const hasLocation = (truck) => {
  const location = truck?.latestTelemetry?.location;
  return Number.isFinite(location?.lat) && Number.isFinite(location?.lng);
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FleetMap({ trucks, visibleTruckIds, selectedTruckId, onSelect, focusRequest }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new globalThis.Map());
  const trucksRef = useRef(trucks);
  const onSelectRef = useRef(onSelect);
  const initialFitRef = useRef(false);
  const tilesLoadedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  trucksRef.current = trucks;
  onSelectRef.current = onSelect;

  const fitTrucks = useCallback((fleet = trucksRef.current, options = {}) => {
    const map = mapRef.current;
    const located = fleet.filter(hasLocation);
    if (!map || located.length === 0) return;
    const bounds = L.latLngBounds(located.map((truck) => [
      truck.latestTelemetry.location.lat,
      truck.latestTelemetry.location.lng,
    ]));
    map.fitBounds(bounds, {
      padding: options.padding ?? [54, 54],
      maxZoom: options.maxZoom ?? 7,
      animate: options.animate ?? !prefersReducedMotion(),
    });
  }, []);

  const focusTruck = useCallback((truckId) => {
    const map = mapRef.current;
    const truck = trucksRef.current.find((item) => item.truckId === truckId);
    if (!map || !hasLocation(truck)) return;
    const { lat, lng } = truck.latestTelemetry.location;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 8), {
      animate: !prefersReducedMotion(),
      duration: .5,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 4,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: false,
    });
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ position: "bottomright", imperial: false, maxWidth: 100 }).addTo(map);

    const tileLayer = L.tileLayer(MAP_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
      maxZoom: 19,
      keepBuffer: 3,
    });
    tileLayer.on("load", () => {
      tilesLoadedRef.current = true;
      setMapReady(true);
      setMapError("");
    });
    tileLayer.on("tileerror", () => {
      if (!tilesLoadedRef.current) {
        setMapError("The basemap could not be loaded. Live vehicle data is still available in the fleet table.");
      }
    });
    tileLayer.addTo(map);

    if (!initialFitRef.current && trucksRef.current.some(hasLocation)) {
      fitTrucks(trucksRef.current, { animate: false });
      initialFitRef.current = true;
    }

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach(({ marker, keyHandler }) => {
        marker.getElement()?.removeEventListener("keydown", keyHandler);
        marker.remove();
      });
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [fitTrucks]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set();
    trucks.filter(hasLocation).forEach((truck) => {
      currentIds.add(truck.truckId);
      let entry = markersRef.current.get(truck.truckId);
      if (!entry) {
        const marker = L.marker(
          [truck.latestTelemetry.location.lat, truck.latestTelemetry.location.lng],
          {
            icon: L.divIcon({
              className: "fleet-map-marker",
              html: '<span class="fleet-map-marker-core" aria-hidden="true"></span>',
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            }),
            keyboard: true,
            title: truck.truckId,
            riseOnHover: true,
            riseOffset: 250,
          },
        ).addTo(map);
        marker.bindTooltip("", {
          direction: "top",
          offset: [0, -14],
          opacity: .96,
          className: "fleet-marker-tooltip",
        });
        marker.on("click", () => onSelectRef.current(truck.truckId));
        const element = marker.getElement();
        const keyHandler = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectRef.current(truck.truckId);
          }
        };
        element?.addEventListener("keydown", keyHandler);
        entry = { marker, keyHandler };
        markersRef.current.set(truck.truckId, entry);
      }

      const { lat, lng } = truck.latestTelemetry.location;
      entry.marker.setLatLng([lat, lng]);
      const element = entry.marker.getElement();
      if (!element) return;
      element.classList.remove("marker-healthy", "marker-warning", "marker-critical", "marker-offline");
      element.classList.add("fleet-map-marker", `marker-${truck.status}`);
      element.classList.toggle("is-selected", truck.truckId === selectedTruckId);
      element.classList.toggle(
        "is-filtered-out",
        !visibleTruckIds.has(truck.truckId) && truck.truckId !== selectedTruckId,
      );
      element.setAttribute("role", "button");
      element.setAttribute("aria-pressed", String(truck.truckId === selectedTruckId));
      element.setAttribute(
        "aria-label",
        `${truck.truckId}, ${truck.status}, ${formatNumber(truck.latestTelemetry.temperature, "°C")}`,
      );
      element.title = `${truck.truckId} · ${truck.status}`;
      entry.marker.setTooltipContent(
        `${truck.truckId} · ${truck.status} · ${formatNumber(truck.latestTelemetry.temperature, "°C")}`,
      );
    });

    markersRef.current.forEach((entry, truckId) => {
      if (!currentIds.has(truckId)) {
        entry.marker.getElement()?.removeEventListener("keydown", entry.keyHandler);
        entry.marker.remove();
        markersRef.current.delete(truckId);
      }
    });

    if (!initialFitRef.current && currentIds.size > 0) {
      fitTrucks(trucks, { animate: false });
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
        <div><p className="section-kicker">Live geography</p><h2 id="live-map-title">Fleet position</h2></div>
        <div className="map-panel-actions">
          <span className="record-count" aria-live="polite">{visibleTrucks.length} visible</span>
          <button className="icon-text-button" type="button" onClick={() => fitTrucks(visibleTrucks)} disabled={visibleTrucks.every((truck) => !hasLocation(truck))}>
            <ScanSearch size={16} aria-hidden="true" />Fit fleet
          </button>
          <button className="icon-text-button" type="button" onClick={() => focusTruck(selectedTruckId)} disabled={!selectedTruckId}>
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
