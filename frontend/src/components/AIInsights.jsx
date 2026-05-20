import { useState } from "react";
import { Sparkle, CircleNotch, ArrowsClockwise } from "@phosphor-icons/react";

export default function AIInsights({ warehouse, onAnalyze }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onAnalyze();
      setData(res);
    } catch (e) {
      setError("Analiz yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="surface relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(17,17,22,0.96), rgba(17,17,22,0.99)), url(https://static.prod-images.emergentagent.com/jobs/aa6d620a-5db6-4ad1-bb32-8db4de36fa70/images/7facc5e61c6aa48c28b8ecccde8552e3365f9839af4608379b19c036cf3551c3.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="ai-insights"
    >
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={14} weight="duotone" className="text-[var(--accent)]" />
          <span className="label-tag">Yapay Zeka Analizi</span>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="btn-sharp btn-primary !py-1.5 !px-3"
          data-testid="ai-run-btn"
        >
          {loading ? (
            <CircleNotch size={12} className="animate-spin inline -mt-0.5 mr-1" />
          ) : (
            <ArrowsClockwise size={12} className="inline -mt-0.5 mr-1" />
          )}
          {data ? "Yenile" : "Analiz Et"}
        </button>
      </div>
      <div className="p-4 min-h-[180px]">
        {!data && !loading && (
          <div className="text-xs text-[var(--text-dim)] leading-relaxed">
            Claude Sonnet 4.5 ile {warehouse?.name} deposunun son 60 sensör kaydını
            analiz edin. Enginar için optimum koşullar değerlendirilir, sapmalar ve
            öneriler madde madde sunulur.
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
            <CircleNotch size={14} className="animate-spin text-[var(--accent)]" />
            Sensör desenleri analiz ediliyor...
          </div>
        )}
        {error && <div className="text-sm text-[var(--critical)]">{error}</div>}
        {data && (
          <div className="space-y-2" data-testid="ai-analysis-result">
            <div className="flex items-center gap-3 mb-2 text-[10px] font-mono-data text-[var(--text-mute)]">
              <span>ORT °C: <span className="text-[var(--accent)]">{data.avg_temp}</span></span>
              <span>ORT %: <span className="text-[var(--accent)]">{data.avg_humidity}</span></span>
              {data.fallback && <span className="text-[var(--warning)]">FALLBACK</span>}
            </div>
            <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-sans leading-relaxed">
              {data.analysis}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
