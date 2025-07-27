# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# === CORA ===
CORA_CLIENT_ID = os.getenv("CORA_CLIENT_ID")
CORA_SANDBOX = os.getenv("CORA_SANDBOX", "TRUE").upper() == "TRUE"

# === MERCADOPAGO ===
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
MP_PUBLIC_KEY = os.getenv("MP_PUBLIC_KEY")

# === SUPABASE ===
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# === SQL SERVER ===
DB_DRIVER = os.getenv("DB_DRIVER", "SQL+Server")
DB_SERVER = os.getenv("DB_SERVER", "ITSERP\\ITSERPSRV")
DB_NAME = os.getenv("DB_NAME", "ConectudoPDV")

# === OUTROS ===
DEBUG = os.getenv("DEBUG", "FALSE").upper() == "TRUE"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# === COMPOSIÇÃO DE STRINGS ===
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://@{DB_SERVER}/{DB_NAME}?driver={DB_DRIVER}"
