from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
import json
import logging
from datetime import datetime
from database import get_db_connection

webhook_router = APIRouter()

# Pydantic models for request validation
class MPWebhookData(BaseModel):
    action: str
    data: dict

class CoraWebhookData(BaseModel):
    tipo_evento: str
    id_boleto: str | None = None

def get_db():
    with get_db_connection() as conn:
        yield conn

@webhook_router.post("/mercadopago")
async def mp_webhook(request: Request, db=Depends(get_db)):
    try:
        data = await request.json()
        logging.info(f"[MP Webhook] Recebido: {json.dumps(data, ensure_ascii=False)}")

        # Validate request data
        webhook_data = MPWebhookData(**data)

        # Extract payment details from webhook data
        payment_id = str(webhook_data.data.get("id", ""))
        status = webhook_data.data.get("status", webhook_data.action)  # Use status if available, fallback to action
        status_detail = webhook_data.data.get("status_detail", "N/A")

        # Check if payment exists in the pagamentos table
        cursor = db.cursor()
        check_query = """
            SELECT COUNT(*) FROM pagamentos WHERE referencia = ?
        """
        cursor.execute(check_query, (payment_id,))
        exists = cursor.fetchone()[0] > 0

        if exists:
            # Update existing payment (only status and status_detail)
            update_query = """
                UPDATE pagamentos
                SET status = ?, status_detail = ?, atualizado_em = getdate()
                WHERE referencia = ?
            """
            update_values = (status, status_detail, payment_id)
            cursor.execute(update_query, update_values)
            logging.info(f"[MP Webhook] Updated payment: referencia={payment_id}, status={status}, status_detail={status_detail}")
        else:
            # Log that the payment was not found, but do not insert
            logging.info(f"[MP Webhook] Payment not found in pagamentos table: referencia={payment_id}. Skipping insert as payment is still pending in frontend.")

        # Insert into webhook_logs for traceability
        log_query = """
            INSERT INTO webhook_logs (origem, tipo_evento, referencia услуги_externa, payload, criado_em)
            VALUES (?, ?, ?, ?, getdate())
        """
        log_values = (
            "mercadopago",
            webhook_data.action,
            payment_id,
            json.dumps(data, ensure_ascii=False)
        )
        cursor.execute(log_query, log_values)
        db.commit()

        return {"status": "ok"}
    except Exception as e:
        logging.error(f"[MP Webhook] Erro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar webhook: {str(e)}")

@webhook_router.post("/cora")
async def cora_webhook(request: Request, db=Depends(get_db)):
    try:
        data = await request.json()

        # Validate request data
        webhook_data = CoraWebhookData(**data)

        # Insert into pagamentos (keeping Cora logic as is, per original code)
        cursor = db.cursor()
        pagamento_query = """
            INSERT INTO pagamentos (referencia, valor, status, origem)
            VALUES (?, ?, ?, ?)
        """
        pagamento_values = (
            webhook_data.id_boleto or "sem_id",
            0,  # valor (default as per original code)
            webhook_data.tipo_evento,
            "cora"
        )
        cursor.execute(pagamento_query, pagamento_values)
        db.commit()

        return {"status": "ok"}
    except Exception as e:
        logging.error(f"[Cora Webhook] Erro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar webhook: {str(e)}")