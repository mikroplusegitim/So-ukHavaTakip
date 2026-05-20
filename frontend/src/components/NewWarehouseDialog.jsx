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
      await onCreate({
        name: name.trim(),
        location: location.trim(),
        capacity_tons: parseFloat(capacity) || 50,
        product: "Enginar",
      });
      setName("");
      setLocation("");
      setCapacity(50);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="new-warehouse-dialog"
    >
      <form
        className="surface w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="label-tag">Yeni Soğuk Hava Deposu</div>
            <div className="font-display text-lg font-bold mt-1">Tesis Tanımla</div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-dim)] hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="label-tag mb-1.5">Depo Adı</div>
            <input
              autoFocus
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 font-mono-data text-sm"
              placeholder="Depo A — Ana Hat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="new-name"
            />
          </div>
          <div>
            <div className="label-tag mb-1.5">Lokasyon</div>
            <input
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 font-mono-data text-sm"
              placeholder="Antalya / Manavgat"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="new-location"
            />
          </div>
          <div>
            <div className="label-tag mb-1.5">Kapasite (ton)</div>
            <input
              type="number"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 font-mono-data text-sm"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              data-testid="new-capacity"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button type="button" className="btn-sharp" onClick={onClose}>İptal</button>
          <button type="submit" disabled={busy} className="btn-sharp btn-primary" data-testid="new-create-btn">
            {busy ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
