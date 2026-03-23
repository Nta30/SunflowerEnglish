import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SERVER = os.getenv('DB_SERVER', 'localhost')
    DATABASE = os.getenv('DB_NAME', 'Sunflower')
    DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')
    
    SQLALCHEMY_DATABASE_URI = f'mssql+pyodbc://@{SERVER}/{DATABASE}?driver={DRIVER}&trusted_connection=yes'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-key-for-dev')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-key')