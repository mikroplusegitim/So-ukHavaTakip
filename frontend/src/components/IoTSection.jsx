import { useState } from "react";
import { Copy, ArrowsClockwise, CheckCircle, WifiHigh } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function IoTSection({ warehouse, onKeyRotated }) {
  const [revealed, setRevealed] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [key, setKey] = useState(warehouse.api_key);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const endpoint = `${backendUrl}/api/ingest/${warehouse.id}`;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı`);
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  const rotate = async () => {
    if (!window.confirm("API anahtarı yenilensin mi? Eski anahtar derhal geçersiz olur.")) return;
    setRotating(true);
    try {
      const res = await api.post(`/warehouses/${warehouse.id}/rotate-key`).then((r) => r.data);
      setKey(res.api_key);
      onKeyRotated && onKeyRotated(res.api_key);
      toast.success("Yeni API anahtarı üretildi");
    } catch {
      toast.error("Yenileme başarısız");
    } finally {
      setRotating(false);
    }
  };

  const masked = key ? `${key.slice(0, 6)}${"•".repeat(20)}${key.slice(-4)}` : "—";

  const curlExample = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${key}" \\
  -d '{"temperature": 0.5, "humidity": 92.0, "power_on": true}'`;

  const arduinoExample = `// ESP32 / NodeMCU örnek (HTTPS POST her 4 saniyede bir)
#include <WiFi.h>
#include <HTTPClient.h>

const char* endpoint = "${endpoint}";
const char* apiKey   = "${key}";

void sendReading(float t, float h, bool power) {
  HTTPClient http;
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  String body = "{\\"temperature\\":" + String(t,2) +
                ",\\"humidity\\":" + String(h,1) +
                ",\\"power_on\\":" + (power ? "true" : "false") + "}";
  int code = http.POST(body);
  http.end();
}`;

  return (
    <div className="border-t border-[var(--border-soft)] pt-5 mt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WifiHigh size={14} weight="duotone" className="text-[var(--ice)]" />
          <span className="eyebrow">IoT Bağlantısı</span>
          <span
            className="ml-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-data tracking-widest border"
            style={
              warehouse.live_mode
                ? { background: "rgba(122,217,245,0.10)", borderColor: "rgba(122,217,245,0.4)", color: "var(--ice)" }
                : { background: "rgba(255,181,71,0.08)", borderColor: "rgba(255,181,71,0.3)", color: "var(--amber)" }
            }
          >
            {warehouse.live_mode ? "● CANLI" : "○ SİMÜLASYON"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="eyebrow">Webhook Endpoint</div>
            <button className="text-[var(--ice)] text-[11px] hover:underline" onClick={() => copy(endpoint, "Endpoint")}>
              <Copy size={11} className="inline -mt-0.5 mr-1" /> Kopyala
            </button>
          </div>
          <div className="frost-input !cursor-default break-all" data-testid="iot-endpoint">{endpoint}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="eyebrow">API Anahtarı</div>
            <div className="flex gap-3 text-[11px]">
              <button className="text-[var(--text-dim)] hover:text-white" onClick={() => setRevealed((v) => !v)}>
                {revealed ? "Gizle" : "Göster"}
              </button>
              <button className="text-[var(--ice)] hover:underline" onClick={() => copy(key, "API anahtarı")}>
                <Copy size={11} className="inline -mt-0.5 mr-1" /> Kopyala
              </button>
              <button className="text-[var(--amber)] hover:underline disabled:opacity-50" disabled={rotating} onClick={rotate} data-testid="rotate-key-btn">
                <ArrowsClockwise size={11} className={`inline -mt-0.5 mr-1 ${rotating ? "animate-spin" : ""}`} /> Yenile
              </button>
            </div>
          </div>
          <div className="frost-input !cursor-default break-all text-[var(--ice)]" data-testid="iot-api-key">
            {revealed ? key : masked}
          </div>
        </div>

        <details className="rounded-xl border border-[var(--border-soft)] overflow-hidden">
          <summary className="px-3 py-2.5 cursor-pointer hover:bg-white/5 flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>cURL / HTTP örneği</span>
            <span className="text-[var(--ice)] text-[11px]">aç ↓</span>
          </summary>
          <div className="relative">
            <pre className="text-[11px] font-mono-data p-3 bg-black/40 overflow-x-auto whitespace-pre text-[var(--text)]">{curlExample}</pre>
            <button className="absolute top-2 right-2 text-[11px] text-[var(--ice)] hover:underline" onClick={() => copy(curlExample, "cURL örneği")}>
              <Copy size={11} className="inline -mt-0.5 mr-1" /> Kopyala
            </button>
          </div>
        </details>

        <details className="rounded-xl border border-[var(--border-soft)] overflow-hidden">
          <summary className="px-3 py-2.5 cursor-pointer hover:bg-white/5 flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>ESP32 / Arduino örneği</span>
            <span className="text-[var(--ice)] text-[11px]">aç ↓</span>
          </summary>
          <div className="relative">
            <pre className="text-[11px] font-mono-data p-3 bg-black/40 overflow-x-auto whitespace-pre text-[var(--text)]">{arduinoExample}</pre>
            <button className="absolute top-2 right-2 text-[11px] text-[var(--ice)] hover:underline" onClick={() => copy(arduinoExample, "Arduino örneği")}>
              <Copy size={11} className="inline -mt-0.5 mr-1" /> Kopyala
            </button>
          </div>
        </details>

        <div className="flex items-start gap-2 text-[11px] text-[var(--text-mute)] mt-3">
          <CheckCircle size={12} weight="duotone" className="text-[var(--ice)] flex-shrink-0 mt-0.5" />
          <span>
            İlk geçerli veri geldiğinde depo otomatik olarak <span className="text-[var(--ice)]">Canlı IoT</span> moduna geçer.
            60 saniye boyunca veri gelmezse simülasyona döner.
          </span>
        </div>
      </div>
    </div>
  );
}
