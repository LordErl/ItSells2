import socket
import time
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from supabase import create_client, Client
import logging

class RobustSupabaseClient:
    """
    Cliente Supabase robusto com retry automático e verificação de conectividade
    """
    
    def __init__(self, url, api_key, max_retries=3, timeout=30):
        self.url = url
        self.api_key = api_key
        self.max_retries = max_retries
        self.timeout = timeout
        self.logger = logging.getLogger("RobustSupabaseClient")
        
        # Configurar sessão com retry automático
        self.session = requests.Session()
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE", "POST", "PATCH"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        self.client = None
        self._initialize_client()
    
    def _check_dns_resolution(self, hostname):
        """
        Verifica se o hostname pode ser resolvido via DNS
        """
        try:
            socket.gethostbyname(hostname)
            return True
        except socket.gaierror:
            return False
    
    def _check_connectivity(self):
        """
        Verifica conectividade com o Supabase
        """
        try:
            # Extrair hostname da URL
            hostname = self.url.replace("https://", "").replace("http://", "")
            
            # Verificar resolução DNS
            if not self._check_dns_resolution(hostname):
                self.logger.error(f"Falha na resolução DNS para {hostname}")
                return False
            
            # Testar conectividade HTTP
            response = self.session.get(
                f"{self.url}/rest/v1/",
                headers={"apikey": self.api_key},
                timeout=self.timeout
            )
            return response.status_code in [200, 401, 403]  # 401/403 são OK, significa que chegou no servidor
            
        except Exception as e:
            self.logger.error(f"Erro ao verificar conectividade: {str(e)}")
            return False
    
    def _initialize_client(self):
        """
        Inicializa o cliente Supabase com verificação de conectividade
        """
        try:
            if self._check_connectivity():
                self.client = create_client(self.url, self.api_key)
                self.logger.info("Cliente Supabase inicializado com sucesso")
                return True
            else:
                self.logger.error("Falha na verificação de conectividade com Supabase")
                return False
        except Exception as e:
            self.logger.error(f"Erro ao inicializar cliente Supabase: {str(e)}")
            return False
    
    def update_with_retry(self, table_name, update_data, filter_column, filter_value):
        """
        Atualiza dados no Supabase com retry automático
        """
        for attempt in range(self.max_retries + 1):
            try:
                if not self.client:
                    if not self._initialize_client():
                        raise Exception("Não foi possível inicializar cliente Supabase")
                
                self.logger.info(f"Tentativa {attempt + 1} de atualização no Supabase")
                
                response = self.client.table(table_name).update(update_data).eq(filter_column, filter_value).execute()
                
                # Verificar se a resposta foi bem-sucedida
                if hasattr(response, 'data') and response.data is not None:
                    self.logger.info(f"Atualização no Supabase bem-sucedida na tentativa {attempt + 1}")
                    return True
                else:
                    raise Exception(f"Resposta inválida do Supabase: {response}")
                    
            except Exception as e:
                self.logger.warning(f"Tentativa {attempt + 1} falhou: {str(e)}")
                
                if attempt < self.max_retries:
                    # Backoff exponencial: 2^attempt segundos
                    wait_time = 2 ** attempt
                    self.logger.info(f"Aguardando {wait_time} segundos antes da próxima tentativa...")
                    time.sleep(wait_time)
                    
                    # Reinicializar cliente na próxima tentativa
                    self.client = None
                else:
                    self.logger.error(f"Todas as {self.max_retries + 1} tentativas falharam")
                    return False
        
        return False
    
    def test_connection(self):
        """
        Testa a conexão com o Supabase
        """
        self.logger.info("Testando conexão com Supabase...")
        
        # Verificar DNS
        hostname = self.url.replace("https://", "").replace("http://", "")
        if not self._check_dns_resolution(hostname):
            self.logger.error(f"❌ Falha na resolução DNS para {hostname}")
            return False
        else:
            self.logger.info(f"✅ DNS resolvido com sucesso para {hostname}")
        
        # Verificar conectividade
        if not self._check_connectivity():
            self.logger.error("❌ Falha na conectividade HTTP com Supabase")
            return False
        else:
            self.logger.info("✅ Conectividade HTTP com Supabase OK")
        
        # Testar cliente
        if not self.client:
            if not self._initialize_client():
                self.logger.error("❌ Falha ao inicializar cliente Supabase")
                return False
        
        self.logger.info("✅ Conexão com Supabase testada com sucesso")
        return True

