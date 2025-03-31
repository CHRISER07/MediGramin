from flask import Flask, render_template, request, redirect, url_for, jsonify, flash # type: ignore
import pandas as pd
import sqlite3
import os
import datetime
import json
import numpy as np
from sklearn.linear_model import LinearRegression # type: ignore
import matplotlib # type: ignore
matplotlib.use('Agg')
import matplotlib.pyplot as plt # type: ignore
from io import BytesIO
import base64
from aixplain.factories import ModelFactory # type: ignore

app = Flask(__name__)
app.secret_key = "inventory_management_secret_key"

# Configure the AIXplain API
def configure_aixplain(api_key):
    # AIXplain doesn't require global configuration like Gemini
    # We'll just store the API key for later use
    pass

# Initialize AIXplain model
def get_aixplain_model(model_id="6759db476eb56303857a07c1"):
    return ModelFactory.get(model_id)

# Function to get inventory data as context for AIXplain
def get_inventory_context():
    conn = get_db_connection()
    inventory = conn.execute('SELECT * FROM inventory ORDER BY product_name').fetchall()
    low_stock = conn.execute(
        'SELECT * FROM inventory WHERE current_stock <= reorder_level'
    ).fetchall()
    expiring_soon = conn.execute(
        'SELECT * FROM inventory WHERE expiry_date IS NOT NULL AND expiry_date <= date("now", "+30 days")'
    ).fetchall()
    recent_orders = conn.execute(
        'SELECT o.*, i.product_name FROM orders o JOIN inventory i ON o.sku = i.sku ORDER BY order_date DESC LIMIT 10'
    ).fetchall()
    conn.close()

    context = "INVENTORY SYSTEM INFORMATION:\n\n"
    context += "OVERALL INVENTORY:\n"
    context += f"Total Products: {len(inventory)}\n"
    context += f"Products with Low Stock: {len(low_stock)}\n"
    context += f"Products Expiring Soon: {len(expiring_soon)}\n\n"
    context += "LOW STOCK ITEMS:\n"
    for item in low_stock:
        context += f"- {item['product_name']} (SKU: {item['sku']}): {item['current_stock']} units (Reorder Level: {item['reorder_level']})\n"
    context += "\n"
    context += "EXPIRING ITEMS:\n"
    for item in expiring_soon:
        context += f"- {item['product_name']} (SKU: {item['sku']}): Expires on {item['expiry_date']}\n"
    context += "\n"
    context += "RECENT ORDERS:\n"
    for order in recent_orders:
        context += f"- Order #{order['id']}: {order['quantity']} units of {order['product_name']} (Status: {order['status']})\n"

    return context

# Create database and tables if they don't exist
def init_db():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        category TEXT,
        current_stock INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        expiry_date DATE,
        unit_price REAL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stock_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL,
        stock_level INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES inventory (sku)
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (sku) REFERENCES inventory (sku)
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS api_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL,
        api_key TEXT NOT NULL,
        model_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()
    conn.close()

init_db()

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect('inventory.db')
    conn.row_factory = sqlite3.Row
    return conn

# Get API key from database
def get_api_key(service_name="aixplain"):
    conn = get_db_connection()
    result = conn.execute(
        'SELECT api_key, model_id FROM api_config WHERE service_name = ? ORDER BY created_at DESC LIMIT 1',
        (service_name,)
    ).fetchone()
    conn.close()
    return result if result else None

# Route for home page
@app.route('/')
def index():
    conn = get_db_connection()
    inventory = conn.execute('SELECT * FROM inventory ORDER BY product_name').fetchall()
    conn.close()
    return render_template('index.html', inventory=inventory)

# Route for API configuration
@app.route('/api_config', methods=['GET', 'POST'])
def api_config():
    if request.method == 'POST':
        api_key = request.form.get('api_key')
        model_id = request.form.get('model_id', '6759db476eb56303857a07c1')
        service_name = request.form.get('service_name', 'aixplain')
        if not api_key:
            flash('API Key is required')
            return redirect(url_for('api_config'))
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO api_config (service_name, api_key, model_id) VALUES (?, ?, ?)',
            (service_name, api_key, model_id)
        )
        conn.commit()
        conn.close()
        configure_aixplain(api_key)
        flash('API key saved successfully')
        return redirect(url_for('index'))
    return render_template('api_config.html')

# Route to upload CSV
@app.route('/upload', methods=['POST'])
def upload_csv():
    if 'csv_file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['csv_file']
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    if file and file.filename.endswith('.csv'):
        df = pd.read_csv(file)
        required_columns = ['product_name', 'sku', 'current_stock']
        if not all(col in df.columns for col in required_columns):
            flash('CSV must contain columns: product_name, sku, current_stock')
            return redirect(url_for('index'))
        conn = get_db_connection()
        cursor = conn.cursor()
        for _, row in df.iterrows():
            existing = cursor.execute('SELECT * FROM inventory WHERE sku = ?', (row['sku'],)).fetchone()
            if existing:
                update_query = '''
                UPDATE inventory
                SET product_name = ?, category = ?, current_stock = ?,
                    reorder_level = ?, expiry_date = ?, unit_price = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE sku = ?
                '''
                cursor.execute(update_query, (
                    row['product_name'],
                    row.get('category', ''),
                    row['current_stock'],
                    row.get('reorder_level', 10),
                    row.get('expiry_date', None),
                    row.get('unit_price', 0.0),
                    row['sku']
                ))
            else:
                insert_query = '''
                INSERT INTO inventory (product_name, sku, category, current_stock,
                                      reorder_level, expiry_date, unit_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                '''
                cursor.execute(insert_query, (
                    row['product_name'],
                    row['sku'],
                    row.get('category', ''),
                    row['current_stock'],
                    row.get('reorder_level', 10),
                    row.get('expiry_date', None),
                    row.get('unit_price', 0.0)
                ))
            cursor.execute(
                'INSERT INTO stock_history (sku, stock_level) VALUES (?, ?)',
                (row['sku'], row['current_stock'])
            )
        conn.commit()
        conn.close()
        flash('Inventory updated successfully from CSV')
        return redirect(url_for('index'))
    flash('Invalid file format. Please upload a CSV file.')
    return redirect(url_for('index'))

# Export current inventory to CSV
@app.route('/export')
def export_csv():
    conn = get_db_connection()
    inventory = conn.execute('SELECT * FROM inventory').fetchall()
    conn.close()
    df = pd.DataFrame([dict(row) for row in inventory])
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"inventory_export_{timestamp}.csv"
    filepath = os.path.join("static", "exports", filename)
    os.makedirs(os.path.join("static", "exports"), exist_ok=True)
    df.to_csv(filepath, index=False)
    return redirect(url_for('static', filename=f"exports/{filename}"))

# Search functionality
@app.route('/search')
def search():
    query = request.args.get('query', '')
    conn = get_db_connection()
    inventory = conn.execute('''
        SELECT * FROM inventory
        WHERE product_name LIKE ? OR sku LIKE ? OR category LIKE ?
        ORDER BY product_name
    ''', (f'%{query}%', f'%{query}%', f'%{query}%')).fetchall()
    conn.close()
    return render_template('search_results.html', inventory=inventory, query=query)

# Place an order
@app.route('/order/<string:sku>', methods=['POST'])
def place_order(sku):
    quantity = int(request.form.get('quantity', 0))
    if quantity <= 0:
        flash('Order quantity must be positive')
        return redirect(url_for('index'))
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO orders (sku, quantity) VALUES (?, ?)',
        (sku, quantity)
    )
    conn.commit()
    conn.close()
    flash(f'Order placed for {quantity} units of SKU: {sku}')
    return redirect(url_for('index'))

# View orders
@app.route('/orders')
def view_orders():
    conn = get_db_connection()
    orders = conn.execute('''
        SELECT o.*, i.product_name
        FROM orders o
        JOIN inventory i ON o.sku = i.sku
        ORDER BY o.order_date DESC
    ''').fetchall()
    conn.close()
    return render_template('orders.html', orders=orders)

# Detect expiring items
@app.route('/expiring')
def expiring_items():
    threshold_date = (datetime.datetime.now() + datetime.timedelta(days=90)).strftime('%Y-%m-%d')
    conn = get_db_connection()
    expiring = conn.execute('''
        SELECT * FROM inventory
        WHERE expiry_date IS NOT NULL AND expiry_date <= ?
        ORDER BY expiry_date
    ''', (threshold_date,)).fetchall()
    conn.close()
    return render_template('expiring.html', items=expiring, threshold_days=90)

# Anomaly detection
@app.route('/anomalies')
def detect_anomalies():
    conn = get_db_connection()
    history = conn.execute('''
        SELECT sh.sku, sh.stock_level, sh.date, i.product_name
        FROM stock_history sh
        JOIN inventory i ON sh.sku = i.sku
        ORDER BY sh.date DESC
    ''').fetchall()
    conn.close()
    df = pd.DataFrame([dict(row) for row in history])
    anomalies = []
    if not df.empty and len(df) > 1:
        for sku, group in df.groupby('sku'):
            if len(group) > 3:
                mean = group['stock_level'].mean()
                std = group['stock_level'].std()
                threshold = 3 * std
                for _, row in group.iterrows():
                    if abs(row['stock_level'] - mean) > threshold:
                        anomalies.append({
                            'sku': row['sku'],
                            'product_name': row['product_name'],
                            'date': row['date'],
                            'stock_level': row['stock_level'],
                            'expected': mean,
                            'difference': row['stock_level'] - mean
                        })
    return render_template('anomalies.html', anomalies=anomalies)

# AI prediction for future stock needs
@app.route('/predict/<string:sku>')
def predict_stock(sku):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM inventory WHERE sku = ?', (sku,)).fetchone()
    if not product:
        flash('Product not found')
        return redirect(url_for('index'))
    history = conn.execute('''
        SELECT stock_level, date FROM stock_history
        WHERE sku = ? ORDER BY date
    ''', (sku,)).fetchall()
    conn.close()
    df = pd.DataFrame([dict(row) for row in history])
    if len(df) < 5:
        flash('Not enough historical data for prediction')
        return render_template('prediction.html', product=product, prediction=None, chart=None)
    df['date'] = pd.to_datetime(df['date'])
    df['days'] = (df['date'] - df['date'].min()).dt.days
    X = df[['days']].values
    y = df['stock_level'].values
    model = LinearRegression()
    model.fit(X, y)
    future_days = np.array(range(max(df['days']) + 1, max(df['days']) + 31)).reshape(-1, 1)
    predictions = model.predict(future_days)
    last_date = df['date'].max()
    future_dates = [(last_date + datetime.timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(30)]
    prediction_data = {
        'dates': future_dates,
        'values': predictions.round().astype(int).tolist()
    }
    plt.figure(figsize=(10, 6))
    plt.plot(df['date'], df['stock_level'], marker='o', linestyle='-', label='Historical Stock')
    pred_dates = [last_date + datetime.timedelta(days=i+1) for i in range(30)]
    plt.plot(pred_dates, predictions, marker='x', linestyle='--', color='red', label='Predicted Stock')
    plt.title(f'Stock Prediction for {product["product_name"]}')
    plt.xlabel('Date')
    plt.ylabel('Stock Level')
    plt.legend()
    plt.tight_layout()
    plt.grid(True, alpha=0.3)
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    chart_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    chart_data = f"data:image/png;base64,{chart_img}"
    reorder_needed = any(pred < product['reorder_level'] for pred in predictions)
    return render_template(
        'prediction.html',
        product=product,
        prediction=prediction_data,
        chart=chart_data,
        reorder_needed=reorder_needed
    )

# AI chatbot for stock queries
@app.route('/chatbot', methods=['GET', 'POST'])
def chatbot():
    if request.method == 'POST':
        user_query = request.form.get('query', '')
        response = process_chatbot_query_with_aixplain(user_query)
        return jsonify({'response': response})
    api_config = get_api_key()
    api_configured = api_config is not None
    return render_template('chatbot.html', api_configured=api_configured)

# Use AIXplain to process chatbot queries
def process_chatbot_query_with_aixplain(query):
    api_config = get_api_key()
    if not api_config:
        return "Please configure your AIXplain API key in the API Configuration page before using the chatbot."
    try:
        context = get_inventory_context()
        model = ModelFactory.get(api_config['model_id'] or "6759db476eb56303857a07c1")
        prompt = f"""
        You are an intelligent inventory management assistant. Below is the current state of our inventory system:
        {context}
        User Query: {query}
        Please provide a helpful, concise response to the user's query based on the inventory information provided.
        Focus on answering specifically about inventory status, stock levels, orders, or product information.
        If you can't answer the question based on the provided information, let the user know what specific data they need to check
        or what actions they can take in the inventory system.
        """
        result = model.run({
            "text": query,
            "prompt": prompt,
            "context": context
        })
        return result.get('text', "No response received from AIXplain API")
    except Exception as e:
        return f"An error occurred with the AIXplain API: {str(e)}"

# Inventory insights with AIXplain
@app.route('/insights')
def inventory_insights():
    api_config = get_api_key()
    if not api_config:
        flash("Please configure your AIXplain API key in the API Configuration page before using insights.")
        return redirect(url_for('api_config'))
    try:
        context = get_inventory_context()
        conn = get_db_connection()
        categories = conn.execute('''
            SELECT category, COUNT(*) as count, SUM(current_stock) as total_stock,
            SUM(current_stock * unit_price) as total_value
            FROM inventory
            GROUP BY category
        ''').fetchall()
        stock_trends = conn.execute('''
            SELECT i.category,
                   SUM(CASE WHEN sh.date >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as movements_count,
                   COUNT(DISTINCT i.sku) as unique_products
            FROM stock_history sh
            JOIN inventory i ON sh.sku = i.sku
            GROUP BY i.category
        ''').fetchall()
        conn.close()
        categories_str = "\nCATEGORY BREAKDOWN:\n"
        for cat in categories:
            categories_str += f"- {cat['category'] or 'Uncategorized'}: {cat['count']} products, {cat['total_stock']} units, Value: ${cat['total_value']:.2f}\n"
        trends_str = "\nSTOCK MOVEMENT TRENDS (LAST 30 DAYS):\n"
        for trend in stock_trends:
            trends_str += f"- {trend['category'] or 'Uncategorized'}: {trend['movements_count']} movements across {trend['unique_products']} products\n"
        model = ModelFactory.get(api_config['model_id'] or "6759db476eb56303857a07c1")
        prompt = f"""
        You are an inventory management expert. Analyze the following inventory data and provide 3-5 key insights
        and recommendations that would be valuable for inventory management:
        {context}
        {categories_str}
        {trends_str}
        Format your response with clear sections:
        1. Executive Summary (2-3 sentences overview)
        2. Key Insights (bullet points)
        3. Recommendations (bullet points with actionable advice)
        4. Areas Needing Attention (highlight any concerning trends or issues)
        Keep your response concise and business-focused.
        """
        result = model.run({
            "text": categories_str + trends_str,
            "prompt": prompt,
            "context": context
        })
        return render_template('insights.html', insights=result.get('text', "No response received from AIXplain API"))
    except Exception as e:
        flash(f"An error occurred with the AIXplain API: {str(e)}")
        return redirect(url_for('index'))

# Run the application
if __name__ == '__main__':
    app.run(debug=True)