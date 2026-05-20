import { Plus, Buildings } from "@phosphor-icons/react";
import ModeBadge from "./ModeBadge";

export default function WarehouseRail({ warehouses, selectedId, onSelect, onAdd }) {
  return (
    <div className="glass-strong overflow-hidden" data-testid="warehouse-rail">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2">
          <Buildings size={14} weight="duotone" className="text-[var(--ice)]" />
          <span className="eyebrow">Tesisler</span>
        </div>
        <button className="btn-pill !py-1.5 !px-3 !text-[11px]" onClick={onAdd} data-testid="add-warehouse-btn">
          <Plus size={12} /> Yeni
        </button>
      </div>
      <div className="divide-y divide-[var(--border-soft)] max-h-[520px] overflow-y-auto">
        {warehouses.map((w) => {
          const active = w.id === selectedId;
          return (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              className={`w-full text-left px-5 py-4 relative group transition-all duration-300 ${
                active ? "bg-[rgba(122,217,245,0.05)]" : "hover:bg-[rgba(255,255,255,0.02)]"
              }`}
              data-testid={`warehouse-item-${w.id}`}
            >
              {active && <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-[var(--ice)] rounded-full" />}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="font-serif-display text-base leading-tight truncate">{w.name}</div>
                <span className={w.power_on ? "dot-cool flex-shrink-0 mt-1.5" : "dot-warm flex-shrink-0 mt-1.5"} />
              </div>
              <div className="text-xs text-[var(--text-dim)] truncate">{w.location}</div>
              <div className="flex items-center justify-between mt-2 font-mono-data text-[10px]">
                <span className={w.power_on ? "text-[var(--ice)]" : "text-[var(--red)]"}>
                  {w.power_on ? "● ENERJİ" : "○ KESİK"}
                </span>
                <div className="flex items-center gap-2">
                  <ModeBadge live={w.live_mode} compact />
                  <span className="text-[var(--text-mute)]">{w.capacity_tons}T</span>
                </div>
              </div>
            </button>
          );
        })}
        {warehouses.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-[var(--text-dim)]">
            Henüz tesis tanımlı değil.
          </div>
        )}
      </div>
    </div>
  );
}
