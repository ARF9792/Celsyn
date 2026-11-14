import { Search, SlidersHorizontal, X } from "lucide-react";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "healthy", label: "Healthy" },
  { value: "offline", label: "Offline" },
];

export default function FleetFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  counts,
  visibleCount,
  totalCount,
  onReset,
}) {
  const hasFilters = Boolean(query) || status !== "all";

  return (
    <section className="panel fleet-filters" aria-labelledby="fleet-filters-title">
      <h2 className="sr-only" id="fleet-filters-title">Fleet filters</h2>
      <label className="fleet-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search fleet</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search truck, cargo or route"
        />
      </label>

      <div className="status-filter" role="group" aria-label="Filter fleet by status">
        <span className="filter-label"><SlidersHorizontal size={15} aria-hidden="true" />Status</span>
        {filterOptions.map((option) => (
          <button
            className={`filter-chip ${status === option.value ? "is-active" : ""}`}
            type="button"
            aria-pressed={status === option.value}
            onClick={() => onStatusChange(option.value)}
            key={option.value}
          >
            {option.label}<span>{option.value === "all" ? totalCount : counts[option.value]}</span>
          </button>
        ))}
      </div>

      <div className="filter-result" aria-live="polite">
        <strong>{visibleCount}</strong><span>of {totalCount} visible</span>
      </div>
      {hasFilters && (
        <button className="filter-reset" type="button" onClick={onReset}>
          <X size={15} aria-hidden="true" />Clear
        </button>
      )}
    </section>
  );
}
