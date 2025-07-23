import { supabase } from '../hooks/useSupabase'

// CORA Bank Integration Service
export class CoraService {
  constructor() {
    this.baseURL = import.meta.env.VITE_CORA_API_URL || 'https://api.cora.com.br'
    this.clientId = import.meta.env.VITE_CORA_CLIENT_ID
    this.clientSecret = import.meta.env.VITE_CORA_CLIENT_SECRET
    this.accessToken = null
    this.tokenExpiry = null
  }

  // Authenticate with CORA API
  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return { success: true, token: this.accessToken }
      }

      const response = await fetch(`${this.baseURL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'payments pix transfers'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000)

      return { success: true, token: this.accessToken }
    } catch (error) {
      console.error('CORA Authentication error:', error)
      return { success: false, error: error.message }
    }
  }

  // Create PIX payment
  async createPixPayment(paymentData) {
    try {
      const auth = await this.authenticate()
      if (!auth.success) throw new Error(auth.error)

      const pixData = {
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        description: paymentData.description || 'Pagamento It$ell\'s',
        external_id: paymentData.external_id || `itsells_${Date.now()}`,
        expiration_date: paymentData.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payer: {
          name: paymentData.payer_name,
          document: paymentData.payer_document,
          email: paymentData.payer_email,
          phone: paymentData.payer_phone
        },
        additional_info: {
          establishment: paymentData.establishment_name || 'It$ell\'s Restaurant',
          table: paymentData.table_number,
          order_id: paymentData.order_id
        }
      }

      const response = await fetch(`${this.baseURL}/pix/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(pixData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'PIX payment creation failed')
      }

      // Store payment in database
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          external_id: result.id,
          payment_method: 'pix',
          amount: paymentData.amount,
          status: 'pending',
          qr_code: result.qr_code,
          qr_code_base64: result.qr_code_base64,
          pix_key: result.pix_key,
          expiration_date: result.expiration_date,
          customer_id: paymentData.customer_id,
          order_id: paymentData.order_id,
          provider: 'cora',
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
          qr_code: result.qr_code,
          qr_code_base64: result.qr_code_base64,
          amount: paymentData.amount,
          status: 'pending',
          expiration_date: result.expiration_date
        }
      }
    } catch (error) {
      console.error('Error creating PIX payment:', error)
      return { success: false, error: error.message }
    }
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    try {
      const auth = await this.authenticate()
      if (!auth.success) throw new Error(auth.error)

      const response = await fetch(`${this.baseURL}/pix/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to check payment status')
      }

      // Update payment status in database
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: result.status,
          paid_at: result.paid_at,
          provider_data: result
        })
        .eq('external_id', paymentId)

      if (updateError) {
        console.error('Error updating payment status:', updateError)
      }

      return {
        success: true,
        payment: {
          id: result.id,
          status: result.status,
          amount: result.amount / 100, // Convert from cents
          paid_at: result.paid_at,
          payer: result.payer
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      return { success: false, error: error.message }
    }
  }

  // Process webhook
  async processWebhook(webhookData, signature) {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(webhookData, signature)
      if (!isValid) {
        throw new Error('Invalid webhook signature')
      }

      const { event, data } = webhookData

      // Store webhook in database
      await supabase
        .from('webhook_logs')
        .insert({
          provider: 'cora',
          event_type: event,
          data: webhookData,
          processed_at: new Date().toISOString()
        })

      switch (event) {
        case 'pix.payment.approved':
          return await this.handlePaymentApproved(data)
        
        case 'pix.payment.cancelled':
          return await this.handlePaymentCancelled(data)
        
        case 'pix.payment.expired':
          return await this.handlePaymentExpired(data)
        
        default:
          console.log('Unhandled webhook event:', event)
          return { success: true, message: 'Event logged but not processed' }
      }
    } catch (error) {
      console.error('Error processing CORA webhook:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle payment approved
  async handlePaymentApproved(paymentData) {
    try {
      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'approved',
          paid_at: paymentData.paid_at,
          provider_data: paymentData
        })
        .eq('external_id', paymentData.id)
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update order status if applicable
      if (payment.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            paid_at: paymentData.paid_at
          })
          .eq('id', payment.order_id)
      }

      // Update customer account
      if (payment.customer_id) {
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
        }
      }

      // Send notification (if WhatsApp service is available)
      if (paymentData.payer?.phone) {
        // This would integrate with WhatsApp service
        console.log('Payment approved notification should be sent to:', paymentData.payer.phone)
      }

      return { success: true, payment }
    } catch (error) {
      console.error('Error handling payment approved:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle payment cancelled
  async handlePaymentCancelled(paymentData) {
    try {
      await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          provider_data: paymentData
        })
        .eq('external_id', paymentData.id)

      return { success: true }
    } catch (error) {
      console.error('Error handling payment cancelled:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle payment expired
  async handlePaymentExpired(paymentData) {
    try {
      await supabase
        .from('payments')
        .update({
          status: 'expired',
          expired_at: new Date().toISOString(),
          provider_data: paymentData
        })
        .eq('external_id', paymentData.id)

      return { success: true }
    } catch (error) {
      console.error('Error handling payment expired:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(payload, signature) {
    try {
      // This would implement CORA's signature verification
      // For now, we'll return true (implement proper verification in production)
      return true
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Create bank transfer
  async createTransfer(transferData) {
    try {
      const auth = await this.authenticate()
      if (!auth.success) throw new Error(auth.error)

      const response = await fetch(`${this.baseURL}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          amount: Math.round(transferData.amount * 100),
          description: transferData.description,
          recipient: {
            bank_code: transferData.recipient.bank_code,
            agency: transferData.recipient.agency,
            account: transferData.recipient.account,
            account_type: transferData.recipient.account_type,
            document: transferData.recipient.document,
            name: transferData.recipient.name
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Transfer creation failed')
      }

      return { success: true, transfer: result }
    } catch (error) {
      console.error('Error creating transfer:', error)
      return { success: false, error: error.message }
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const auth = await this.authenticate()
      if (!auth.success) throw new Error(auth.error)

      const response = await fetch(`${this.baseURL}/accounts/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get account balance')
      }

      return {
        success: true,
        balance: {
          available: result.available_balance / 100,
          blocked: result.blocked_balance / 100,
          total: result.total_balance / 100
        }
      }
    } catch (error) {
      console.error('Error getting account balance:', error)
      return { success: false, error: error.message }
    }
  }

  // Get transaction history
  async getTransactionHistory(startDate, endDate, limit = 50) {
    try {
      const auth = await this.authenticate()
      if (!auth.success) throw new Error(auth.error)

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: limit.toString()
      })

      const response = await fetch(`${this.baseURL}/transactions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get transaction history')
      }

      return {
        success: true,
        transactions: result.transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount / 100,
          description: tx.description,
          date: tx.created_at,
          status: tx.status
        }))
      }
    } catch (error) {
      console.error('Error getting transaction history:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new CoraService()

