"""
MediGramin 2.0 — Flask Application Entry Point
Run: python server/app.py  (from project root)
"""
import os
import sys

# Make imports resolve from server/ directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config, print_startup
from db import init_all_databases
from routes.inventory    import inventory_bp
from routes.routing      import routing_bp
from routes.chatbot      import chatbot_bp
from routes.patients     import patients_bp
from routes.visits       import visits_bp
from routes.prescriptions import prescriptions_bp
from routes.sync         import sync_bp


def create_app():
    app = Flask(__name__)
    app.secret_key = Config.SECRET_KEY

    # CORS — allow React dev server
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize DBs and folders
    init_all_databases()

    # Register blueprints
    app.register_blueprint(inventory_bp,    url_prefix="/api/inventory")
    app.register_blueprint(routing_bp,      url_prefix="/api/routing")
    app.register_blueprint(chatbot_bp,      url_prefix="/api/chatbot")
    app.register_blueprint(patients_bp,     url_prefix="/api/patients")
    app.register_blueprint(visits_bp,       url_prefix="/api/visits")
    app.register_blueprint(prescriptions_bp,url_prefix="/api/prescriptions")
    app.register_blueprint(sync_bp,         url_prefix="/api/sync")

    # Health check
    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "MediGramin 2.0",
            "ai_model": Config.GEMINI_MODEL,
            "gemini_configured": bool(Config.GOOGLE_API_KEY)
        })

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Server error", "detail": str(e)}), 500

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "File too large. Max 16MB."}), 413

    return app


if __name__ == "__main__":
    print_startup()
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=Config.FLASK_PORT,
        debug=Config.DEBUG,
        use_reloader=Config.DEBUG
    )
