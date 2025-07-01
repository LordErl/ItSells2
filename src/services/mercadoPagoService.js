import { supabase } from '../lib/supabase'

// Mercado Pago Integration Service
export class MercadoPagoService {
  constructor() {
    this.baseURL = 'https://api.mercadopago.com'
    this.accessToken = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN
    this.publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY
    this.webhookSecret = import.meta.env.VITE_MERCADO_PAGO_WEBHOOK_SECRET
  }

  // Create payment preference
  async createPreference(paymentData) {
    try {
      const preferenceData = {
        items: [
          {
            id: paymentData.order_id || `itsells_${Date.now()}`,
            title: paymentData.title || 'Pedido It$ell\'s',
            description: paymentData.description || 'Pagamento de pedido',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: paymentData.amount
          }
        ],
        payer: {
          name: paymentData.payer_name,
          surname: paymentData.payer_surname || '',
          email: paymentData.payer_email,
          phone: {
            area_code: paymentData.payer_phone?.substring(0, 2) || '11',
            number: paymentData.payer_phone?.substring(2) || '999999999'
          },
          identification: {
            type: 'CPF',
            number: paymentData.payer_document
          }
        },
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        notification_url: `${window.location.origin}/api/mercadopago/webhook`,
        external_reference: paymentData.external_reference || `itsells_${Date.now()}`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        additional_info: {
          items: paymentData.items || [],
          payer: {
            first_name: paymentData.payer_name,
            last_name: paymentData.payer_surname || '',
            phone: {
              area_code: paymentData.payer_phone?.substring(0, 2) || '11',
              number: paymentData.payer_phone?.substring(2) || '999999999'
            }
          },
          shipments: {
            receiver_address: {
              zip_code: paymentData.zip_code || '01310-100',
              street_name: paymentData.establishment_address || 'Estabelecimento It$ell\'s',
              street_number: paymentData.establishment_number || '123'
            }
          }
        }
      }

      const response = await fetch(`${this.baseURL}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(preferenceData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create payment preference')
      }

      // Store payment in database
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          external_id: result.id,
          payment_method: 'mercado_pago',
          amount: paymentData.amount,
          status: 'pending',
          checkout_url: result.init_point,
          sandbox_url: result.sandbox_init_point,
          customer_id: paymentData.customer_id,
          order_id: paymentData.order_id,
          provider: 'mercado_pago',
          provider_data: result
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        success: true,
        payment: {
          id: payment.id,
          preference_id: result.id,
          checkout_url: result.init_point,
          sandbox_url: result.sandbox_init_point,
          amount: paymentData.amount,
          status: 'pending'
        }
      }
    } catch (error) {
      console.error('Error creating Mercado Pago preference:', error)
      return { success: false, error: error.message }
    }
  }

  // Create PIX payment
  async createPixPayment(paymentData) {
    try {
      const pixData = {
        transaction_amount: paymentData.amount,
        description: paymentData.description || 'Pagamento It$ell\'s PIX',
        payment_method_id: 'pix',
        payer: {
          email: paymentData.payer_email,
          first_name: paymentData.payer_name,
          last_name: paymentData.payer_surname || '',
          identification: {
            type: 'CPF',
            number: paymentData.payer_document
          }
        },
        notification_url: `${window.location.origin}/api/mercadopago/webhook`,
        external_reference: paymentData.external_reference || `itsells_pix_${Date.now()}`,
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        additional_info: {
          items: paymentData.items || [],
          payer: {
            first_name: paymentData.payer_name,
            last_name: paymentData.payer_surname || ''
          }
        }
      }

      const response = await fetch(`${this.baseURL}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(pixData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create PIX payment')
      }

      // Store payment in database
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          external_id: result.id.toString(),
          payment_method: 'pix',
          amount: paymentData.amount,
          status: result.status,
          qr_code: result.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          expiration_date: result.date_of_expiration,
          customer_id: paymentData.customer_id,
          order_id: paymentData.order_id,
          provider: 'mercado_pago',
          provider_data: result
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        success: true,
        payment: {
          id: payment.id,
          external_id: result.id,
          qr_code: result.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          amount: paymentData.amount,
          status: result.status,
          expiration_date: result.date_of_expiration
        }
      }
    } catch (error) {
      console.error('Error creating Mercado Pago PIX payment:', error)
      return { success: false, error: error.message }
    }
  }

  // Create card payment
  async createCardPayment(paymentData) {
    try {
      const cardData = {
        transaction_amount: paymentData.amount,
        token: paymentData.card_token,
        description: paymentData.description || 'Pagamento It$ell\'s Cartão',
        installments: paymentData.installments || 1,
        payment_method_id: paymentData.payment_method_id,
        issuer_id: paymentData.issuer_id,
        payer: {
          email: paymentData.payer_email,
          identification: {
            type: 'CPF',
            number: paymentData.payer_document
          }
        },
        notification_url: `${window.location.origin}/api/mercadopago/webhook`,
        external_reference: paymentData.external_reference || `itsells_card_${Date.now()}`,
        additional_info: {
          items: paymentData.items || [],
          payer: {
            first_name: paymentData.payer_name,
            last_name: paymentData.payer_surname || '',
            phone: {
              area_code: paymentData.payer_phone?.substring(0, 2) || '11',
              number: paymentData.payer_phone?.substring(2) || '999999999'
            }
          }
        }
      }

      const response = await fetch(`${this.baseURL}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(cardData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create card payment')
      }

      // Store payment in database
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          external_id: result.id.toString(),
          payment_method: 'card',
          amount: paymentData.amount,
          status: result.status,
          installments: paymentData.installments || 1,
          customer_id: paymentData.customer_id,
          order_id: paymentData.order_id,
          provider: 'mercado_pago',
          provider_data: result
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        success: true,
        payment: {
          id: payment.id,
          external_id: result.id,
          status: result.status,
          status_detail: result.status_detail,
          amount: paymentData.amount,
          installments: paymentData.installments || 1
        }
      }
    } catch (error) {
      console.error('Error creating Mercado Pago card payment:', error)
      return { success: false, error: error.message }
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseURL}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get payment status')
      }

      // Update payment status in database
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: result.status,
          status_detail: result.status_detail,
          provider_data: result
        })
        .eq('external_id', paymentId.toString())

      if (updateError) {
        console.error('Error updating payment status:', updateError)
      }

      return {
        success: true,
        payment: {
          id: result.id,
          status: result.status,
          status_detail: result.status_detail,
          amount: result.transaction_amount,
          date_approved: result.date_approved,
          payer: result.payer
        }
      }
    } catch (error) {
      console.error('Error getting payment status:', error)
      return { success: false, error: error.message }
    }
  }

  // Process webhook
  async processWebhook(webhookData) {
    try {
      const { action, data, type } = webhookData

      // Store webhook in database
      await supabase
        .from('webhook_logs')
        .insert({
          provider: 'mercado_pago',
          event_type: action,
          data: webhookData,
          processed_at: new Date().toISOString()
        })

      if (type === 'payment') {
        const paymentId = data.id
        const paymentInfo = await this.getPaymentStatus(paymentId)
        
        if (paymentInfo.success) {
          return await this.handlePaymentUpdate(paymentInfo.payment)
        }
      }

      return { success: true, message: 'Webhook processed' }
    } catch (error) {
      console.error('Error processing Mercado Pago webhook:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle payment update
  async handlePaymentUpdate(paymentData) {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('external_id', paymentData.id.toString())
        .single()

      if (paymentError) {
        console.error('Payment not found:', paymentData.id)
        return { success: false, error: 'Payment not found' }
      }

      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          paid_at: paymentData.date_approved,
          provider_data: paymentData
        })
        .eq('id', payment.id)

      // Handle approved payments
      if (paymentData.status === 'approved') {
        // Update order status if applicable
        if (payment.order_id) {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              paid_at: paymentData.date_approved
            })
            .eq('id', payment.order_id)
        }

        // Update customer account
        if (payment.customer_id) {
          // Primeiro, atualiza o saldo da conta
          const { data: account } = await supabase
            .from('customer_accounts')
            .select('current_bill')
            .eq('customer_id', payment.customer_id)
            .single()

          if (account) {
            const newBill = Math.max(0, account.current_bill - payment.amount)
            await supabase
              .from('customer_accounts')
              .update({ current_bill: newBill })
              .eq('customer_id', payment.customer_id)

            // Importa o StoreService para atualizar o total_gasto e visit_count
            const { StoreService } = await import('./storeService')
            await StoreService.updateCustomerAccount(payment.customer_id, payment.amount)
          }
        }

        // Send notification (if WhatsApp service is available)
        console.log('Payment approved notification should be sent for payment:', payment.id)
      }

      return { success: true, payment }
    } catch (error) {
      console.error('Error handling payment update:', error)
      return { success: false, error: error.message }
    }
  }

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await fetch(`${this.baseURL}/v1/payment_methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get payment methods')
      }

      return {
        success: true,
        payment_methods: result.filter(method => method.status === 'active')
      }
    } catch (error) {
      console.error('Error getting payment methods:', error)
      return { success: false, error: error.message }
    }
  }

  // Get installments
  async getInstallments(amount, paymentMethodId) {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        payment_method_id: paymentMethodId
      })

      const response = await fetch(`${this.baseURL}/v1/payment_methods/installments?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get installments')
      }

      return {
        success: true,
        installments: result[0]?.payer_costs || []
      }
    } catch (error) {
      console.error('Error getting installments:', error)
      return { success: false, error: error.message }
    }
  }

  // Create card token (for frontend use)
  async createCardToken(cardData) {
    try {
      const response = await fetch(`${this.baseURL}/v1/card_tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.publicKey}`
        },
        body: JSON.stringify({
          card_number: cardData.card_number,
          expiration_month: cardData.expiration_month,
          expiration_year: cardData.expiration_year,
          security_code: cardData.security_code,
          cardholder: {
            name: cardData.cardholder_name,
            identification: {
              type: 'CPF',
              number: cardData.cardholder_document
            }
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create card token')
      }

      return {
        success: true,
        token: result.id,
        first_six_digits: result.first_six_digits,
        last_four_digits: result.last_four_digits
      }
    } catch (error) {
      console.error('Error creating card token:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new MercadoPagoService()
