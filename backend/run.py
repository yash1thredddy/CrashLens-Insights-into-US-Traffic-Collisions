from flask import Flask, jsonify, request
from flask_cors import CORS
from api.routes.accident_routes import accident_bp
from api.routes.spatial_routes import spatial_bp
from api.routes.state_routes import state_bp

from config.config import Config
import os
import psycopg2
from api.utils.database import execute_query

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Test database connection
def test_db():
    try:
        result = execute_query("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

# Register blueprints - only register the ones we're using
app.register_blueprint(accident_bp)
app.register_blueprint(spatial_bp)
app.register_blueprint(state_bp)

@app.before_request
def before_request():
    print(f"📝 Request: {request.method} {request.url}")
    print(f"📝 Args: {request.args}")
    print(f"📝 Headers: {request.headers}")

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    print(f"📤 Response Status: {response.status}")
    return response

# Test route
@app.route('/api/test')
def test():
    return jsonify({
        'status': 'success',
        'message': 'API is working'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', Config.PORT))
    
    print("""
    ----------------------------------------
    🚀 Starting Server
    ----------------------------------------""")
    
    if not test_db():
        print("❌ Database connection failed. Exiting...")
        exit(1)
        
    print(f"""
    ✅ Debug mode: {Config.DEBUG}
    🌐 Port: {port}
    💾 Database: {Config.DATABASE_CONFIG['dbname']}
    ----------------------------------------
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=Config.DEBUG
    )