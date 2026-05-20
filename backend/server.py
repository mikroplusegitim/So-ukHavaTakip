from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import random
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="FrostGuard - Soğuk Hava Deposu İzleme")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ===================== MODELS =====================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Warehouse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    capacity_tons: float = 50.0
    product: str = "Enginar"
    # Target conditions for artichoke storage
    temp_target: float = 0.5     # °C (recommended 0 to 1 °C)
    temp_min: float = -1.0
    temp_max: float = 2.0
    humidity_target: float = 92.0   # %
    humidity_min: float = 88.0
    humidity_max: float = 95.0
    power_on: bool = True
    created_at: str = Field(default_factory=now_iso)


class WarehouseCreate(BaseModel):
    name: str
    location: str
    capacity_tons: float = 50.0
    product: str = "Enginar"


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity_tons: Optional[float] = None
    temp_target: Optional[float] = None
    temp_min: Optional[float] = None
    temp_max: Optional[float] = None
    humidity_target: Optional[float] = None
    humidity_min: Optional[float] = None
    humidity_max: Optional[float] = None
    power_on: Optional[bool] = None


class SensorReading(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    warehouse_id: str
    temperature: float
    humidity: float
    power_on: bool = True
    timestamp: str = Field(default_factory=now_iso)


class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    warehouse_id: str
    warehouse_name: str
    severity: Literal["critical", "warning", "info"]
    type: Literal["power_cut", "temp_high", "temp_low", "humidity_high", "humidity_low", "system", "power_restored"]
    title: str
    message: str
    value: Optional[float] = None
    acknowledged: bool = False
    timestamp: str = Field(default_factory=now_iso)


class AIAnalysisRequest(BaseModel):
    warehouse_id: str


# ===================== SIMULATION ENGINE =====================

# Cache to keep simulation state realistic between ticks
_sim_state: dict = {}


def _next_reading(wh: dict) -> dict:
    """Generate a realistic next reading based on previous state."""
    wid = wh['id']
    prev = _sim_state.get(wid)
    if prev is None:
        prev = {
            "temperature": wh.get('temp_target', 0.5),
            "humidity": wh.get('humidity_target', 92.0),
            "drift": 0.0,
        }

    power_on = wh.get('power_on', True)

    if power_on:
        # Cooling system active: oscillate near target with small drift
        target_t = wh.get('temp_target', 0.5)
        target_h = wh.get('humidity_target', 92.0)
        # Slowly drift then correct
        prev['drift'] = prev.get('drift', 0.0) + random.uniform(-0.08, 0.08)
        prev['drift'] = max(-0.6, min(0.6, prev['drift']))
        new_t = prev['temperature'] * 0.85 + (target_t + prev['drift']) * 0.15 + random.uniform(-0.05, 0.05)
        new_h = prev['humidity'] * 0.9 + (target_h + random.uniform(-1.2, 1.2)) * 0.1
    else:
        # Power cut: temperature rises towards ambient (18°C), humidity drops
        ambient_t = 18.0
        ambient_h = 60.0
        new_t = prev['temperature'] + (ambient_t - prev['temperature']) * 0.04 + random.uniform(-0.1, 0.15)
        new_h = prev['humidity'] + (ambient_h - prev['humidity']) * 0.03 + random.uniform(-0.5, 0.2)

    new_t = round(max(-15.0, min(35.0, new_t)), 2)
    new_h = round(max(20.0, min(100.0, new_h)), 1)
    prev['temperature'] = new_t
    prev['humidity'] = new_h
    _sim_state[wid] = prev
    return {"temperature": new_t, "humidity": new_h, "power_on": power_on}


async def _check_thresholds_and_alert(wh: dict, reading: dict):
    """Create alerts when readings violate thresholds."""
    alerts_to_create = []
    t = reading['temperature']
    h = reading['humidity']

    if not reading['power_on']:
        # Single active power-cut alert (avoid spam): only create if none active in last 30s
        last_cut = await db.alerts.find_one(
            {"warehouse_id": wh['id'], "type": "power_cut", "acknowledged": False},
            sort=[("timestamp", -1)]
        )
        if not last_cut:
            alerts_to_create.append(Alert(
                warehouse_id=wh['id'],
                warehouse_name=wh['name'],
                severity="critical",
                type="power_cut",
                title="ELEKTRİK KESİNTİSİ",
                message=f"{wh['name']} deposunun enerjisi kesildi! Acil müdahale gerekli.",
                value=None,
            ))
    else:
        if t > wh['temp_max']:
            recent = await db.alerts.find_one(
                {"warehouse_id": wh['id'], "type": "temp_high", "acknowledged": False},
                sort=[("timestamp", -1)]
            )
            if not recent:
                alerts_to_create.append(Alert(
                    warehouse_id=wh['id'], warehouse_name=wh['name'],
                    severity="critical", type="temp_high",
                    title="YÜKSEK SICAKLIK",
                    message=f"Sıcaklık {t}°C — üst limit {wh['temp_max']}°C aşıldı.",
                    value=t,
                ))
        elif t < wh['temp_min']:
            recent = await db.alerts.find_one(
                {"warehouse_id": wh['id'], "type": "temp_low", "acknowledged": False},
                sort=[("timestamp", -1)]
            )
            if not recent:
                alerts_to_create.append(Alert(
                    warehouse_id=wh['id'], warehouse_name=wh['name'],
                    severity="warning", type="temp_low",
                    title="DÜŞÜK SICAKLIK",
                    message=f"Sıcaklık {t}°C — alt limit {wh['temp_min']}°C altında. Donma riski.",
                    value=t,
                ))

        if h > wh['humidity_max']:
            recent = await db.alerts.find_one(
                {"warehouse_id": wh['id'], "type": "humidity_high", "acknowledged": False},
                sort=[("timestamp", -1)]
            )
            if not recent:
                alerts_to_create.append(Alert(
                    warehouse_id=wh['id'], warehouse_name=wh['name'],
                    severity="warning", type="humidity_high",
                    title="YÜKSEK NEM",
                    message=f"Nem %{h} — üst limit %{wh['humidity_max']} aşıldı. Küflenme riski.",
                    value=h,
                ))
        elif h < wh['humidity_min']:
            recent = await db.alerts.find_one(
                {"warehouse_id": wh['id'], "type": "humidity_low", "acknowledged": False},
                sort=[("timestamp", -1)]
            )
            if not recent:
                alerts_to_create.append(Alert(
                    warehouse_id=wh['id'], warehouse_name=wh['name'],
                    severity="warning", type="humidity_low",
                    title="DÜŞÜK NEM",
                    message=f"Nem %{h} — alt limit %{wh['humidity_min']} altında. Kuruma riski.",
                    value=h,
                ))

    for a in alerts_to_create:
        await db.alerts.insert_one(a.model_dump())


async def simulation_loop():
    """Background loop: generate readings every 4 seconds for all warehouses."""
    logger.info("Simülasyon motoru başlatıldı")
    while True:
        try:
            warehouses = await db.warehouses.find({}, {"_id": 0}).to_list(1000)
            for wh in warehouses:
                reading = _next_reading(wh)
                reading_doc = SensorReading(
                    warehouse_id=wh['id'],
                    temperature=reading['temperature'],
                    humidity=reading['humidity'],
                    power_on=reading['power_on'],
                ).model_dump()
                await db.readings.insert_one(reading_doc)
                await _check_thresholds_and_alert(wh, reading)

            # Trim old readings - keep last 500 per warehouse
            for wh in warehouses:
                count = await db.readings.count_documents({"warehouse_id": wh['id']})
                if count > 500:
                    excess = count - 500
                    old = await db.readings.find({"warehouse_id": wh['id']}).sort("timestamp", 1).limit(excess).to_list(excess)
                    if old:
                        await db.readings.delete_many({"id": {"$in": [r['id'] for r in old]}})
        except Exception as e:
            logger.exception(f"Simulation tick error: {e}")
        await asyncio.sleep(4)


async def seed_warehouses():
    count = await db.warehouses.count_documents({})
    if count == 0:
        samples = [
            Warehouse(name="Depo A — Ana Hat", location="Antalya / Manavgat", capacity_tons=80.0),
            Warehouse(name="Depo B — Lojistik", location="İzmir / Bayındır", capacity_tons=60.0),
            Warehouse(name="Depo C — İhracat", location="Bursa / Karacabey", capacity_tons=120.0),
        ]
        for s in samples:
            await db.warehouses.insert_one(s.model_dump())
        logger.info("Örnek depolar oluşturuldu")


# ===================== ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"app": "FrostGuard", "status": "online", "ts": now_iso()}


@api_router.get("/warehouses", response_model=List[Warehouse])
async def list_warehouses():
    items = await db.warehouses.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return items


@api_router.post("/warehouses", response_model=Warehouse)
async def create_warehouse(body: WarehouseCreate):
    wh = Warehouse(**body.model_dump())
    await db.warehouses.insert_one(wh.model_dump())
    return wh


@api_router.get("/warehouses/{wid}", response_model=Warehouse)
async def get_warehouse(wid: str):
    wh = await db.warehouses.find_one({"id": wid}, {"_id": 0})
    if not wh:
        raise HTTPException(404, "Depo bulunamadı")
    return wh


@api_router.patch("/warehouses/{wid}", response_model=Warehouse)
async def update_warehouse(wid: str, body: WarehouseUpdate):
    wh = await db.warehouses.find_one({"id": wid}, {"_id": 0})
    if not wh:
        raise HTTPException(404, "Depo bulunamadı")
    changes = {k: v for k, v in body.model_dump().items() if v is not None}

    # If power state toggled, emit special alert
    if 'power_on' in changes and changes['power_on'] != wh.get('power_on', True):
        if changes['power_on']:
            await db.alerts.insert_one(Alert(
                warehouse_id=wid, warehouse_name=wh['name'],
                severity="info", type="power_restored",
                title="ENERJİ GERİ GELDİ",
                message=f"{wh['name']} deposunda enerji yeniden sağlandı.",
            ).model_dump())
            # auto-ack power_cut alerts for this warehouse
            await db.alerts.update_many(
                {"warehouse_id": wid, "type": "power_cut", "acknowledged": False},
                {"$set": {"acknowledged": True}}
            )

    if changes:
        await db.warehouses.update_one({"id": wid}, {"$set": changes})
    wh = await db.warehouses.find_one({"id": wid}, {"_id": 0})
    return wh


@api_router.delete("/warehouses/{wid}")
async def delete_warehouse(wid: str):
    res = await db.warehouses.delete_one({"id": wid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Depo bulunamadı")
    await db.readings.delete_many({"warehouse_id": wid})
    await db.alerts.delete_many({"warehouse_id": wid})
    _sim_state.pop(wid, None)
    return {"ok": True}


@api_router.get("/warehouses/{wid}/readings", response_model=List[SensorReading])
async def get_readings(wid: str, limit: int = 60):
    items = await db.readings.find({"warehouse_id": wid}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    items.reverse()
    return items


@api_router.get("/warehouses/{wid}/latest", response_model=Optional[SensorReading])
async def get_latest(wid: str):
    item = await db.readings.find_one({"warehouse_id": wid}, {"_id": 0}, sort=[("timestamp", -1)])
    return item


@api_router.post("/warehouses/{wid}/toggle-power", response_model=Warehouse)
async def toggle_power(wid: str):
    wh = await db.warehouses.find_one({"id": wid}, {"_id": 0})
    if not wh:
        raise HTTPException(404, "Depo bulunamadı")
    new_state = not wh.get('power_on', True)
    return await update_warehouse(wid, WarehouseUpdate(power_on=new_state))


@api_router.get("/alerts", response_model=List[Alert])
async def list_alerts(limit: int = 50, only_active: bool = False):
    query = {"acknowledged": False} if only_active else {}
    items = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return items


@api_router.post("/alerts/{aid}/acknowledge", response_model=Alert)
async def ack_alert(aid: str):
    await db.alerts.update_one({"id": aid}, {"$set": {"acknowledged": True}})
    a = await db.alerts.find_one({"id": aid}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Uyarı bulunamadı")
    return a


@api_router.post("/alerts/acknowledge-all")
async def ack_all():
    res = await db.alerts.update_many({"acknowledged": False}, {"$set": {"acknowledged": True}})
    return {"acknowledged": res.modified_count}


@api_router.get("/stats")
async def stats():
    warehouses = await db.warehouses.find({}, {"_id": 0}).to_list(1000)
    online = sum(1 for w in warehouses if w.get('power_on', True))
    offline = len(warehouses) - online
    active_alerts = await db.alerts.count_documents({"acknowledged": False})
    critical = await db.alerts.count_documents({"acknowledged": False, "severity": "critical"})
    total_readings = await db.readings.count_documents({})
    return {
        "warehouses_total": len(warehouses),
        "warehouses_online": online,
        "warehouses_offline": offline,
        "active_alerts": active_alerts,
        "critical_alerts": critical,
        "total_readings": total_readings,
        "uptime": now_iso(),
    }


@api_router.post("/ai/analyze")
async def ai_analyze(body: AIAnalysisRequest):
    wh = await db.warehouses.find_one({"id": body.warehouse_id}, {"_id": 0})
    if not wh:
        raise HTTPException(404, "Depo bulunamadı")
    readings = await db.readings.find({"warehouse_id": body.warehouse_id}, {"_id": 0}).sort("timestamp", -1).limit(60).to_list(60)
    readings.reverse()
    active_alerts = await db.alerts.find(
        {"warehouse_id": body.warehouse_id, "acknowledged": False}, {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)

    if not readings:
        return {"analysis": "Henüz yeterli veri yok. Birkaç saniye içinde tekrar deneyin."}

    temps = [r['temperature'] for r in readings]
    hums = [r['humidity'] for r in readings]
    avg_t = round(sum(temps) / len(temps), 2)
    avg_h = round(sum(hums) / len(hums), 1)
    min_t, max_t = min(temps), max(temps)
    min_h, max_h = min(hums), max(hums)

    summary = f"""Depo: {wh['name']} ({wh['location']}) — Ürün: {wh['product']}
Kapasite: {wh['capacity_tons']} ton | Enerji: {'AÇIK' if wh['power_on'] else 'KESİK'}

Son 60 kayıt:
- Sıcaklık: ort {avg_t}°C, min {min_t}°C, max {max_t}°C (Hedef: {wh['temp_target']}°C, Limit: {wh['temp_min']}°C — {wh['temp_max']}°C)
- Nem: ort %{avg_h}, min %{min_h}, max %{max_h} (Hedef: %{wh['humidity_target']}, Limit: %{wh['humidity_min']} — %{wh['humidity_max']})

Aktif uyarı sayısı: {len(active_alerts)}
"""

    system_msg = (
        "Sen bir tarım soğuk zincir uzmanısın. Enginar (artichoke) hasat sonrası "
        "soğuk hava deposu izleme verilerini analiz edersin. Cevapların Türkçe, "
        "kısa (en fazla 6 kısa madde), profesyonel ve eyleme dönük olsun. "
        "Enginar için optimum koşullar: 0°C civarında sıcaklık ve %90-95 nem. "
        "Donma noktası -1.2°C civarındadır."
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"frostguard-{body.warehouse_id}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"Bu depoyu analiz et ve önerilerini madde madde ver:\n\n{summary}")
        response = await chat.send_message(msg)
        return {
            "analysis": response,
            "avg_temp": avg_t,
            "avg_humidity": avg_h,
            "generated_at": now_iso(),
        }
    except Exception as e:
        logger.exception(f"AI analiz hatası: {e}")
        return {
            "analysis": (
                f"• Ortalama sıcaklık {avg_t}°C, ortalama nem %{avg_h}.\n"
                f"• Hedef sıcaklığa göre sapma: {round(avg_t - wh['temp_target'], 2)}°C.\n"
                f"• {'Enerji kesintisi mevcut — acil müdahale gerekli.' if not wh['power_on'] else 'Sistem stabil.'}\n"
                f"• AI servisine ulaşılamadı: {str(e)[:120]}"
            ),
            "avg_temp": avg_t,
            "avg_humidity": avg_h,
            "generated_at": now_iso(),
            "fallback": True,
        }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed_warehouses()
    asyncio.create_task(simulation_loop())


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
