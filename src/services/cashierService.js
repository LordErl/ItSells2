import { supabase } from '../lib/supabase'
import { TABLES, ORDER_STATUS, PAYMENT_STATUS, dbHelpers, ORDER_ITEM_STATUS } from '../lib/constants'

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
        error: dbHelpers.handleError(error)
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
      // First, let's debug what we have in the orders table
      console.log('🔍 Debugging orders table...')
      
      const { data: allOrders, error: debugError } = await supabase
        .from(TABLES.ORDERS)
        .select('*')
        .limit(5)
      
      if (debugError) {
        console.error('Debug error:', debugError)
      } else {
        console.log('📊 Sample orders:', allOrders)
      }

      console.log('🔍 Looking for delivered orders with paid=false...')

      // Instead of looking for orders with status DELIVERED,
      // let's look for orders that have all items delivered but not paid
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          id,
          table_id,
          status,
          paid,
          users(
            id,
            name
          ),
          order_items(
            id,
            status
          )
        `)
        .eq('paid', false)
        .not('status', 'eq', 'cancelled')
        .order('table_id')

      if (error) throw error

      console.log('📋 Query result:', data)
      console.log('📋 Query result length:', data?.length)

      // Group by customer (default) or by table (optional)
      const customersMap = new Map()
      const tablesMap = new Map()
      
      data.forEach(order => {
        // Check if all order items are delivered
        const allItemsDelivered = order.order_items.length > 0 && 
          order.order_items.every(item => item.status === ORDER_ITEM_STATUS.DELIVERED)
        
        if (allItemsDelivered) {
          const customerId = order.users?.id
          const customerName = order.users?.name || 'Cliente'
          const tableId = order.table_id || 0 // Mesa padrão para clientes sem mesa
          const tableNumber = tableId === 0 ? 0 : tableId // Mesa 0 para casos sem mesa
          
          // Group by customer (individual bills)
          if (!customersMap.has(customerId)) {
            customersMap.set(customerId, {
              id: customerId,
              name: customerName,
              table_id: tableId,
              table_number: tableNumber,
              orders: [],
              totalAmount: 0,
              type: 'customer'
            })
          }
          
          const customer = customersMap.get(customerId)
          customer.orders.push({
            id: order.id,
            order_items: order.order_items
          })
          
          // Also group by table for optional table billing
          if (!tablesMap.has(tableId)) {
            tablesMap.set(tableId, {
              id: tableId,
              number: tableNumber,
              customers: [],
              totalAmount: 0,
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
      })

      const customers = Array.from(customersMap.values())
      const tables = Array.from(tablesMap.values())
      
      console.log('👥 Customers with bills:', customers)
      console.log('🍽️ Tables with bills:', tables)

      return {
        customers,
        tables,
        defaultView: 'customers' // Default to individual customer bills
      }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  /**
   * Create payment request record
   */
  static async createPaymentRequest(tableId, totalAmount, paymentMethod, includeServiceCharge = false) {
    try {
      const paymentData = {
        table_id: tableId,
        amount: totalAmount,
        payment_method: paymentMethod,
        service_charge_included: includeServiceCharge,
        status: PAYMENT_STATUS.PENDING,
        created_at: new Date().toISOString()
      }

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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_config')
        .select('couvert_rate')
        .eq('date', today)
        .single()

      if (error) {
        // If no config for today, return 0 (no couvert)
        return 0
      }

      return data.couvert_rate || 0
    } catch (error) {
      console.error('Error loading couvert rate:', error)
      return 0
    }
  }
}
