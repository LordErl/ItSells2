// Debug script para testar comunicação com API de pagamento
// Para executar: node debug-payment-api.js

// Polyfill para fetch no Node.js
import fetch from 'node-fetch';
global.fetch = fetch;

// Importar as constantes diretamente
const PAYMENT_API = {
  BASE_URL: 'https://itserpapi.duckdns.org:8009',
  FALLBACK_URL: 'http://191.31.165.81:8009',
  ENDPOINTS: {
    PIX: '/cora/cobranca',
    CREDIT_CARD: '/mercadopago/processar-pagamento-token',
    STATUS: '/status'
  }
};

// Implementação simplificada da classe PaymentAPI para teste
class PaymentAPITest {
  static workingUrlCache = null;
  static cacheExpiry = 0;

  static async getWorkingApiUrl() {
    // Check cache
    if (this.workingUrlCache && Date.now() < this.cacheExpiry) {
      return this.workingUrlCache;
    }

    const urls = [PAYMENT_API.BASE_URL, PAYMENT_API.FALLBACK_URL];
    
    for (const url of urls) {
      try {
        console.log(`🔍 Testando URL: ${url}`);
        const response = await fetch(`${url}/docs`, { 
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          console.log(`✅ URL funcionando: ${url}`);
          this.workingUrlCache = url;
          this.cacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
          return url;
        }
      } catch (error) {
        console.log(`❌ Falha em ${url}: ${error.message}`);
      }
    }
    
    throw new Error('Nenhuma URL de API está funcionando');
  }

  static async makeApiRequest(endpoint, options) {
    const baseUrl = await this.getWorkingApiUrl();
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro na API de pagamento');
    }

    return await response.json();
  }

  static async createPixPayment(paymentData) {
    try {
      const payload = {
        amount: Math.round(paymentData.amount * 100), // Convert to centavos
        nome: paymentData.customerName,
        documento: paymentData.customerDocument,
        descricao: `Pagamento Mesa ${paymentData.tableNumber} - ItSells`,
        referencia: paymentData.reference,
        vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: "pix"
      };

      const data = await this.makeApiRequest(PAYMENT_API.ENDPOINTS.PIX, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          pixCode: data.url_pagamento,
          qrCodeUrl: data.url_pagamento
        }
      };
    } catch (error) {
      console.error('❌ PIX payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async checkPaymentStatus(paymentReference) {
    try {
      const data = await this.makeApiRequest(`${PAYMENT_API.ENDPOINTS.STATUS}/${paymentReference}`, {
        method: 'GET'
      });
      
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          amount: data.amount,
          paid_at: data.paid_at,
          reference: paymentReference
        }
      };
    } catch (error) {
      console.error('❌ Payment status check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

async function testPaymentAPI() {
  console.log('🧪 Testando comunicação com API de pagamento...');
  
  // Teste 1: Verificar URL funcionando
  console.log('\n1️⃣ Testando detecção de URL...');
  try {
    const workingUrl = await PaymentAPITest.getWorkingApiUrl();
    console.log('✅ URL funcionando:', workingUrl);
  } catch (error) {
    console.error('❌ Erro na detecção de URL:', error.message);
    return; // Para se não conseguir conectar
  }

  // Teste 2: Testar PIX (com dados de exemplo)
  console.log('\n2️⃣ Testando criação de pagamento PIX...');
  try {
    const pixData = {
      amount: 50.00, // R$ 50,00
      customerName: 'João Silva',
      customerDocument: '12345678901',
      tableNumber: 5,
      reference: `test-${Date.now()}`
    };
    
    const pixResult = await PaymentAPITest.createPixPayment(pixData);
    console.log('PIX Result:', JSON.stringify(pixResult, null, 2));
  } catch (error) {
    console.error('❌ Erro no PIX:', error.message);
  }

  // Teste 3: Testar status (se disponível)
  console.log('\n3️⃣ Testando verificação de status...');
  try {
    const statusResult = await PaymentAPITest.checkPaymentStatus('test-reference');
    console.log('Status Result:', JSON.stringify(statusResult, null, 2));
  } catch (error) {
    console.error('❌ Erro no status:', error.message);
  }
}

// Executar testes
testPaymentAPI().catch(console.error);
