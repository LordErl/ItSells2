import { supabase } from '../lib/supabase'

// WhatsApp AI Service for automated customer service and reservations
export class WhatsAppService {
  constructor() {
    this.aiEndpoint = import.meta.env.VITE_AI_ENDPOINT || 'http://localhost:8000'
    this.whatsappToken = import.meta.env.VITE_WHATSAPP_TOKEN
    this.webhookSecret = import.meta.env.VITE_WHATSAPP_WEBHOOK_SECRET
  }

  // Initialize WhatsApp webhook
  async initializeWebhook() {
    try {
      const response = await fetch(`${this.aiEndpoint}/whatsapp/webhook/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.whatsappToken}`
        },
        body: JSON.stringify({
          webhook_url: `${window.location.origin}/api/whatsapp/webhook`,
          verify_token: this.webhookSecret
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error initializing WhatsApp webhook:', error)
      return { success: false, error: error.message }
    }
  }

  // Process incoming WhatsApp message
  async processMessage(messageData) {
    try {
      const { from, body, timestamp } = messageData
      
      // Store message in database
      const { data: message, error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          phone_number: from,
          message_body: body,
          timestamp: new Date(timestamp * 1000).toISOString(),
          direction: 'incoming',
          status: 'received'
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Send to AI for processing
      const aiResponse = await this.sendToAI(body, from)
      
      if (aiResponse.success && aiResponse.reply) {
        await this.sendMessage(from, aiResponse.reply)
        
        // Handle specific actions
        if (aiResponse.action) {
          await this.handleAction(aiResponse.action, from, aiResponse.data)
        }
      }

      return { success: true, message }
    } catch (error) {
      console.error('Error processing WhatsApp message:', error)
      return { success: false, error: error.message }
    }
  }

  // Send message to AI for processing
  async sendToAI(message, phoneNumber) {
    try {
      // Get customer context
      const customerContext = await this.getCustomerContext(phoneNumber)
      
      const response = await fetch(`${this.aiEndpoint}/ai/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          phone_number: phoneNumber,
          context: customerContext,
          business_type: 'restaurant',
          language: 'pt-BR'
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error sending to AI:', error)
      return { 
        success: false, 
        error: error.message,
        reply: 'Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em alguns minutos.'
      }
    }
  }

  // Get customer context from database
  async getCustomerContext(phoneNumber) {
    try {
      // Get customer info
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            products (name, price)
          )
        `)
        .eq('customer_phone', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get recent reservations
      const { data: recentReservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_phone', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(3)

      return {
        customer,
        recent_orders: recentOrders || [],
        recent_reservations: recentReservations || [],
        preferences: customer?.preferences || {}
      }
    } catch (error) {
      console.error('Error getting customer context:', error)
      return {}
    }
  }

  // Send WhatsApp message
  async sendMessage(to, message) {
    try {
      const response = await fetch(`${this.aiEndpoint}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.whatsappToken}`
        },
        body: JSON.stringify({
          to,
          message
        })
      })

      const result = await response.json()

      // Store sent message in database
      await supabase
        .from('whatsapp_messages')
        .insert({
          phone_number: to,
          message_body: message,
          timestamp: new Date().toISOString(),
          direction: 'outgoing',
          status: result.success ? 'sent' : 'failed',
          message_id: result.message_id
        })

      return result
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle specific actions from AI
  async handleAction(action, phoneNumber, data) {
    try {
      switch (action) {
        case 'create_reservation':
          return await this.createReservation(phoneNumber, data)
        
        case 'check_menu':
          return await this.sendMenuInfo(phoneNumber, data)
        
        case 'create_order':
          return await this.createOrder(phoneNumber, data)
        
        case 'check_order_status':
          return await this.checkOrderStatus(phoneNumber, data)
        
        case 'cancel_reservation':
          return await this.cancelReservation(phoneNumber, data)
        
        default:
          console.log('Unknown action:', action)
          return { success: false, error: 'Unknown action' }
      }
    } catch (error) {
      console.error('Error handling action:', error)
      return { success: false, error: error.message }
    }
  }

  // Create reservation via WhatsApp
  async createReservation(phoneNumber, reservationData) {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          customer_phone: phoneNumber,
          date: reservationData.date,
          time: reservationData.time,
          party_size: reservationData.party_size,
          special_requests: reservationData.special_requests,
          status: 'pending',
          source: 'whatsapp'
        })
        .select()
        .single()

      if (error) throw error

      // Send confirmation message
      const confirmationMessage = `✅ Reserva criada com sucesso!

📅 Data: ${new Date(reservationData.date).toLocaleDateString()}
🕐 Horário: ${reservationData.time}
👥 Pessoas: ${reservationData.party_size}
🆔 Código: ${reservation.id}

Aguardamos você! Em caso de cancelamento, avise com antecedência.`

      await this.sendMessage(phoneNumber, confirmationMessage)

      return { success: true, reservation }
    } catch (error) {
      console.error('Error creating reservation:', error)
      
      const errorMessage = `❌ Não foi possível criar a reserva. 

Motivo: ${error.message}

Por favor, tente novamente ou entre em contato conosco.`
      
      await this.sendMessage(phoneNumber, errorMessage)
      return { success: false, error: error.message }
    }
  }

  // Send menu information
  async sendMenuInfo(phoneNumber, menuData) {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .eq('available', true)
        .order('category_id', { ascending: true })

      if (!products || products.length === 0) {
        await this.sendMessage(phoneNumber, 'Desculpe, nosso menu não está disponível no momento.')
        return { success: false, error: 'No products available' }
      }

      // Group products by category
      const groupedProducts = products.reduce((acc, product) => {
        const category = product.categories?.name || 'Outros'
        if (!acc[category]) acc[category] = []
        acc[category].push(product)
        return acc
      }, {})

      // Format menu message
      let menuMessage = '🍽️ *NOSSO MENU* 🍽️\n\n'
      
      Object.entries(groupedProducts).forEach(([category, items]) => {
        menuMessage += `*${category.toUpperCase()}*\n`
        items.forEach(item => {
          menuMessage += `• ${item.name} - R$ ${item.price.toFixed(2)}\n`
          if (item.description) {
            menuMessage += `  _${item.description}_\n`
          }
        })
        menuMessage += '\n'
      })

      menuMessage += '📱 Para fazer pedidos, me informe os itens desejados!'

      await this.sendMessage(phoneNumber, menuMessage)
      return { success: true }
    } catch (error) {
      console.error('Error sending menu info:', error)
      return { success: false, error: error.message }
    }
  }

  // Get conversation history
  async getConversationHistory(phoneNumber, limit = 10) {
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, messages: messages.reverse() }
    } catch (error) {
      console.error('Error getting conversation history:', error)
      return { success: false, error: error.message }
    }
  }

  // Update AI learning data
  async updateAILearning(conversationData) {
    try {
      const response = await fetch(`${this.aiEndpoint}/ai/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversationData)
      })

      return await response.json()
    } catch (error) {
      console.error('Error updating AI learning:', error)
      return { success: false, error: error.message }
    }
  }

  // Get analytics
  async getAnalytics(startDate, endDate) {
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      if (error) throw error

      const analytics = {
        total_messages: messages.length,
        incoming_messages: messages.filter(m => m.direction === 'incoming').length,
        outgoing_messages: messages.filter(m => m.direction === 'outgoing').length,
        unique_customers: [...new Set(messages.map(m => m.phone_number))].length,
        response_rate: 0
      }

      analytics.response_rate = analytics.incoming_messages > 0 
        ? (analytics.outgoing_messages / analytics.incoming_messages * 100).toFixed(2)
        : 0

      return { success: true, analytics }
    } catch (error) {
      console.error('Error getting analytics:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new WhatsAppService()

