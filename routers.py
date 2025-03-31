import os
import sqlite3
import pandas as pd
import numpy as np
from flask import Flask, request, render_template, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import cdist
import networkx as nx
import re
import google.generativeai as genai
from flask_cors import CORS
from datetime import datetime

# Flask setup
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER  
DB_FILE = "patients.db"
NUM_CLUSTERS = 6
ALLOWED_EXTENSIONS = {"csv"}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.close()

# Initialize database on startup - Flask 2.0+ compatible way
with app.app_context():
    init_db()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def process_csv(filepath):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if the table exists first
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'")
    table_exists = cursor.fetchone()
    
    df = pd.read_csv(filepath)
    df.to_sql("patients", conn, if_exists="replace", index=False)

    # Make sure urgency_score column exists
    cursor.execute("PRAGMA table_info(patients);")
    columns = [col[1] for col in cursor.fetchall()]
    if "cluster" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN cluster INTEGER;")
    if "sub_cluster" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN sub_cluster INTEGER;")
    if "urgency_score" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN urgency_score FLOAT;")
    
    query = """
        SELECT patient_id, name, age, severity_level, last_consultation_date, stock_available, latitude, longitude, village
        FROM patients
    """
    df = pd.read_sql_query(query, conn)
    
    # Handle possible data issues
    df["age"] = pd.to_numeric(df["age"], errors="coerce").fillna(0).astype(int)
    
    severity_mapping = {"Critical": 10, "Severe": 7, "Moderate": 5, "Mild": 2}
    df["severity_score"] = df["severity_level"].map(severity_mapping).fillna(0)
    df["age_factor"] = df["age"].apply(lambda x: 3 if x > 60 else (2 if x < 10 else 0))
    
    # Safer date parsing
    df["last_consultation_date"] = pd.to_datetime(df["last_consultation_date"], errors="coerce")
    # Handle NaT values
    current_date = datetime.now()
    df["consultation_weight"] = df["last_consultation_date"].apply(
        lambda x: 3 if pd.isna(x) or (current_date - x > pd.Timedelta(days=180))
        else (2 if current_date - x > pd.Timedelta(days=90)
        else (1 if current_date - x > pd.Timedelta(days=30) else 0))
    )
    
    df["stock_factor"] = df["stock_available"].apply(
        lambda x: 5 if str(x).lower() == "no" 
        else (3 if str(x).lower() == "low" else 0)
    )
    
    df["urgency_score"] = df["severity_score"] + df["age_factor"] + df["consultation_weight"] + df["stock_factor"]
    
    # Use parameterized queries for security
    cursor.executemany(
        "UPDATE patients SET urgency_score = ? WHERE patient_id = ?", 
        df[["urgency_score", "patient_id"]].values.tolist()
    )
    
    # Only perform clustering if we have enough data with location
    df_for_clustering = df.dropna(subset=["latitude", "longitude"])
    
    if len(df_for_clustering) > 0:
        # Adjust number of clusters if needed
        actual_clusters = min(NUM_CLUSTERS, len(df_for_clustering))
        
        scaler = StandardScaler()
        scaled_locations = scaler.fit_transform(df_for_clustering[["latitude", "longitude"]])
        
        # Only run KMeans if we have enough data
        if len(df_for_clustering) >= actual_clusters:
            kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
            df_for_clustering["cluster"] = kmeans.fit_predict(scaled_locations)
            
            # Process subclusters
            cluster_groups = df_for_clustering.groupby("cluster")
            sub_clusters = []
            
            for cluster_id, group in cluster_groups:
                if len(group) > 1:  # Only do DBSCAN with multiple points
                    coords = scaler.transform(group[["latitude", "longitude"]])
                    # Adjust DBSCAN parameters based on cluster size
                    min_samples = min(2, len(group))
                    dbscan = DBSCAN(eps=0.2, min_samples=min_samples).fit(coords)
                    group["sub_cluster"] = dbscan.labels_
                else:
                    group["sub_cluster"] = 0
                
                group = group.sort_values(by="urgency_score", ascending=False)
                sub_clusters.append(group)
            
            if sub_clusters:
                df_for_clustering = pd.concat(sub_clusters)
            
            # Update original dataframe with cluster info
            df.loc[df_for_clustering.index, "cluster"] = df_for_clustering["cluster"]
            df.loc[df_for_clustering.index, "sub_cluster"] = df_for_clustering["sub_cluster"]
        else:
            # If not enough data, assign all to one cluster
            df["cluster"] = 0
            df["sub_cluster"] = 0
    else:
        # If no valid location data, assign all to one cluster
        df["cluster"] = 0
        df["sub_cluster"] = 0
        
    # Update database with clustering results
    cursor.executemany(
        "UPDATE patients SET cluster = ?, sub_cluster = ? WHERE patient_id = ?", 
        df[["cluster", "sub_cluster", "patient_id"]].values.tolist()
    )
    
    conn.commit()
    conn.close()
    return df

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file"}), 400
    
    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)
    
    try:
        df = process_csv(filepath)
        sorted_patients = df.sort_values(by="urgency_score", ascending=False).to_dict(orient="records")
        
        # Group by clusters for frontend
        clusters = {}
        for patient in sorted_patients:
            cluster_id = int(patient['cluster'])
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            clusters[cluster_id].append(patient)
        
        return jsonify({"clusters": clusters})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_map_data")
def get_map_data():
    try:
        cluster_id = request.args.get("cluster")
        if cluster_id is None:
            return jsonify({"error": "Missing cluster parameter"}), 400
            
        conn = sqlite3.connect("patients.db")
        cursor = conn.cursor()
        cursor.execute(
            "SELECT patient_id, name, latitude, longitude, urgency_score FROM patients WHERE cluster=?", 
            (cluster_id,)
        )
        patients = [
            {"pid": row[0], "name": row[1], "lat": row[2], "lon": row[3], "priority": row[4]} 
            for row in cursor.fetchall()
        ]
        conn.close()
        return jsonify({"patients": patients})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/update_priority", methods=["POST"])
def update_priority():
    user_input = request.json.get("user_input", "")
    
    if not user_input:
        return jsonify({"error": "No input provided"}), 400
    
    # Configure Gemini API with proper error handling
    try:
        genai.configure(api_key="AIzaSyBx9zBbdMHnk7_52R9dWTQoljuoFzNIU_k")  # Replace with your actual API key
        
        # Get column names from DB
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(patients)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Generate SQL query using Gemini
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        prompt = f"""
        Given the input: "{user_input}", generate an SQL query that updates the 'patients' table.
        The table has the following columns: {', '.join(columns)}.
        The 'patient_id' follows the format 'PID-XX', where XX is the numeric ID.
        The query should set 'urgency_score' to a high value (e.g., 100) for the patient(s) described.
        Only return the SQL query with no explanations.
        Ensure the query is safe and uses proper SQL parameters with '?' placeholders.
        """
        
        response = model.generate_content(prompt)
        # Clean the SQL query to remove markdown formatting
        sql_query = re.sub(r"```sql\s*([\s\S]*?)\s*```", r"\1", response.text).strip()
        
        # Security check - only allow UPDATE operations on patients table
        if not sql_query.lower().startswith("update patients") or ";" in sql_query[:-1]:
            return jsonify({
                "message": "Invalid SQL query generated",
                "success": False
            }), 400
        
        # Execute the query with proper parameters
        print(f"Executing SQL query: {sql_query}")
        cursor.execute(sql_query)
        conn.commit()
        
        # Get updated patient data
        query = """
            SELECT patient_id, name, age, severity_level, last_consultation_date, 
                  stock_available, latitude, longitude, village, urgency_score, 
                  cluster, sub_cluster
            FROM patients
        """
        df = pd.read_sql_query(query, conn)
        
        # Process data for frontend
        sorted_patients = df.sort_values(by="urgency_score", ascending=False).to_dict(orient="records")
        
        # Group by clusters for frontend
        clusters = {}
        for patient in sorted_patients:
            cluster_id = int(patient['cluster'])
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            clusters[cluster_id].append(patient)
        
        conn.close()
        
        return jsonify({
            "message": f"Successfully updated priority based on: '{user_input}'",
            "success": True,
            "clusters": clusters
        })
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        print(f"Error in update_priority: {str(e)}")
        return jsonify({
            "message": f"Error processing request: {str(e)}",
            "success": False
        }), 500

if __name__ == "__main__":
    app.run(debug=True)