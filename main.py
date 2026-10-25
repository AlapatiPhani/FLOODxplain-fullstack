"""PFIAP v3 â€” main.py"""
import json
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

app = FastAPI(title="PFIAP v3")
app.mount("/static", StaticFiles(directory="static"), name="static")

DAMAGE_FILE = Path(__file__).with_name("latest_damage.json")

def load_latest_damage():
    if not DAMAGE_FILE.exists():
        return {}
    try:
        return json.loads(DAMAGE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

def save_latest_damage(data):
    DAMAGE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

@app.get("/")
def home(): return FileResponse("static/index.html")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        from model.predictor import predict as p
        return JSONResponse(p(await file.read()))
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/predict_batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    from model.predictor import predict as p
    BASE_LAT, BASE_LNG = 16.5, 81.5
    results = []
    for i, file in enumerate(files):
        try:
            result = p(await file.read())
            result["filename"] = file.filename
            result["lat"] = round(BASE_LAT + (i * 0.04) - (len(files) * 0.02), 4)
            result["lng"] = round(BASE_LNG + (i * 0.05) - (len(files) * 0.025), 4)
            result["index"] = i
        except Exception as e:
            result = {
                "filename": file.filename, "error": str(e),
                "label": "Error", "severity": "UNKNOWN",
                "confidence": 0, "flood_prob": 0, "safe_prob": 0,
                "lat": round(BASE_LAT + (i * 0.04), 4),
                "lng": round(BASE_LNG + (i * 0.05), 4),
                "index": i,
            }
        results.append(result)
    return JSONResponse(results)

@app.post("/latest_damage")
async def update_latest_damage(data: dict = Body(...)):
    save_latest_damage(data)
    return {"message": "Latest damage analysis saved"}

@app.get("/latest_damage")
async def latest_damage():
    return load_latest_damage()

@app.get("/infrastructure")
def infra():
    return JSONResponse({"roads_blocked":5,"hospitals_affected":11,"bridges_damaged":5,"markers":[
        {"lat":16.5130963,"lng":80.6187886,"type":"hospital","status":"safe","name":"Government General Hospital, Vijayawada"},
        {"lat":16.2995582,"lng":80.4437719,"type":"hospital","status":"safe","name":"Government General Hospital, Guntur"},
        {"lat":16.7133436,"lng":81.0951087,"type":"hospital","status":"safe","name":"District Govt Hospital, Eluru"},
        {"lat":16.9557132,"lng":82.2273127,"type":"hospital","status":"safe","name":"Government General Hospital, Kakinada"},
        {"lat":16.5167180,"lng":80.6696408,"type":"hospital","status":"safe","name":"Government General Hospital, Gannavaram"},
        {"lat":16.5416,"lng":81.5208,"type":"hospital","status":"safe","name":"Government Area Hospital, Bhimavaram"},
        {"lat":16.5870470,"lng":81.4532388,"type":"hospital","status":"safe","name":"Government Hospital, Undi"},
        {"lat":16.6532897,"lng":81.6415637,"type":"hospital","status":"safe","name":"Government Hospital, Penumantra"},
        {"lat":16.2149227,"lng":81.0775082,"type":"hospital","status":"safe","name":"Government Hospital, Guduru"},
        {"lat":16.1776054,"lng":81.1263849,"type":"hospital","status":"safe","name":"General Hospital, Machilipatnam"},
        {"lat":16.1769287,"lng":81.1386281,"type":"hospital","status":"safe","name":"Government Hospital, Machilipatnam"},
        {"lat":16.5062,"lng":80.6050,"type":"bridge","status":"partial","name":"Prakasam Barrage, Vijayawada"},
        {"lat":16.9891,"lng":81.7645,"type":"bridge","status":"partial","name":"Godavari Bridge, Rajahmundry"},
        {"lat":16.9397,"lng":81.7774,"type":"bridge","status":"partial","name":"Sir Arthur Cotton Barrage, Dowleswaram"},
        {"lat":16.4850,"lng":80.6260,"type":"bridge","status":"partial","name":"Kanaka Durga Varadhi, Vijayawada"},
        {"lat":16.4300,"lng":81.7000,"type":"bridge","status":"safe","name":"Narasapur Road Bridge"},
        {"lat":16.5151,"lng":80.6321,"type":"road","status":"partial","name":"NH16 Vijayawada Urban Segment"},
        {"lat":16.7107,"lng":81.0952,"type":"road","status":"partial","name":"NH16 Eluru Segment"},
        {"lat":16.9891,"lng":82.2475,"type":"road","status":"safe","name":"NH216 Kakinada Approach"},
        {"lat":16.1770,"lng":81.1300,"type":"road","status":"partial","name":"Machilipatnam Coastal Road Segment"},
        {"lat":16.5400,"lng":81.5200,"type":"road","status":"partial","name":"Bhimavaram Town Road Segment"},
    ]})

@app.get("/recovery")
def rec():
    return JSONResponse({"high_risk_zones":23,"medium_risk":41,"recovery_weeks":16,"zones":[
        {"name":"Konaseema","risk":"HIGH","weeks":20,"lat":16.78,"lng":81.92},
        {"name":"Rajahmundry","risk":"HIGH","weeks":18,"lat":17.00,"lng":81.79},
        {"name":"Eluru","risk":"MEDIUM","weeks":12,"lat":16.71,"lng":81.09},
        {"name":"Vijayawada","risk":"LOW","weeks":8,"lat":16.50,"lng":80.63},
    ]})
# ===== REPORTING MODULE =====

REPORTS_FILE = Path(__file__).with_name("reports.json")

def load_reports():
    if not REPORTS_FILE.exists():
        return []
    try:
        return json.loads(REPORTS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

def save_reports():
    REPORTS_FILE.write_text(json.dumps(reports_db, indent=2), encoding="utf-8")

reports_db = load_reports()

FLOOD_TERMS = {
    "flood", "water", "overflow", "rain", "river", "canal", "drain",
    "submerged", "blocked", "evacuate", "evacuation", "rescue",
    "stranded", "inundated", "bridge", "road", "house", "crop"
}
SUSPICIOUS_TERMS = {"fake", "test", "asdf", "qwerty", "dummy", "lol", "random"}
SEVERITY_TERMS = {
    "Low": {"water", "rain", "drain", "minor"},
    "Moderate": {"blocked", "overflow", "submerged", "road", "crop"},
    "High": {"rescue", "stranded", "evacuate", "submerged", "bridge", "house"},
    "Critical": {"rescue", "stranded", "evacuation", "collapsed", "danger", "trapped"}
}

def _safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def verify_report(data):
    location = str(data.get("location") or "").strip()
    severity = str(data.get("severity") or "").strip()
    description = str(data.get("description") or "").strip()
    lat = _safe_float(data.get("lat"))
    lng = _safe_float(data.get("lng"))

    score = 25
    reasons = []

    if len(location) >= 3:
        score += 15
    else:
        reasons.append("location is too short")

    if lat is not None and lng is not None and 6 <= lat <= 37 and 68 <= lng <= 98:
        score += 25
    else:
        reasons.append("coordinates are missing or outside India")

    words = {w.strip(".,!?;:()[]{}").lower() for w in description.split()}
    flood_matches = words & FLOOD_TERMS
    suspicious_matches = words & SUSPICIOUS_TERMS

    if len(description) >= 25:
        score += 15
    else:
        reasons.append("description needs more detail")

    if flood_matches:
        score += min(20, len(flood_matches) * 5)
    else:
        reasons.append("description does not mention flood-related conditions")

    if severity in SEVERITY_TERMS and words & SEVERITY_TERMS[severity]:
        score += 10
    elif severity in {"High", "Critical"}:
        score -= 10
        reasons.append("severity is not supported by the description")

    if suspicious_matches:
        score -= 35
        reasons.append("suspicious test or fake wording detected")

    duplicate = any(
        str(r.get("location", "")).strip().lower() == location.lower()
        and str(r.get("description", "")).strip().lower() == description.lower()
        for r in reports_db
    )
    if duplicate:
        score -= 25
        reasons.append("duplicate report already exists")

    score = max(0, min(100, score))
    verified = score >= 70
    if verified and not reasons:
        reasons.append("location, coordinates, and report details look consistent")

    return verified, score, reasons

@app.post("/submit_report")
async def submit_report(data: dict = Body(...)):
    verified, confidence, reasons = verify_report(data)
    report = {
        "location": data.get("location"),
        "severity": data.get("severity"),
        "description": data.get("description"),
        "name": data.get("name", "Anonymous"),
        "assigned_to": data.get("assigned_to", "Control Room"),
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "time": "Just now",
        "verified": verified,
        "confidence": confidence,
        "verification_notes": reasons
    }
    reports_db.insert(0, report)
    save_reports()
    return {
        "message": "Report submitted successfully",
        "verified": verified,
        "confidence": confidence,
        "verification_notes": reasons
    }


@app.get("/get_reports")
async def get_reports():
    return reports_db[:10]
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

