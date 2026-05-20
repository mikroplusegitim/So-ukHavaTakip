import { Snowflake, BellRinging, BellSlash, CheckCircle, Pulse } from "@phosphor-icons/react";

export default function Header({ stats, muted, alarmOn, onMuteToggle, onAckAll }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-30 backdrop-blur">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[var(--accent)] flex items-center justify-center bg-[var(--surface-2)]">
            <Snowflake size={22} weight="duotone" className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="font-display text-xl sm:text-2xl font-black tracking-tight">
              FROST<span className="text-[var(--accent)]">GUARD</span>
            </div>
            <div className="label-tag mt-0.5">Soğuk Zincir İzleme Sistemi · Enginar</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 font-mono-data text-xs">
          <Stat label="Depo" value={stats?.warehouses_total ?? "—"} testid="stat-warehouses" />
          <Stat label="Aktif" value={stats?.warehouses_online ?? "—"} color="var(--accent)" testid="stat-online" />
          <Stat label="Kesik" value={stats?.warehouses_offline ?? "—"} color={stats?.warehouses_offline ? "var(--critical)" : "var(--text-dim)"} testid="stat-offline" />
          <Stat label="Aktif Uyarı" value={stats?.active_alerts ?? "—"} color={stats?.critical_alerts ? "var(--critical)" : "var(--warning)"} testid="stat-alerts" />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-sharp"
            onClick={onMuteToggle}
            data-testid="mute-toggle-btn"
            title={muted ? "Sesi aç" : "Sesi kapat"}
          >
            {muted ? <BellSlash size={14} /> : <BellRinging size={14} className={alarmOn ? "text-[var(--critical)]" : ""} />}
          </button>
          <button className="btn-sharp" onClick={onAckAll} data-testid="ack-all-btn">
            <CheckCircle size={14} className="inline -mt-0.5 mr-1" /> Tümünü Onayla
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, color, testid }) {
  return (
    <div className="flex items-baseline gap-2" data-testid={testid}>
      <span className="label-tag">{label}</span>
      <span className="text-lg font-bold" style={{ color: color || "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
