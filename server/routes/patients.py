"""
Patient Routes — /api/patients/*
Patient registry CRUD for ASHA workers.
"""
import uuid
from flask import Blueprint, request, jsonify
from db import patients_db

patients_bp = Blueprint("patients", __name__)


def _pid():
    """Generate PID-XXXX style ID."""
    return "PID-" + str(uuid.uuid4())[:8].upper()


# ── GET /api/patients ────────────────────────────────────────────────────────

@patients_bp.get("")
@patients_bp.get("/")
def list_patients():
    q = request.args.get("q", "")
    village = request.args.get("village", "")
    asha_id = request.args.get("asha_id", "")
    severity = request.args.get("severity", "")
    sort = request.args.get("sort", "urgency")  # urgency | name | recent
    limit = int(request.args.get("limit", 100))

    filters, params = [], []
    if q:
        filters.append("(name LIKE ? OR phone LIKE ? OR village LIKE ?)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    if village:
        filters.append("village = ?")
        params.append(village)
    if asha_id:
        filters.append("asha_id = ?")
        params.append(asha_id)
    if severity:
        filters.append("severity_level = ?")
        params.append(severity)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    order = {
        "urgency": "urgency_score DESC",
        "name": "name ASC",
        "recent": "updated_at DESC"
    }.get(sort, "urgency_score DESC")

    with patients_db() as conn:
        rows = conn.execute(
            f"SELECT * FROM patients {where} ORDER BY {order} LIMIT ?",
            params + [limit]
        ).fetchall()
        total = conn.execute(f"SELECT COUNT(*) FROM patients {where}", params).fetchone()[0]

    return jsonify({
        "patients": [dict(r) for r in rows],
        "total": total
    })


# ── POST /api/patients ───────────────────────────────────────────────────────

@patients_bp.post("")
@patients_bp.post("/")
def register_patient():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    village = data.get("village", "").strip()

    if not name:
        return jsonify({"error": "Patient name is required"}), 400

    # Check for possible duplicate
    with patients_db() as conn:
        dup = conn.execute(
            "SELECT id, name FROM patients WHERE name=? AND village=? LIMIT 1",
            (name, village)
        ).fetchone()
        if dup:
            return jsonify({
                "warning": "Patient may already exist",
                "existing": dict(dup),
                "action": "Use existing or force_create=true to register anyway"
            }), 409

    if data.get("force_create") is not True and dup:
        return jsonify({"error": "Duplicate"}), 409

    pid = data.get("id") or _pid()

    with patients_db() as conn:
        conn.execute("""
            INSERT INTO patients (id, name, age, gender, village, phone, conditions,
                asha_id, latitude, longitude, severity_level, last_consultation_date, stock_available)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            pid,
            name,
            int(data.get("age", 0) or 0),
            data.get("gender", "Unknown"),
            village,
            data.get("phone", ""),
            data.get("conditions", ""),
            data.get("asha_id", ""),
            data.get("latitude"),
            data.get("longitude"),
            data.get("severity_level", "Mild"),
            data.get("last_consultation_date"),
            data.get("stock_available", "Yes")
        ))

    return jsonify({"message": "Patient registered", "patient_id": pid}), 201


# ── GET /api/patients/<pid> ──────────────────────────────────────────────────

@patients_bp.get("/<pid>")
def get_patient(pid):
    with patients_db() as conn:
        p = conn.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
        if not p:
            return jsonify({"error": "Patient not found"}), 404
        visits = conn.execute(
            "SELECT * FROM visits WHERE patient_id=? ORDER BY visit_date DESC", (pid,)
        ).fetchall()
        prescriptions = conn.execute(
            "SELECT * FROM prescriptions WHERE patient_id=? ORDER BY created_at DESC", (pid,)
        ).fetchall()

    return jsonify({
        "patient": dict(p),
        "visits": [dict(v) for v in visits],
        "prescriptions": [dict(rx) for rx in prescriptions]
    })


# ── PUT /api/patients/<pid> ──────────────────────────────────────────────────

@patients_bp.put("/<pid>")
def update_patient(pid):
    data = request.get_json() or {}
    allowed = ["name", "age", "gender", "village", "phone", "conditions",
               "asha_id", "latitude", "longitude", "severity_level",
               "last_consultation_date", "stock_available"]

    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k}=?" for k in updates)
    vals = list(updates.values()) + [pid]

    with patients_db() as conn:
        conn.execute(
            f"UPDATE patients SET {set_clause}, updated_at=CURRENT_TIMESTAMP WHERE id=?", vals
        )

    return jsonify({"message": "Patient updated"})


# ── GET /api/patients/village/list ───────────────────────────────────────────

@patients_bp.get("/meta/villages")
def villages():
    with patients_db() as conn:
        rows = conn.execute(
            "SELECT DISTINCT village, COUNT(*) cnt FROM patients WHERE village!='' GROUP BY village ORDER BY cnt DESC"
        ).fetchall()
    return jsonify({"villages": [dict(r) for r in rows]})


# ── GET /api/patients/stats/summary ─────────────────────────────────────────

@patients_bp.get("/meta/summary")
def summary():
    with patients_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
        critical = conn.execute("SELECT COUNT(*) FROM patients WHERE severity_level='Critical'").fetchone()[0]
        high_urgency = conn.execute("SELECT COUNT(*) FROM patients WHERE urgency_score>=15").fetchone()[0]
        no_visit_90 = conn.execute(
            "SELECT COUNT(*) FROM patients WHERE last_consultation_date IS NULL OR "
            "last_consultation_date <= date('now','-90 days')"
        ).fetchone()[0]

    return jsonify({
        "total": total,
        "critical": critical,
        "high_urgency": high_urgency,
        "no_visit_90_days": no_visit_90
    })
