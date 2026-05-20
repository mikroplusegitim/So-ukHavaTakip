import { WifiHigh, Flask } from "@phosphor-icons/react";

export default function ModeBadge({ live, compact = false }) {
  if (live) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-data tracking-widest border"
        style={{
          background: "rgba(122,217,245,0.10)",
          borderColor: "rgba(122,217,245,0.4)",
          color: "var(--ice)",
        }}
        title="Gerçek IoT sensöründen canlı veri alınıyor"
      >
        <WifiHigh size={11} weight="fill" />
        {!compact && "CANLI IoT"}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-data tracking-widest border"
      style={{
        background: "rgba(255,181,71,0.08)",
        borderColor: "rgba(255,181,71,0.3)",
        color: "var(--amber)",
      }}
      title="Demo/simülasyon verisi — gerçek sensör bağlanmadı"
    >
      <Flask size={11} weight="fill" />
      {!compact && "SİMÜLASYON"}
    </span>
  );
}
