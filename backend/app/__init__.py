from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    from app.routes.auth import auth_bp
    # from app.routes.exam import exam_bp
    # from app.routes.flashcard import flashcard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # app.register_blueprint(exam_bp, url_prefix='/api/exams')

    return app