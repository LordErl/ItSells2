"""
Script para verificar e sugerir soluções para problemas de DNS do Supabase
"""

import socket
import requests
import time

def test_supabase_domains():
    """
    Testa diferentes variações de domínios Supabase
    """
    print("🔍 Testando variações de domínios Supabase...")
    
    # Domínios para testar
    test_domains = [
        "obtuvfyxkvbzrkqpvm.supabase.co",
        "supabase.co",
        "app.supabase.io",
        "api.supabase.io"
    ]
    
    results = {}
    
    for domain in test_domains:
        print(f"\n📡 Testando: {domain}")
        try:
            ip = socket.gethostbyname(domain)
            print(f"   ✅ DNS OK: {ip}")
            results[domain] = {"dns": True, "ip": ip}
            
            # Testar conectividade HTTP se DNS funcionar
            try:
                response = requests.get(f"https://{domain}", timeout=10)
                print(f"   ✅ HTTPS OK: Status {response.status_code}")
                results[domain]["https"] = True
                results[domain]["status"] = response.status_code
            except Exception as e:
                print(f"   ❌ HTTPS FALHA: {str(e)}")
                results[domain]["https"] = False
                
        except socket.gaierror as e:
            print(f"   ❌ DNS FALHA: {str(e)}")
            results[domain] = {"dns": False, "error": str(e)}
    
    return results

def suggest_solutions():
    """
    Sugere soluções baseadas nos testes
    """
    print("\n💡 SOLUÇÕES SUGERIDAS:")
    print("=" * 50)
    
    print("1. 🔧 VERIFICAR URL DO PROJETO:")
    print("   - Acesse o painel do Supabase (https://app.supabase.io)")
    print("   - Vá em Settings > API")
    print("   - Copie a URL correta do projeto")
    print("   - A URL deve estar no formato: https://[project-id].supabase.co")
    
    print("\n2. 🌐 VERIFICAR STATUS DO PROJETO:")
    print("   - Verifique se o projeto está ativo no painel")
    print("   - Verifique se não há problemas de billing")
    print("   - Verifique se o projeto não foi pausado")
    
    print("\n3. 🔑 VERIFICAR API KEY:")
    print("   - Confirme se a API key está correta")
    print("   - Use a 'anon' key para operações públicas")
    print("   - Use a 'service_role' key apenas no backend")
    
    print("\n4. 🛡️ VERIFICAR FIREWALL/PROXY:")
    print("   - Teste em uma rede diferente")
    print("   - Verifique configurações de proxy corporativo")
    print("   - Teste com VPN se necessário")
    
    print("\n5. 🔄 IMPLEMENTAR FALLBACK:")
    print("   - Use o sistema de retry já implementado")
    print("   - Configure timeout adequado")
    print("   - Implemente cache local para casos críticos")

def create_fallback_config():
    """
    Cria um arquivo de configuração com fallbacks
    """
    config = """# Configuração de Fallback para Supabase
# Arquivo: supabase_config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Configurações principais
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://obtuvufykxvbzrykpqvm.supabase.co")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Configurações de fallback
FALLBACK_URLS = [
    "https://obtuvufykxvbzrykpqvm.supabase.co",
    # Adicione URLs alternativas se disponíveis
]

# Configurações de conectividade
NETWORK_TIMEOUT = 30
MAX_RETRIES = 3
BACKOFF_FACTOR = 2

# Configurações de cache local (para casos de falha total)
ENABLE_LOCAL_CACHE = True
CACHE_DURATION_MINUTES = 30

# Configurações de logging
LOG_LEVEL = "INFO"
LOG_FILE = "supabase_connectivity.log"

def get_active_supabase_url():
    \"\"\"
    Retorna a primeira URL do Supabase que responde
    \"\"\"
    import socket
    import requests
    
    for url in FALLBACK_URLS:
        try:
            # Testar DNS
            hostname = url.replace("https://", "").replace("http://", "")
            socket.gethostbyname(hostname)
            
            # Testar conectividade
            response = requests.get(f"{url}/rest/v1/", 
                                  headers={"apikey": SUPABASE_API_KEY},
                                  timeout=10)
            if response.status_code in [200, 401, 403]:
                return url
        except:
            continue
    
    return None
"""
    
    with open("/home/ubuntu/supabase_config.py", "w") as f:
        f.write(config)
    
    print("📁 Arquivo de configuração criado: supabase_config.py")

def main():
    print("🚀 Diagnóstico Avançado do Supabase")
    print("=" * 60)
    
    # Testar domínios
    results = test_supabase_domains()
    
    # Análise dos resultados
    print("\n📊 ANÁLISE DOS RESULTADOS:")
    print("=" * 50)
    
    working_domains = [domain for domain, result in results.items() 
                      if result.get("dns", False)]
    
    if working_domains:
        print(f"✅ Domínios funcionando: {len(working_domains)}")
        for domain in working_domains:
            print(f"   - {domain}")
    else:
        print("❌ Nenhum domínio Supabase funcionando")
    
    # Sugerir soluções
    suggest_solutions()
    
    # Criar configuração de fallback
    print("\n🔧 Criando configuração de fallback...")
    create_fallback_config()
    
    print("\n✅ Diagnóstico concluído!")

if __name__ == "__main__":
    main()

