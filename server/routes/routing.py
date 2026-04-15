"""
Routing Routes — /api/routing/*
Patient clustering (KMeans + DBSCAN) + AI-powered priority updates via Gemini.
"""
import os
import re
import json
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from datetime import datetime

from db import patients_db
from config import Config, gemini_chat

routing_bp = Blueprint("routing", __name__)


def _urgency(row):
    """Calculate urgency score from patient row data."""
    severity_map = {"Critical": 10, "Severe": 7, "Moderate": 5, "Mild": 2}
    score = severity_map.get(str(row.get("severity_level", "Mild")), 2)

    age = int(row.get("age", 0) or 0)
    if age > 60: score += 3
    elif age < 10: score += 2

    # Days since last consultation
    try:
        last = pd.to_datetime(row.get("last_consultation_date"))
        days = (datetime.now() - last).days
        if days > 180: score += 3
        elif days > 90: score += 2
        elif days > 30: score += 1
    except Exception:
        score += 3  # unknown = treat as long overdue

    stock = str(row.get("stock_available", "Yes")).lower()
    if stock == "no": score += 5
    elif stock == "low": score += 3

    return score


def _cluster_patients(df):
    """Run KMeans + DBSCAN clustering on patient lat/lon."""
    df_loc = df.dropna(subset=["latitude", "longitude"]).copy()
    n = len(df_loc)
    if n == 0:
        df["cluster"] = 0
        df["sub_cluster"] = 0
        return df

    k = min(Config.NUM_CLUSTERS, n)
    scaler = StandardScaler()
    coords = scaler.fit_transform(df_loc[["latitude", "longitude"]])

    # KMeans main clusters
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    df_loc["cluster"] = kmeans.fit_predict(coords)

    # DBSCAN sub-clusters per cluster
    sub_clusters = []
    for cid, grp in df_loc.groupby("cluster"):
        if len(grp) > 1:
            c = scaler.transform(grp[["latitude", "longitude"]])
            mins = min(Config.DBSCAN_MIN, len(grp))
            db = DBSCAN(eps=Config.DBSCAN_EPS, min_samples=mins).fit(c)
            grp = grp.copy()
            grp["sub_cluster"] = db.labels_
        else:
            grp = grp.copy()
            grp["sub_cluster"] = 0
        sub_clusters.append(grp)

    df_loc = pd.concat(sub_clusters)
    df.loc[df_loc.index, "cluster"] = df_loc["cluster"]
    df.loc[df_loc.index, "sub_cluster"] = df_loc["sub_cluster"]
    df["cluster"] = df["cluster"].fillna(0).astype(int)
    df["sub_cluster"] = df["sub_cluster"].fillna(0).astype(int)
    return df


# ── POST /api/routing/upload ─────────────────────────────────────────────────

@routing_bp.post("/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if not f.filename or not f.filename.endswith(".csv"):
        return jsonify({"error": "CSV file required"}), 400

    filename = secure_filename(f.filename)
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(Config.UPLOAD_DIR, filename)
    f.save(path)

    try:
        df = pd.read_csv(path)
        required = {"patient_id", "name", "latitude", "longitude"}
        missing = required - set(df.columns)
        if missing:
            return jsonify({"error": f"CSV missing columns: {list(missing)}"}), 400

        # Clean types
        df["age"] = pd.to_numeric(df.get("age", 0), errors="coerce").fillna(0).astype(int)
        df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
        df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

        # Compute urgency
        df["urgency_score"] = df.apply(_urgency, axis=1)

        # Cluster
        df = _cluster_patients(df)

        # Persist all patients
        with patients_db() as conn:
            for _, row in df.iterrows():
                pid = str(row["patient_id"])
                exists = conn.execute("SELECT 1 FROM patients WHERE id=?", (pid,)).fetchone()
                row_data = row.where(pd.notnull(row), None).to_dict()
                if exists:
                    conn.execute("""
                        UPDATE patients SET
                            name=?, age=?, village=?, latitude=?, longitude=?,
                            cluster=?, sub_cluster=?, urgency_score=?,
                            severity_level=?, last_consultation_date=?,
                            stock_available=?, updated_at=CURRENT_TIMESTAMP
                        WHERE id=?
                    """, (
                        row_data.get("name"), row_data.get("age"),
                        row_data.get("village"), row_data.get("latitude"),
                        row_data.get("longitude"), int(row_data.get("cluster", 0)),
                        int(row_data.get("sub_cluster", 0)), float(row_data.get("urgency_score", 0)),
                        row_data.get("severity_level"), row_data.get("last_consultation_date"),
                        row_data.get("stock_available"), pid
                    ))
                else:
                    conn.execute("""
                        INSERT INTO patients (id, name, age, gender, village, phone, latitude, longitude,
                            cluster, sub_cluster, urgency_score, severity_level,
                            last_consultation_date, stock_available)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """, (
                        pid, row_data.get("name"), row_data.get("age"),
                        row_data.get("gender", "Unknown"), row_data.get("village", ""),
                        row_data.get("phone", ""), row_data.get("latitude"),
                        row_data.get("longitude"), int(row_data.get("cluster", 0)),
                        int(row_data.get("sub_cluster", 0)), float(row_data.get("urgency_score", 0)),
                        row_data.get("severity_level", "Mild"),
                        row_data.get("last_consultation_date"), row_data.get("stock_available", "Yes")
                    ))

        # Build cluster response
        sorted_df = df.sort_values("urgency_score", ascending=False)
        clusters = {}
        for _, row in sorted_df.iterrows():
            cid = str(int(row.get("cluster", 0)))
            if cid not in clusters:
                clusters[cid] = []
            clusters[cid].append({
                "patient_id": str(row["patient_id"]),
                "name": str(row.get("name", "")),
                "village": str(row.get("village", "")),
                "age": int(row.get("age", 0) or 0),
                "severity_level": str(row.get("severity_level", "Mild")),
                "urgency_score": float(row.get("urgency_score", 0)),
                "latitude": float(row["latitude"]) if pd.notna(row["latitude"]) else None,
                "longitude": float(row["longitude"]) if pd.notna(row["longitude"]) else None,
                "stock_available": str(row.get("stock_available", "Yes")),
                "last_consultation_date": str(row.get("last_consultation_date", ""))
            })

        return jsonify({
            "clusters": clusters,
            "total_patients": len(df),
            "total_clusters": len(clusters)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── GET /api/routing/clusters ────────────────────────────────────────────────

@routing_bp.get("/clusters")
def get_clusters():
    with patients_db() as conn:
        rows = conn.execute(
            "SELECT * FROM patients WHERE cluster IS NOT NULL ORDER BY urgency_score DESC"
        ).fetchall()

    clusters = {}
    for r in rows:
        cid = str(r["cluster"])
        if cid not in clusters:
            clusters[cid] = []
        clusters[cid].append(dict(r))

    return jsonify({"clusters": clusters, "total_patients": len(rows)})


# ── GET /api/routing/map ─────────────────────────────────────────────────────

@routing_bp.get("/map")
def map_data():
    cluster = request.args.get("cluster")
    with patients_db() as conn:
        if cluster is not None:
            rows = conn.execute(
                "SELECT id, name, latitude, longitude, urgency_score, severity_level, village FROM patients WHERE cluster=?",
                (cluster,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, name, latitude, longitude, urgency_score, severity_level, village, cluster FROM patients"
            ).fetchall()

    pins = []
    for r in rows:
        if r["latitude"] and r["longitude"]:
            d = dict(r)
            score = d.get("urgency_score", 0) or 0
            d["triage_color"] = "red" if score >= 15 else ("amber" if score >= 8 else "green")
            pins.append(d)

    return jsonify({"pins": pins})


# ── POST /api/routing/priority ───────────────────────────────────────────────

@routing_bp.post("/priority")
def update_priority():
    data = request.get_json() or {}
    user_input = data.get("user_input", "").strip()
    if not user_input:
        return jsonify({"error": "user_input required"}), 400

    with patients_db() as conn:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(patients)").fetchall()]

        prompt = f"""You are a SQL assistant for a rural healthcare patient database.
Table: patients
Columns: {', '.join(cols)}
patient_id format: PID-XX (e.g., PID-03, PID-12)

User request: "{user_input}"

Generate ONLY a single safe SQL UPDATE statement that:
- Updates the 'patients' table
- Modifies 'urgency_score' only
- Sets urgency_score to 100 for highest priority, or adjusts as requested
- Uses proper WHERE clause

Return ONLY the SQL. No explanations. No markdown. No semicolons except at end."""

        sql_raw = gemini_chat(prompt, fallback="")
        if not sql_raw:
            return jsonify({"error": "AI could not generate SQL", "success": False}), 500

        # Clean Gemini markdown if present
        sql = re.sub(r"```(?:sql)?(.+?)```", r"\1", sql_raw, flags=re.DOTALL).strip().rstrip(";")

        # Security: only allow UPDATE on patients, only urgency_score changes
        sql_lower = sql.lower()
        if not sql_lower.startswith("update patients"):
            return jsonify({"error": "AI generated unsafe SQL — rejected", "generated": sql, "success": False}), 400
        if any(word in sql_lower for word in ["drop", "delete", "insert", "create", "alter"]):
            return jsonify({"error": "Disallowed SQL keyword detected", "success": False}), 400

        try:
            conn.execute(sql)
            rows = conn.execute("SELECT * FROM patients ORDER BY urgency_score DESC").fetchall()
        except Exception as e:
            return jsonify({"error": f"SQL execution failed: {e}", "generated": sql, "success": False}), 500

    clusters = {}
    for r in rows:
        cid = str(r["cluster"] or 0)
        if cid not in clusters:
            clusters[cid] = []
        clusters[cid].append(dict(r))

    return jsonify({
        "message": f"Priority updated based on: '{user_input}'",
        "success": True,
        "clusters": clusters
    })
