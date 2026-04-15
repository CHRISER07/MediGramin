"""
Prescription Routes — /api/prescriptions/*
E-prescription generation with QR hash verification.
"""
import json
import hashlib
import datetime
from flask import Blueprint, request, jsonify
from db import patients_db

prescriptions_bp = Blueprint("prescriptions", __name__)


def _qr_hash(patient_id: str, medicines: list, created_at: str) -> str:
    raw = f"{patient_id}|{json.dumps(medicines, sort_keys=True)}|{created_at}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()


# ── POST /api/prescriptions ───────────────────────────────────────────────────

@prescriptions_bp.post("")
@prescriptions_bp.post("/")
def create_prescription():
    data = request.get_json() or {}
    patient_id = data.get("patient_id", "").strip()
    medicines   = data.get("medicines", [])   # [{name, dose, frequency, duration, qty}]
    doctor_name = data.get("doctor_name", "").strip()

    if not patient_id:
        return jsonify({"error": "patient_id required"}), 400
    if not medicines or not isinstance(medicines, list):
        return jsonify({"error": "medicines list required (at least 1)"}), 400
    for m in medicines:
        if not m.get("name"):
            return jsonify({"error": "Each medicine must have a 'name'"}), 400

    with patients_db() as conn:
        p = conn.execute("SELECT name, village FROM patients WHERE id=?", (patient_id,)).fetchone()
    if not p:
        return jsonify({"error": "Patient not found"}), 404

    now = datetime.datetime.now().isoformat()
    qr = _qr_hash(patient_id, medicines, now)

    with patients_db() as conn:
        cursor = conn.execute("""
            INSERT INTO prescriptions (patient_id, visit_id, doctor_name, medicines, diagnosis, instructions, qr_hash)
            VALUES (?,?,?,?,?,?,?)
        """, (
            patient_id,
            data.get("visit_id"),
            doctor_name,
            json.dumps(medicines),
            data.get("diagnosis", ""),
            data.get("instructions", ""),
            qr
        ))
        rx_id = cursor.lastrowid

    return jsonify({
        "message": "Prescription created",
        "prescription_id": rx_id,
        "qr_hash": qr,
        "patient_name": p["name"],
        "patient_village": p["village"],
        "created_at": now
    }), 201


# ── GET /api/prescriptions/<patient_id> ──────────────────────────────────────

@prescriptions_bp.get("/<patient_id>")
def get_prescriptions(patient_id):
    with patients_db() as conn:
        rows = conn.execute(
            "SELECT * FROM prescriptions WHERE patient_id=? ORDER BY created_at DESC",
            (patient_id,)
        ).fetchall()

    result = []
    for r in rows:
        d = dict(r)
        try:
            d["medicines"] = json.loads(d.get("medicines") or "[]")
        except Exception:
            pass
        result.append(d)

    return jsonify({"prescriptions": result, "total": len(result)})


# ── GET /api/prescriptions/verify/<qr_hash> ──────────────────────────────────

@prescriptions_bp.get("/verify/<qr_hash>")
def verify(qr_hash):
    with patients_db() as conn:
        rx = conn.execute("""
            SELECT pr.*, p.name patient_name, p.village, p.age, p.gender
            FROM prescriptions pr JOIN patients p ON pr.patient_id=p.id
            WHERE pr.qr_hash=?
        """, (qr_hash,)).fetchone()

    if not rx:
        return jsonify({"valid": False, "message": "Prescription not found or invalid QR"}), 404

    d = dict(rx)
    try:
        d["medicines"] = json.loads(d.get("medicines") or "[]")
    except Exception:
        pass
    d["valid"] = True
    return jsonify(d)


# ── PUT /api/prescriptions/<rx_id>/print ─────────────────────────────────────

@prescriptions_bp.put("/<int:rx_id>/print")
def mark_printed(rx_id):
    with patients_db() as conn:
        conn.execute("UPDATE prescriptions SET printed=1 WHERE id=?", (rx_id,))
    return jsonify({"message": "Marked as printed"})
