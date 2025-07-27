"""
Script para verificar periodicamente o status de pagamentos pendentes no Mercado Pago
e atualizar o banco de dados com as informações mais recentes.
Versão melhorada com logs detalhados, análise de rejeições e atualização de múltiplas tabelas Supabase.
"""

import os
import time
import logging
import schedule
import requests
from datetime import datetime, timedelta
from robust_supabase_client_v3 import RobustSupabaseClient
from dotenv import load_dotenv
import pyodbc
import pytz
import json
import socket

# Carregar variáveis de ambiente de um arquivo .env
load_dotenv()

DATABASE_URL = (
    "Driver={SQL Server};"
    "Server=ITSERP\\ITSERPSRV;"
    "Database=ConectudoPDV;"
    "Trusted_Connection=yes;"
)

SUPABASE_URL = "https://obtuvufykxvbzrykpqvm.supabase.co"
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Configurações de conectividade
NETWORK_TIMEOUT = 30  # segundos
MAX_RETRIES = 3
BACKOFF_FACTOR = 2

# Inicializar cliente Supabase robusto v2
supabase_client = RobustSupabaseClient(
    url=SUPABASE_URL,
    api_key=SUPABASE_API_KEY,
    max_retries=MAX_RETRIES,
    timeout=NETWORK_TIMEOUT
)

# Configuração de logging melhorada
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mercadopago_payment_checker.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MercadoPagoChecker")

# Token do Mercado Pago (use variável de ambiente em produção)
MERCADO_PAGO_ACCESS_TOKEN = os.environ.get("MERCADO_PAGO_ACCESS_TOKEN", "APP_USR-4419048675246744-052601-6dd7887f9a4228a30298a7caadfeb0af-40698194")

# Dicionário de códigos de status_detail para melhor compreensão
STATUS_DETAIL_MEANINGS = {
    # Aprovados
    "accredited": "Pagamento aprovado e creditado",
    
    # Pendentes
    "pending_contingency": "Pagamento em análise",
    "pending_review_manual": "Pagamento em revisão manual",
    "pending_waiting_payment": "Aguardando pagamento",
    "pending_waiting_transfer": "Aguardando transferência",
    
    # Rejeitados - Cartão
    "cc_rejected_bad_filled_card_number": "Número do cartão inválido",
    "cc_rejected_bad_filled_date": "Data de vencimento inválida",
    "cc_rejected_bad_filled_other": "Dados do cartão inválidos",
    "cc_rejected_bad_filled_security_code": "Código de segurança inválido",
    "cc_rejected_blacklist": "Cartão na lista negra",
    "cc_rejected_call_for_authorize": "Necessário autorizar com o banco",
    "cc_rejected_card_disabled": "Cartão desabilitado",
    "cc_rejected_card_error": "Erro no cartão",
    "cc_rejected_duplicated_payment": "Pagamento duplicado",
    "cc_rejected_high_risk": "Pagamento de alto risco",
    "cc_rejected_insufficient_amount": "Valor insuficiente",
    "cc_rejected_invalid_installments": "Parcelas inválidas",
    "cc_rejected_max_attempts": "Máximo de tentativas excedido",
    "cc_rejected_other_reason": "Rejeitado por outros motivos",
    
    # Outros
    "expired": "Pagamento expirado",
    "cancelled": "Pagamento cancelado"
}

def check_network_connectivity():
    """
    Verifica conectividade básica de rede
    """
    try:
        # Testar conectividade com DNS público do Google
        socket.create_connection(("8.8.8.8", 53), timeout=5)
        logger.info("✅ Conectividade de rede básica OK")
        return True
    except OSError:
        logger.error("❌ Falha na conectividade de rede básica")
        return False

def get_status_detail_meaning(status_detail):
    """
    Retorna o significado do status_detail em português.
    """
    return STATUS_DETAIL_MEANINGS.get(status_detail, f"Status desconhecido: {status_detail}")

def check_payment_status(payment_id):
    """
    Consulta o status de um pagamento específico no Mercado Pago.
    
    Args:
        payment_id (str): ID do pagamento no Mercado Pago
        
    Returns:
        dict: Dados do pagamento ou None em caso de erro
    """
    try:
        headers = {
            "Authorization": f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        
        url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
        response = requests.get(url, headers=headers, timeout=NETWORK_TIMEOUT)
        
        if response.status_code != 200:
            logger.error(f"Erro ao consultar pagamento {payment_id}: {response.status_code} - {response.text}")
            return None
        
        payment_data = response.json()
        
        # Extrair as informações relevantes do pagamento
        data = {
            "id": payment_data["id"],
            "external_reference": payment_data.get("external_reference"),
            "status": payment_data["status"],
            "payment_type": payment_data["payment_type_id"],
            "status_detail": payment_data["status_detail"],
            "description": payment_data.get("description"),
            "value": payment_data["transaction_amount"],
            "date_approved": payment_data.get("date_approved"),
            "date_created": payment_data["date_created"],
            "last_updated": datetime.now(pytz.UTC).isoformat(),
            # Informações adicionais para análise
            "payment_method_id": payment_data.get("payment_method_id"),
            "issuer_id": payment_data.get("issuer_id"),
            "installments": payment_data.get("installments"),
            "card_first_six_digits": payment_data.get("card", {}).get("first_six_digits"),
            "card_last_four_digits": payment_data.get("card", {}).get("last_four_digits"),
            "processing_mode": payment_data.get("processing_mode"),
            "merchant_account_id": payment_data.get("merchant_account_id")
        }
        
        # Log detalhado baseado no status
        log_payment_details(data)
        
        # Atualizar o status do pagamento no banco de dados e Supabase
        update_payment_status(data)
                
        return data
    
    except Exception as e:
        logger.error(f"Erro ao consultar status do pagamento {payment_id}: {str(e)}")
        return None

def log_payment_details(payment_data):
    """
    Gera logs detalhados baseados no status do pagamento.
    """
    payment_id = payment_data["id"]
    status = payment_data["status"]
    status_detail = payment_data["status_detail"]
    status_meaning = get_status_detail_meaning(status_detail)
    
    if status == "approved":
        logger.info(f"✅ Pagamento {payment_id} APROVADO! 💰")
        logger.info(f"   💳 Método: {payment_data.get('payment_method_id', 'N/A')}")
        logger.info(f"   💵 Valor: R$ {payment_data.get('value', 0):.2f}")
        logger.info(f"   📅 Aprovado em: {payment_data.get('date_approved', 'N/A')}")
        
    elif status == "rejected":
        logger.warning(f"❌ Pagamento {payment_id} REJEITADO!")
        logger.warning(f"   🚫 Motivo: {status_meaning}")
        logger.warning(f"   💳 Método: {payment_data.get('payment_method_id', 'N/A')}")
        logger.warning(f"   🏦 Emissor: {payment_data.get('issuer_id', 'N/A')}")
        logger.warning(f"   💵 Valor: R$ {payment_data.get('value', 0):.2f}")
        if payment_data.get('card_first_six_digits'):
            logger.warning(f"   💳 Cartão: {payment_data['card_first_six_digits']}****{payment_data.get('card_last_four_digits', '****')}")
        
        # Sugestões baseadas no tipo de rejeição
        if "bad_filled" in status_detail:
            logger.warning("   💡 Sugestão: Verificar dados do cartão (número, data, CVV)")
        elif "insufficient" in status_detail:
            logger.warning("   💡 Sugestão: Cartão sem limite suficiente")
        elif "call_for_authorize" in status_detail:
            logger.warning("   💡 Sugestão: Cliente deve entrar em contato com o banco")
        elif "high_risk" in status_detail:
            logger.warning("   💡 Sugestão: Transação considerada de alto risco")
        elif "max_attempts" in status_detail:
            logger.warning("   💡 Sugestão: Muitas tentativas, aguardar antes de tentar novamente")
            
    elif status == "in_process":
        logger.info(f"⏳ Pagamento {payment_id} em análise...")
        logger.info(f"   🔍 Detalhes: {status_meaning}")
        logger.info(f"   💳 Método: {payment_data.get('payment_method_id', 'N/A')}")
        logger.info(f"   ⏰ Criado em: {payment_data.get('date_created', 'N/A')}")
        
    elif status == "pending":
        logger.info(f"⏸️ Pagamento {payment_id} pendente")
        logger.info(f"   📋 Detalhes: {status_meaning}")
        
    else:
        logger.info(f"ℹ️ Pagamento {payment_id}: {status}")
        logger.info(f"   📋 Detalhes: {status_meaning}")

def get_pending_payments():
    """
    Obtém a lista de pagamentos pendentes do banco de dados.
    """
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        query = """
            SELECT referencia, referencia_externa
            FROM pagamentos
            WHERE [status] NOT IN ('rejected', 'cancelled', 'refunded')
            AND [status] IS NOT NULL
            AND referencia IS NOT NULL
            AND tipo <> 'PIX'
            AND criado_em >= DATEADD(hour, -6, GETDATE())
        """
        
        cursor.execute(query)
        result = cursor.fetchall()
        
        # Converter para o formato correto
        pending_payments = []
        for row in result:
            pending_payments.append({
                "id": str(row[0]),  # referencia (ID do Mercado Pago)
                "reference": str(row[1]) if row[1] else ""  # referencia_externa
            })
        
        conn.close()
        return pending_payments
        
    except Exception as e:
        logger.error(f"Erro ao obter pagamentos pendentes: {str(e)}")
        return []

def update_payment_status(payment_data):
    """
    Atualiza o status do pagamento no banco de dados local e no Supabase (payments + registrations).
    
    Args:
        payment_data (dict): Dados do pagamento retornados pela API do MercadoPago
    """
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Mapear status do Mercado Pago
        status_mapping = {
            "approved": "approved",
            "pending": "pending",
            "in_process": "in_process",
            "rejected": "rejected",
            "cancelled": "cancelled",
            "refunded": "refunded",
            "charged_back": "charged_back"
        }
        
        mapped_status = status_mapping.get(payment_data["status"], payment_data["status"])
        
        # Atualizar no banco local
        update_query = """
            UPDATE pagamentos 
            SET [status] = ?, 
                status_detail = ?, 
                atualizado_em = GETDATE()
            WHERE referencia = ?
        """
        
        cursor.execute(update_query, (
            mapped_status,
            payment_data.get("status_detail", ""),
            str(payment_data["id"])
        ))
        
        # Verificar se alguma linha foi afetada
        if cursor.rowcount > 0:
            logger.info(f"💾 Pagamento MercadoPago {payment_data['id']} atualizado para status '{mapped_status}' no banco local")
            if payment_data["status"] == "approved":
                logger.info(f"🎉 Pagamento MercadoPago {payment_data['id']} foi aprovado!")
        else:
            logger.warning(f"⚠️ Nenhum pagamento encontrado com referencia {payment_data['id']} no banco local")
        
        conn.commit()
        
        # Atualizar o Supabase (payments + registrations) com cliente robusto
        if not SUPABASE_API_KEY:
            logger.error("❌ Chave da API do Supabase não configurada")
            return
        
        registration_id = payment_data.get("external_reference")
        if not registration_id:
            logger.warning(f"⚠️ registration_id não encontrado para pagamento {payment_data['id']}")
            return
        
        # Preparar dados do pagamento para o método de múltiplas tabelas
        payment_data_for_supabase = {
            "id": payment_data["id"],
            "external_reference": registration_id,
            "status": payment_data["status"],
            "amount": payment_data.get("value", 0),
            "status_detail": payment_data.get("status_detail", ""),
            "payment_method": "Credito"  # Específico para MercadoPago
        }
        
        # Usar o novo método que atualiza ambas as tabelas
        logger.info(f"🔄 Iniciando atualização no Supabase para registration_id: {registration_id}")
        results = supabase_client.update_payment_and_registration_mercadopago(
            payment_data=payment_data_for_supabase,
            registration_id=registration_id
        )
        
        # Log detalhado dos resultados
        if results['payments'] and results['registrations']:
            logger.info(f"✅ Supabase atualizado com sucesso - Payments: ✅ | Registrations: ✅")
            if payment_data["status"] == "approved":
                logger.info(f"💰 Inscrição {registration_id} confirmada com pagamento Crédito de R$ {payment_data.get('value', 0)}")
        elif results['payments']:
            logger.warning(f"⚠️ Supabase parcialmente atualizado - Payments: ✅ | Registrations: ❌")
        elif results['registrations']:
            logger.warning(f"⚠️ Supabase parcialmente atualizado - Payments: ❌ | Registrations: ✅")
        else:
            logger.error(f"❌ Falha completa na atualização do Supabase para registration_id: {registration_id}")
        
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar status do pagamento {payment_data.get('id', 'unknown')}: {str(e)}")
        try:
            conn.rollback()
            conn.close()
        except:
            pass

def check_payments():
    """
    Função principal que verifica o status de todos os pagamentos pendentes.
    """
    logger.info("🔍 Executando verificação de status de pagamentos do Mercado Pago...")
    
    # Verificar conectividade de rede básica
    if not check_network_connectivity():
        logger.error("❌ Falha na conectividade de rede. Abortando verificação.")
        return
    
    # Testar conexão com Supabase
    logger.info("🔗 Testando conexão com Supabase...")
    if not supabase_client.test_connection():
        logger.warning("⚠️ Problemas de conectividade com Supabase detectados. Continuando com banco local apenas.")
    
    try:
        # Obter pagamentos pendentes
        pending_payments = get_pending_payments()
        logger.info(f"📋 {len(pending_payments)} pagamentos MercadoPago pendentes encontrados")
        
        if len(pending_payments) == 0:
            logger.info("✅ Nenhum pagamento MercadoPago pendente para verificar")
            return
        
        # Verificar o status de cada pagamento
        for payment in pending_payments:
            try:
                logger.info(f"🔄 Verificando pagamento MercadoPago: {payment['id']}")
                payment_data = check_payment_status(payment["id"])
                if payment_data:
                    status_emoji = "✅" if payment_data['status'] == "approved" else "⏳" if payment_data['status'] in ["pending", "in_process"] else "❌"
                    logger.info(f"{status_emoji} Pagamento MercadoPago {payment['id']} ({payment['reference']}): {payment_data['status']}")
                else:
                    logger.warning(f"❌ Falha ao verificar pagamento MercadoPago {payment['id']}")
                    
                # Aguardar um pouco entre as requisições para não sobrecarregar a API
                time.sleep(2)
            except Exception as e:
                logger.error(f"❌ Erro ao verificar pagamento MercadoPago {payment['id']}: {str(e)}")
                # Continuar com o próximo pagamento
        
        logger.info("✅ Verificação de status de pagamentos MercadoPago concluída")
    
    except Exception as e:
        logger.error(f"❌ Erro ao executar verificação de pagamentos MercadoPago: {str(e)}")

def run_as_service():
    """
    Executa o script como um serviço contínuo, verificando pagamentos a cada 1 minuto.
    """
    logger.info("🚀 Iniciando serviço de verificação de pagamentos do Mercado Pago")
    logger.info(f"⚙️ Configurações: Timeout={NETWORK_TIMEOUT}s, Max Retries={MAX_RETRIES}, Backoff={BACKOFF_FACTOR}")
    logger.info("📊 Atualizações: Tabelas 'payments' e 'registrations' no Supabase com payment_method='Credito'")
    
    # Agendar a execução a cada 1 minuto
    schedule.every(1).minutes.do(check_payments)
    
    # Executar uma vez imediatamente ao iniciar
    check_payments()
    
    # Loop principal
    while True:
        schedule.run_pending()
        time.sleep(1)

def run_once():
    """
    Executa o script uma única vez, verificando todos os pagamentos pendentes.
    """
    check_payments()

def test_connectivity():
    """
    Testa todas as conectividades necessárias
    """
    logger.info("🧪 Executando teste completo de conectividade...")
    
    # Teste de rede básica
    network_ok = check_network_connectivity()
    
    # Teste do Supabase
    supabase_ok = supabase_client.test_connection()
    
    # Teste da API MercadoPago (básico)
    try:
        headers = {
            "Authorization": f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        response = requests.get("https://api.mercadopago.com/v1/payment_methods", headers=headers, timeout=10)
        mercadopago_ok = response.status_code == 200
        if mercadopago_ok:
            logger.info("✅ Conectividade com API MercadoPago OK")
        else:
            logger.error(f"❌ Falha na conectividade com API MercadoPago: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Erro ao testar API MercadoPago: {str(e)}")
        mercadopago_ok = False
    
    # Resumo
    logger.info("📊 Resumo dos testes de conectividade:")
    logger.info(f"   Rede básica: {'✅' if network_ok else '❌'}")
    logger.info(f"   Supabase: {'✅' if supabase_ok else '❌'}")
    logger.info(f"   API MercadoPago: {'✅' if mercadopago_ok else '❌'}")
    
    return network_ok and supabase_ok and mercadopago_ok

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Verificador de status de pagamentos do Mercado Pago')
    parser.add_argument('--once', action='store_true', help='Executar uma única vez e sair')
    parser.add_argument('--test', action='store_true', help='Testar conectividade e sair')
    args = parser.parse_args()
    
    if args.test:
        test_connectivity()
    elif args.once:
        run_once()
    else:
        run_as_service()

