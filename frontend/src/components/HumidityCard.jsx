import { Drop } from "@phosphor-icons/react";

export default function HumidityCard({ latest, warehouse }) {
  const h = latest?.humidity;
  const min = warehouse.humidity_min;
  const max = warehouse.humidity_max;
  const target = warehouse.humidity_target;

  let status = "normal";
  let color = "var(--ice)";
  let statusText = "OPTIMUM";
  if (Number.isFinite(h)) {
    if (h > max) { status = "critical"; color = "var(--red)"; statusText = "ÜST LİMİT"; }
    else if (h < min) { status = "warning"; color = "var(--amber)"; statusText = "DÜŞÜK"; }
  }

  // animated wave fill height percentage
  const pct = Number.isFinite(h) ? Math.max(0, Math.min(100, (h - 40) / 60 * 100)) : 0;

  return (
    <div className="glass-strong p-6 relative overflow-hidden flex flex-col justify-between" data-testid="metric-humidity">
      <div className="aurora" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Drop size={14} weight="duotone" className="text-[var(--ice)]" />
          <span className="eyebrow">Nem Oranı</span>
        </div>
        <span className="font-mono-data text-[10px] tracking-widest" style={{ color }}>{statusText}</span>
      </div>

      <div className="relative z-10 flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono-data font-bold text-5xl sm:text-6xl leading-none" style={{ color }}>
              {Number.isFinite(h) ? h.toFixed(1) : "—"}
            </span>
            <span className="font-mono-data text-xl text-[var(--text-dim)]">%</span>
          </div>
          <div className="font-mono-data text-[10px] text-[var(--text-mute)] mt-2 tracking-widest">
            HEDEF %{target} · {min}-{max}
          </div>
        </div>

        {/* Mini liquid bar */}
        <div className="relative w-12 h-24 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden border border-[var(--border-soft)]">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700"
            style={{
              height: `${pct}%`,
              background: `linear-gradient(180deg, ${color}40, ${color})`,
              boxShadow: `0 0 20px ${color}60`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
