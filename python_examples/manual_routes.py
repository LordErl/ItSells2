from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from utils.supabase_sync import confirmar_pagamento_supabase
from responses import ConfirmacaoManualResponse, ErroPadrao , ObterDadosManualResponse
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

manual_router = APIRouter()

def get_db():
    with get_db_connection() as conn:
        yield conn

@manual_router.post("/confirmar-pagamento/{referencia_externa}", response_model=ConfirmacaoManualResponse, responses={500: {"model": ErroPadrao}})
async def confirmar_pagamento(referencia_externa: str, db=Depends(get_db)):
    try:
        # Log the incoming request
        logger.info(f"Endpoint called: POST /pagamento/https://obtuvufykxvbzrykpqvm.supabase.co/{referencia_externa}")

        # Query the pagamentos table
        cursor = db.cursor()
        query = """
            SELECT status
            FROM pagamentos
            WHERE referencia_externa = ?
        """
        cursor.execute(query, (referencia_externa,))
        result = cursor.fetchone()

        if not result:
            logger.warning(f"Payment not found for referencia_externa: {referencia_externa}")
            return ConfirmacaoManualResponse(
                referencia_externa=referencia_externa,
                status_supabase=404,
                resposta_supabase="Pagamento não encontrado."
            )

        status = result[0]  # status column
        logger.info(f"Endpoint called: POST /confirmar-pagamento/{referencia_externa}")

        # Check if the payment is confirmed (approved in Mercado Pago terms)
        if status == "approved":
            status_code, resposta = await confirmar_pagamento_supabase(referencia_externa)
            logger.info(f"Supabase confirmation response: status={status_code}, resposta={resposta}")
            return ConfirmacaoManualResponse(
                referencia_externa=referencia_externa,
                status_supabase=status_code,
                resposta_supabase=resposta
            )

        # Handle intermediate or rejected statuses
        message = "Pagamento ainda não está confirmado."
        if status == "in_process":
            message = "Pagamento em processamento, aguarde a confirmação."
        elif status == "pending":
            message = "Pagamento pendente, aguarde a confirmação."
        elif status == "rejected":
            message = "Pagamento rejeitado."
        elif status in ["cancelled", "refunded", "charged_back"]:
            message = f"Pagamento {status}, não pode ser confirmado."
        elif status == "in_mediation":
            message = "Pagamento em mediação, entre em contato com o suporte."

        logger.info(f"Payment not confirmed: {message}")
        return ConfirmacaoManualResponse(
            referencia_externa=referencia_externa,
            status_supabase=200,  # Use 200 since the request was processed, but payment isn't confirmed
            resposta_supabase=message
        )

    except Exception as e:
        logger.error(f"Error confirming payment for referencia_externa {referencia_externa}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao confirmar pagamento: {str(e)}")
    
    
@manual_router.get("/obter-dados/{referencia_externa}", response_model=ObterDadosManualResponse, responses={500: {"model": ErroPadrao}})
async def obter_dados_pagamento(referencia_externa: str, db=Depends(get_db)):
    try:
        # Log da requisição
        logger.info(f"Endpoint called: POST /obter-dados/{referencia_externa}")

        # Criação do cursor
        cursor = db.cursor()
        query = """
            SELECT TOP 1 referencia, valor*100, nome, documento, [status], tipo, origem, criado_em, referencia_externa, url_pagamento
            FROM pagamentos
            WHERE referencia_externa = ?
            ORDER BY id DESC
        """
        cursor.execute(query, (referencia_externa,))
        result = cursor.fetchone()
        cursor.close()  # Fecha o cursor explicitamente

        if not result:
            logger.warning(f"Payment not found for referencia_externa: {referencia_externa}")
            # Opção 1: Retornar objeto com valores padrão
            return ObterDadosManualResponse(
                id="0",
                valor="0",
                nome="0",
                documento="0",
                status="0",
                tipo="0",
                origem="0",
                criado_em="0",
                referencia_externa=referencia_externa,
                url_pagamento="0"
            )
            # Opção 2: Levantar 404 (descomente se preferir)
            # raise HTTPException(status_code=404, detail=f"Pagamento não encontrado para referencia_externa: {referencia_externa}")

        # Mapeamento correto dos campos
        return ObterDadosManualResponse(
            id=str(result[0]),  # referencia
            valor=str(result[1]),  # valor
            nome=str(result[2]),  # nome
            documento=str(result[3]),  # documento
            status=str(result[4]),  # status
            tipo=str(result[5]),  # tipo
            origem=str(result[6]),  # origem
            criado_em=str(result[7]),  # criado_em
            referencia_externa=str(result[8]),  # referencia_externa
            url_pagamento=str(result[9])  # url_pagamento
        )

    except Exception as e:
        logger.error(f"Error fetching payment for referencia_externa {referencia_externa}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter dados do pagamento: {str(e)}")
