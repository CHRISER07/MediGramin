"""
Inventory Routes — /api/inventory/*
All 12 endpoints. Returns JSON data for recharts (no matplotlib).
"""
import io
import csv
import datetime
import hashlib
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

from db import inventory_db
from config import Config, gemini_chat

inventory_bp = Blueprint("inventory", __name__)

ALLOWED_EXT = {"csv"}


def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def _row(r):
    return dict(r)


# ── GET /api/inventory/dashboard ───────────────────────────────────────────

@inventory_bp.get("/dashboard")
def dashboard():
    with inventory_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM inventory").fetchone()[0]
        total_units = conn.execute("SELECT COALESCE(SUM(current_stock),0) FROM inventory").fetchone()[0]
        low_stock = conn.execute(
            "SELECT COUNT(*) FROM inventory WHERE current_stock <= reorder_level"
        ).fetchone()[0]
        expiring = conn.execute(
            "SELECT COUNT(*) FROM inventory WHERE expiry_date IS NOT NULL AND expiry_date <= date('now','+30 days')"
        ).fetchone()[0]
        pending_orders = conn.execute(
            "SELECT COUNT(*) FROM orders WHERE status='pending'"
        ).fetchone()[0]
        total_value = conn.execute(
            "SELECT COALESCE(SUM(current_stock * unit_price),0) FROM inventory"
        ).fetchone()[0]
        unacked_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE acknowledged=0"
        ).fetchone()[0]

        # Category breakdown
        cats = conn.execute("""
            SELECT category, COUNT(*) cnt, SUM(current_stock) units
            FROM inventory GROUP BY category ORDER BY units DESC
        """).fetchall()

    return jsonify({
        "total_products": total,
        "total_units": int(total_units),
        "low_stock_count": low_stock,
        "expiring_count": expiring,
        "pending_orders": pending_orders,
        "total_value": round(float(total_value), 2),
        "unacked_alerts": unacked_alerts,
        "categories": [{"category": r["category"] or "General", "count": r["cnt"], "units": r["units"] or 0} for r in cats]
    })


# ── GET /api/inventory/items ────────────────────────────────────────────────

@inventory_bp.get("/items")
def list_items():
    q = request.args.get("q", "")
    category = request.args.get("category", "")
    status = request.args.get("status", "")  # low, expiring, ok
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    offset = (page - 1) * limit

    filters = []
    params = []
    if q:
        filters.append("(product_name LIKE ? OR sku LIKE ? OR category LIKE ?)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    if category:
        filters.append("category = ?")
        params.append(category)
    if status == "low":
        filters.append("current_stock <= reorder_level")
    elif status == "expiring":
        filters.append("expiry_date IS NOT NULL AND expiry_date <= date('now','+30 days')")
    elif status == "ok":
        filters.append("current_stock > reorder_level")

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    with inventory_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM inventory {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM inventory {where} ORDER BY product_name LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall()

    items = []
    for r in rows:
        d = dict(r)
        # Stock status badge
        if d["current_stock"] <= 0:
            d["stock_status"] = "critical"
        elif d["current_stock"] <= d["reorder_level"]:
            d["stock_status"] = "low"
        else:
            d["stock_status"] = "ok"
        # Expiry status
        if d.get("expiry_date"):
            try:
                exp = datetime.datetime.strptime(d["expiry_date"], "%Y-%m-%d").date()
                days_left = (exp - datetime.date.today()).days
                d["days_until_expiry"] = days_left
                d["expiry_status"] = "expired" if days_left < 0 else ("soon" if days_left <= 30 else "ok")
            except Exception:
                d["days_until_expiry"] = None
                d["expiry_status"] = "unknown"
        items.append(d)

    return jsonify({"items": items, "total": total, "page": page, "pages": -(-total // limit)})


# ── GET /api/inventory/items/<sku> ──────────────────────────────────────────

@inventory_bp.get("/items/<sku>")
def get_item(sku):
    with inventory_db() as conn:
        row = conn.execute("SELECT * FROM inventory WHERE sku=?", (sku,)).fetchone()
    if not row:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(dict(row))


# ── POST /api/inventory/upload ──────────────────────────────────────────────

@inventory_bp.post("/upload")
def upload_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if not f.filename or not _allowed(f.filename):
        return jsonify({"error": "Only CSV files allowed"}), 400

    df = pd.read_csv(f)
    required = {"product_name", "sku", "current_stock"}
    missing = required - set(df.columns)
    if missing:
        return jsonify({"error": f"CSV missing columns: {missing}"}), 400

    inserted = updated = errors = 0
    error_rows = []

    with inventory_db() as conn:
        for i, row in df.iterrows():
            try:
                exists = conn.execute("SELECT 1 FROM inventory WHERE sku=?", (row["sku"],)).fetchone()
                if exists:
                    conn.execute("""
                        UPDATE inventory SET
                            product_name=?, category=?, current_stock=?,
                            reorder_level=?, expiry_date=?, unit_price=?,
                            last_updated=CURRENT_TIMESTAMP
                        WHERE sku=?
                    """, (
                        row["product_name"],
                        row.get("category", "General"),
                        int(row["current_stock"]),
                        int(row.get("reorder_level", 10)),
                        row.get("expiry_date") or None,
                        float(row.get("unit_price", 0)),
                        row["sku"]
                    ))
                    updated += 1
                else:
                    conn.execute("""
                        INSERT INTO inventory (product_name, sku, category, current_stock, reorder_level, expiry_date, unit_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row["product_name"], row["sku"],
                        row.get("category", "General"),
                        int(row["current_stock"]),
                        int(row.get("reorder_level", 10)),
                        row.get("expiry_date") or None,
                        float(row.get("unit_price", 0))
                    ))
                    inserted += 1
                # Record history
                conn.execute("INSERT INTO stock_history (sku, stock_level) VALUES (?,?)",
                             (row["sku"], int(row["current_stock"])))
            except Exception as e:
                errors += 1
                error_rows.append({"row": i + 2, "error": str(e)})

    return jsonify({
        "message": f"Import complete: {inserted} new, {updated} updated, {errors} errors",
        "inserted": inserted, "updated": updated, "errors": errors,
        "error_rows": error_rows
    })


# ── GET /api/inventory/export ───────────────────────────────────────────────

@inventory_bp.get("/export")
def export_csv():
    with inventory_db() as conn:
        rows = conn.execute("SELECT * FROM inventory ORDER BY product_name").fetchall()
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=dict(rows[0]).keys())
        writer.writeheader()
        writer.writerows([dict(r) for r in rows])
    output.seek(0)
    return send_file(
        io.BytesIO(output.read().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"inventory_{datetime.date.today()}.csv"
    )


# ── GET /api/inventory/low-stock ────────────────────────────────────────────

@inventory_bp.get("/low-stock")
def low_stock():
    with inventory_db() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory WHERE current_stock <= reorder_level ORDER BY current_stock ASC"
        ).fetchall()
    return jsonify({"items": [dict(r) for r in rows]})


# ── GET /api/inventory/expiring ─────────────────────────────────────────────

@inventory_bp.get("/expiring")
def expiring():
    days = int(request.args.get("days", 30))
    with inventory_db() as conn:
        rows = conn.execute("""
            SELECT *, (julianday(expiry_date) - julianday('now')) AS days_left
            FROM inventory
            WHERE expiry_date IS NOT NULL AND expiry_date <= date('now', ? || ' days')
            ORDER BY expiry_date ASC
        """, (f"+{days}",)).fetchall()
    return jsonify({"items": [dict(r) for r in rows], "days": days})


# ── GET/POST /api/inventory/orders ──────────────────────────────────────────

@inventory_bp.get("/orders")
def get_orders():
    status = request.args.get("status", "")
    with inventory_db() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM orders WHERE status=? ORDER BY order_date DESC", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM orders ORDER BY order_date DESC").fetchall()
    return jsonify({"orders": [dict(r) for r in rows]})


@inventory_bp.post("/orders")
def place_order():
    data = request.get_json() or {}
    sku = data.get("sku", "").strip()
    qty = int(data.get("quantity", 0))
    notes = data.get("notes", "")
    if not sku or qty <= 0:
        return jsonify({"error": "sku and quantity > 0 required"}), 400

    with inventory_db() as conn:
        item = conn.execute("SELECT product_name FROM inventory WHERE sku=?", (sku,)).fetchone()
        if not item:
            return jsonify({"error": "SKU not found"}), 404
        conn.execute(
            "INSERT INTO orders (sku, product_name, quantity, notes) VALUES (?,?,?,?)",
            (sku, item["product_name"], qty, notes)
        )
    return jsonify({"message": f"Order placed: {qty} units of {sku}"}), 201


@inventory_bp.put("/orders/<int:order_id>")
def update_order(order_id):
    data = request.get_json() or {}
    status = data.get("status", "")
    if status not in ("pending", "confirmed", "delivered", "cancelled"):
        return jsonify({"error": "Invalid status"}), 400
    with inventory_db() as conn:
        conn.execute("UPDATE orders SET status=? WHERE id=?", (status, order_id))
        if status == "delivered":
            order = conn.execute("SELECT sku, quantity FROM orders WHERE id=?", (order_id,)).fetchone()
            if order:
                conn.execute("UPDATE inventory SET current_stock = current_stock + ?, last_updated=CURRENT_TIMESTAMP WHERE sku=?",
                             (order["quantity"], order["sku"]))
                conn.execute("INSERT INTO stock_history (sku, stock_level) SELECT sku, current_stock FROM inventory WHERE sku=?",
                             (order["sku"],))
    return jsonify({"message": "Order updated"})


# ── GET /api/inventory/predict/<sku> ────────────────────────────────────────

@inventory_bp.get("/predict/<sku>")
def predict(sku):
    with inventory_db() as conn:
        product = conn.execute("SELECT * FROM inventory WHERE sku=?", (sku,)).fetchone()
        if not product:
            return jsonify({"error": "SKU not found"}), 404
        history = conn.execute(
            "SELECT stock_level, recorded_at FROM stock_history WHERE sku=? ORDER BY recorded_at", (sku,)
        ).fetchall()

    hist = [{"date": r["recorded_at"][:10], "stock": r["stock_level"]} for r in history]

    if len(hist) < 3:
        # Not enough data — return only current stock as baseline
        return jsonify({
            "sku": sku,
            "product_name": product["product_name"],
            "reorder_level": product["reorder_level"],
            "historical": hist,
            "predicted": [],
            "reorder_needed": product["current_stock"] <= product["reorder_level"],
            "stockout_date": None,
            "message": "Not enough history for prediction (need ≥3 data points)"
        })

    df = pd.DataFrame(hist)
    df["date"] = pd.to_datetime(df["date"])
    df["day_index"] = (df["date"] - df["date"].min()).dt.days
    X = df[["day_index"]].values
    y = df["stock"].values

    model = LinearRegression()
    model.fit(X, y)

    last_day = int(df["day_index"].max())
    last_date = df["date"].max()
    future_days = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
    preds = model.predict(future_days)

    predicted = []
    stockout_date = None
    for i, pred in enumerate(preds):
        date_str = (last_date + datetime.timedelta(days=i + 1)).strftime("%Y-%m-%d")
        stock_val = max(0, int(round(pred)))
        predicted.append({"date": date_str, "stock": stock_val})
        if stockout_date is None and stock_val <= product["reorder_level"]:
            stockout_date = date_str

    return jsonify({
        "sku": sku,
        "product_name": product["product_name"],
        "reorder_level": product["reorder_level"],
        "current_stock": product["current_stock"],
        "historical": hist,
        "predicted": predicted,
        "reorder_needed": stockout_date is not None,
        "stockout_date": stockout_date
    })


# ── GET /api/inventory/anomalies ────────────────────────────────────────────

@inventory_bp.get("/anomalies")
def anomalies():
    with inventory_db() as conn:
        rows = conn.execute("""
            SELECT sh.sku, sh.stock_level, sh.recorded_at, i.product_name
            FROM stock_history sh JOIN inventory i ON sh.sku=i.sku
            ORDER BY sh.recorded_at DESC
        """).fetchall()

    df = pd.DataFrame([dict(r) for r in rows])
    found = []
    if not df.empty:
        for sku, grp in df.groupby("sku"):
            if len(grp) >= 4:
                mean = grp["stock_level"].mean()
                std = grp["stock_level"].std()
                for _, row in grp.iterrows():
                    if std > 0 and abs(row["stock_level"] - mean) > 3 * std:
                        found.append({
                            "sku": sku,
                            "product_name": row["product_name"],
                            "date": row["recorded_at"],
                            "stock_level": int(row["stock_level"]),
                            "expected": round(mean, 1),
                            "deviation": round(abs(row["stock_level"] - mean), 1)
                        })
    return jsonify({"anomalies": found})


# ── POST /api/inventory/query ────────────────────────────────────────────────

@inventory_bp.post("/query")
def nl_query():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "question required"}), 400

    with inventory_db() as conn:
        low = [dict(r) for r in conn.execute(
            "SELECT product_name, sku, current_stock, reorder_level FROM inventory WHERE current_stock<=reorder_level"
        ).fetchall()]
        expiring = [dict(r) for r in conn.execute(
            "SELECT product_name, sku, expiry_date FROM inventory WHERE expiry_date<=date('now','+30 days')"
        ).fetchall()]
        totals = conn.execute(
            "SELECT COUNT(*) total, SUM(current_stock) units, SUM(current_stock*unit_price) value FROM inventory"
        ).fetchone()

    context = f"""
PHC Inventory System Context:
- Total products: {totals['total']}, Total units: {totals['units']}, Total value: ₹{totals['value'] or 0:.0f}
- Low stock items ({len(low)}): {[i['product_name'] for i in low[:10]]}
- Expiring in 30 days ({len(expiring)}): {[i['product_name'] for i in expiring[:10]]}

Question: {question}
Answer concisely in 2-3 sentences. Focus on actionable information.
"""
    answer = gemini_chat(context, fallback="Could not generate answer at this time.")
    return jsonify({"question": question, "answer": answer})


# ── POST /api/inventory/insights ────────────────────────────────────────────

@inventory_bp.post("/insights")
def insights():
    with inventory_db() as conn:
        inv = conn.execute("SELECT * FROM inventory ORDER BY current_stock ASC").fetchall()
        orders = conn.execute("SELECT COUNT(*),status FROM orders GROUP BY status").fetchall()

    inv_summary = "\n".join([
        f"- {r['product_name']} (SKU:{r['sku']}): {r['current_stock']} units, reorder@{r['reorder_level']}, expires:{r['expiry_date'] or 'N/A'}"
        for r in inv[:30]
    ])
    order_summary = ", ".join([f"{r[1]}: {r[0]}" for r in orders])

    prompt = f"""You are a pharmacy inventory analyst for a rural PHC in India.
Inventory (worst stock first):
{inv_summary}

Orders: {order_summary}

Provide a structured report (max 250 words):
**Critical Actions** (immediate):
**Reorder Priorities** (next 7 days):
**Expiry Waste Risk**:
**Cost Savings Opportunity**:
"""
    report = gemini_chat(prompt, fallback="Could not generate insights. Check Gemini API key.")
    return jsonify({"report": report})
