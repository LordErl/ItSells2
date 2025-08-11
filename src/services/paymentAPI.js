import { PAYMENT_API, PAYMENT_METHODS } from '../lib'
import { CompanyService } from './companyService'

export class PaymentAPI {
  // Cache para URL funcionando
  static workingUrlCache = null
  static cacheExpiry = 0

  /**
   * Detecta automaticamente qual URL da API está funcionando
   */
  static async getWorkingApiUrl() {
    // Verifica cache
    if (this.workingUrlCache && Date.now() < this.cacheExpiry) {
      return this.workingUrlCache
    }

    const urls = [PAYMENT_API.BASE_URL, PAYMENT_API.FALLBACK_URL]
    
    for (const url of urls) {
      try {
        console.log(`🔍 Testando URL: ${url}`)
        const response = await fetch(`${url}/docs`, { 
          method: 'GET',
          timeout: 5000
        })
        
        if (response.ok) {
          console.log(`✅ URL funcionando: ${url}`)
          this.workingUrlCache = url
          this.cacheExpiry = Date.now() + (5 * 60 * 1000) // 5 minutes
          return url
        }
      } catch (error) {
        console.log(`❌ Falha em ${url}: ${error.message}`)
      }
    }
    
    throw new Error('Nenhuma URL de API está funcionando')
  }

  /**
   * Faz requisição para API com fallback automático
   */
  static async makeApiRequest(endpoint, options) {
    const baseUrl = await this.getWorkingApiUrl()
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Erro na API de pagamento')
    }

    return await response.json()
  }

  /**
   * Create PIX payment via Banco Cora API
   */
  static async createPixPayment(paymentData) {
    try {
      // Buscar dados da empresa
      const companyData = await CompanyService.getCompanyData()
      
      // Formatar payload com dados da empresa
      const payload = CompanyService.formatForPixPayment(companyData, paymentData)

      const data = await this.makeApiRequest(PAYMENT_API.ENDPOINTS.PIX, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          pixCode: data.url_pagamento,
          qrCodeUrl: data.url_pagamento
        }
      }
    } catch (error) {
      console.error('❌ PIX payment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create PIX payment with retry logic
   */
  static async createPixPaymentWithRetry(paymentData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.createPixPayment(paymentData)
        if (result.success) {
          return result
        }
        
        if (attempt === maxRetries) {
          return result
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message
          }
        }
        
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Create credit card payment via Mercado Pago API
   */
  static async processCreditCardPayment(paymentData) {
    try {
      const payload = {
        token: paymentData.token,
        payment_method_id: paymentData.paymentMethodId,
        issuer_id: paymentData.issuerId,
        installments: paymentData.installments || 1,
        transaction_amount: Math.round(paymentData.amount * 100), // Convert to centavos
        description: `Pagamento Mesa ${paymentData.tableNumber} - ItSells`,
        payer: {
          email: paymentData.customerEmail,
          identification: {
            type: paymentData.customerDocument.length === 11 ? "CPF" : "CNPJ",
            number: paymentData.customerDocument
          }
        },
        external_reference: paymentData.reference
      }

      const data = await this.makeApiRequest(PAYMENT_API.ENDPOINTS.CREDIT_CARD, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          message: data.message,
          mpPaymentId: data.mp_payment_id
        }
      }
    } catch (error) {
      console.error('❌ Credit card payment error:', error)
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento com cartão'
      }
    }
  }

  /**
   * Create credit card payment with retry logic
   */
  static async processCreditCardPaymentWithRetry(paymentData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.processCreditCardPayment(paymentData)
        if (result.success) {
          return result
        }
        
        if (attempt === maxRetries) {
          return result
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message
          }
        }
        
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Get payment data including status and QR code
   */
  static async checkPaymentStatus(paymentReference) {
    try {
      const data = await this.makeApiRequest(`${PAYMENT_API.ENDPOINTS.GET_PAYMENT_DATA}/${paymentReference}`, {
        method: 'GET'
      })
      
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          amount: parseFloat(data.valor) / 100, // Converter de centavos
          paid_at: data.status === 'approved' ? data.criado_em : null,
          reference: data.referencia_externa,
          pixCode: data.url_pagamento,
          qrCodeUrl: data.url_pagamento,
          customerName: data.nome,
          customerDocument: data.documento,
          paymentType: data.tipo,
          origin: data.origem,
          createdAt: data.criado_em
        }
      }
    } catch (error) {
      console.error('❌ Payment data fetch error:', error)
      return {
        success: false,
        error: error.message || 'Erro ao obter dados do pagamento'
      }
    }
  }

  /**
   * Generate unique payment reference
   */
  static generatePaymentReference(tableId) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `MESA${tableId}_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * Format amount for display
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  /**
   * Validate customer data for payment
   */
  static validateCustomerData(customerData) {
    const errors = []

    if (!customerData.name || customerData.name.trim().length < 2) {
      errors.push('Nome é obrigatório')
    }

    if (!customerData.email || !this.isValidEmail(customerData.email)) {
      errors.push('Email válido é obrigatório')
    }

    if (!customerData.document || !this.isValidCPF(customerData.document)) {
      errors.push('CPF válido é obrigatório')
    }

    if (!customerData.phone || customerData.phone.length < 10) {
      errors.push('Telefone válido é obrigatório')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate CPF format (basic validation)
   */
  static isValidCPF(cpf) {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Check if has 11 digits and is not all same digits
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
      return false
    }

    // Basic CPF validation algorithm
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false

    return true
  }

  /**
   * Configure webhook for automatic payment confirmation
   */
  static async configureWebhook(paymentId, orderId) {
    try {
      const webhookData = {
        payment_id: paymentId,
        order_id: orderId,
        callback_url: `${window.location.origin}/api/payment-webhook`,
        events: ['payment.approved', 'payment.rejected']
      }

      const data = await this.makeApiRequest('/webhook/configure', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      })

      return { success: true, data }
    } catch (error) {
      console.error('❌ Webhook configuration error:', error)
      return { success: false, error: error.message }
    }
  }
}
