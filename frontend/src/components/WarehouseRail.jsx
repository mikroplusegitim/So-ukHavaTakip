import { Plus, Warehouse as WarehouseIcon, Lightning } from "@phosphor-icons/react";

export default function WarehouseRail({ warehouses, selectedId, onSelect, onAdd }) {
  return (
    <div className="surface" data-testid="warehouse-rail">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="label-tag">Depolar</div>
        <button
          className="btn-sharp btn-primary !py-1.5 !px-3"
          onClick={onAdd}
          data-testid="add-warehouse-btn"
        >
          <Plus size={12} className="inline -mt-0.5 mr-1" /> Yeni
        </button>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {warehouses.map((w) => {
          const active = w.id === selectedId;
          return (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              className={`w-full text-left px-4 py-3.5 transition-colors lift relative group ${
                active ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
              }`}
              data-testid={`warehouse-item-${w.id}`}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
              )}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <WarehouseIcon size={16} weight="duotone" className="text-[var(--text-dim)] flex-shrink-0" />
                  <span className="font-display font-bold text-sm truncate">{w.name}</span>
                </div>
                <span
                  className={w.power_on ? "live-dot" : "dot-red"}
                  title={w.power_on ? "Online" : "Enerji Kesik"}
                />
              </div>
              <div className="text-xs text-[var(--text-dim)] truncate">{w.location}</div>
              <div className="flex items-center gap-3 mt-2 font-mono-data text-xs">
                <span className={w.power_on ? "text-[var(--accent)]" : "text-[var(--critical)]"}>
                  <Lightning size={10} className="inline -mt-0.5" /> {w.power_on ? "AÇIK" : "KESİK"}
                </span>
                <span className="text-[var(--text-mute)]">{w.capacity_tons}t</span>
              </div>
            </button>
          );
        })}
        {warehouses.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-dim)]">
            Henüz depo yok. Yeni Depo ekleyin.
          </div>
        )}
      </div>
    </div>
  );
}
