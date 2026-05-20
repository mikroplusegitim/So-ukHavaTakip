import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cold-storage-monitor.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("app") == "FrostGuard"


def test_warehouses_seeded(session):
    r = session.get(f"{API}/warehouses")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    for w in data:
        assert "id" in w and "name" in w and "temp_max" in w


def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    d = r.json()
    for k in ["warehouses_total", "warehouses_online", "active_alerts", "total_readings"]:
        assert k in d


def test_readings_after_wait(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    # Wait for simulation tick (4s)
    time.sleep(6)
    r = session.get(f"{API}/warehouses/{wid}/readings?limit=10")
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0
    assert "temperature" in items[0] and "humidity" in items[0]


def test_create_update_delete_warehouse(session):
    create = session.post(f"{API}/warehouses", json={
        "name": "TEST_Depo X", "location": "Test/City", "capacity_tons": 25.0
    })
    assert create.status_code == 200
    wh = create.json()
    wid = wh['id']
    assert wh['name'] == "TEST_Depo X"

    # Update thresholds
    upd = session.patch(f"{API}/warehouses/{wid}", json={"temp_max": 99.0, "humidity_min": 10.0})
    assert upd.status_code == 200
    assert upd.json()['temp_max'] == 99.0

    # Verify persistence
    got = session.get(f"{API}/warehouses/{wid}").json()
    assert got['temp_max'] == 99.0

    # Delete
    d = session.delete(f"{API}/warehouses/{wid}")
    assert d.status_code == 200
    g404 = session.get(f"{API}/warehouses/{wid}")
    assert g404.status_code == 404


def test_toggle_power_creates_alert(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    # Ensure power on first
    session.patch(f"{API}/warehouses/{wid}", json={"power_on": True})
    time.sleep(1)
    # Toggle off
    r = session.post(f"{API}/warehouses/{wid}/toggle-power")
    assert r.status_code == 200
    assert r.json()['power_on'] is False
    # Wait for simulation tick
    time.sleep(7)
    alerts = session.get(f"{API}/alerts?limit=50").json()
    power_cut = [a for a in alerts if a['warehouse_id'] == wid and a['type'] == 'power_cut']
    assert len(power_cut) > 0, "power_cut alert was not generated"
    # Toggle back on -> power_restored + auto-ack
    r2 = session.post(f"{API}/warehouses/{wid}/toggle-power")
    assert r2.status_code == 200
    assert r2.json()['power_on'] is True
    alerts2 = session.get(f"{API}/alerts?limit=50").json()
    restored = [a for a in alerts2 if a['warehouse_id'] == wid and a['type'] == 'power_restored']
    assert len(restored) > 0
    active_cuts = [a for a in alerts2 if a['warehouse_id'] == wid and a['type'] == 'power_cut' and not a['acknowledged']]
    assert len(active_cuts) == 0


def test_threshold_violation_alert(session):
    # Create test warehouse with extreme thresholds
    wh = session.post(f"{API}/warehouses", json={"name": "TEST_Threshold", "location": "X"}).json()
    wid = wh['id']
    try:
        session.patch(f"{API}/warehouses/{wid}", json={"temp_max": -5.0, "temp_min": -10.0})
        time.sleep(9)  # wait 2 sim ticks
        alerts = session.get(f"{API}/alerts?limit=100").json()
        violations = [a for a in alerts if a['warehouse_id'] == wid and a['type'] in ('temp_high', 'humidity_high', 'humidity_low')]
        assert len(violations) > 0, "threshold violation alert not created"
    finally:
        session.delete(f"{API}/warehouses/{wid}")


def test_acknowledge_alerts(session):
    # Create an alert by toggling power
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    session.patch(f"{API}/warehouses/{wid}", json={"power_on": True})
    time.sleep(1)
    session.post(f"{API}/warehouses/{wid}/toggle-power")
    time.sleep(7)
    alerts = session.get(f"{API}/alerts?only_active=true").json()
    if alerts:
        aid = alerts[0]['id']
        r = session.post(f"{API}/alerts/{aid}/acknowledge")
        assert r.status_code == 200
        assert r.json()['acknowledged'] is True
    # ack all
    r2 = session.post(f"{API}/alerts/acknowledge-all")
    assert r2.status_code == 200
    # restore power
    session.post(f"{API}/warehouses/{wid}/toggle-power")


def test_ai_analyze(session):
    whs = session.get(f"{API}/warehouses").json()
    wid = whs[0]['id']
    time.sleep(5)
    r = session.post(f"{API}/ai/analyze", json={"warehouse_id": wid}, timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert "analysis" in data
    assert isinstance(data['analysis'], str) and len(data['analysis']) > 10
