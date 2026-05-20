import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { ChartLineUp } from "@phosphor-icons/react";

export default function LiveChart({ readings, warehouse }) {
  const data = readings.map((r, i) => ({
    idx: i,
    t: new Date(r.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    temperature: r.temperature,
    humidity: r.humidity,
  }));

  return (
    <div className="glass-strong p-6 relative overflow-hidden" data-testid="live-chart">
      <div className="aurora" />
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <ChartLineUp size={14} weight="duotone" className="text-[var(--ice)]" />
          <span className="eyebrow">Canlı Akış · Son 60 Kayıt</span>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Legend label="Sıcaklık °C" color="var(--ice)" />
          <Legend label="Nem %" color="var(--amber)" />
        </div>
      </div>

      <div className="h-72 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7AD9F5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7AD9F5" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB547" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFB547" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "#5B6B82", fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="rgba(255,255,255,0.06)" interval="preserveStartEnd" minTickGap={60} />
            <YAxis yAxisId="t" orientation="left" tick={{ fill: "#5B6B82", fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="rgba(255,255,255,0.06)" domain={["auto", "auto"]} />
            <YAxis yAxisId="h" orientation="right" tick={{ fill: "#5B6B82", fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="rgba(255,255,255,0.06)" domain={[40, 100]} />
            <Tooltip
              contentStyle={{
                background: "rgba(10, 26, 46, 0.95)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 10,
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              labelStyle={{ color: "#8B9BB4" }}
            />
            <ReferenceLine yAxisId="t" y={warehouse.temp_max} stroke="#FF4D4D" strokeDasharray="2 4" strokeWidth={1} />
            <ReferenceLine yAxisId="t" y={warehouse.temp_min} stroke="#FFB547" strokeDasharray="2 4" strokeWidth={1} />
            <Area yAxisId="t" type="monotone" dataKey="temperature" stroke="#7AD9F5" strokeWidth={2} fill="url(#tempGrad)" isAnimationActive={false} />
            <Area yAxisId="h" type="monotone" dataKey="humidity" stroke="#FFB547" strokeWidth={1.5} fill="url(#humGrad)" isAnimationActive={false} strokeOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-[var(--text-dim)] font-mono-data text-[11px]">{label}</span>
    </div>
  );
}
