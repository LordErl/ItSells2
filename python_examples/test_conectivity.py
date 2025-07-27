"""
Script de teste para validar as melhorias na conectividade do Supabase
"""

import sys
import os
import logging
from robust_supabase_client import RobustSupabaseClient

# Configurar logging para testes
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_robust_supabase_client():
    """
    Testa o cliente Supabase robusto
    """
    print("🧪 Testando Cliente Supabase Robusto")
    print("=" * 50)
    
    # Configurações de teste
    SUPABASE_URL = "https://obtuvufykxvbzrykpqvm.supabase.co"
    SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY", "test_key")
    
    # Criar cliente
    client = RobustSupabaseClient(
        url=SUPABASE_URL,
        api_key=SUPABASE_API_KEY,
        max_retries=2,
        timeout=10
    )
    
    # Teste 1: Verificação de DNS
    print("\n1. Testando resolução DNS...")
    hostname = SUPABASE_URL.replace("https://", "").replace("http://", "")
    dns_ok = client._check_dns_resolution(hostname)
    print(f"   DNS para {hostname}: {'✅ OK' if dns_ok else '❌ FALHA'}")
    
    # Teste 2: Verificação de conectividade
    print("\n2. Testando conectividade HTTP...")
    connectivity_ok = client._check_connectivity()
    print(f"   Conectividade HTTP: {'✅ OK' if connectivity_ok else '❌ FALHA'}")
    
    # Teste 3: Teste completo de conexão
    print("\n3. Testando conexão completa...")
    connection_ok = client.test_connection()
    print(f"   Conexão completa: {'✅ OK' if connection_ok else '❌ FALHA'}")
    
    # Teste 4: Simulação de atualização (se conectividade OK)
    if connection_ok:
        print("\n4. Testando atualização com retry...")
        try:
            # Dados de teste (não vai funcionar sem dados reais, mas testa o mecanismo)
            success = client.update_with_retry(
                table_name="payments",
                update_data={"status": "test"},
                filter_column="registration_id",
                filter_value="test_id"
            )
            print(f"   Atualização com retry: {'✅ OK' if success else '❌ FALHA (esperado sem dados reais)'}")
        except Exception as e:
            print(f"   Atualização com retry: ❌ ERRO - {str(e)}")
    else:
        print("\n4. Pulando teste de atualização (sem conectividade)")
    
    print("\n" + "=" * 50)
    print("🏁 Teste concluído")
    
    return dns_ok, connectivity_ok, connection_ok

def test_network_diagnostics():
    """
    Executa diagnósticos de rede básicos
    """
    print("\n🌐 Diagnósticos de Rede")
    print("=" * 50)
    
    import socket
    import requests
    
    # Teste 1: Conectividade básica
    print("\n1. Testando conectividade básica...")
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=5)
        print("   Conectividade básica: ✅ OK")
        basic_ok = True
    except OSError as e:
        print(f"   Conectividade básica: ❌ FALHA - {str(e)}")
        basic_ok = False
    
    # Teste 2: Resolução DNS para domínios conhecidos
    print("\n2. Testando resolução DNS...")
    test_domains = ["google.com", "github.com", "supabase.co"]
    dns_results = {}
    
    for domain in test_domains:
        try:
            socket.gethostbyname(domain)
            print(f"   DNS {domain}: ✅ OK")
            dns_results[domain] = True
        except socket.gaierror as e:
            print(f"   DNS {domain}: ❌ FALHA - {str(e)}")
            dns_results[domain] = False
    
    # Teste 3: Conectividade HTTPS
    print("\n3. Testando conectividade HTTPS...")
    test_urls = ["https://google.com", "https://github.com"]
    https_results = {}
    
    for url in test_urls:
        try:
            response = requests.get(url, timeout=10)
            print(f"   HTTPS {url}: ✅ OK (status: {response.status_code})")
            https_results[url] = True
        except Exception as e:
            print(f"   HTTPS {url}: ❌ FALHA - {str(e)}")
            https_results[url] = False
    
    return basic_ok, dns_results, https_results

def main():
    """
    Executa todos os testes
    """
    print("🚀 Iniciando Testes de Conectividade")
    print("=" * 60)
    
    # Diagnósticos de rede
    basic_ok, dns_results, https_results = test_network_diagnostics()
    
    # Testes do cliente Supabase
    dns_ok, connectivity_ok, connection_ok = test_robust_supabase_client()
    
    # Resumo final
    print("\n📊 RESUMO FINAL")
    print("=" * 60)
    print(f"Conectividade básica: {'✅' if basic_ok else '❌'}")
    print(f"DNS geral: {'✅' if all(dns_results.values()) else '❌'}")
    print(f"HTTPS geral: {'✅' if all(https_results.values()) else '❌'}")
    print(f"DNS Supabase: {'✅' if dns_ok else '❌'}")
    print(f"Conectividade Supabase: {'✅' if connectivity_ok else '❌'}")
    print(f"Cliente Supabase: {'✅' if connection_ok else '❌'}")
    
    # Recomendações
    print("\n💡 RECOMENDAÇÕES:")
    if not basic_ok:
        print("   - Verificar conexão de internet")
    if not all(dns_results.values()):
        print("   - Verificar configurações de DNS")
    if not dns_ok:
        print("   - Verificar se o domínio Supabase está correto")
        print("   - Verificar firewall/proxy corporativo")
    if not connectivity_ok:
        print("   - Verificar se a API key do Supabase está correta")
        print("   - Verificar se o projeto Supabase está ativo")

if __name__ == "__main__":
    main()

