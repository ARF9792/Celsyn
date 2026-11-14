import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTime } from "../utils/telemetry.js";

export default function SystemTrendChart({ history }) {
  const data = history.map((metrics) => ({
    ...metrics,
    label: formatTime(metrics.timestamp),
    latency: metrics.averageBroadcastLatencyMs,
    events: metrics.currentEventsPerSecond,
  }));

  return (
    <section className="panel system-trend-panel">
      <div className="panel-heading"><div><p className="section-kicker">Live one-minute window</p><h2>Throughput and latency</h2></div><span className="record-count">{data.length} samples</span></div>
      {data.length < 2 ? <div className="chart-empty">Collecting live pipeline samples…</div> : (
        <div className="system-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="#dfe3e8" vertical={false} />
              <XAxis dataKey="label" minTickGap={48} tickLine={false} axisLine={{ stroke: "#cbd1d8" }} tick={{ fill: "#656d78", fontSize: 11 }} />
              <YAxis yAxisId="events" width={44} tickLine={false} axisLine={false} tick={{ fill: "#656d78", fontSize: 11 }} />
              <YAxis yAxisId="latency" orientation="right" width={54} tickFormatter={(value) => `${value}ms`} tickLine={false} axisLine={false} tick={{ fill: "#656d78", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #cbd1d8", borderRadius: 10 }} />
              <Line yAxisId="events" type="monotone" dataKey="events" name="Events / sec" stroke="#1a4be0" strokeWidth={2.25} dot={false} isAnimationActive={false} />
              <Line yAxisId="latency" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#925500" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
