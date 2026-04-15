"""
Visit Routes — /api/visits/*
ASHA worker home-visit logging with AI summary generation.
"""
import json
from flask import Blueprint, request, jsonify
from db import patients_db
from config import gemini_chat

visits_bp = Blueprint("visits", __name__)


# ── POST /api/visits ─────────────────────────────────────────────────────────

@visits_bp.post("")
@visits_bp.post("/")
def log_visit():
    data = request.get_json() or {}
    patient_id = data.get("patient_id", "").strip()
    if not patient_id:
        return jsonify({"error": "patient_id required"}), 400

    # Validate patient exists
    with patients_db() as conn:
        p = conn.execute("SELECT name, age, gender, village FROM patients WHERE id=?", (patient_id,)).fetchone()
    if not p:
        return jsonify({"error": "Patient not found"}), 404

    symptoms = data.get("symptoms", [])
    if isinstance(symptoms, str):
        try:
            symptoms = json.loads(symptoms)
        except Exception:
            symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]

    # Generate AI summary if enough data
    ai_summary = ""
    triage = data.get("triage_result", "GREEN")
    triage_reason = data.get("triage_reason", "")
    triage_action = data.get("triage_action", "")

    vitals_str = ""
    if any([data.get("bp_systolic"), data.get("temperature"), data.get("spo2"), data.get("blood_glucose")]):
        parts = []
        if data.get("bp_systolic"):
            parts.append(f"BP:{data['bp_systolic']}/{data.get('bp_diastolic','?')}")
        if data.get("temperature"):
            parts.append(f"Temp:{data['temperature']}°C")
        if data.get("spo2"):
            parts.append(f"SpO2:{data['spo2']}%")
        if data.get("blood_glucose"):
            parts.append(f"Glucose:{data['blood_glucose']}mg/dL")
        vitals_str = ", ".join(parts)

    if symptoms or vitals_str or data.get("notes"):
        summary_prompt = f"""Write a concise clinical visit note (3-4 sentences) for an ASHA worker's home visit record.
Patient: {p['name']}, {p['age']}yr {p['gender']}, {p['village']}
Symptoms: {', '.join(symptoms) if symptoms else 'None reported'}
Vitals: {vitals_str or 'Not recorded'}
Notes: {data.get('notes', '')}

Write a professional EHR-style note. End with recommended follow-up action."""
        ai_summary = gemini_chat(summary_prompt, fallback="Visit recorded. Follow-up as per standard protocol.")

    local_id = data.get("local_id")

    with patients_db() as conn:
        # Check dedup by local_id
        if local_id:
            dup = conn.execute("SELECT id FROM visits WHERE local_id=?", (local_id,)).fetchone()
            if dup:
                return jsonify({"message": "Visit already synced", "visit_id": dup["id"]}), 200

        cursor = conn.execute("""
            INSERT INTO visits (
                patient_id, asha_id, bp_systolic, bp_diastolic, temperature,
                weight, spo2, blood_glucose, symptoms, notes,
                triage_result, triage_reason, triage_action, ai_summary,
                synced, local_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            patient_id,
            data.get("asha_id", ""),
            data.get("bp_systolic"),
            data.get("bp_diastolic"),
            data.get("temperature"),
            data.get("weight"),
            data.get("spo2"),
            data.get("blood_glucose"),
            json.dumps(symptoms),
            data.get("notes", ""),
            triage,
            triage_reason,
            triage_action,
            ai_summary,
            1 if not data.get("offline") else 0,
            local_id
        ))
        visit_id = cursor.lastrowid

        # Update patient's last consultation date + urgency
        conn.execute("""
            UPDATE patients SET
                last_consultation_date=date('now'),
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """, (patient_id,))

    return jsonify({
        "message": "Visit logged",
        "visit_id": visit_id,
        "ai_summary": ai_summary,
        "triage": triage
    }), 201


# ── GET /api/visits/<visit_id> ────────────────────────────────────────────────

@visits_bp.get("/<int:visit_id>")
def get_visit(visit_id):
    with patients_db() as conn:
        v = conn.execute("""
            SELECT v.*, p.name patient_name, p.village, p.age, p.gender
            FROM visits v JOIN patients p ON v.patient_id=p.id
            WHERE v.id=?
        """, (visit_id,)).fetchone()
    if not v:
        return jsonify({"error": "Visit not found"}), 404
    d = dict(v)
    try:
        d["symptoms"] = json.loads(d.get("symptoms") or "[]")
    except Exception:
        pass
    return jsonify(d)


# ── GET /api/visits/patient/<pid> ─────────────────────────────────────────────

@visits_bp.get("/patient/<pid>")
def patient_visits(pid):
    with patients_db() as conn:
        rows = conn.execute(
            "SELECT * FROM visits WHERE patient_id=? ORDER BY visit_date DESC", (pid,)
        ).fetchall()
    visits = []
    for r in rows:
        d = dict(r)
        try:
            d["symptoms"] = json.loads(d.get("symptoms") or "[]")
        except Exception:
            pass
        visits.append(d)
    return jsonify({"visits": visits, "total": len(visits)})


# ── GET /api/visits/recent ────────────────────────────────────────────────────

@visits_bp.get("/recent")
def recent_visits():
    limit = int(request.args.get("limit", 20))
    with patients_db() as conn:
        rows = conn.execute("""
            SELECT v.*, p.name patient_name, p.village
            FROM visits v JOIN patients p ON v.patient_id=p.id
            ORDER BY v.visit_date DESC LIMIT ?
        """, (limit,)).fetchall()
    return jsonify({"visits": [dict(r) for r in rows]})


# ── PUT /api/visits/<vid>/triage ──────────────────────────────────────────────

@visits_bp.put("/<int:vid>/triage")
def update_triage(vid):
    data = request.get_json() or {}
    level = data.get("triage_result", "").upper()
    if level not in ("RED", "AMBER", "GREEN"):
        return jsonify({"error": "Valid levels: RED, AMBER, GREEN"}), 400

    with patients_db() as conn:
        conn.execute("""
            UPDATE visits SET triage_result=?, triage_reason=?, triage_action=?
            WHERE id=?
        """, (level, data.get("triage_reason",""), data.get("triage_action",""), vid))

    return jsonify({"message": "Triage updated", "level": level})
