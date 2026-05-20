// Circular temperature gauge — premium "watch face" feel
export default function CircularGauge({
  value,
  min = -2,
  max = 5,
  target = 0.5,
  unit = "°C",
  label = "Sıcaklık",
  status = "normal", // normal | warning | critical
}) {
  const safe = Number.isFinite(value) ? value : target;
  const clamped = Math.max(min, Math.min(max, safe));
  const range = max - min;
  const pct = (clamped - min) / range;

  // Arc from 135° (bottom-left) to 405° (bottom-right) → 270° sweep
  const startAngle = 135;
  const sweep = 270;
  const currentAngle = startAngle + sweep * pct;

  const size = 260;
  const r = 100;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    status === "critical" ? "var(--red)" :
    status === "warning" ? "var(--amber)" :
    "var(--ice)";

  const glowClass =
    status === "critical" ? "gauge-glow-warm" :
    status === "warning" ? "gauge-glow-amber" :
    "gauge-glow";

  // Build arc path
  const polarToCart = (angle, radius) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };

  const arcPath = (startA, endA, radius) => {
    const [x1, y1] = polarToCart(startA, radius);
    const [x2, y2] = polarToCart(endA, radius);
    const large = endA - startA > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const targetPct = (target - min) / range;
  const targetAngle = startAngle + sweep * targetPct;
  const [tx, ty] = polarToCart(targetAngle, r);
  const [txOuter, tyOuter] = polarToCart(targetAngle, r + 14);

  // Tick marks
  const ticks = Array.from({ length: 28 }).map((_, i) => {
    const a = startAngle + (sweep / 27) * i;
    const isMajor = i % 4 === 0;
    const inner = isMajor ? r - 18 : r - 10;
    const outer = r - 2;
    const [x1, y1] = polarToCart(a, inner);
    const [x2, y2] = polarToCart(a, outer);
    return { x1, y1, x2, y2, isMajor };
  });

  const displayVal = Number.isFinite(value) ? value.toFixed(1) : "—";

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={glowClass}>
        <defs>
          <linearGradient id="g-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="g-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 18} fill="none" stroke="var(--border-soft)" strokeWidth="1" />

        {/* Track */}
        <path d={arcPath(startAngle, startAngle + sweep, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />

        {/* Value arc */}
        <path
          d={arcPath(startAngle, currentAngle, r)}
          fill="none"
          stroke="url(#g-arc)"
          strokeWidth="14"
          strokeLinecap="round"
          style={{ transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />

        {/* Ticks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}
            strokeWidth={t.isMajor ? 1.5 : 1}
          />
        ))}

        {/* Target marker */}
        <line x1={tx} y1={ty} x2={txOuter} y2={tyOuter} stroke="var(--frost)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={txOuter} cy={tyOuter} r="3" fill="var(--frost)" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill={color} />
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="eyebrow mb-1">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono-data text-6xl font-bold tracking-tight" style={{ color, lineHeight: 1 }}>
            {displayVal}
          </span>
          <span className="font-mono-data text-xl text-[var(--text-dim)]">{unit}</span>
        </div>
        <div className="font-mono-data text-[10px] text-[var(--text-mute)] mt-2 tracking-widest">
          HEDEF {target}{unit}
        </div>
      </div>
    </div>
  );
}
