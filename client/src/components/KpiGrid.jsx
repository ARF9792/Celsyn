const cards = [
  ["totalTrucks", "Fleet", "registered"],
  ["onlineTrucks", "Online", "reporting"],
  ["healthyTrucks", "Healthy", "in range"],
  ["warningTrucks", "Warning", "attention"],
  ["criticalTrucks", "Critical", "action needed"],
];

export default function KpiGrid({ summary, metrics }) {
  return (
    <section className="kpi-grid" aria-label="Fleet summary">
      {cards.map(([key, label, helper]) => (
        <article className={`kpi-card kpi-${key}`} key={key}>
          <span>{label}</span>
          <strong>{summary[key] ?? 0}</strong>
          <small>{helper}</small>
        </article>
      ))}
      <article className="kpi-card kpi-throughput">
        <span>Throughput</span>
        <strong>{metrics?.currentEventsPerSecond ?? 0}</strong>
        <small>events / second</small>
      </article>
    </section>
  );
}

