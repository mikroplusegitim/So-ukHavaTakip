import { useEffect, useMemo, useState, useRef } from "react";
import {
  fetchWarehouses,
  fetchReadings,
  fetchAlerts,
  fetchStats,
  togglePower,
  ackAlert,
  ackAllAlerts,
  aiAnalyze,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/lib/api";
import { startAlarm, stopAlarm, chime } from "@/lib/alarm";
import { toast } from "sonner";
import {
  Snowflake,
  Drop,
  Lightning,
  Warning,
  CircleNotch,
  Power,
  Pulse,
  Plant,
  WaveSawtooth,
  Sparkle,
  Bell,
  BellSlash,
  Plus,
  Gear,
  CheckCircle,
  Trash,
  ArrowsClockwise,
  ThermometerSimple,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import WarehouseRail from "@/components/WarehouseRail";
import MetricBlock from "@/components/MetricBlock";
import LiveChart from "@/components/LiveChart";
import AlertsPanel from "@/components/AlertsPanel";
import AIInsights from "@/components/AIInsights";
import SettingsDialog from "@/components/SettingsDialog";
import NewWarehouseDialog from "@/components/NewWarehouseDialog";
import PowerCutOverlay from "@/components/PowerCutOverlay";

const POLL_MS = 2500;

export default function Dashboard() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [alarmOn, setAlarmOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCriticalIdRef = useRef(null);

  const selected = useMemo(
    () => warehouses.find((w) => w.id === selectedId),
    [warehouses, selectedId]
  );
  const latest = readings[readings.length - 1];

  // Initial fetch
  useEffect(() => {
    (async () => {
      try {
        const [whs, st] = await Promise.all([fetchWarehouses(), fetchStats()]);
        setWarehouses(whs);
        setStats(st);
        if (whs.length && !selectedId) setSelectedId(whs[0].id);
      } catch (e) {
        toast.error("Sistem verisi alınamadı");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Polling loop
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [whs, rds, als, st] = await Promise.all([
          fetchWarehouses(),
          fetchReadings(selectedId, 60),
          fetchAlerts({ limit: 50 }),
          fetchStats(),
        ]);
        if (cancelled) return;
        setWarehouses(whs);
        setReadings(rds);
        setAlerts(als);
        setStats(st);
      } catch (e) {
        // silent
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedId]);

  // Critical alert handler: trigger alarm + toast
  useEffect(() => {
    const activeCritical = alerts.find(
      (a) => !a.acknowledged && a.severity === "critical"
    );
    if (activeCritical) {
      if (!alarmOn) {
        setAlarmOn(true);
        if (!muted) startAlarm();
      }
      if (lastCriticalIdRef.current !== activeCritical.id) {
        lastCriticalIdRef.current = activeCritical.id;
        toast.error(activeCritical.title, {
          description: activeCritical.message,
          duration: 7000,
        });
      }
    } else if (alarmOn) {
      setAlarmOn(false);
      stopAlarm();
      lastCriticalIdRef.current = null;
    }
  }, [alerts, alarmOn, muted]);

  // Cleanup on unmount
  useEffect(() => () => stopAlarm(), []);

  const handleTogglePower = async (id) => {
    try {
      await togglePower(id);
      chime();
      const updated = await fetchWarehouses();
      setWarehouses(updated);
      toast.success("Enerji durumu değiştirildi");
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleAckAll = async () => {
    await ackAllAlerts();
    stopAlarm();
    setAlarmOn(false);
    const fresh = await fetchAlerts({ limit: 50 });
    setAlerts(fresh);
    toast.success("Tüm uyarılar onaylandı");
  };

  const handleAck = async (id) => {
    await ackAlert(id);
    const fresh = await fetchAlerts({ limit: 50 });
    setAlerts(fresh);
  };

  const handleMuteToggle = () => {
    if (muted) {
      setMuted(false);
      if (alarmOn) startAlarm();
      toast("Ses açık", { description: "Sesli alarm aktif" });
    } else {
      setMuted(true);
      stopAlarm();
      toast("Ses kapalı", { description: "Görsel uyarılar devam ediyor" });
    }
  };

  const handleCreateWarehouse = async (body) => {
    const wh = await createWarehouse(body);
    const all = await fetchWarehouses();
    setWarehouses(all);
    setSelectedId(wh.id);
    toast.success("Depo oluşturuldu", { description: wh.name });
  };

  const handleSaveSettings = async (body) => {
    await updateWarehouse(selectedId, body);
    const all = await fetchWarehouses();
    setWarehouses(all);
    toast.success("Ayarlar güncellendi");
  };

  const handleDeleteWarehouse = async (id) => {
    await deleteWarehouse(id);
    const all = await fetchWarehouses();
    setWarehouses(all);
    if (all.length) setSelectedId(all[0].id);
    else setSelectedId(null);
    toast.success("Depo silindi");
  };

  const handleAI = async () => {
    return aiAnalyze(selectedId);
  };

  const powerCut = selected && !selected.power_on;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative" data-testid="dashboard">
      {powerCut && <PowerCutOverlay />}
      <Header
        stats={stats}
        muted={muted}
        alarmOn={alarmOn}
        onMuteToggle={handleMuteToggle}
        onAckAll={handleAckAll}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-4">
        {/* Left rail: warehouses */}
        <aside className="col-span-12 lg:col-span-3">
          <WarehouseRail
            warehouses={warehouses}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => setNewOpen(true)}
          />
        </aside>

        {/* Center: metrics + chart */}
        <section className="col-span-12 lg:col-span-6 space-y-4">
          {selected && (
            <>
              <div className="surface p-5 relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="label-tag">Aktif Depo</div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1" data-testid="active-warehouse-name">
                      {selected.name}
                    </h2>
                    <div className="text-sm text-[var(--text-dim)] mt-1 flex items-center gap-2">
                      <Plant size={14} weight="duotone" className="text-[var(--accent)]" />
                      <span>{selected.product}</span>
                      <span className="text-[var(--border-hot)]">•</span>
                      <span>{selected.location}</span>
                      <span className="text-[var(--border-hot)]">•</span>
                      <span className="font-mono-data">{selected.capacity_tons} ton</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-sharp"
                      onClick={() => setSettingsOpen(true)}
                      data-testid="open-settings-btn"
                    >
                      <Gear size={14} className="inline mr-1.5 -mt-0.5" />
                      Ayarlar
                    </button>
                    <button
                      className={`btn-sharp ${selected.power_on ? "btn-danger" : "btn-primary"}`}
                      onClick={() => handleTogglePower(selected.id)}
                      data-testid="toggle-power-btn"
                    >
                      <Power size={14} className="inline mr-1.5 -mt-0.5" />
                      {selected.power_on ? "Şalteri İndir (Simülasyon)" : "Enerjiyi Aç"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricBlock
                    icon={<ThermometerSimple size={20} weight="duotone" />}
                    label="Sıcaklık"
                    value={latest?.temperature?.toFixed(1) ?? "—"}
                    unit="°C"
                    target={selected.temp_target}
                    min={selected.temp_min}
                    max={selected.temp_max}
                    metric="temp"
                    testid="metric-temp"
                  />
                  <MetricBlock
                    icon={<Drop size={20} weight="duotone" />}
                    label="Nem Oranı"
                    value={latest?.humidity?.toFixed(1) ?? "—"}
                    unit="%"
                    target={selected.humidity_target}
                    min={selected.humidity_min}
                    max={selected.humidity_max}
                    metric="humidity"
                    testid="metric-humidity"
                  />
                  <MetricBlock
                    icon={selected.power_on ? <Lightning size={20} weight="duotone" /> : <Warning size={20} weight="duotone" />}
                    label="Enerji"
                    value={selected.power_on ? "AÇIK" : "KESİK"}
                    isStatus
                    statusOk={selected.power_on}
                    testid="metric-power"
                  />
                </div>
              </div>

              <LiveChart readings={readings} warehouse={selected} />
            </>
          )}
        </section>

        {/* Right: alerts + AI insights */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <AlertsPanel alerts={alerts} onAck={handleAck} onAckAll={handleAckAll} />
          {selected && <AIInsights warehouse={selected} onAnalyze={handleAI} />}
        </aside>
      </main>

      <footer className="border-t border-[var(--border)] mt-6 py-4">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between text-xs text-[var(--text-mute)] font-mono-data">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span>SİMÜLASYON MOTORU AKTİF · TICK 4s</span>
          </div>
          <div>FROSTGUARD v1.0 · ENGINAR SOĞUK ZİNCİR</div>
        </div>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        warehouse={selected}
        onSave={handleSaveSettings}
        onDelete={handleDeleteWarehouse}
      />
      <NewWarehouseDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={handleCreateWarehouse}
      />
    </div>
  );
}
