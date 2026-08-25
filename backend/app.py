import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.api import api_bp

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# Register API routes under /api
app.register_blueprint(api_bp, url_prefix="/api")

# Serve frontend static assets & SPA fallback
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    else:
        return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print("=" * 45)
    print(f"🐍 Paper Arcade Python Backend on http://localhost:{port}")
    print(f"📁 Serving frontend from: {FRONTEND_DIR}")
    print(f"🚀 API live at: http://localhost:{port}/api")
    print("=" * 45)
    app.run(host="0.0.0.0", port=port, debug=False)
