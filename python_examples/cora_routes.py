from fastapi import APIRouter, HTTPException, Request, Depends
import logging
from models import CriarCobrancaRequest, CriarCobrancaResponse
from cora_api import gerar_boleto, gerar_pix
from database import get_db_connection
from datetime import datetime


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cora", tags=["Cora"])


@router.post("/cobranca", response_model=CriarCobrancaResponse)
async def criar_cobranca(payload: CriarCobrancaRequest, request: Request):
    logger.info(f"Corpo da solicitação recebida: {payload}")
    payloadtxt= str(payload)
    try:
        if payload.tipo == "boleto":
            resultado = gerar_boleto(payload)
        elif payload.tipo == "pix":
            resultado = gerar_pix(payload)
        else:
            raise HTTPException(status_code=400, detail="Tipo inválido")

        if "id" not in resultado:
            logger.error(f"Erro na resposta do Cora: {resultado}")
            raise HTTPException(status_code=500, detail=resultado.get("message", "Erro desconhecido"))

        url_pagamento = (
            resultado.get("payment_url") or
            resultado.get("payload") or
            resultado.get("qr_code", {}).get("image_url")
        )

        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                DELETE FROM pagamentos
                WHERE referencia_externa = ? AND status = 'rejected'
            """, (payload.referencia,))
            conn.commit()

            cursor.execute("""
                SELECT COUNT(*) FROM pagamentos
                WHERE referencia_externa = ? AND status = 'approved'
            """, (payload.referencia,))
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status_code=400, detail="Já existe um pagamento aprovado para essa inscrição.")

            cursor.execute("""
    INSERT INTO pagamentos (
        referencia, valor, nome, documento, status, tipo, origem,
        criado_em, referencia_externa, status_detail, atualizado_em, url_pagamento , requisicaooriginal
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, getdate(), ?, ?, getdate(), ?, ?)
""", (
    resultado["id"],
    payload.amount / 100,
    payload.nome,
    payload.documento,
    resultado["status"],
    payload.tipo.upper(),
    "cora",
    resultado.get("code"),  # referência externa
    "",  # status_detail não veio na resposta da Cora
    resultado.get("pix", {}).get("emv") if payload.tipo == "pix" else resultado.get("payment_options", {}).get("bank_slip", {}).get("url"),
    payloadtxt
    
))

            conn.commit()

        return CriarCobrancaResponse(
            id=resultado["id"],
            tipo=payload.tipo,
            status=resultado["status"],
            url_pagamento=url_pagamento,
            vencimento=payload.vencimento
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar cobrança: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))