from requisicaotokencora import obter_token_cora
import os
import time
import logging
import schedule
import requests
import pyodbc
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
from robust_supabase_client_v3 import RobustSupabaseClient
import socket

# Carregar variáveis de ambiente de um arquivo .env
load_dotenv()

# Configurações
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
BACKOFF_FACTOR = 1

# Inicializar cliente Supabase robusto
supabase_client = RobustSupabaseClient(
    url=SUPABASE_URL,
    api_key=SUPABASE_API_KEY,
    max_retries=MAX_RETRIES,
    timeout=NETWORK_TIMEOUT
)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("cora_payment_checker.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("CoraChecker")

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

def check_payment_status_with_retry(payment_reference, max_retries=MAX_RETRIES):
    """
    Consulta o status de um pagamento PIX específico na Cora via GET com retry automático.
    
    Args:
        payment_reference (str): Referência do pagamento (code) usado na criação
        max_retries (int): Número máximo de tentativas
        
    Returns:
        dict: Dados do pagamento ou None em caso de erro
    """
    for attempt in range(max_retries + 1):
        try:
            token = obter_token_cora()
            if not token:
                logger.error("Não foi possível obter token da Cora")
                return None
            
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {token}"
            }
            
            logger.info(f"Consultando status do pagamento PIX via GET (tentativa {attempt + 1}): {payment_reference}")
            url = f"https://matls-clients.api.cora.com.br/v2/invoices/{payment_reference}"
            
            response = requests.get(url, headers=headers, timeout=NETWORK_TIMEOUT)
            
            if response.status_code == 200:
                payment_data = response.json()
                
                result = {
                    "id": payment_reference,
                    "external_reference": payment_data.get("code"),
                    "status": payment_data.get("status"),
                    "payment_type": "PIX",
                    "status_detail": payment_data.get("status_detail", ""),
                    "description": payment_data.get("services", [{}])[0].get("name", "") if payment_data.get("services") else "",
                    "amount": payment_data.get("total_amount", 0),
                    "date_approved": payment_data.get("paid_at"),
                    "date_created": payment_data.get("created_at"),
                    "due_date": payment_data.get("payment_terms", {}).get("due_date"),
                    "pix_qr_code": payment_data.get("pix_qr_code"),
                    "last_updated": datetime.now(pytz.UTC).isoformat()
                }
                
                logger.info(f"Status do pagamento {payment_reference}: {result['status']}")
                update_payment_status(result)
                return result
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            logger.warning(f"Tentativa {attempt + 1} falhou para pagamento {payment_reference}: {str(e)}")
            
            if attempt < max_retries:
                wait_time = BACKOFF_FACTOR ** attempt
                logger.info(f"Aguardando {wait_time} segundos antes da próxima tentativa...")
                time.sleep(wait_time)
            else:
                logger.error(f"Todas as {max_retries + 1} tentativas falharam para pagamento {payment_reference}")
                return None
    
    return None

def check_payment_status(payment_reference):
    """
    Wrapper para manter compatibilidade com o código existente
    """
    return check_payment_status_with_retry(payment_reference)

def get_pending_payments():
    """
    Obtém a lista de pagamentos PIX pendentes do banco de dados.
    
    Returns:
        list: Lista de dicionários contendo id e referência dos pagamentos pendentes
    """
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        query = """
            SELECT DISTINCT(referencia), referencia_externa
            FROM pagamentos
            WHERE [status] NOT IN ('PAID', 'approved', 'rejected', 'cancelled', 'refunded')
            AND [status] IS NOT NULL
            AND referencia IS NOT NULL
            AND tipo = 'PIX'
            AND criado_em >= DATEADD(day, -7, GETDATE())
        """
        
        cursor.execute(query)
        result = cursor.fetchall()
        
        pending_payments = []
        for row in result:
            pending_payments.append({
                "id": str(row[0]),  # referencia (code da Cora)
                "reference": str(row[1]) if row[1] else ""  # referencia_externa (registration_id no Supabase)
            })
        
        conn.close()
        return pending_payments
        
    except Exception as e:
        logger.error(f"Erro ao obter pagamentos pendentes: {str(e)}")
        return []

def update_payment_status(payment_data):
    """
    Atualiza o status do pagamento PIX no banco de dados local e no Supabase (payments + registrations).
    
    Args:
        payment_data (dict): Dados do pagamento retornados pela API da Cora
    """
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        status_mapping = {
            "OPEN": "pending",
            "PENDING": "pending",
            "PAID": "approved",
            "EXPIRED": "expired",
            "CANCELLED": "cancelled",
            "PROCESSING": "in_process",
            "FAILED": "rejected"
        }
        
        mapped_status = status_mapping.get(payment_data["status"], payment_data["status"])
        
        # Atualizar o banco de dados local
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
        
        if cursor.rowcount > 0:
            logger.info(f"💾 Pagamento PIX {payment_data['id']} atualizado para status '{mapped_status}' no banco local")
            if payment_data["status"] == "PAID":
                logger.info(f"🎉 Pagamento PIX {payment_data['id']} foi aprovado!")
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
        
        # Usar o novo método que atualiza ambas as tabelas
        logger.info(f"🔄 Iniciando atualização no Supabase para registration_id: {registration_id}")
        results = supabase_client.update_payment_and_registration(
            payment_data=payment_data,
            registration_id=registration_id
        )
        
        # Log detalhado dos resultados
        if results['payments'] and results['registrations']:
            logger.info(f"✅ Supabase atualizado com sucesso - Payments: ✅ | Registrations: ✅")
            if payment_data["status"] == "PAID":
                logger.info(f"💰 Inscrição {registration_id} confirmada com pagamento PIX de R$ {payment_data.get('amount', 0)}")
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
    Função principal que verifica o status de todos os pagamentos PIX pendentes.
    """
    logger.info("🔍 Executando verificação de status de pagamentos PIX da Cora...")
    
    # Verificar conectividade de rede básica
    if not check_network_connectivity():
        logger.error("❌ Falha na conectividade de rede. Abortando verificação.")
        return
    
    # Testar conexão com Supabase
    logger.info("🔗 Testando conexão com Supabase...")
    if not supabase_client.test_connection():
        logger.warning("⚠️ Problemas de conectividade com Supabase detectados. Continuando com banco local apenas.")
    
    try:
        pending_payments = get_pending_payments()
        logger.info(f"📋 {len(pending_payments)} pagamentos PIX pendentes encontrados")
        
        if len(pending_payments) == 0:
            logger.info("✅ Nenhum pagamento PIX pendente para verificar")
            return
        
        for payment in pending_payments:
            try:
                logger.info(f"🔄 Verificando pagamento PIX: {payment['id']}")
                payment_data = check_payment_status(payment["id"])
                if payment_data:
                    status_emoji = "✅" if payment_data['status'] == "PAID" else "⏳"
                    logger.info(f"{status_emoji} Pagamento PIX {payment['id']} ({payment['reference']}): {payment_data['status']}")
                    time.sleep(2)  # Evitar sobrecarga da API
                else:
                    logger.warning(f"❌ Falha ao verificar pagamento PIX {payment['id']}")
            except Exception as e:
                logger.error(f"❌ Erro ao verificar pagamento PIX {payment['id']}: {str(e)}")
        
        logger.info("✅ Verificação de status de pagamentos PIX concluída")
    
    except Exception as e:
        logger.error(f"❌ Erro ao executar verificação de pagamentos PIX: {str(e)}")

def run_as_service():
    """
    Executa o script como um serviço contínuo, verificando pagamentos a cada 2 minutos.
    """
    logger.info("🚀 Iniciando serviço de verificação de pagamentos PIX da Cora")
    logger.info(f"⚙️ Configurações: Timeout={NETWORK_TIMEOUT}s, Max Retries={MAX_RETRIES}, Backoff={BACKOFF_FACTOR}")
    logger.info("📊 Atualizações: Tabelas 'payments' e 'registrations' no Supabase")
    
    schedule.every(2).minutes.do(check_payments)
    check_payments()  # Executar uma vez imediatamente
    
    while True:
        schedule.run_pending()
        time.sleep(1)

def run_once():
    """
    Executa o script uma única vez, verificando todos os pagamentos PIX pendentes.
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
    
    # Teste da API Cora (básico)
    try:
        token = obter_token_cora()
        cora_ok = token is not None
        if cora_ok:
            logger.info("✅ Conectividade com API Cora OK")
        else:
            logger.error("❌ Falha na conectividade com API Cora")
    except Exception as e:
        logger.error(f"❌ Erro ao testar API Cora: {str(e)}")
        cora_ok = False
    
    # Resumo
    logger.info("📊 Resumo dos testes de conectividade:")
    logger.info(f"   Rede básica: {'✅' if network_ok else '❌'}")
    logger.info(f"   Supabase: {'✅' if supabase_ok else '❌'}")
    logger.info(f"   API Cora: {'✅' if cora_ok else '❌'}")
    
    return network_ok and supabase_ok and cora_ok

def test_supabase_updates():
    """
    Testa as atualizações do Supabase com dados fictícios
    """
    logger.info("🧪 Testando atualizações do Supabase...")
    
    # Dados de teste
    test_payment_data = {
        "id": "test_payment_id",
        "external_reference": "test_registration_id",
        "status": "PAID",
        "amount": 150.00,
        "status_detail": "Pagamento aprovado"
    }
    
    logger.info("⚠️ ATENÇÃO: Este é um teste com dados fictícios")
    logger.info(f"📝 Dados de teste: {test_payment_data}")
    
    # Testar atualização (não vai funcionar com dados fictícios, mas testa a lógica)
    try:
        results = supabase_client.update_payment_and_registration(
            payment_data=test_payment_data,
            registration_id="test_registration_id"
        )
        logger.info(f"📊 Resultado do teste: {results}")
    except Exception as e:
        logger.info(f"⚠️ Teste falhou como esperado (dados fictícios): {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Verificador de status de pagamentos PIX da Cora')
    parser.add_argument('--once', action='store_true', help='Executar uma única vez e sair')
    parser.add_argument('--test', action='store_true', help='Testar conectividade e sair')
    parser.add_argument('--test-updates', action='store_true', help='Testar atualizações do Supabase')
    args = parser.parse_args()
    
    if args.test:
        test_connectivity()
    elif args.test_updates:
        test_supabase_updates()
    elif args.once:
        run_once()
    else:
        run_as_service()

