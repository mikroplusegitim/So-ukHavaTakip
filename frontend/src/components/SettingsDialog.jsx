import { useEffect, useState } from "react";
import { X, Trash } from "@phosphor-icons/react";

export default function SettingsDialog({ open, onClose, warehouse, onSave, onDelete }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (warehouse) {
      setForm({
        name: warehouse.name,
        location: warehouse.location,
        capacity_tons: warehouse.capacity_tons,
        temp_target: warehouse.temp_target,
        temp_min: warehouse.temp_min,
        temp_max: warehouse.temp_max,
        humidity_target: warehouse.humidity_target,
        humidity_min: warehouse.humidity_min,
        humidity_max: warehouse.humidity_max,
      });
    }
  }, [warehouse]);

  if (!open || !form) return null;

  const submit = async () => {
    await onSave({
      ...form,
      capacity_tons: parseFloat(form.capacity_tons),
      temp_target: parseFloat(form.temp_target),
      temp_min: parseFloat(form.temp_min),
      temp_max: parseFloat(form.temp_max),
      humidity_target: parseFloat(form.humidity_target),
      humidity_min: parseFloat(form.humidity_min),
      humidity_max: parseFloat(form.humidity_max),
    });
    onClose();
  };

  const confirmDelete = async () => {
    if (window.confirm(`${warehouse.name} kalıcı olarak silinsin mi?`)) {
      await onDelete(warehouse.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="settings-dialog"
    >
      <div
        className="surface w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="label-tag">Depo Ayarları</div>
            <div className="font-display text-lg font-bold mt-1">{warehouse.name}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-white" data-testid="close-settings-btn">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          <Field label="Depo Adı" full>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="input-name"
            />
          </Field>
          <Field label="Lokasyon" full>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              data-testid="input-location"
            />
          </Field>
          <Field label="Kapasite (ton)">
            <input
              type="number"
              step="0.1"
              className="input"
              value={form.capacity_tons}
              onChange={(e) => setForm({ ...form, capacity_tons: e.target.value })}
            />
          </Field>
          <div />
          <Field label="Sıcaklık Hedef °C">
            <input type="number" step="0.1" className="input" value={form.temp_target}
              onChange={(e) => setForm({ ...form, temp_target: e.target.value })} />
          </Field>
          <Field label="Sıcaklık Min — Max °C">
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.1" className="input" value={form.temp_min}
                onChange={(e) => setForm({ ...form, temp_min: e.target.value })} />
              <input type="number" step="0.1" className="input" value={form.temp_max}
                onChange={(e) => setForm({ ...form, temp_max: e.target.value })} />
            </div>
          </Field>
          <Field label="Nem Hedef %">
            <input type="number" step="0.1" className="input" value={form.humidity_target}
              onChange={(e) => setForm({ ...form, humidity_target: e.target.value })} />
          </Field>
          <Field label="Nem Min — Max %">
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.1" className="input" value={form.humidity_min}
                onChange={(e) => setForm({ ...form, humidity_min: e.target.value })} />
              <input type="number" step="0.1" className="input" value={form.humidity_max}
                onChange={(e) => setForm({ ...form, humidity_max: e.target.value })} />
            </div>
          </Field>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
          <button className="btn-sharp btn-danger" onClick={confirmDelete} data-testid="delete-warehouse-btn">
            <Trash size={12} className="inline -mt-0.5 mr-1" /> Sil
          </button>
          <div className="flex gap-2">
            <button className="btn-sharp" onClick={onClose}>İptal</button>
            <button className="btn-sharp btn-primary" onClick={submit} data-testid="save-settings-btn">Kaydet</button>
          </div>
        </div>
      </div>
      <style>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 9px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .input:focus { outline: none; border-color: var(--accent); }
      `}</style>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="label-tag mb-1.5">{label}</div>
      {children}
    </div>
  );
}
