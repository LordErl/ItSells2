import httpx
from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_db_connection
from config import CORA_SANDBOX
from requisicaotokencora import obter_token_cora
from responses import PixResponse , ErroPadrao
import requests
from models import CriarCobrancaRequest , Dict
import logging
import pyodbc

logger = logging.getLogger(__name__)
url = f"https://matls-clients.api.cora.com.br/v2/invoices/"

DATABASE_URL = (
    "Driver={SQL Server};"
    "Server=ITSERP\\ITSERPSRV;"
    "Database=ConectudoPDV;"
    "Trusted_Connection=yes;"
)

def gerar_boleto(payload: CriarCobrancaRequest):
    url = f"https://matls-clients.api.cora.com.br/v2/invoices/"
    token = obter_token_cora()

    headers = {
    "accept": "application/json",
    "Idempotency-Key": payload.referencia,
    "content-type": "application/json",
    "authorization": f"Bearer {token}"}
    

    data = {
        "code": payload.referencia,
        "total_amount": payload.amount,
        "customer": {
            "name": payload.nome,
            "email": payload.email,
            "document": {
                "identity": payload.documento,
                "type": "CPF"
            },
            "phone": payload.telefone,
            "address": payload.endereco.dict()
        },
        "services": [
            {
                "name": payload.descricao,
                "description": payload.descricao,
                "amount": payload.amount
            }
        ],
        "payment_terms": {
            "due_date": payload.vencimento
        },
        "payment_forms": ["BANK_SLIP"]
    }

    logger.info(f"Enviando solicitação para Cora (boleto): {url}")
    logger.info(f"header da solicitação: {headers}")
    logger.info(f"Corpo da solicitação: {data}")
    response = requests.post(url, headers=headers, json=data)
    logger.info(f"Resposta do Cora - Status: {response.status_code}")
    logger.info(f"Corpo da resposta: {response.json()}")
    return response.json()


def gerar_pix(payload: CriarCobrancaRequest):
    url = f"https://matls-clients.api.cora.com.br/v2/invoices/"
    token = obter_token_cora()
    logger.info(f"token pix: {token}")

    headers = {
    "accept": "application/json",
    "Idempotency-Key": payload.referencia,
    "content-type": "application/json",
    "authorization": f"Bearer {token}"}
    
    logger.info(f"heADER DE AY pix: {headers}")


    data = {
        "code": payload.referencia,
        "total_amount": payload.amount,
        "customer": {
            "name": payload.nome,
            "email": payload.email,
            "document": {
                "identity": payload.documento,
                "type": "CPF"
            },
            "phone": payload.telefone,
            "address": payload.endereco.dict()
        },
        "services": [
            {
                "name": payload.descricao,
                "description": payload.descricao,
                "amount": payload.amount
            }
        ],
        "payment_terms": {
            "due_date": payload.vencimento
        },
        "payment_forms": ["PIX"],
        "notification": {
            "name": payload.notification_name or payload.nome,
            "channels": [
                {
                    "channel": "EMAIL",
                    "contact": payload.notification_email or payload.email,
                    "rules": ["NOTIFY_TWO_DAYS_BEFORE_DUE_DATE", "NOTIFY_WHEN_PAID"]
                },
                {
                    "channel": "SMS",
                    "contact": payload.notification_sms or payload.telefone,
                    "rules": ["NOTIFY_TWO_DAYS_BEFORE_DUE_DATE", "NOTIFY_WHEN_PAID"]
                }
            ]
        }
    }

    logger.info(f"Enviando solicitação para Cora (PIX): {url}")
    logger.info(f"header da solicitação: {headers}")
    logger.info(f"Corpo da solicitação: {data}")
    response = requests.post(url, headers=headers, json=data)
    logger.info(f"Resposta do Cora - Status: {response.status_code}")
    logger.info(f"Corpo da resposta: {response.json()}")
    return response.json()


router = APIRouter()

# ============================
# ENDPOINT FastAPI - CRIAÇÃO PIX
# ============================
@router.post("/cora/pix", response_model=PixResponse, responses={500: {"model": ErroPadrao}})
async def criar_pix_endpoint(payload: CriarCobrancaRequest):
    logger.info(">>> Iniciando endpoint criar_pix_endpoint com payload:")
    logger.info(payload)    
    try:
        conn = pyodbc.connect(DATABASE_URL)
        # Obtem token via função externa já com controle de expiração (se implementado)
        token = obter_token_cora()
        logger.info("Tentando inserir pagamento no banco de dados...")

        resultado = gerar_pix(payload)

        # Insert into pagamentos
        cursor = conn.cursor()
        query = """
            INSERT INTO pagamentos (referencia, valor, nome, documento, status, tipo, origem)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        values = (
            payload.referencia,
            payload.amount,
            payload.nome,
            payload.documento,
            "pendente",
            "pix",
            "cora"
        )
        cursor.execute(query, values)
        logger.info("Query executada com sucesso")
        conn.commit()
        logger.info("Commit realizado com sucesso")


        return {"mensagem": "PIX gerado com sucesso", "qr_code": resultado.get("pix")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))