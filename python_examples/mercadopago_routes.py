from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import mercadopago
from config import MP_ACCESS_TOKEN
from database import get_db_connection
from responses import CartaoResponse, ErroPadrao
import logging
import json

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

mp_router = APIRouter()

# Pydantic model for request validation
class PagamentoCreate(BaseModel):
    transaction_amount: float
    token: str
    description: str
    installments: int
    payment_method_id: str
    payer_email: str
    nome: str | None = None
    documento: str | None = None
    tipo: str = "CARTAO"

# Pydantic model for the processar-pagamento-token endpoint
class PagamentoTokenCreate(BaseModel):
    token: str
    payment_method_id: str
    issuer_id: str | None = None
    installments: int
    transaction_amount: float
    description: str
    payer: dict
    external_reference: str

# Response model for MercadoPagoProcessedResponse
class MercadoPagoProcessedResponse(BaseModel):
    id: str
    status: str
    message: str | None = None
    mp_payment_id: str | None = None

def get_db():
    with get_db_connection() as conn:
        yield conn

@mp_router.post("/pagar", response_model=CartaoResponse, responses={500: {"model": ErroPadrao}})
async def pagar(pagamento: PagamentoCreate, db=Depends(get_db)):
    try:
        payment_data = {
            "transaction_amount": pagamento.transaction_amount,
            "token": pagamento.token,
            "description": pagamento.description,
            "installments": pagamento.installments,
            "payment_method_id": pagamento.payment_method_id,
            "payer": {"email": pagamento.payer_email},
        }

        result = sdk.payment().create(payment_data)
        response = result["response"]

        cursor = db.cursor()
        query = """
            INSERT INTO pagamentos (referencia, valor, nome, documento, status, tipo, origem)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        values = (
            str(response.get("id", "")),
            response.get("transaction_amount", 0),
            pagamento.nome,
            pagamento.documento,
            response.get("status", "desconhecido"),
            pagamento.tipo,
            "mercadopago"
        )
        cursor.execute(query, values)
        db.commit()

        return response
    except Exception as e:
        logger.error(f"Error processing /pagar endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar pagamento: {str(e)}")

@mp_router.post("/processar-pagamento-token", response_model=MercadoPagoProcessedResponse, responses={500: {"model": ErroPadrao}})
async def processar_pagamento_token(request: Request, pagamento: PagamentoTokenCreate, db=Depends(get_db)):
    try:
        # Log request details
        logger.info(f"Endpoint called: {request.method} {request.url}")
        logger.info(f"Request body: {json.dumps(pagamento.dict(), ensure_ascii=False)}")

        # Convert transaction_amount from centavos to reais (e.g., 11490 -> 114.90)
        transaction_amount_reais = pagamento.transaction_amount / 100

        # Prepare payment data for Mercado Pago SDK
        payment_data = {
            "token": pagamento.token,
            "payment_method_id": pagamento.payment_method_id,
            "issuer_id": pagamento.issuer_id,
            "installments": pagamento.installments,
            "transaction_amount": transaction_amount_reais,
            "description": pagamento.description,
            "payer": {
                "email": pagamento.payer.get("email"),
                "identification": {
                    "type": pagamento.payer.get("identification", {}).get("type"),
                    "number": pagamento.payer.get("identification", {}).get("number")
                }
            },
            "external_reference": pagamento.external_reference
        }

        # Create payment using Mercado Pago SDK
        result = sdk.payment().create(payment_data)
        logger.info(f"Mercado Pago response: {json.dumps(result, ensure_ascii=False)}")
        
        # Check if the response indicates an error
        if result.get("status") >= 400:
            logger.error(f"Mercado Pago error: status={result.get('status')}, message={result.get('response', {}).get('message', 'Unknown error')}")
            raise HTTPException(status_code=result.get("status", 500), detail=f"Mercado Pago error: {result.get('response', {}).get('message', 'Unknown error')}")

        response = result["response"]

        # Log successful payment creation
        logger.info(f"Payment created successfully: mp_payment_id={response.get('id', '')}, status={response.get('status', 'desconhecido')}, status_detail={response.get('status_detail', 'N/A')}")

        # Save to database
        cursor = db.cursor()
        query = """
            INSERT INTO pagamentos (referencia, valor, nome, documento, status, tipo, origem, criado_em, referencia_externa, status_detail, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, getdate(), ?,? ,getdate() )
        """
        values = (
            str(response.get("id", "")),
            transaction_amount_reais,  # Store amount in reais
            None,
            pagamento.payer.get("identification", {}).get("number"),
            str(response.get("status", "desconhecido")),
            "CARTAO",
            "mercadopago",
            pagamento.external_reference,
            str(response.get("status_detail", "desconhecido"))
        )
        cursor.execute(query, values)
        db.commit()

        # Prepare response message based on status
        message = None
        if response.get("status") == "approved":
            message = "Pagamento processado com sucesso"
        elif response.get("status") == "rejected":
            status_detail = response.get("status_detail", "Motivo desconhecido")
            message = f"Pagamento rejeitado: {status_detail}"
            if status_detail == "cc_rejected_insufficient_amount":
                message = "Pagamento rejeitado: saldo insuficiente no cartão"

        # Prepare and log response
        response_data = MercadoPagoProcessedResponse(
            id=pagamento.external_reference,
            status=str(response.get("status", "desconhecido")),
            mp_payment_id=str(response.get("id", "")),
            message=message
        )
        logger.info(f"Response sent: {json.dumps(response_data.dict(), ensure_ascii=False)}")

        return response_data
    except HTTPException as e:
        # Re-raise HTTP exceptions (e.g., Mercado Pago errors)
        logger.error(f"Error processing /processar-pagamento-token endpoint: {str(e)}")
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error processing /processar-pagamento-token endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar pagamento: {str(e)}")