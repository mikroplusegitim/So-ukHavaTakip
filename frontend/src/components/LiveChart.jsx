import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Pulse } from "@phosphor-icons/react";

export default function LiveChart({ readings, warehouse }) {
  const data = readings.map((r, i) => ({
    idx: i,
    t: new Date(r.timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    temperature: r.temperature,
    humidity: r.humidity,
  }));

  return (
    <div className="surface p-5 relative overflow-hidden" data-testid="live-chart">
      <div className="sweep-line" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Pulse size={16} weight="bold" className="text-[var(--accent)]" />
          <span className="label-tag">Canlı Veri Akışı · Son 60 Kayıt</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-data">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-[var(--accent)]" />
            <span className="text-[var(--text-dim)]">Sıcaklık °C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-[#FFD600]" />
            <span className="text-[var(--text-dim)]">Nem %</span>
          </div>
        </div>
      </div>

      <div className="h-64 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#272730" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
              stroke="#272730"
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              yAxisId="t"
              orientation="left"
              tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
              stroke="#272730"
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="h"
              orientation="right"
              tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
              stroke="#272730"
              domain={[40, 100]}
            />
            <Tooltip
              contentStyle={{
                background: "#08080C",
                border: "1px solid #272730",
                borderRadius: 0,
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              labelStyle={{ color: "#A1A1AA" }}
            />
            <ReferenceLine
              yAxisId="t"
              y={warehouse.temp_max}
              stroke="#FF3B30"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
            <ReferenceLine
              yAxisId="t"
              y={warehouse.temp_min}
              stroke="#FFD600"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
            <Line
              yAxisId="t"
              type="monotone"
              dataKey="temperature"
              stroke="#00E5FF"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="h"
              type="monotone"
              dataKey="humidity"
              stroke="#FFD600"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
              strokeOpacity={0.7}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
