import os
import requests
import pyodbc
from dotenv import load_dotenv
from functools import lru_cache
from datetime import datetime, timedelta
from database import get_db_connection  # use a sua função já existente


# Carrega variáveis do .env

load_dotenv()

CERT_PATH = "C:/cert_key_cora_production/certificate.pem"
KEY_PATH = "C:/cert_key_cora_production/private-key.key"
TOKEN_URL = "https://matls-clients.api.cora.com.br/token"
HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}


# Define variável de cache manual
_token_cache = {
    "access_token": None,
    "expires_at": datetime.min
}

def token_expirado():
    """Verifica se o token atual está expirado."""
    return datetime.utcnow() >= _token_cache["expires_at"]

def obter_token_cora():
    dados_conexao = (
    "Driver={SQL Server};"
    "Server=ITSERP\\ITSERPSRV;"
    "Database=ConectudoPDV"
            )
    
    conexao_direta = pyodbc.connect(dados_conexao)
    cursor = conexao_direta.cursor()

    cursor.execute("SELECT access_token, expires_at FROM token_cora WHERE id = 1")
    row = cursor.fetchone()

    agora = datetime.utcnow()

    # Se token existe e é válido por mais de 5 minutos, retorna
    if row:
        token, expires_at = row
        if expires_at - agora > timedelta(minutes=5):
            return token

    # Caso contrário, requisita novo token
    client_id = os.getenv("CORA_CLIENT_ID")
    data = {
        "grant_type": "client_credentials",  
        "client_id": client_id
    }
    print([TOKEN_URL],HEADERS,data, CERT_PATH, KEY_PATH)

    response = requests.post(
        TOKEN_URL,
        headers=HEADERS,
        data=data,
        cert=(CERT_PATH, KEY_PATH)
    )

    if response.status_code == 200:
        token_data = response.json()
        novo_token = token_data["access_token"]
        nova_expiracao = agora + timedelta(seconds=token_data.get("expires_in", 1800))

        # Insere ou atualiza
        cursor.execute("""
            INSERT INTO token_cora (id, access_token, expires_at)
            VALUES ((select isnull(MAx(id),0)+1 from token_cora), ?, ?)
        """, (novo_token, nova_expiracao))

        conexao_direta.commit()
        return novo_token
    else:
        raise Exception(f"Erro ao obter token: {response.status_code} - {response.text}")