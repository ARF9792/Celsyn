import {
  CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatTime } from "../utils/telemetry.js";

export default function TemperatureChart({ truck, series, loading }) {
  const chartData = series.map((event) => ({ ...event, timeLabel: formatTime(event.timestamp) }));

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div><p className="section-kicker">Historical + live</p><h2>Temperature trend</h2></div>
        <span className="record-count">{loading ? "Loading…" : `${series.length} points`}</span>
      </div>
      {!truck || chartData.length === 0 ? (
        <div className="chart-empty">Run the simulator to begin plotting telemetry.</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#233a3b" />
              <XAxis dataKey="timeLabel" minTickGap={44} stroke="#74908f" tick={{ fontSize: 11 }} />
              <YAxis stroke="#74908f" tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{ background: "#0d2021", border: "1px solid #294445", borderRadius: 10 }}
                labelStyle={{ color: "#91aaa8" }}
              />
              <ReferenceArea y1={truck.safeTemperature.min} y2={truck.safeTemperature.max} fill="#36c89b" fillOpacity={0.1} />
              <Line type="monotone" dataKey="temperature" name="Temperature °C" stroke="#62e0b7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

