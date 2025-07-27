# schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, Any


class PixResponse(BaseModel):
    status: str
    pix_copia_cola: str
    valor: float
    referencia: str
    vencimento: str
    id_transacao: str


class BoletoResponse(BaseModel):
    status: str
    linha_digitavel: str
    pdf_url: str
    valor: float
    vencimento: str
    referencia: str


class CartaoResponse(BaseModel):
    status: str
    id_transacao: str
    valor: float
    descricao: str
    status_pagamento: str


class ErroPadrao(BaseModel):
    status: str = "erro"
    mensagem: str
    erro: Optional[str] = None

    
class ConfirmacaoManualResponse(BaseModel):
    referencia_externa: str
    status_supabase: int
    resposta_supabase: Any


class ObterDadosManualResponse(BaseModel):
    id: str
    valor : str
    nome : str
    documento : str
    status : str
    tipo: str
    origem: str
    criado_em : str
    referencia_externa : str
    url_pagamento: str


