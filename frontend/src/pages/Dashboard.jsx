import { useEffect, useMemo, useState, useRef } from "react";
import {
  fetchWarehouses, fetchReadings, fetchAlerts, fetchStats,
  togglePower, ackAlert, ackAllAlerts, aiAnalyze,
  createWarehouse, updateWarehouse, deleteWarehouse,
} from "@/lib/api";
import { startAlarm, stopAlarm, chime } from "@/lib/alarm";
import { requestPermission, notify, getPermission } from "@/lib/notify";
import { toast } from "sonner";
import { CircleNotch, Power, Snowflake, Plant, MapPin, Gear } from "@phosphor-icons/react";
import Header from "@/components/Header";
import WarehouseRail from "@/components/WarehouseRail";
import LiveChart from "@/components/LiveChart";
import AlertsPanel from "@/components/AlertsPanel";
import AIInsights from "@/components/AIInsights";
import SettingsDialog from "@/components/SettingsDialog";
import NewWarehouseDialog from "@/components/NewWarehouseDialog";
import PowerCutOverlay from "@/components/PowerCutOverlay";
import FrostParticles from "@/components/FrostParticles";
import CircularGauge from "@/components/CircularGauge";
import HumidityCard from "@/components/HumidityCard";
import ModeBadge from "@/components/ModeBadge";

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

  const selected = useMemo(() => warehouses.find((w) => w.id === selectedId), [warehouses, selectedId]);
  const latest = readings[readings.length - 1];

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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [whs, rds, als, st] = await Promise.all([
          fetchWarehouses(), fetchReadings(selectedId, 60), fetchAlerts({ limit: 50 }), fetchStats(),
        ]);
        if (cancelled) return;
        setWarehouses(whs); setReadings(rds); setAlerts(als); setStats(st);
      } catch (e) {}
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [selectedId]);

  useEffect(() => {
    const activeCritical = alerts.find((a) => !a.acknowledged && a.severity === "critical");
    if (activeCritical) {
      if (!alarmOn) { setAlarmOn(true); if (!muted) startAlarm(); }
      if (lastCriticalIdRef.current !== activeCritical.id) {
        lastCriticalIdRef.current = activeCritical.id;
        toast.error(activeCritical.title, { description: activeCritical.message, duration: 7000 });
        // Push browser/PWA notification
        notify({
          title: `🚨 ${activeCritical.title}`,
          body: activeCritical.message,
          tag: `alert-${activeCritical.warehouse_id}-${activeCritical.type}`,
        });
      }
    } else if (alarmOn) {
      setAlarmOn(false); stopAlarm(); lastCriticalIdRef.current = null;
    }
  }, [alerts, alarmOn, muted]);

  // Ask for notification permission once
  const [notifPerm, setNotifPerm] = useState(getPermission());
  const askNotif = async () => {
    const p = await requestPermission();
    setNotifPerm(p);
    if (p === "granted") toast.success("Bildirim izni verildi", { description: "Kritik uyarılar telefon ekranına gönderilecek" });
    else toast.error("Bildirim izni reddedildi");
  };

  useEffect(() => () => stopAlarm(), []);

  const handleTogglePower = async (id) => {
    try {
      await togglePower(id); chime();
      const updated = await fetchWarehouses(); setWarehouses(updated);
      toast.success("Enerji durumu değiştirildi");
    } catch { toast.error("İşlem başarısız"); }
  };
  const handleAckAll = async () => {
    await ackAllAlerts(); stopAlarm(); setAlarmOn(false);
    const fresh = await fetchAlerts({ limit: 50 }); setAlerts(fresh);
    toast.success("Tüm uyarılar onaylandı");
  };
  const handleAck = async (id) => {
    await ackAlert(id);
    const fresh = await fetchAlerts({ limit: 50 }); setAlerts(fresh);
  };
  const handleMuteToggle = () => {
    if (muted) { setMuted(false); if (alarmOn) startAlarm(); toast("Ses açık"); }
    else { setMuted(true); stopAlarm(); toast("Ses kapalı"); }
  };
  const handleCreateWarehouse = async (body) => {
    const wh = await createWarehouse(body);
    const all = await fetchWarehouses();
    setWarehouses(all); setSelectedId(wh.id);
    toast.success("Depo oluşturuldu", { description: wh.name });
  };
  const handleSaveSettings = async (body) => {
    await updateWarehouse(selectedId, body);
    const all = await fetchWarehouses(); setWarehouses(all);
    toast.success("Ayarlar güncellendi");
  };
  const handleDeleteWarehouse = async (id) => {
    await deleteWarehouse(id);
    const all = await fetchWarehouses(); setWarehouses(all);
    if (all.length) setSelectedId(all[0].id); else setSelectedId(null);
    toast.success("Depo silindi");
  };
  const handleAI = async () => aiAnalyze(selectedId);

  const powerCut = selected && !selected.power_on;

  // Status computation
  const tempStatus = useMemo(() => {
    if (!latest || !selected) return "normal";
    if (latest.temperature > selected.temp_max) return "critical";
    if (latest.temperature < selected.temp_min) return "warning";
    return "normal";
  }, [latest, selected]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <FrostParticles count={30} />
        <CircleNotch size={36} className="animate-spin text-[var(--ice)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden" data-testid="dashboard">
      <FrostParticles count={45} />
      {powerCut && <PowerCutOverlay />}

      <Header
        stats={stats} muted={muted} alarmOn={alarmOn}
        notifPerm={notifPerm} onAskNotif={askNotif}
        onMuteToggle={handleMuteToggle} onAckAll={handleAckAll}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
        {selected && (
          <>
            {/* HERO SECTION */}
            <section className="mb-8 fade-in" data-testid="hero-section">
              <div className="flex items-center gap-2 mb-3 text-[var(--text-dim)]">
                <span className={selected.power_on ? "dot-cool" : "dot-warm"} />
                <span className="eyebrow">Aktif İzleme</span>
                <span className="eyebrow text-[var(--text-mute)]">·</span>
                <span className="eyebrow font-mono-data">{selected.id.slice(0, 8).toUpperCase()}</span>
                <span className="ml-2"><ModeBadge live={selected.live_mode} /></span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <h1
                    className="font-serif-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tighter"
                    data-testid="active-warehouse-name"
                  >
                    {selected.name.split("—")[0].trim()}
                    {selected.name.includes("—") && (
                      <span className="font-serif-italic text-[var(--ice)] font-light">
                        {" "}— {selected.name.split("—")[1].trim()}
                      </span>
                    )}
                  </h1>
                  <div className="flex items-center gap-4 mt-4 text-sm text-[var(--text-dim)]">
                    <span className="inline-flex items-center gap-1.5"><Plant size={14} weight="duotone" className="text-[var(--ice)]" /> {selected.product}</span>
                    <span className="text-[var(--text-mute)]">·</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={14} weight="duotone" /> {selected.location}</span>
                    <span className="text-[var(--text-mute)]">·</span>
                    <span className="font-mono-data">{selected.capacity_tons} TON</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-pill" onClick={() => setSettingsOpen(true)} data-testid="open-settings-btn">
                    <Gear size={14} /> Ayarlar
                  </button>
                  <button
                    className={`btn-pill ${selected.power_on ? "btn-danger" : "btn-primary"}`}
                    onClick={() => handleTogglePower(selected.id)}
                    data-testid="toggle-power-btn"
                  >
                    <Power size={14} />
                    {selected.power_on ? "Şalteri İndir" : "Enerjiyi Aç"}
                  </button>
                </div>
              </div>
              <div className="hairline mt-6" />
            </section>

            {/* BENTO GRID */}
            <div className="grid grid-cols-12 gap-5 stagger">
              {/* Left rail */}
              <aside className="col-span-12 lg:col-span-3 lg:row-span-2">
                <WarehouseRail
                  warehouses={warehouses} selectedId={selectedId}
                  onSelect={setSelectedId} onAdd={() => setNewOpen(true)}
                />
              </aside>

              {/* Big gauge */}
              <section className="col-span-12 md:col-span-6 lg:col-span-5 glass-strong p-8 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="aurora" />
                <div className="absolute top-4 left-5 flex items-center gap-2 z-10">
                  <Snowflake size={14} weight="duotone" className="text-[var(--ice)]" />
                  <span className="eyebrow">Anlık Sıcaklık</span>
                </div>
                <div className="absolute top-4 right-5 text-[10px] font-mono-data tracking-widest text-[var(--text-mute)]">
                  {powerCut ? <span className="text-[var(--red)]">SOĞUTMA DURDU</span> : "SOĞUTMA AKTİF"}
                </div>
                <div data-testid="metric-temp">
                  <CircularGauge
                    value={latest?.temperature}
                    min={selected.temp_min - 1.5}
                    max={selected.temp_max + 1.5}
                    target={selected.temp_target}
                    status={tempStatus}
                    label="Sıcaklık"
                  />
                </div>
                <div className="flex items-center gap-6 mt-6 text-xs font-mono-data text-[var(--text-dim)]">
                  <span>MİN <span className="text-[var(--frost)]">{selected.temp_min}°</span></span>
                  <span className="text-[var(--text-mute)]">/</span>
                  <span>MAX <span className="text-[var(--frost)]">{selected.temp_max}°</span></span>
                </div>
              </section>

              {/* Humidity + Power stack */}
              <section className="col-span-12 md:col-span-6 lg:col-span-4 grid grid-rows-2 gap-5">
                <HumidityCard latest={latest} warehouse={selected} />
                <div
                  className={`glass-strong p-6 flex flex-col justify-between relative overflow-hidden ${powerCut ? "" : ""}`}
                  data-testid="metric-power"
                  style={powerCut ? { borderColor: "rgba(255,77,77,0.5)" } : {}}
                >
                  <div className="aurora" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Power size={14} weight="duotone" className={selected.power_on ? "text-[var(--ice)]" : "text-[var(--red)]"} />
                      <span className="eyebrow">Enerji Durumu</span>
                    </div>
                    <span className={selected.power_on ? "dot-cool" : "dot-warm"} />
                  </div>
                  <div className="relative z-10">
                    <div
                      className="font-serif-display text-5xl sm:text-6xl leading-none"
                      style={{ color: selected.power_on ? "var(--frost)" : "var(--red)" }}
                    >
                      {selected.power_on ? "Açık" : "Kesik"}
                    </div>
                    <div className="text-xs text-[var(--text-dim)] mt-2 max-w-xs">
                      {selected.power_on
                        ? "Şalter devrede, soğutma kompresörü çalışıyor."
                        : "ŞALTER İNDİRİLDİ. Sıcaklık yükselişe geçti — derhal müdahale edin."}
                    </div>
                  </div>
                </div>
              </section>

              {/* Chart - full width below */}
              <section className="col-span-12 lg:col-span-9">
                <LiveChart readings={readings} warehouse={selected} />
              </section>

              {/* AI Insights tall */}
              <aside className="col-span-12 lg:col-span-3">
                <AIInsights warehouse={selected} onAnalyze={handleAI} />
              </aside>

              {/* Alerts - full width */}
              <section className="col-span-12 lg:col-span-9">
                <AlertsPanel alerts={alerts} onAck={handleAck} onAckAll={handleAckAll} />
              </section>
            </div>
          </>
        )}

        {!selected && warehouses.length === 0 && (
          <div className="text-center py-32">
            <h2 className="font-serif-display text-4xl mb-3">Henüz Depo Yok</h2>
            <p className="text-[var(--text-dim)] mb-6">İlk soğuk hava deponuzu tanımlayarak başlayın.</p>
            <button className="btn-pill btn-primary" onClick={() => setNewOpen(true)}>+ Yeni Depo</button>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border-soft)] mt-12 py-6 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between text-xs text-[var(--text-mute)] font-mono-data">
          <div className="flex items-center gap-2">
            <span className="dot-cool" />
            <span>SİMÜLASYON AKTİF · TICK 4s</span>
          </div>
          <div className="font-serif-italic text-sm text-[var(--text-dim)]">
            MikroPlus <span className="text-[var(--ice)]">/</span> Onur S. Alpdoğan
          </div>
        </div>
      </footer>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} warehouse={selected} onSave={handleSaveSettings} onDelete={handleDeleteWarehouse} />
      <NewWarehouseDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={handleCreateWarehouse} />
    </div>
  );
}
