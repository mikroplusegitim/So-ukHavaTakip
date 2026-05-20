import { Snowflake, BellRinging, BellSlash, CheckCircle, BellSimple } from "@phosphor-icons/react";

export default function Header({ stats, muted, alarmOn, notifPerm, onAskNotif, onMuteToggle, onAckAll }) {
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-10 pt-5 pb-2 relative">
      <div className="glass max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(122,217,245,0.08)] border border-[var(--border-hot)] flex items-center justify-center">
            <Snowflake size={22} weight="duotone" className="text-[var(--ice)]" />
          </div>
          <div>
            <div className="font-serif-display text-xl tracking-tight leading-none">
              Gurme <span className="text-[var(--ice)] font-serif-italic font-light">Enginar</span>
            </div>
            <div className="eyebrow mt-1">Soğuk Zincir İzleme</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-7 font-mono-data text-xs">
          <Stat label="Depo" value={stats?.warehouses_total ?? "—"} testid="stat-warehouses" />
          <Stat label="Aktif" value={stats?.warehouses_online ?? "—"} color="var(--ice)" testid="stat-online" />
          <Stat label="Kesik" value={stats?.warehouses_offline ?? "—"} color={stats?.warehouses_offline ? "var(--red)" : "var(--text-dim)"} testid="stat-offline" />
          <Stat label="Uyarı" value={stats?.active_alerts ?? "—"} color={stats?.critical_alerts ? "var(--red)" : "var(--amber)"} testid="stat-alerts" />
        </div>

        <div className="flex items-center gap-2">
          {notifPerm !== "granted" && (
            <button
              className="btn-pill !py-2 !px-3"
              onClick={onAskNotif}
              data-testid="enable-notif-btn"
              title="Telefon bildirimlerini aç"
            >
              <BellSimple size={14} /> <span className="hidden sm:inline">Bildirim Aç</span>
            </button>
          )}
          <button className="btn-pill !py-2 !px-3" onClick={onMuteToggle} data-testid="mute-toggle-btn" title={muted ? "Sesi aç" : "Sesi kapat"}>
            {muted ? <BellSlash size={14} /> : <BellRinging size={14} className={alarmOn ? "text-[var(--red)]" : ""} />}
          </button>
          <button className="btn-pill" onClick={onAckAll} data-testid="ack-all-btn">
            <CheckCircle size={14} /> Onayla
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, color, testid }) {
  return (
    <div className="flex flex-col items-start" data-testid={testid}>
      <span className="eyebrow !text-[9px]">{label}</span>
      <span className="text-lg font-bold leading-none mt-1" style={{ color: color || "var(--text)" }}>{value}</span>
    </div>
  );
}
