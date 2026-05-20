import { useState } from "react";
import { X } from "@phosphor-icons/react";

export default function NewWarehouseDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), location: location.trim(), capacity_tons: parseFloat(capacity) || 50, product: "Enginar" });
      setName(""); setLocation(""); setCapacity(50); onClose();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose} data-testid="new-warehouse-dialog">
      <form className="glass-strong w-full max-w-md fade-in" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-soft)]">
          <div>
            <div className="eyebrow">Yeni Tesis</div>
            <div className="font-serif-display text-2xl mt-1">
              Soğuk Hava <span className="font-serif-italic text-[var(--ice)] font-light">Deposu</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-dim)] hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="eyebrow mb-2">Depo Adı</div>
            <input autoFocus className="frost-input" placeholder="Depo A — Ana Hat" value={name} onChange={(e) => setName(e.target.value)} data-testid="new-name" />
          </div>
          <div>
            <div className="eyebrow mb-2">Lokasyon</div>
            <input className="frost-input" placeholder="Antalya / Manavgat" value={location} onChange={(e) => setLocation(e.target.value)} data-testid="new-location" />
          </div>
          <div>
            <div className="eyebrow mb-2">Kapasite (ton)</div>
            <input type="number" className="frost-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} data-testid="new-capacity" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-soft)]">
          <button type="button" className="btn-pill" onClick={onClose}>İptal</button>
          <button type="submit" disabled={busy} className="btn-pill btn-primary" data-testid="new-create-btn">
            {busy ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
