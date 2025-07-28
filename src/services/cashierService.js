import { supabase } from '../lib/supabase'
import { TABLES, ORDER_STATUS, PAYMENT_STATUS, dbHelpers } from '../lib/constants'

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

      // Group by table and get unique tables
      const tablesMap = new Map()
      data.forEach(order => {
        if (!tablesMap.has(order.table_id)) {
          tablesMap.set(order.table_id, {
            id: order.table_id,
            number: order.table_id, // Use table_id as number since we can't join tables
            customers: []
          })
        }
        
        const table = tablesMap.get(order.table_id)
        if (!table.customers.find(c => c.id === order.users.id)) {
          table.customers.push({
            id: order.users.id,
            name: order.users.name
          })
        }
      })

      return { 
        success: true, 
        data: Array.from(tablesMap.values()) 
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
}
