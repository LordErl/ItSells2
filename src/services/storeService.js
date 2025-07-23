import { supabase } from '../hooks/useSupabase'
import { TABLES, ORDER_STATUS, PAYMENT_STATUS, TABLE_STATUS, dbHelpers } from '../lib/supabase'

export class StoreService {
  // ===== PRODUCTS =====
  
  // Get all products
  static async getProducts() {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select(`
          *,
          categories (
            id,
            name,
            description
          )
        `)
        .eq('active', true)
        .order('name')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Get products by category
  static async getProductsByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('category_id', categoryId)
        .eq('active', true)
        .eq('available', true)
        .order('name')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Create product
  static async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([{
          ...productData,
          created_at: new Date().toISOString(),
          active: true
        }])
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

  // Update product
  static async updateProduct(productId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
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

  // Delete product (soft delete)
  static async deleteProduct(productId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
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

  // ===== CATEGORIES =====
  
  // Get all categories
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // ===== ORDERS =====
  
  // Create order
  static async createOrder(orderData) {
    try {
      const { customer_id, table_id, items, observations } = orderData

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .insert([{
          customer_id,
          table_id,
          status: ORDER_STATUS.PENDING,
          total,
          observations,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        observations: item.observations
      }))

      const { error: itemsError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update table status if applicable
      if (table_id) {
        await this.updateTableStatus(table_id, TABLE_STATUS.OCCUPIED, order.id)
      }

      // Get complete order with items
      const completeOrder = await this.getOrderById(order.id)

      return completeOrder
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Get order by ID
  static async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          users (
            id,
            name,
            cpf
          ),
          tables!orders_table_id_fkey (
            id,
            number,
            capacity
          ),
          order_items (
            *,
            products (
              id,
              name,
              description,
              image
            )
          )
        `)
        .eq('id', orderId)
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

  // Get orders by customer
  static async getOrdersByCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image
            )
          )
        `)
        .eq('customer_id', customerId)
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

  // Get active orders
  static async getActiveOrders() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image
            )
          ),
          tables!orders_table_id_fkey (
            id,
            number
          ),
          users!orders_customer_id_fkey (
            id,
            name
          )
        `)
        .in('status', [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY
        ])
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

  // Get all orders (for staff/admin)
  static async getAllOrders(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          users (
            id,
            name,
            cpf
          ),
          tables (
            id,
            number
          ),
          order_items (
            *,
            products (
              name,
              image
            )
          )
        `)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.table_id) {
        query = query.eq('table_id', filters.table_id)
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
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

  // ===== TABLES =====
  
  // Get all tables
  static async getTables() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TABLES)
        .select(`
          *,
          orders!fk_tables_current_order (
            id,
            status,
            total,
            created_at
          )
        `)
        .order('number')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update table status
  static async updateTableStatus(tableId, status, currentOrderId = null) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TABLES)
        .update({
          status,
          current_order_id: currentOrderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
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

  // ===== PAYMENTS =====
  
  // Process payment
  static async processPayment(paymentData) {
    try {
      const { order_id, customer_id, method, amount } = paymentData

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from(TABLES.PAYMENTS)
        .insert([{
          order_id,
          customer_id,
          method,
          amount,
          status: PAYMENT_STATUS.PROCESSING,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (paymentError) throw paymentError

      // Simulate payment processing
      const paymentResult = await this.simulatePaymentProcessing(payment)

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from(TABLES.PAYMENTS)
        .update({
          status: paymentResult.success ? PAYMENT_STATUS.APPROVED : PAYMENT_STATUS.REJECTED,
          transaction_id: paymentResult.transaction_id,
          processed_at: new Date().toISOString()
        })
        .eq('id', payment.id)
        .select()
        .single()

      if (updateError) throw updateError

      // If payment approved, update order status and customer account
      if (paymentResult.success) {
        // Update order status
        await this.updateOrderStatus(order_id, ORDER_STATUS.DELIVERED)
        
        // Update customer account with the payment amount
        await this.updateCustomerAccount(customer_id, amount)
      }

      return { success: true, data: updatedPayment }
    } catch (error) {
      console.error('Error processing payment:', error)
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      // Get orders count by status
      const { data: ordersData, error: ordersError } = await supabase
        .from(TABLES.ORDERS)
        .select('status')
        .in('status', [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED
        ])
        
      if (ordersError) throw ordersError
      
      // Manually count orders by status
      const ordersByStatus = [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.READY,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED
      ].map(status => ({
        status,
        count: ordersData.filter(order => order.status === status).length
      }))

      // Get today's sales
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: payments, error: paymentsError } = await supabase
        .from(TABLES.PAYMENTS)
        .select('amount')
        .eq('status', PAYMENT_STATUS.APPROVED)
        .gte('created_at', today.toISOString())
        
      if (paymentsError) throw paymentsError
      
      const todaySales = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0)

      // Get occupied tables
      const { data: tables, error: tablesError } = await supabase
        .from(TABLES.TABLES)
        .select('status')
        .eq('status', TABLE_STATUS.OCCUPIED)
        
      if (tablesError) throw tablesError

      return {
        success: true,
        data: {
          ordersByStatus: ordersByStatus || [],
          todaySales: todaySales,
          occupiedTables: tables?.length || 0
        }
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Simulate payment processing
  static async simulatePaymentProcessing(payment) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock payment success (90% success rate)
    const success = Math.random() > 0.1

    return {
      success,
      transaction_id: success ? `txn_${Date.now()}` : null
    }
  }

  // ===== CUSTOMER ACCOUNT =====
  
  // Get customer account
  static async getCustomerAccount(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .select(`
          *,
          users (
            id,
            name,
            cpf
          )
        `)
        .eq('user_id', customerId)
        .single()

      if (error) throw error

      // Get open orders
      const openOrders = await this.getOrdersByCustomer(customerId)
      
      // Get payment history
      const { data: payments } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', PAYMENT_STATUS.APPROVED)
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        success: true,
        data: {
          ...data,
          open_orders: openOrders.data?.filter(order => 
            [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(order.status)
          ) || [],
          payment_history: payments || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update customer account
  static async updateCustomerAccount(customerId, amountSpent) {
    try {
      // Primeiro, buscar o valor atual
      const { data: currentAccount, error: fetchError } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .select('total_spent, visit_count')
        .eq('user_id', customerId)
        .single()

      if (fetchError) throw fetchError

      // Atualizar com os novos valores calculados
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .update({
          total_spent: (parseFloat(currentAccount.total_spent) || 0) + parseFloat(amountSpent),
          visit_count: (parseInt(currentAccount.visit_count) || 0) + 1,
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', customerId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error updating customer account:', error)
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // ===== INVENTORY =====
  
  // Get inventory items
  static async getInventory() {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVENTORY)
        .select('*')
        .order('name')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Get expiring items
  static async getExpiringItems(days = 7) {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + days)

      const { data, error } = await supabase
        .from(TABLES.INVENTORY)
        .select('*')
        .lte('expiry_date', expiryDate.toISOString())
        .order('expiry_date')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update inventory item
  static async updateInventoryItem(itemId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVENTORY)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
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

  // ===== STAFF =====
  
  // Get staff members
  static async getStaff() {
    try {
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select(`
          *,
          users (
            id,
            name,
            cpf,
            photo
          )
        `)
        .eq('active', true)
        .order('name')

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
