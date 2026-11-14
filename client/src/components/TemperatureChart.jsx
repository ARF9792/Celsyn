import {
  CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatTime } from "../utils/telemetry.js";

export default function TemperatureChart({ truck, series, loading }) {
  const chartData = series
    .filter((event) => Number.isFinite(event.temperature))
    .map((event) => ({ ...event, timeLabel: formatTime(event.timestamp) }));
  const temperatureValues = chartData.map((event) => event.temperature);
  const safeMinimum = truck?.safeTemperature.min;
  const safeMaximum = truck?.safeTemperature.max;
  const rangeValues = [
    ...temperatureValues,
    ...(Number.isFinite(safeMinimum) ? [safeMinimum] : []),
    ...(Number.isFinite(safeMaximum) ? [safeMaximum] : []),
  ];
  const yDomain = rangeValues.length > 0
    ? [Math.floor(Math.min(...rangeValues) - 1), Math.ceil(Math.max(...rangeValues) + 1)]
    : [0, 10];

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div><p className="section-kicker">Historical + live</p><h2>Temperature trend</h2></div>
        <div className="chart-heading-meta">
          {truck && <span className="safe-range-label">Safe {safeMinimum}–{safeMaximum}°C</span>}
          <span className="record-count">{loading ? "Loading…" : `${chartData.length} points`}</span>
        </div>
      </div>
      {!truck || chartData.length === 0 ? (
        <div className="chart-empty">Run the simulator to begin plotting telemetry.</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 14, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                minTickGap={44}
                axisLine={{ stroke: "var(--color-line-strong)" }}
                tickLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              />
              <YAxis
                width={54}
                domain={yDomain}
                tickCount={6}
                tickFormatter={(value) => `${Number(value).toFixed(1)}°`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} °C`, "Temperature"]}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line-strong)", borderRadius: 10, boxShadow: "var(--shadow-raised)" }}
                labelStyle={{ color: "var(--color-muted)", marginBottom: 4 }}
                itemStyle={{ color: "var(--color-ink)" }}
              />
              <ReferenceArea y1={safeMinimum} y2={safeMaximum} fill="var(--chart-safe-band)" fillOpacity={1} />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="var(--chart-primary)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, fill: "var(--chart-primary)", stroke: "var(--color-surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

