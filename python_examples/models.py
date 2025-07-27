from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal, Any, Dict



class PixResponse(BaseModel):
    mensagem: str
    qr_code: str


class BoletoResponse(BaseModel):
    mensagem: str
    dados: Dict[str, Any]


class CartaoResponse(BaseModel):
    id: Optional[str]
    status: str
    status_detail: Optional[str]
    transaction_amount: float
    payment_method_id: str
    payer: Dict[str, Any]


class ErroResponse(BaseModel):
    detail: str


class ConfirmacaoManualResponse(BaseModel):
    referencia_externa: str
    status_supabase: int
    resposta_supabase: Any

class EnderecoCliente(BaseModel):
    street: str
    number: str
    district: str
    city: str
    state: str
    complement: str
    zip_code: str

class CriarCobrancaRequest(BaseModel):
    nome: str
    email: EmailStr
    documento: str  # CPF sem máscara
    telefone: str   # Ex: +5511999999999
    endereco: EnderecoCliente
    amount: int  # em centavos
    descricao: str
    referencia: str
    vencimento: str  # formato 'YYYY-MM-DD'
    tipo: Literal["pix", "boleto"]
    notification_name: Optional[str] = None
    notification_email: Optional[EmailStr] = None
    notification_sms: Optional[str] = None

class CriarCobrancaResponse(BaseModel):
    id: str
    tipo: str
    status: str
    url_pagamento: Optional[str] = None
    vencimento: str

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
    url_pagamento: Optional[str] = None

