import { PAYMENT_API, PAYMENT_METHODS } from '../lib'

export class PaymentAPI {
  
  /**
   * Create PIX payment via Cora API
   */
  static async createPixPayment(paymentData) {
    try {
      const payload = {
        nome: paymentData.customerName,
        email: paymentData.customerEmail,
        documento: paymentData.customerDocument,
        telefone: paymentData.customerPhone,
        endereco: {
          street: "Rua Principal",
          number: "123",
          district: "Centro",
          city: "São Paulo",
          state: "SP",
          complement: "",
          zip_code: "01000-000"
        },
        amount: Math.round(paymentData.amount * 100), // Convert to centavos
        descricao: `Pagamento Mesa ${paymentData.tableNumber} - ItSells`,
        referencia: paymentData.reference,
        vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        tipo: "pix"
      }

      const response = await fetch(`${PAYMENT_API.BASE_URL}${PAYMENT_API.ENDPOINTS.PIX}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erro na API de pagamento')
      }

      const data = await response.json()
      
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
      return {
        success: false,
        error: error.message || 'Erro ao criar pagamento PIX'
      }
    }
  }

  /**
   * Create credit card payment via Mercado Pago API
   */
  static async createCardPayment(paymentData) {
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
            type: "CPF",
            number: paymentData.customerDocument
          }
        },
        external_reference: paymentData.reference
      }

      const response = await fetch(`${PAYMENT_API.BASE_URL}${PAYMENT_API.ENDPOINTS.CREDIT_CARD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erro na API de pagamento')
      }

      const data = await response.json()
      
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
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento com cartão'
      }
    }
  }

  /**
   * Check payment status (polling)
   */
  static async checkPaymentStatus(paymentReference, paymentType) {
    try {
      // For now, we'll implement a simple status check
      // In a real implementation, you might have a specific endpoint for this
      const endpoint = paymentType === PAYMENT_METHODS.PIX 
        ? PAYMENT_API.ENDPOINTS.PIX 
        : PAYMENT_API.ENDPOINTS.CREDIT_CARD

      const response = await fetch(`${PAYMENT_API.BASE_URL}/status/${paymentReference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento')
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          status: data.status,
          paid: data.status === 'approved'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao verificar status do pagamento'
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

      const response = await fetch(`${PAYMENT_API.BASE_URL}/webhook/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      })

      const data = await response.json()
      return { success: response.ok, data }
    } catch (error) {
      console.error('❌ Webhook configuration error:', error)
      return { success: false, error: error.message }
    }
  }
}
