# Gurme Enginar — Soğuk Hava Deposu İzleme Sistemi (MikroPlus / Onur S. Alpdoğan)

## Problem Statement (orijinal)
> bir soğuk hava deposunda enginar depolucam bana bu deponun sıcaklık ve nemini devamlı kontrol edebilceğim ve birisi şalteri indirip deponun enerjisini kesip elektrikler gidince hemen müşteri telefonuna bildirim göndereceğim bir uygulama yapmak istiyorum şimdi sistemi incele mimarisini kur gerekli gördüğün özellikleri ekle tasarımı mükemmel ve profosyonel olsun müşteri görünce sisteme ihtiyacı olduğunu hissetsin herşeyi sana bırakıyorum şaşırt beni

## User Choices
- Bildirim: Uygulama içi + sesli alarm
- Veri kaynağı: Simüle edilmiş (gerçekçi)
- Auth: Yok (tek panel)
- AI: Evet (anomali tespiti, akıllı raporlama)
- Çoklu depo desteği

## Architecture
- **Backend**: FastAPI + MongoDB (Motor). Asenkron simülasyon döngüsü (4s tick) her depo için gerçekçi sensör verisi üretir, eşik aşımlarını tespit eder ve uyarı oluşturur.
- **Frontend**: React + Tailwind + Recharts + Phosphor Icons. "Control Room" estetiği (Chivo + JetBrains Mono + Inter), keskin 1px grid borders, dark obsidian arka plan, neon cyan vurgular.
- **AI**: Claude Sonnet 4.5 via Emergent LLM key, Türkçe analiz çıktısı.
- **Audio**: WebAudio API (harici asset yok), kritik uyarıda otomatik tetiklenir.

## Implemented (2026-02-XX)
- 3 örnek depo (Antalya, İzmir, Bursa) auto-seed
- Canlı sıcaklık/nem grafiği (Recharts, son 60 kayıt)
- Devasa metric kartları (sıcaklık / nem / enerji) renkli durum göstergeleri
- "Şalteri İndir" simülasyon butonu → tam ekran kırmızı flash overlay + ses alarmı + toast
- Uyarı paneli (severity bazlı: critical/warning/info) + tekil/toplu onay
- Yapay Zeka Analizi (Claude Sonnet 4.5, son 60 kayıt + aktif uyarılar)
- Eşik ayarları dialog (sıcaklık/nem min-hedef-max düzenleme)
- Yeni depo oluşturma dialog
- Depo silme (onaylı)
- Sessize alma (görsel uyarılar devam eder)
- Çoklu depo sidebar rail (status dot: cyan=online, red=power cut)
- Polling 2.5s, simülasyon tick 4s
- Power restored event → power_cut auto-acknowledge

## Tested
- 9/9 backend pytest ✓
- Frontend e2e: load, power toggle + banner, AI analyze, settings, new warehouse, ack-all ✓

## Backlog (P1/P2)
- **P1**: Gerçek SMS/Telegram bildirim entegrasyonu (Twilio veya Telegram bot)
- **P1**: Geçmiş veri export (CSV/PDF)
- **P2**: Çoklu kullanıcı + rol bazlı erişim (operatör/müşteri)
- **P2**: MQTT/HTTP webhook desteği (gerçek IoT sensör entegrasyonu)
- **P2**: Mobil PWA optimizasyonu + push notification
- **P2**: Tahminsel bakım (sıcaklık trend forecasting)
- **P2**: Çoklu ürün desteği (sadece enginar değil)

## Key Files
- `/app/backend/server.py` — tüm endpointler + simülasyon motoru
- `/app/frontend/src/pages/Dashboard.jsx` — ana panel
- `/app/frontend/src/components/*` — Header, WarehouseRail, MetricBlock, LiveChart, AlertsPanel, AIInsights, SettingsDialog, NewWarehouseDialog, PowerCutOverlay
- `/app/frontend/src/lib/alarm.js` — WebAudio alarm
- `/app/design_guidelines.json` — tasarım sistemi
