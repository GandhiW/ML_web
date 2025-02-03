from flask import Flask
from .routes import main

def create_app():
    app = Flask(__name__)
    
    # Set a secret key for session management
    app.secret_key = 'your-unique-and-secret-key'  # Replace this with a strong key
    
    # Register Blueprints
    app.register_blueprint(main)

    return app
