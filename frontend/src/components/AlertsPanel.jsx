import { Warning, CheckCircle, Lightning, Drop, ThermometerSimple, Info } from "@phosphor-icons/react";
import { useState } from "react";

const ICON_BY_TYPE = {
  power_cut: <Lightning size={14} weight="bold" />,
  power_restored: <CheckCircle size={14} weight="bold" />,
  temp_high: <ThermometerSimple size={14} weight="bold" />,
  temp_low: <ThermometerSimple size={14} weight="bold" />,
  humidity_high: <Drop size={14} weight="bold" />,
  humidity_low: <Drop size={14} weight="bold" />,
  system: <Info size={14} weight="bold" />,
};

export default function AlertsPanel({ alerts, onAck }) {
  const [filter, setFilter] = useState("all");
  const filtered = alerts.filter((a) =>
    filter === "active" ? !a.acknowledged : true
  );

  return (
    <div className="surface" data-testid="alerts-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Warning size={14} weight="duotone" className="text-[var(--warning)]" />
          <span className="label-tag">Uyarı Akışı</span>
        </div>
        <div className="flex border border-[var(--border-hot)]">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            Tümü
          </FilterBtn>
          <FilterBtn active={filter === "active"} onClick={() => setFilter("active")}>
            Aktif
          </FilterBtn>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-[var(--border)]">
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-dim)]">
            <CheckCircle size={28} weight="duotone" className="mx-auto mb-2 text-[var(--accent)]" />
            Uyarı yok. Sistem stabil.
          </div>
        )}
        {filtered.map((a) => {
          const sevClass =
            a.severity === "critical"
              ? "sev-critical"
              : a.severity === "warning"
              ? "sev-warning"
              : "sev-info";
          return (
            <div
              key={a.id}
              className={`px-4 py-3 ${a.acknowledged ? "opacity-50" : ""}`}
              data-testid={`alert-item-${a.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 px-2 py-1 ${sevClass}`}>
                  {ICON_BY_TYPE[a.type] || <Info size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm">{a.title}</span>
                    <span className="text-[10px] font-mono-data text-[var(--text-mute)]">
                      {new Date(a.timestamp).toLocaleTimeString("tr-TR")}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-dim)] mt-1">{a.message}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono-data text-[var(--text-mute)]">
                      {a.warehouse_name}
                    </span>
                    {!a.acknowledged && (
                      <button
                        onClick={() => onAck(a.id)}
                        className="text-[10px] tracking-[0.15em] font-bold text-[var(--accent)] hover:underline"
                        data-testid={`ack-${a.id}`}
                      >
                        ONAYLA →
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
  );
}

function FilterBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] tracking-[0.15em] font-bold ${
        active ? "bg-[var(--accent)] text-black" : "text-[var(--text-dim)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
