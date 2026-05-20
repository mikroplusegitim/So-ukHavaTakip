import { useState } from "react";
import { Warning, CheckCircle, Lightning, Drop, ThermometerSimple, Info } from "@phosphor-icons/react";

const ICON_BY_TYPE = {
  power_cut: <Lightning size={14} weight="fill" />,
  power_restored: <CheckCircle size={14} weight="fill" />,
  temp_high: <ThermometerSimple size={14} weight="fill" />,
  temp_low: <ThermometerSimple size={14} weight="fill" />,
  humidity_high: <Drop size={14} weight="fill" />,
  humidity_low: <Drop size={14} weight="fill" />,
  system: <Info size={14} weight="fill" />,
};

const SEV_STYLES = {
  critical: { bg: "rgba(255,77,77,0.12)", border: "rgba(255,77,77,0.4)", color: "var(--red)", label: "KRİTİK" },
  warning: { bg: "rgba(255,181,71,0.10)", border: "rgba(255,181,71,0.35)", color: "var(--amber)", label: "UYARI" },
  info: { bg: "rgba(122,217,245,0.08)", border: "rgba(122,217,245,0.3)", color: "var(--ice)", label: "BİLGİ" },
};

export default function AlertsPanel({ alerts, onAck }) {
  const [filter, setFilter] = useState("all");
  const filtered = alerts.filter((a) => (filter === "active" ? !a.acknowledged : true));

  return (
    <div className="glass-strong relative overflow-hidden" data-testid="alerts-panel">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2">
          <Warning size={14} weight="duotone" className="text-[var(--amber)]" />
          <span className="eyebrow">Uyarı Geçmişi</span>
        </div>
        <div className="flex gap-1 p-1 bg-black/30 rounded-full border border-[var(--border-soft)]">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Tümü</FilterBtn>
          <FilterBtn active={filter === "active"} onClick={() => setFilter("active")}>Aktif</FilterBtn>
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <CheckCircle size={32} weight="duotone" className="mx-auto mb-3 text-[var(--ice)] opacity-70" />
            <div className="font-serif-display text-lg text-[var(--text-dim)]">Her şey yolunda.</div>
            <div className="text-xs text-[var(--text-mute)] mt-1">Sistem stabil — uyarı yok.</div>
          </div>
        )}
        <div className="divide-y divide-[var(--border-soft)]">
          {filtered.map((a) => {
            const sev = SEV_STYLES[a.severity] || SEV_STYLES.info;
            return (
              <div
                key={a.id}
                className={`px-5 py-3.5 transition-opacity ${a.acknowledged ? "opacity-40" : ""} hover:bg-[rgba(255,255,255,0.02)]`}
                data-testid={`alert-item-${a.id}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}
                  >
                    {ICON_BY_TYPE[a.type] || <Info size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif-display text-base leading-tight">{a.title}</span>
                      <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded" style={{ color: sev.color, border: `1px solid ${sev.border}` }}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] font-mono-data text-[var(--text-mute)]">
                        {new Date(a.timestamp).toLocaleTimeString("tr-TR")}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-dim)] mt-1">{a.message}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-mono-data text-[var(--text-mute)]">{a.warehouse_name}</span>
                      {!a.acknowledged && (
                        <button
                          onClick={() => onAck(a.id)}
                          className="text-[11px] font-medium text-[var(--ice)] hover:underline"
                          data-testid={`ack-${a.id}`}
                        >
                          Onayla →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[11px] rounded-full transition-all ${
        active ? "bg-[var(--ice)] text-[#001220] font-semibold" : "text-[var(--text-dim)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
