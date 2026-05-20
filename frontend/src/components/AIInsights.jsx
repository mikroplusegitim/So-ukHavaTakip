import { useState } from "react";
import { Sparkle, CircleNotch, ArrowsClockwise } from "@phosphor-icons/react";

export default function AIInsights({ warehouse, onAnalyze }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setError(null);
    try { const res = await onAnalyze(); setData(res); }
    catch (e) { setError("Analiz yapılamadı."); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-strong relative overflow-hidden h-full flex flex-col" data-testid="ai-insights">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "url(https://static.prod-images.emergentagent.com/jobs/aa6d620a-5db6-4ad1-bb32-8db4de36fa70/images/7facc5e61c6aa48c28b8ecccde8552e3365f9839af4608379b19c036cf3551c3.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "luminosity",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,18,31,0.7)] to-[rgba(6,18,31,0.95)] pointer-events-none" />

      <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Sparkle size={14} weight="duotone" className="text-[var(--ice)]" />
          <span className="eyebrow">Yapay Zeka</span>
        </div>
        <button onClick={run} disabled={loading} className="btn-pill btn-primary !py-1.5 !px-3 !text-[11px]" data-testid="ai-run-btn">
          {loading ? <CircleNotch size={12} className="animate-spin" /> : <ArrowsClockwise size={12} />}
          {data ? "Yenile" : "Analiz Et"}
        </button>
      </div>

      <div className="p-5 relative z-10 flex-1 overflow-y-auto">
        {!data && !loading && (
          <div className="space-y-3">
            <div className="font-serif-display text-2xl leading-tight">
              Enginar için <span className="font-serif-italic text-[var(--ice)] font-light">akıllı</span> öneriler.
            </div>
            <div className="text-xs text-[var(--text-dim)] leading-relaxed">
              Claude Sonnet 4.5 — son 60 sensör kaydını ve aktif uyarıları değerlendirir; optimum koşullar için öneriler madde madde sunar.
            </div>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
            <CircleNotch size={14} className="animate-spin text-[var(--ice)]" /> Sensör desenleri analiz ediliyor...
          </div>
        )}
        {error && <div className="text-sm text-[var(--red)]">{error}</div>}
        {data && (
          <div className="space-y-3" data-testid="ai-analysis-result">
            <div className="flex items-center gap-3 text-[10px] font-mono-data text-[var(--text-mute)]">
              <span>ORT °C <span className="text-[var(--ice)]">{data.avg_temp}</span></span>
              <span>ORT % <span className="text-[var(--ice)]">{data.avg_humidity}</span></span>
              {data.fallback && <span className="text-[var(--amber)]">FALLBACK</span>}
            </div>
            <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-sans leading-relaxed">{data.analysis}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
