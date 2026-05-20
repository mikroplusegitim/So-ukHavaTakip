export default function MetricBlock({
  icon,
  label,
  value,
  unit,
  target,
  min,
  max,
  metric,
  isStatus,
  statusOk,
  testid,
}) {
  // Determine status color
  let color = "var(--accent)";
  let statusText = "NORMAL";
  let n = parseFloat(value);

  if (isStatus) {
    color = statusOk ? "var(--accent)" : "var(--critical)";
    statusText = statusOk ? "STABİL" : "ACİL DURUM";
  } else if (!isNaN(n) && min !== undefined && max !== undefined) {
    if (n > max) {
      color = "var(--critical)";
      statusText = "ÜST LİMİT AŞIM";
    } else if (n < min) {
      color = "var(--warning)";
      statusText = "ALT LİMİT";
    } else if (target !== undefined && Math.abs(n - target) > (max - min) * 0.3) {
      color = "var(--warning)";
      statusText = "SAPMA";
    }
  }

  // Build mini sparkline gauge bar
  let percent = 50;
  if (!isStatus && !isNaN(n) && min !== undefined && max !== undefined) {
    const range = max - min;
    percent = Math.max(0, Math.min(100, ((n - min) / range) * 100));
  }

  return (
    <div
      className="border border-[var(--border)] p-4 bg-[var(--surface-2)] relative lift"
      data-testid={testid}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[var(--text-dim)]">
          <span style={{ color }}>{icon}</span>
          <span className="label-tag">{label}</span>
        </div>
        <div className="text-[10px] font-mono-data tracking-widest" style={{ color }}>
          {statusText}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="metric-value text-5xl sm:text-6xl tick" style={{ color }}>
          {value}
        </span>
        {unit && <span className="metric-unit text-xl">{unit}</span>}
      </div>
      {!isStatus && (
        <>
          <div className="mt-4 h-1 bg-[var(--surface)] relative overflow-hidden border border-[var(--border)]">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-700"
              style={{ width: `${percent}%`, background: color }}
            />
            {target !== undefined && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--text-dim)] opacity-60"
                style={{
                  left: `${Math.max(0, Math.min(100, ((target - min) / (max - min)) * 100))}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] font-mono-data text-[var(--text-mute)]">
            <span>MIN {min}{unit}</span>
            <span>HEDEF {target}{unit}</span>
            <span>MAX {max}{unit}</span>
          </div>
        </>
      )}
      {isStatus && (
        <div className="mt-4 text-xs text-[var(--text-dim)]">
          {statusOk
            ? "Soğutma sistemi devrede. Tüm devreler aktif."
            : "Şalter indirildi veya enerji kayboldu."}
        </div>
      )}
    </div>
  );
}
