# Configuração de Fallback para Supabase
# Arquivo: supabase_config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Configurações principais
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://obtuvufykxvbzrykpqvm.supabase.co")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Configurações de fallback
FALLBACK_URLS = [
    "https://obtuvufykxvbzrykpqvm.supabase.co",
    # Adicione URLs alternativas se disponíveis
]

# Configurações de conectividade
NETWORK_TIMEOUT = 30
MAX_RETRIES = 3
BACKOFF_FACTOR = 2

# Configurações de cache local (para casos de falha total)
ENABLE_LOCAL_CACHE = True
CACHE_DURATION_MINUTES = 30

# Configurações de logging
LOG_LEVEL = "INFO"
LOG_FILE = "supabase_connectivity.log"

def get_active_supabase_url():
    """
    Retorna a primeira URL do Supabase que responde
    """
    import socket
    import requests
    
    for url in FALLBACK_URLS:
        try:
            # Testar DNS
            hostname = url.replace("https://", "").replace("http://", "")
            socket.gethostbyname(hostname)
            
            # Testar conectividade
            response = requests.get(f"{url}/rest/v1/", 
                                  headers={"apikey": SUPABASE_API_KEY},
                                  timeout=10)
            if response.status_code in [200, 401, 403]:
                return url
        except:
            continue
    
    return None
