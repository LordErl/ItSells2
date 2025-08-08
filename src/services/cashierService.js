import { supabase, TABLES, ORDER_STATUS, PAYMENT_STATUS, ORDER_ITEM_STATUS, handleError, formatDate, parseDate, getTables } from '../lib'

export class CashierService {
  
  /**
   * Get all orders for a specific table
   */
  static async getTableOrders(tableId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items(
            *,
            products(
              id,
              name,
              price
            )
          ),
          users(
            id,
            name
          )
        `)
        .eq('table_id', tableId)
        .in('status', [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY])
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Calculate table total with optional 10% service charge
   */
  static calculateTableTotal(orders, includeServiceCharge = false) {
    try {
      let subtotal = 0

      orders.forEach(order => {
        order.order_items.forEach(item => {
          subtotal += item.quantity * item.products.price
        })
      })

      const serviceCharge = includeServiceCharge ? subtotal * 0.1 : 0
      const total = subtotal + serviceCharge

      return {
        success: true,
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          serviceCharge: parseFloat(serviceCharge.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          includeServiceCharge
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao calcular total da mesa'
      }
    }
  }

  /**
   * Get occupied tables with pending orders
   */
  static async getOccupiedTablesForPayment() {
    try {
      console.log('🔍 CashierService: Loading occupied tables for payment...')
      
      // First check if we can connect to the database
      const { data: testConnection, error: connectionError } = await supabase
        .from(TABLES.ORDERS)
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('❌ Database connection error:', connectionError)
        throw new Error(`Erro de conexão com o banco de dados: ${connectionError.message}`)
      }
      
      console.log('✅ Database connection successful')

      // Get orders that are not paid and not cancelled
      console.log('🔍 Looking for unpaid orders...')
      const { data: orders, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          id,
          table_id,
          status,
          paid,
          created_at,
          users!inner(
            id,
            name
          ),
          order_items!inner(
            id,
            quantity,
            price,
            observations,
            status,
            products(
              id,
              name
            )
          )
        `)
        .eq('paid', false)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Query error:', error)
        throw new Error(`Erro na consulta: ${error.message}`)
      }

      console.log(`📋 Found ${orders?.length || 0} unpaid orders`)
      
      if (!orders || orders.length === 0) {
        console.log('ℹ️ No unpaid orders found')
        return {
          customers: [],
          tables: [],
          defaultView: 'customers'
        }
      }

      // Group orders by customer and table
      const customersMap = new Map()
      const tablesMap = new Map()
      
      orders.forEach(order => {
        try {
          // Check if all order items are delivered
          const hasItems = order.order_items && order.order_items.length > 0
          const allItemsDelivered = hasItems && 
            order.order_items.every(item => item.status === ORDER_ITEM_STATUS.DELIVERED)
          
          console.log(`📦 Order ${order.id}: ${order.order_items?.length || 0} items, all delivered: ${allItemsDelivered}`)
          
          if (hasItems && allItemsDelivered) {
            const customerId = order.users?.id
            const customerName = order.users?.name || 'Cliente Sem Nome'
            const tableId = order.table_id || 0 // Default table for customers without table
            const tableNumber = tableId
            
            // Group by customer (individual bills)
            if (!customersMap.has(customerId)) {
              customersMap.set(customerId, {
                id: customerId,
                name: customerName,
                table_id: tableId,
                table_number: tableNumber,
                orders: [],
                type: 'customer'
              })
            }
            
            const customer = customersMap.get(customerId)
            customer.orders.push({
              id: order.id,
              created_at: order.created_at,
              order_items: order.order_items
            })
            
            // Also group by table
            if (!tablesMap.has(tableId)) {
              tablesMap.set(tableId, {
                id: `table_${tableId}`,
                number: tableNumber,
                customers: [],
                type: 'table'
              })
            }
            
            const table = tablesMap.get(tableId)
            if (!table.customers.find(c => c.id === customerId)) {
              table.customers.push({
                id: customerId,
                name: customerName
              })
            }
          }
        } catch (orderError) {
          console.warn(`⚠️ Error processing order ${order.id}:`, orderError)
        }
      })

      const customers = Array.from(customersMap.values())
      const tables = Array.from(tablesMap.values())
      
      console.log(`👥 Found ${customers.length} customers with pending bills`)
      console.log(`🍽️ Found ${tables.length} tables with pending bills`)

      return {
        customers,
        tables,
        defaultView: 'customers'
      }
      
    } catch (error) {
      console.error('❌ CashierService.getOccupiedTablesForPayment error:', error)
      throw error // Re-throw to be handled by the component
    }
  }

  /**
   * Create payment request record
   */
  static async createPaymentRequest(tableOrCustomerId, totalAmount, paymentMethod, includeServiceCharge = false, isCustomerPayment = false) {
    try {
      const paymentData = {
        amount: totalAmount,
        payment_method: paymentMethod,
        service_charge_included: includeServiceCharge,
        status: PAYMENT_STATUS.PENDING,
        created_at: new Date().toISOString()
      }

      // Set either customer_id or table_id based on payment type
      if (isCustomerPayment) {
        paymentData.customer_id = tableOrCustomerId
        paymentData.table_id = null // Explicitly set to null for customer payments
      } else {
        paymentData.table_id = tableOrCustomerId
        paymentData.customer_id = null // Explicitly set to null for table payments
      }

      console.log('💳 Creating payment request:', paymentData)

      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert(paymentData)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId, status, externalReference = null) {
    try {
      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      }

      if (externalReference) {
        updateData.external_reference = externalReference
      }

      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Close table after successful payment
   */
  static async closeTable(tableId, paymentId) {
    try {
      // Update all orders for this table to delivered
      const { error: ordersError } = await supabase
        .from(TABLES.ORDERS)
        .update({ 
          status: ORDER_STATUS.DELIVERED,
          updated_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .in('status', [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY])

      if (ordersError) throw ordersError

      // Update table status to available
      const { error: tableError } = await supabase
        .from(TABLES.TABLES)
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)

      if (tableError) throw tableError

      // Update payment as completed
      const { error: paymentError } = await supabase
        .from(TABLES.PAYMENTS)
        .update({ 
          status: PAYMENT_STATUS.APPROVED,
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (paymentError) throw paymentError

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select(`
          *,
          tables(
            id,
            number
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Calculate bill total for individual customer or table
   */
  static async calculateBillTotal(billData, includeServiceCharge = false) {
    try {
      let subtotal = 0
      let couvert = 0
      
      // Calculate subtotal from orders
      if (billData.orders && billData.orders.length > 0) {
        billData.orders.forEach(order => {
          if (order.order_items && order.order_items.length > 0) {
            order.order_items.forEach(item => {
              // Use the price stored in order_items table
              subtotal += item.quantity * item.price
            })
          }
        })
      }

      // Calculate couvert (if applicable)
      if (billData.type === 'customer') {
        // For individual customer, couvert is per person
        const couvertRate = await this.getDailyCouvertRate()
        couvert = couvertRate
      } else if (billData.type === 'table') {
        // For table billing, couvert is per customer at the table
        const couvertRate = await this.getDailyCouvertRate()
        const customerCount = billData.customers?.length || 0
        couvert = couvertRate * customerCount
      }

      // Calculate service charge (10% of subtotal)
      const serviceCharge = includeServiceCharge ? subtotal * 0.1 : 0

      // Calculate total
      const total = subtotal + couvert + serviceCharge

      return {
        success: true,
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          couvert: parseFloat(couvert.toFixed(2)),
          serviceCharge: parseFloat(serviceCharge.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          includeServiceCharge
        }
      }
    } catch (error) {
      console.error('Error calculating bill total:', error)
      return {
        success: false,
        error: 'Erro ao calcular total da conta'
      }
    }
  }

  /**
   * Get daily couvert rate
   */
  static async getDailyCouvertRate() {
    try {
      const { data, error } = await supabase
        .from('daily_config')
        .select('couvert')
        .single()

      if (error) {
        console.error('Error loading couvert rate:', error)
        return 0
      }

      return data.couvert || 0
    } catch (error) {
      console.error('Error loading couvert rate:', error)
      return 0
    }
  }

  /**
   * Update user PIX data strategically on first payment
   */
  static async updateUserPixData(userId, pixData) {
    try {
      // First check if user already has PIX data
      const { data: currentUser, error: fetchError } = await supabase
        .from(TABLES.USERS)
        .select('pix_name, pix_email, pix_cpf, pix_phone')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching user data:', fetchError)
        return { success: false, error: 'Erro ao buscar dados do usuário' }
      }

      // Only update if PIX data is not already present
      const needsUpdate = !currentUser.pix_name || !currentUser.pix_email || 
                         !currentUser.pix_cpf || !currentUser.pix_phone

      if (needsUpdate) {
        console.log('🔄 Updating user PIX data for first-time payment...')
        
        const updateData = {}
        
        // Only update fields that are empty and provided in pixData
        if (!currentUser.pix_name && pixData.name) {
          updateData.pix_name = pixData.name
        }
        if (!currentUser.pix_email && pixData.email) {
          updateData.pix_email = pixData.email
        }
        if (!currentUser.pix_cpf && pixData.cpf) {
          updateData.pix_cpf = pixData.cpf
        }
        if (!currentUser.pix_phone && pixData.phone) {
          updateData.pix_phone = pixData.phone
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString()
          
          const { error: updateError } = await supabase
            .from(TABLES.USERS)
            .update(updateData)
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating user PIX data:', updateError)
            return { success: false, error: 'Erro ao atualizar dados PIX do usuário' }
          }

          console.log('✅ User PIX data updated successfully:', updateData)
        }
      } else {
        console.log('ℹ️ User already has complete PIX data, skipping update')
      }

      return { success: true }
    } catch (error) {
      console.error('Error in updateUserPixData:', error)
      return { success: false, error: 'Erro ao processar dados PIX do usuário' }
    }
  }

  /**
   * Get user PIX data for payment form pre-fill
   */
  static async getUserPixData(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('pix_name, pix_email, pix_cpf, pix_phone')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user PIX data:', error)
        return { success: false, error: 'Erro ao buscar dados PIX do usuário' }
      }

      return {
        success: true,
        data: {
          name: data.pix_name || '',
          email: data.pix_email || '',
          cpf: data.pix_cpf || '',
          phone: data.pix_phone || ''
        }
      }
    } catch (error) {
      console.error('Error in getUserPixData:', error)
      return { success: false, error: 'Erro ao buscar dados PIX do usuário' }
    }
  }
}
