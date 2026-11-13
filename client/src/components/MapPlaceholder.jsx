export default function MapPlaceholder({ trucks }) {
  const visibleTrucks = trucks.filter((truck) => truck.online).slice(0, 12);

  return (
    <section className="panel map-panel">
      <div className="panel-heading">
        <div><p className="section-kicker">Reference canvas</p><h2>Live operations map</h2></div>
        <span className="record-count">Map planned</span>
      </div>
      <div className="map-placeholder">
        <div className="map-route route-one" />
        <div className="map-route route-two" />
        {visibleTrucks.map((truck, index) => (
          <span
            className={`map-dot status-${truck.status}`}
            style={{ left: `${14 + ((index * 23) % 72)}%`, top: `${18 + ((index * 31) % 64)}%` }}
            title={truck.truckId}
            key={truck.truckId}
          />
        ))}
        <div className="map-placeholder-copy">
          <strong>Map integration area</strong>
          <span>Use this space to compare Mapbox, Google Maps or Leaflet references.</span>
        </div>
      </div>
    </section>
  );
}

