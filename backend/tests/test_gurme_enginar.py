"""Backend tests for Gurme Enginar - IoT ingest, PWA support and regression tests."""
import os
import time
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / 'frontend' / '.env')

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ===================== Regression: existing endpoints =====================

def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("app") == "Gurme Enginar"
    assert body.get("status") == "online"


def test_warehouses_seeded(session):
    r = session.get(f"{API}/warehouses")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 3
    # Every warehouse must expose IoT fields
    for w in data:
        assert "id" in w and "name" in w
        assert "api_key" in w, "api_key missing from warehouse"
        assert isinstance(w["api_key"], str) and w["api_key"].startswith("ge_")
        assert "live_mode" in w
        assert "last_ingest_at" in w  # may be None


def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    for k in ["warehouses_total", "warehouses_online", "active_alerts", "total_readings"]:
        assert k in r.json()


# ===================== IoT: rotate-key =====================

def test_rotate_key_invalidates_old(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    old_key = whs[0]['api_key']

    r = session.post(f"{API}/warehouses/{wid}/rotate-key")
    assert r.status_code == 200
    new_key = r.json().get("api_key")
    assert new_key and new_key != old_key
    assert new_key.startswith("ge_")

    # Confirm GET /warehouses reflects new key
    refreshed = session.get(f"{API}/warehouses").json()
    updated = next(w for w in refreshed if w['id'] == wid)
    assert updated['api_key'] == new_key

    # Ingest with old key must fail 401
    bad = session.post(f"{API}/ingest/{wid}", json={
        "temperature": 0.5, "humidity": 92.0, "api_key": old_key
    })
    assert bad.status_code == 401


# ===================== IoT: ingest auth =====================

def test_ingest_wrong_key_401(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    r = session.post(f"{API}/ingest/{wid}", json={
        "temperature": 0.5, "humidity": 92.0, "api_key": "ge_wrong_key"
    })
    assert r.status_code == 401


def test_ingest_body_key_ok_and_marks_live(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    key = whs[0]['api_key']

    r = session.post(f"{API}/ingest/{wid}", json={
        "temperature": 0.4, "humidity": 91.0, "api_key": key
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert data["mode"] == "live"

    # warehouse should now be in live_mode
    wh = session.get(f"{API}/warehouses/{wid}").json()
    assert wh['live_mode'] is True
    assert wh['last_ingest_at'] is not None


def test_ingest_header_key_ok(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[1]['id']
    key = whs[1]['api_key']

    r = requests.post(
        f"{API}/ingest/{wid}",
        json={"temperature": 0.6, "humidity": 92.5},
        headers={"Content-Type": "application/json", "X-API-Key": key},
    )
    assert r.status_code == 200, r.text
    assert r.json()["mode"] == "live"


def test_ingest_persists_reading(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    key = whs[0]['api_key']
    # Ingest a distinct value
    session.post(f"{API}/ingest/{wid}", json={"temperature": 0.77, "humidity": 91.3, "api_key": key})
    readings = session.get(f"{API}/warehouses/{wid}/readings?limit=10").json()
    assert len(readings) > 0
    last = readings[-1]
    assert "temperature" in last and "humidity" in last


# ===================== IoT: validation =====================

def test_ingest_temp_out_of_bounds_422(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    key = whs[0]['api_key']
    r = session.post(f"{API}/ingest/{wid}", json={
        "temperature": -50, "humidity": 90, "api_key": key
    })
    assert r.status_code == 422


def test_ingest_humidity_out_of_bounds_422(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    key = whs[0]['api_key']
    r = session.post(f"{API}/ingest/{wid}", json={
        "temperature": 0.5, "humidity": 150, "api_key": key
    })
    assert r.status_code == 422


# ===================== IoT: power_cut + power_restored via ingest =====================

def test_ingest_power_cut_then_restored_alerts(session):
    # Create dedicated TEST_ warehouse to keep test isolated
    wh = session.post(f"{API}/warehouses", json={
        "name": "TEST_IoT_Power", "location": "Test/IoT", "capacity_tons": 10.0
    }).json()
    wid = wh['id']
    key = wh['api_key']
    try:
        # First send a normal reading to enter live mode
        session.post(f"{API}/ingest/{wid}", json={
            "temperature": 0.5, "humidity": 92.0, "api_key": key, "power_on": True
        })
        # Power cut event
        r1 = session.post(f"{API}/ingest/{wid}", json={
            "temperature": 1.0, "humidity": 90.0, "api_key": key, "power_on": False
        })
        assert r1.status_code == 200
        time.sleep(1)
        alerts = session.get(f"{API}/alerts?limit=100").json()
        cuts = [a for a in alerts if a['warehouse_id'] == wid and a['type'] == 'power_cut']
        assert len(cuts) > 0, "power_cut alert not generated by ingest"

        # Power restored event
        r2 = session.post(f"{API}/ingest/{wid}", json={
            "temperature": 0.5, "humidity": 92.0, "api_key": key, "power_on": True
        })
        assert r2.status_code == 200
        time.sleep(1)
        alerts2 = session.get(f"{API}/alerts?limit=100").json()
        restored = [a for a in alerts2 if a['warehouse_id'] == wid and a['type'] == 'power_restored']
        assert len(restored) > 0, "power_restored alert not generated"
        active_cuts = [a for a in alerts2 if a['warehouse_id'] == wid and a['type'] == 'power_cut' and not a['acknowledged']]
        assert len(active_cuts) == 0, "old power_cut not auto-acked"
    finally:
        session.delete(f"{API}/warehouses/{wid}")


# ===================== IoT: threshold violation via ingest =====================

def test_ingest_threshold_violation_creates_alert(session):
    wh = session.post(f"{API}/warehouses", json={
        "name": "TEST_IoT_Threshold", "location": "Test/IoT"
    }).json()
    wid = wh['id']
    key = wh['api_key']
    try:
        # Ingest a high temp reading (above default temp_max=2.0)
        r = session.post(f"{API}/ingest/{wid}", json={
            "temperature": 15.0, "humidity": 92.0, "api_key": key, "power_on": True
        })
        assert r.status_code == 200
        time.sleep(1)
        alerts = session.get(f"{API}/alerts?limit=100").json()
        temp_high = [a for a in alerts if a['warehouse_id'] == wid and a['type'] == 'temp_high']
        assert len(temp_high) > 0, "temp_high alert not generated by ingest"

        # Now ingest a humidity violation in a fresh warehouse to avoid power-cut blocking
        r2 = session.post(f"{API}/ingest/{wid}", json={
            "temperature": 0.5, "humidity": 99.5, "api_key": key, "power_on": True
        })
        assert r2.status_code == 200
        time.sleep(1)
        alerts2 = session.get(f"{API}/alerts?limit=100").json()
        hum_high = [a for a in alerts2 if a['warehouse_id'] == wid and a['type'] == 'humidity_high']
        assert len(hum_high) > 0, "humidity_high alert not generated by ingest"
    finally:
        session.delete(f"{API}/warehouses/{wid}")


# ===================== IoT: auto-revert to simulation after 60s =====================

@pytest.mark.slow
def test_live_mode_auto_reverts(session):
    wh = session.post(f"{API}/warehouses", json={
        "name": "TEST_IoT_AutoRevert", "location": "Test/IoT"
    }).json()
    wid = wh['id']
    key = wh['api_key']
    try:
        # Enter live mode
        session.post(f"{API}/ingest/{wid}", json={
            "temperature": 0.5, "humidity": 92.0, "api_key": key
        })
        live = session.get(f"{API}/warehouses/{wid}").json()
        assert live['live_mode'] is True
        # Wait ~70s (>60s timeout + 4s sim tick to actually flip the flag)
        time.sleep(70)
        after = session.get(f"{API}/warehouses/{wid}").json()
        assert after['live_mode'] is False, "live_mode did not auto-revert after >60s"
    finally:
        session.delete(f"{API}/warehouses/{wid}")


# ===================== Regression: CRUD =====================

def test_create_update_delete_warehouse(session):
    create = session.post(f"{API}/warehouses", json={
        "name": "TEST_Depo CRUD", "location": "Test/City", "capacity_tons": 25.0
    })
    assert create.status_code == 200
    wh = create.json()
    wid = wh['id']
    assert wh['name'] == "TEST_Depo CRUD"
    assert "api_key" in wh and wh['api_key'].startswith("ge_")
    assert wh['live_mode'] is False

    upd = session.patch(f"{API}/warehouses/{wid}", json={"temp_max": 99.0})
    assert upd.status_code == 200
    assert upd.json()['temp_max'] == 99.0

    got = session.get(f"{API}/warehouses/{wid}").json()
    assert got['temp_max'] == 99.0

    d = session.delete(f"{API}/warehouses/{wid}")
    assert d.status_code == 200
    g404 = session.get(f"{API}/warehouses/{wid}")
    assert g404.status_code == 404


def test_ai_analyze(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    r = session.post(f"{API}/ai/analyze", json={"warehouse_id": wid}, timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert "analysis" in data
    assert isinstance(data['analysis'], str) and len(data['analysis']) > 10


# ===================== Frontend: PWA static assets =====================

def test_favicon_svg():
    r = requests.get(f"{BASE_URL}/favicon.svg")
    assert r.status_code == 200
    assert "svg" in r.text.lower()
    # crude sanity check it begins with an SVG-ish opening
    assert r.text.lstrip().startswith("<") and "<svg" in r.text


def test_manifest_json():
    r = requests.get(f"{BASE_URL}/manifest.json")
    assert r.status_code == 200
    data = r.json()
    assert data.get("start_url") == "/panel"
    assert "name" in data and "icons" in data and len(data["icons"]) > 0


def test_service_worker():
    r = requests.get(f"{BASE_URL}/sw.js")
    assert r.status_code == 200
    # Service worker scripts typically have self.addEventListener or install handlers
    body = r.text
    assert "self" in body or "addEventListener" in body or "install" in body
