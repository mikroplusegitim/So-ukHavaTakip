import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Snowflake, ArrowRight, Lightning, Drop, ThermometerSimple,
  Sparkle, ShieldCheck, ChartLineUp, Plant,
} from "@phosphor-icons/react";
import { fetchWarehouses, fetchStats, fetchLatest } from "@/lib/api";
import FrostParticles from "@/components/FrostParticles";

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [previewWh, setPreviewWh] = useState(null);
  const [previewReading, setPreviewReading] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [whs, st] = await Promise.all([fetchWarehouses(), fetchStats()]);
        if (cancelled) return;
        setStats(st);
        if (whs.length) {
          setPreviewWh(whs[0]);
          const r = await fetchLatest(whs[0].id);
          if (!cancelled) setPreviewReading(r);
        }
      } catch {}
    };
    load();
    const id = setInterval(load, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FrostParticles count={60} />

      {/* Decorative aurora orbs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.15), transparent 70%)" }} />
      <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(122,217,245,0.10), transparent 70%)" }} />

      {/* Nav bar */}
      <nav className="relative z-20 px-4 sm:px-6 lg:px-10 pt-6">
        <div className="glass max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between">
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
          <div className="hidden md:flex items-center gap-6 text-xs text-[var(--text-dim)]">
            <a href="#features" className="hover:text-white transition">Özellikler</a>
            <a href="#metrics" className="hover:text-white transition">Canlı Veri</a>
            <a href="#mission" className="hover:text-white transition">Misyon</a>
          </div>
          <Link to="/panel" className="btn-pill btn-primary" data-testid="cta-enter-panel">
            Panele Gir <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 stagger" data-testid="hero">
            <div className="flex items-center gap-2 mb-6">
              <span className="dot-cool" />
              <span className="eyebrow">Mevsim 2026 · Hasat Dönemi</span>
            </div>
            <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-tighter">
              Her bir <span className="font-serif-italic text-[var(--ice)] font-light">enginarın</span>
              <br />tazeliğini koruyan
              <br />görünmez bir <span className="font-serif-italic text-[var(--ice)] font-light">kalkan</span>.
            </h1>
            <p className="mt-7 text-base sm:text-lg text-[var(--text-dim)] max-w-2xl leading-relaxed">
              Soğuk hava deponuzun sıcaklığını, nemini ve enerjisini
              <span className="text-white"> saniye saniye</span> izleyin.
              Şalter indiği an, kompresör durduğu an, sıcaklık yükselişe geçtiği an —
              <span className="text-[var(--ice)]"> ekran ve sesli alarm</span> sizi uyandırır.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link to="/panel" className="btn-pill btn-primary !py-3 !px-6 !text-sm" data-testid="cta-hero-primary">
                Canlı Panele Gir <ArrowRight size={16} weight="bold" />
              </Link>
              <a href="#features" className="btn-pill !py-3 !px-6 !text-sm">
                Sistem Nasıl Çalışır?
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12 max-w-xl">
              <Pill label="Aktif Tesis" value={stats?.warehouses_total ?? "—"} testid="stat-pill-total" />
              <Pill label="Canlı Kayıt" value={stats?.total_readings ?? "—"} color="var(--ice)" testid="stat-pill-readings" />
              <Pill label="Yanıt Süresi" value="< 4s" color="var(--frost)" suffix="" />
            </div>
          </div>

          {/* Live preview card */}
          <div className="lg:col-span-5 fade-in" data-testid="hero-preview">
            <div className="glass-strong p-6 relative overflow-hidden">
              <div className="aurora" />
              <div className="shimmer" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="dot-cool" />
                    <span className="eyebrow">Canlı Önizleme</span>
                  </div>
                  <span className="font-mono-data text-[10px] tracking-widest text-[var(--text-mute)]">
                    {previewWh?.id?.slice(0, 8).toUpperCase() ?? "DEPO"}
                  </span>
                </div>
                <div className="font-serif-display text-2xl mb-1">{previewWh?.name || "Depo yükleniyor..."}</div>
                <div className="text-xs text-[var(--text-dim)] mb-6 flex items-center gap-2">
                  <Plant size={12} weight="duotone" className="text-[var(--ice)]" />
                  {previewWh?.product} · {previewWh?.location}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <PreviewMetric
                    icon={<ThermometerSimple size={14} weight="duotone" />}
                    label="Sıcaklık"
                    value={previewReading?.temperature?.toFixed(1) ?? "—"}
                    unit="°C"
                    color="var(--ice)"
                  />
                  <PreviewMetric
                    icon={<Drop size={14} weight="duotone" />}
                    label="Nem"
                    value={previewReading?.humidity?.toFixed(1) ?? "—"}
                    unit="%"
                    color="var(--frost)"
                  />
                  <PreviewMetric
                    icon={<Lightning size={14} weight="duotone" />}
                    label="Enerji"
                    value={previewWh ? (previewWh.power_on ? "AÇIK" : "KESİK") : "—"}
                    unit=""
                    color={previewWh?.power_on === false ? "var(--red)" : "var(--ice)"}
                  />
                  <PreviewMetric
                    icon={<ShieldCheck size={14} weight="duotone" />}
                    label="Durum"
                    value="STABİL"
                    unit=""
                    color="var(--ice)"
                  />
                </div>

                <div className="hairline my-6" />
                <Link to="/panel" className="flex items-center justify-between group">
                  <span className="text-sm text-[var(--text-dim)] group-hover:text-white transition">
                    Tüm depoları ve canlı grafikleri gör
                  </span>
                  <ArrowRight size={14} className="text-[var(--ice)] group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] font-mono-data tracking-widest text-[var(--text-mute)]">
              VERİ HER 4 SANİYEDE BİR GÜNCELLENİR
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <div className="eyebrow mb-3">Yetenekler</div>
            <h2 className="font-serif-display text-4xl sm:text-5xl tracking-tighter leading-[1] max-w-3xl">
              Mahsulünüzü
              <span className="font-serif-italic text-[var(--ice)] font-light"> dört katmanlı</span> bir
              güvenlik ağıyla sarıyoruz.
            </h2>
          </div>
          <p className="text-sm text-[var(--text-dim)] max-w-md">
            Sensörden alarma kadar her aşama, sıfır kayıp prensibi üzerine inşa edildi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
          <FeatureCard
            icon={<ThermometerSimple size={22} weight="duotone" />}
            title="Mikron Hassas İzleme"
            desc="Sıcaklık ve nem 0.1 birim hassasiyetle takip edilir. Hedef sapması anında işaretlenir."
          />
          <FeatureCard
            icon={<Lightning size={22} weight="duotone" />}
            title="Elektrik Kesintisi Tetik"
            desc="Şalter inse de, hat kopsa da — saniyeler içinde tam ekran kırmızı uyarı ve sesli alarm devreye girer."
          />
          <FeatureCard
            icon={<Sparkle size={22} weight="duotone" />}
            title="Yapay Zeka Analizi"
            desc="Claude Sonnet 4.5 son 60 kaydı analiz eder, enginar için optimum koşulları ve riskleri raporlar."
          />
          <FeatureCard
            icon={<ChartLineUp size={22} weight="duotone" />}
            title="Çoklu Tesis Yönetimi"
            desc="Sınırsız soğuk hava deposu. Tek panelden tüm tesisleri görün, eşikleri ayarlayın, raporlayın."
          />
        </div>
      </section>

      {/* LIVE METRICS STRIP */}
      <section id="metrics" className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="glass-strong p-10 relative overflow-hidden">
          <div className="aurora" />
          <div className="grid md:grid-cols-4 gap-8 relative z-10 text-center">
            <Big number={stats?.warehouses_total ?? 0} label="Aktif Tesis" />
            <Big number={stats?.warehouses_online ?? 0} label="Online Soğutma" color="var(--ice)" />
            <Big number={stats?.total_readings ?? 0} label="Sensör Kaydı" color="var(--frost)" />
            <Big number={stats?.active_alerts ?? 0} label="Aktif Uyarı" color={stats?.critical_alerts ? "var(--red)" : "var(--amber)"} />
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section id="mission" className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="eyebrow mb-3">Misyon</div>
            <h2 className="font-serif-display text-4xl sm:text-5xl tracking-tighter leading-[1.02]">
              Anadolu'nun en kırılgan mahsulü için
              <span className="font-serif-italic text-[var(--ice)] font-light"> kusursuz bir koruma katmanı.</span>
            </h2>
            <p className="mt-6 text-[var(--text-dim)] text-base leading-relaxed max-w-2xl">
              Enginar, hasat sonrası 0°C civarında ve %90+ nem altında saklanmazsa
              günler içinde kararır, lezzetini yitirir. Gurme Enginar; üreticinin emeğini,
              müşterinin tabağına ulaşana dek hassas sensörler, AI tabanlı uyarılar ve
              insan dokunuşuyla korur.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/panel" className="btn-pill btn-primary !py-3 !px-6 !text-sm">
                Sisteme Giriş <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div
              className="aspect-square glass-strong relative overflow-hidden"
              style={{
                backgroundImage: "url(https://static.prod-images.emergentagent.com/jobs/aa6d620a-5db6-4ad1-bb32-8db4de36fa70/images/7facc5e61c6aa48c28b8ecccde8552e3365f9839af4608379b19c036cf3551c3.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,18,31,0.8)] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="eyebrow text-white/80 mb-2">Ürün Profili</div>
                <div className="font-serif-display text-3xl">Enginar — Cynara scolymus</div>
                <div className="text-xs font-mono-data text-white/60 mt-1">
                  0°C · %90-95 NEM · 30 GÜN RAFI
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="glass-strong p-12 lg:p-16 relative overflow-hidden text-center">
          <div className="aurora" />
          <div className="shimmer" />
          <div className="relative z-10">
            <Snowflake size={40} weight="duotone" className="text-[var(--ice)] mx-auto mb-6" />
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1] max-w-3xl mx-auto">
              Mahsulünüz uyurken
              <span className="font-serif-italic text-[var(--ice)] font-light"> biz nöbet tutuyoruz.</span>
            </h2>
            <p className="mt-5 text-[var(--text-dim)] max-w-xl mx-auto">
              Panele giriş yapın, üç örnek depo ile sistemin gücünü saniyeler içinde deneyimleyin.
            </p>
            <Link to="/panel" className="btn-pill btn-primary !py-3.5 !px-7 !text-sm mt-9" data-testid="cta-final">
              Şimdi Panele Gir <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--border-soft)] mt-8 py-6">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-mute)] font-mono-data">
          <div className="flex items-center gap-2">
            <span className="dot-cool" />
            <span>SİMÜLASYON AKTİF · TICK 4s</span>
          </div>
          <div className="font-serif-italic text-sm text-[var(--text-dim)]">
            MikroPlus <span className="text-[var(--ice)]">/</span> Onur S. Alpdoğan
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pill({ label, value, color, suffix, testid }) {
  return (
    <div data-testid={testid}>
      <div className="eyebrow !text-[10px] mb-1">{label}</div>
      <div className="font-mono-data text-2xl font-bold" style={{ color: color || "var(--text)" }}>
        {value}{suffix}
      </div>
    </div>
  );
}

function PreviewMetric({ icon, label, value, unit, color }) {
  return (
    <div className="border border-[var(--border-soft)] rounded-xl p-3 bg-black/20">
      <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="eyebrow !text-[9px]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono-data text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="font-mono-data text-sm text-[var(--text-dim)]">{unit}</span>}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass p-6 relative overflow-hidden hover:border-[var(--border-hot)] transition-all">
      <div className="w-11 h-11 rounded-xl bg-[rgba(122,217,245,0.08)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--ice)] mb-5">
        {icon}
      </div>
      <div className="font-serif-display text-xl leading-tight mb-2">{title}</div>
      <div className="text-xs text-[var(--text-dim)] leading-relaxed">{desc}</div>
    </div>
  );
}

function Big({ number, label, color }) {
  return (
    <div>
      <div className="font-mono-data text-5xl sm:text-6xl font-bold tracking-tight" style={{ color: color || "var(--text)" }}>
        {String(number).padStart(2, "0")}
      </div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}
