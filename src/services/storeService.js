import { supabase, TABLES, ORDER_STATUS, ORDER_ITEM_STATUS, PAYMENT_STATUS, TABLE_STATUS, handleError, formatDate, parseDate, getTables } from '../lib'


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
        error: handleError(error)
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
        error: handleError(error)
      }
    }
  }

  // Create product
  static async createProduct(productData) {
    try {
      // Validate required fields
      if (!productData.name || !productData.price || !productData.category_id) {
        return { success: false, error: 'Nome, preço e categoria são obrigatórios' }
      }

      // Create product with new fields
      const prepTime = productData.prep_time || 15; // Default 15 minutes if not specified
      
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([{
          name: productData.name,
          description: productData.description || '',
          price: productData.price,
          category_id: productData.category_id,
          ingredients: productData.ingredients || null,
          available: productData.available !== undefined ? productData.available : true,
          prep_time: prepTime, // Novo campo
          preparation_time: String(prepTime), // Campo original (como string)
          show_in_menu: productData.show_in_menu !== undefined ? productData.show_in_menu : true,
          image_path: productData.image_path || null,
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
        error: handleError(error)
      }
    }
  }

  // Update product
  static async updateProduct(productId, updates) {
    try {
      // Validate required fields if they are being updated
      if ((updates.name !== undefined && !updates.name) || 
          (updates.price !== undefined && !updates.price) || 
          (updates.category_id !== undefined && !updates.category_id)) {
        return { success: false, error: 'Nome, preço e categoria são obrigatórios' }
      }

      // Make sure we have the new fields in the update
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Tratar campo ingredients para evitar erro de array malformado
      if (updateData.ingredients === '') {
        updateData.ingredients = null
      }

      // If prep_time is being set to null or undefined, set it to default
      if (updates.prep_time === null || updates.prep_time === undefined) {
        updateData.prep_time = 15
      }
      
      // Sincronizar preparation_time com prep_time
      if (updateData.prep_time !== undefined) {
        updateData.preparation_time = String(updateData.prep_time)
      }

      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update(updateData)
        .eq('id', productId)
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
        error: handleError(error)
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
        error: handleError(error)
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
        observations: item.observations,
        status: ORDER_ITEM_STATUS.PENDING,
        created_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update table status if applicable
      if (table_id) {
        await this.updateTableStatus(table_id, TABLE_STATUS.OCCUPIED, order.id)
      }
      
      return { success: true, data: order }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }
  
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
        error: handleError(error)
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
        error: handleError(error)
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
        error: handleError(error)
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
        error: handleError(error)
      }
    }
  }

  // ===== OPERATIONAL DASHBOARD =====
  
  // Get tables
  static async getTables() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TABLES)
        .select('*')
        .order('number')
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get staff members
  static async getStaff() {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .in('role', ['admin', 'staff', 'cashier'])
        .order('name')
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

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
        error: handleError(error)
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
          users(id, name, cpf),
          order_items(
            *,
            products(name, price)
          )
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
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

  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      // Get pending orders count
      const { count: pendingOrders } = await supabase
        .from(TABLES.ORDERS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get occupied tables count
      const { count: occupiedTables } = await supabase
        .from(TABLES.USERS)
        .select('*', { count: 'exact', head: true })
        .not('on_table', 'is', null)

      // Get today's revenue
      const today = new Date().toISOString().split('T')[0]
      const { data: payments } = await supabase
        .from(TABLES.PAYMENTS)
        .select('amount')
        .eq('status', 'approved')
        .gte('created_at', today)

      const todayRevenue = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0

      const stats = {
        pendingOrders: pendingOrders || 0,
        occupiedTables: occupiedTables || 0,
        todayRevenue: todayRevenue
      }

      return { success: true, data: stats }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get customer account information
  static async getCustomerAccount(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          id,
          name,
          cpf,
          to_pay,
          on_table
        `)
        .eq('id', customerId)
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

  // Get orders by customer ID
  static async getOrdersByCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items(
            *,
            products(
              name,
              price
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get payments by customer ID
  static async getPaymentsByCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Process payment
  static async processPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert([
          {
            customer_id: paymentData.customer_id,
            table_id: paymentData.table_id,
            amount: paymentData.amount,
            method: paymentData.method,
            status: paymentData.status || 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()
      
      if (error) throw error

      // Update customer balance if payment is approved
      if (paymentData.status === 'approved' && paymentData.customer_id) {
        await this.updateCustomerBalance(paymentData.customer_id, paymentData.amount, 'subtract')
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get pending order items for production areas
  static async getPendingOrderItems(area = null) {
    try {
      let query = supabase
        .from(TABLES.ORDER_ITEMS)
        .select(`
          *,
          orders(
            id,
            table_id,
            customer_id,
            created_at
          ),
          products(
            id,
            name,
            category_id,
            prep_time,
            categories(
              name
            )
          )
        `)
        .eq('status', ORDER_ITEM_STATUS.PENDING)
        .order('created_at', { ascending: true })

      // Filter by production area if specified
      if (area) {
        // Area 1: Cozinha (food categories)
        // Area 2: Bar (drinks categories) 
        // Area 3: Mixed
        const foodCategories = ['pratos', 'lanches', 'sobremesas']
        const drinkCategories = ['bebidas', 'sucos', 'cafes']
        
        if (area === 1) {
          query = query.in('products.categories.name', foodCategories)
        } else if (area === 2) {
          query = query.in('products.categories.name', drinkCategories)
        }
      }

      const { data, error } = await query
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get producing order items for production areas
  static async getProducingOrderItems(area = null) {
    try {
      let query = supabase
        .from(TABLES.ORDER_ITEMS)
        .select(`
          *,
          orders(
            id,
            table_id,
            customer_id,
            created_at
          ),
          products(
            id,
            name,
            category_id,
            prep_time,
            categories(
              name
            )
          )
        `)
        .eq('status', ORDER_ITEM_STATUS.PRODUCING)
        .order('created_at', { ascending: true })

      // Filter by production area if specified
      if (area) {
        const foodCategories = ['pratos', 'lanches', 'sobremesas']
        const drinkCategories = ['bebidas', 'sucos', 'cafes']
        
        if (area === 1) {
          query = query.in('products.categories.name', foodCategories)
        } else if (area === 2) {
          query = query.in('products.categories.name', drinkCategories)
        }
      }

      const { data, error } = await query
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Update order item status
  static async updateOrderItemStatus(itemId, status) {
    try {
      console.log(`🔄 Updating item ${itemId} status to: ${status}`)
      
      const updateData = { status: status }
      
      // Add started_at timestamp when item starts producing
      if (status === ORDER_ITEM_STATUS.PRODUCING) {
        updateData.started_at = new Date().toISOString()
      }
      
      // Get item info first to get order_id
      const { data: itemInfo, error: itemInfoError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .select('id, order_id')
        .eq('id', itemId)
        .single()

      if (itemInfoError) throw itemInfoError
      
      const { data, error } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .update(updateData)
        .eq('id', itemId)
        .select(`
          *,
          orders(
            id,
            table_id,
            customer_id
          ),
          products(
            name
          )
        `)
        .single()

      if (error) throw error

      // Update order totals and status if needed
      await this.updateOrderTotalsAndStatus(itemInfo.order_id)

      console.log(`✅ Item ${itemId} status updated to ${status}, order ${itemInfo.order_id} checked`)
      return { success: true, data }
      
    } catch (error) {
      console.error(`❌ Error updating item ${itemId} status:`, error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get ready items for waiters
  static async getReadyOrderItems() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .select(`
          *,
          orders(
            id,
            table_id,
            customer_id
          ),
          products(
            name
          )
        `)
        .eq('status', ORDER_ITEM_STATUS.READY)
        .order('created_at', { ascending: true })
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get delivering items for waiters
  static async getDeliveringOrderItems() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .select(`
          *,
          orders(
            id,
            table_id,
            customer_id
          ),
          products(
            name
          )
        `)
        .eq('status', ORDER_ITEM_STATUS.DELIVERING)
        .order('created_at', { ascending: true })
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Update customer account balance (to_pay field)
  static async updateCustomerBalance(customerId, amount, operation = 'add') {
    try {
      // Get current balance
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('to_pay')
        .eq('id', customerId)
        .single()

      if (userError) throw userError

      const currentBalance = parseFloat(user.to_pay) || 0
      const newBalance = operation === 'add' 
        ? currentBalance + parseFloat(amount)
        : currentBalance - parseFloat(amount)

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          to_pay: Math.max(0, newBalance), // Ensure balance doesn't go negative
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
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

  // Get occupied tables with customer details
  static async getOccupiedTablesDetails() {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          id,
          name,
          on_table,
          to_pay,
          tables!inner(
            id,
            number,
            capacity
          )
        `)
        .not('on_table', 'is', null)
        .order('on_table')
      
      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .update({ 
          status: status,
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
        error: handleError(error)
      }
    }
  }

  // Update order totals and status when all items are delivered
  static async updateOrderTotalsAndStatus(orderId) {
    try {
      console.log(`🔄 Updating order totals and status for order: ${orderId}`)
      
      // Get order with all items
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          id,
          table_id,
          status,
          total,
          order_items(
            id,
            status,
            price,
            quantity
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Check if all items are delivered
      const allItemsDelivered = order.order_items.length > 0 && 
        order.order_items.every(item => item.status === ORDER_ITEM_STATUS.DELIVERED)

      console.log(`📦 Order ${orderId}: ${order.order_items.length} items, all delivered: ${allItemsDelivered}`)

      // Calculate total amount from delivered items
      const totalAmount = order.order_items.reduce((sum, item) => {
        if (item.status === ORDER_ITEM_STATUS.DELIVERED) {
          return sum + (parseFloat(item.price) * parseInt(item.quantity))
        }
        return sum
      }, 0)

      // Prepare update data
      const updateData = {
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      }

      // If all items are delivered, update status to delivered
      if (allItemsDelivered) {
        updateData.status = ORDER_STATUS.DELIVERED
        console.log(`✅ Order ${orderId} marked as DELIVERED with total: R$ ${totalAmount.toFixed(2)}`)
      }

      // Update table_number if table_id exists and table_number is null
      if (order.table_id && !order.table_number) {
        updateData.table_number = order.table_id
        console.log(`🍽️ Order ${orderId} table_number set to: ${order.table_id}`)
      }

      // Update the order
      const { data: updatedOrder, error: updateError } = await supabase
        .from(TABLES.ORDERS)
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (updateError) throw updateError

      console.log(`💾 Order ${orderId} updated successfully:`, updateData)
      return { success: true, data: updatedOrder }
      
    } catch (error) {
      console.error(`❌ Error updating order ${orderId}:`, error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Confirm item delivery (customer confirmation)
  static async confirmItemDelivery(itemId, customerId) {
    try {
      console.log(`🚚 Confirming delivery for item: ${itemId}, customer: ${customerId}`)
      
      // First, get the item with order info
      const { data: itemInfo, error: itemInfoError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .select('id, order_id, price, quantity')
        .eq('id', itemId)
        .single()

      if (itemInfoError) throw itemInfoError

      // Update item status to delivered and set delivered_at timestamp
      const { data: item, error: itemError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .update({
          status: ORDER_ITEM_STATUS.DELIVERED,
          delivered_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select('price, quantity')
        .single()

      if (itemError) throw itemError

      // Add amount to customer's balance
      const itemTotal = parseFloat(item.price) * parseInt(item.quantity)
      await this.updateCustomerBalance(customerId, itemTotal, 'add')

      // Update order totals and status
      await this.updateOrderTotalsAndStatus(itemInfo.order_id)

      console.log(`✅ Item ${itemId} delivery confirmed, order ${itemInfo.order_id} updated`)
      return { success: true, data: item }
      
    } catch (error) {
      console.error(`❌ Error confirming delivery for item ${itemId}:`, error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Get daily report with comprehensive data
  static async getDailyReport(date) {
    try {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      // Get previous day for comparison
      const prevDate = new Date(startDate)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevEndDate = new Date(prevDate)
      prevEndDate.setHours(23, 59, 59, 999)

      // Parallel data fetching for better performance
      const [salesData, ordersData, inventoryData, staffData, performanceData, tableAnalytics, comparativeMetrics, peakHours] = await Promise.all([
        this.getDailySales(startDate, endDate, prevDate, prevEndDate),
        this.getDailyOrders(startDate, endDate, prevDate, prevEndDate),
        this.getDailyInventory(startDate, endDate),
        this.getDailyCashClosures(startDate, endDate),
        this.getDailyPerformance(startDate, endDate),
        this.getDailyTableAnalytics(startDate, endDate),
        this.getDailyComparativeMetrics(startDate, endDate, prevDate, prevEndDate),
        this.getDailyPeakHours(startDate, endDate)
      ])

      // Calculate insights and recommendations
      const insights = this.generateDailyInsights(salesData, ordersData, inventoryData, performanceData, peakHours)

      return {
        success: true,
        data: {
          date,
          sales: salesData,
          orders: ordersData,
          customers: {
            count: ordersData.uniqueCustomers,
            trend: ordersData.customerTrend
          },
          inventory: inventoryData,
          cashClosures: staffData,
          performance: performanceData,
          topProducts: salesData.topProducts,
          tableAnalytics,
          comparativeMetrics,
          peakHours,
          insights
        }
      }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  // Helper: Get daily sales data
  static async getDailySales(startDate, endDate, prevStartDate, prevEndDate) {
    try {
      const { data: todaySales, error: todayError } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          total_amount,
          order_items(
            quantity,
            price,
            products(name, category_id)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['delivered', 'confirmed', 'ready'])

      if (todayError) {
        console.error('Error fetching today sales:', todayError)
        return {
          total: 0,
          trend: 0,
          averageTicket: 0,
          ticketTrend: 0,
          topProducts: []
        }
      }

      const { data: yesterdaySales, error: yesterdayError } = await supabase
        .from(TABLES.ORDERS)
        .select('total_amount')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString())
        .in('status', ['delivered', 'confirmed', 'ready'])

      if (yesterdayError) {
        console.error('Error fetching yesterday sales:', yesterdayError)
        // Continue with today's data only
      }

      const todayTotal = todaySales?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
      const yesterdayTotal = yesterdaySales?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
      const trend = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0

      // Calculate top products
      const productSales = {}
      todaySales?.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = item.products?.name || 'Produto Desconhecido'
          const revenue = parseFloat(item.price || 0) * parseInt(item.quantity || 0)
          
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            }
          }
          
          productSales[productName].quantity += parseInt(item.quantity || 0)
          productSales[productName].revenue += revenue
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      const averageTicket = todaySales?.length > 0 ? todayTotal / todaySales.length : 0
      const prevAverageTicket = yesterdaySales?.length > 0 ? yesterdayTotal / yesterdaySales.length : 0
      const ticketTrend = prevAverageTicket > 0 ? ((averageTicket - prevAverageTicket) / prevAverageTicket * 100) : 0

      return {
        total: todayTotal,
        trend: Math.round(trend * 100) / 100,
        averageTicket,
        ticketTrend: Math.round(ticketTrend * 100) / 100,
        topProducts
      }
    } catch (error) {
      console.error('Error in getDailySales:', error)
      return {
        total: 0,
        trend: 0,
        averageTicket: 0,
        ticketTrend: 0,
        topProducts: []
      }
    }
  }

  // Helper: Get daily orders data
  static async getDailyOrders(startDate, endDate, prevStartDate, prevEndDate) {
    const { data: todayOrders, error: todayError } = await supabase
      .from(TABLES.ORDERS)
      .select('id, customer_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (todayError) throw todayError

    const { data: yesterdayOrders, error: yesterdayError } = await supabase
      .from(TABLES.ORDERS)
      .select('id, customer_id')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString())

    if (yesterdayError) throw yesterdayError

    const todayCount = todayOrders.length
    const yesterdayCount = yesterdayOrders.length
    const trend = yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount * 100) : 0

    const uniqueCustomers = new Set(todayOrders.map(o => o.customer_id)).size
    const prevUniqueCustomers = new Set(yesterdayOrders.map(o => o.customer_id)).size
    const customerTrend = prevUniqueCustomers > 0 ? ((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers * 100) : 0

    return {
      count: todayCount,
      trend: Math.round(trend * 100) / 100,
      uniqueCustomers,
      customerTrend: Math.round(customerTrend * 100) / 100
    }
  }

  // Helper: Get daily inventory data
  static async getDailyInventory(startDate, endDate) {
    // Get current inventory status
    const { data: inventory, error: invError } = await supabase
      .from(TABLES.INVENTORY)
      .select('*')

    if (invError) throw invError

    // Calculate consumed items (simplified - would need proper inventory tracking)
    const consumed = inventory.map(item => ({
      name: item.name || 'Item desconhecido',
      consumed: Math.abs(item.quantity_used || 0),
      unit: item.unit || 'un'
    })).filter(item => item.consumed > 0)

    // Find low stock items (less than 20% of max capacity)
    const lowStock = inventory
      .filter(item => item.current_stock <= (item.max_capacity * 0.2))
      .map(item => `${item.name}: ${item.current_stock} ${item.unit}`)

    // Find items near expiry (within 3 days)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const nearExpiry = inventory
      .filter(item => item.expiry_date && new Date(item.expiry_date) <= threeDaysFromNow)
      .map(item => `${item.name}: ${new Date(item.expiry_date).toLocaleDateString()}`)

    return {
      consumed,
      lowStock,
      nearExpiry
    }
  }

  // Helper: Get daily cash closures by staff
  static async getDailyCashClosures(startDate, endDate) {
    try {
      const { data: payments, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select(`
          amount,
          payment_method,
          customer_id,
          users!customer_id(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'approved')

      if (error) {
        console.error('Error fetching payments:', error)
        // Return default data if query fails
        return [{
          staffName: 'Sistema',
          pix: 0,
          card: 0,
          cash: 0,
          total: 0,
          cashToManager: 0
        }]
      }

      // Group by customer (since we don't have staff_id in payments)
      const customerClosures = {}
      payments?.forEach(payment => {
        const customerId = payment.customer_id || 'unknown'
        const customerName = payment.users?.name || 'Cliente Desconhecido'
        
        if (!customerClosures[customerId]) {
          customerClosures[customerId] = {
            staffName: customerName,
            pix: 0,
            card: 0,
            cash: 0,
            total: 0,
            cashToManager: 0
          }
        }

        const amount = parseFloat(payment.amount) || 0
        customerClosures[customerId].total += amount

        switch (payment.payment_method) {
          case 'pix':
            customerClosures[customerId].pix += amount
            break
          case 'cartao':
          case 'credit_card':
          case 'debit_card':
            customerClosures[customerId].card += amount
            break
          case 'cash':
          case 'money':
            customerClosures[customerId].cash += amount
            customerClosures[customerId].cashToManager += amount
            break
        }
      })

      const result = Object.values(customerClosures)
      return result.length > 0 ? result : [{
        staffName: 'Nenhum pagamento hoje',
        pix: 0,
        card: 0,
        cash: 0,
        total: 0,
        cashToManager: 0
      }]
    } catch (error) {
      console.error('Error in getDailyCashClosures:', error)
      return [{
        staffName: 'Erro ao carregar dados',
        pix: 0,
        card: 0,
        cash: 0,
        total: 0,
        cashToManager: 0
      }]
    }
  }

  // Helper: Get daily performance metrics
  static async getDailyPerformance(startDate, endDate) {
    const { data: orderItems, error } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select(`
        created_at,
        started_at,
        delivered_at,
        status,
        products(prep_time)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    // Calculate average prep time
    const completedItems = orderItems.filter(item => item.delivered_at)
    let totalPrepTime = 0
    let prepTimeCount = 0

    completedItems.forEach(item => {
      if (item.started_at && item.delivered_at) {
        const prepTime = (new Date(item.delivered_at) - new Date(item.started_at)) / (1000 * 60) // minutes
        totalPrepTime += prepTime
        prepTimeCount++
      }
    })

    const avgPrepTime = prepTimeCount > 0 ? Math.round(totalPrepTime / prepTimeCount) : 0

    // Count delayed orders (taking more than expected prep time)
    const delayedOrders = completedItems.filter(item => {
      if (!item.started_at || !item.delivered_at || !item.products?.prep_time) return false
      const actualTime = (new Date(item.delivered_at) - new Date(item.started_at)) / (1000 * 60)
      const expectedTime = item.products.prep_time
      return actualTime > expectedTime * 1.2 // 20% tolerance
    }).length

    // Calculate kitchen efficiency
    const totalItems = orderItems.length
    const onTimeItems = completedItems.length - delayedOrders
    const kitchenEfficiency = totalItems > 0 ? Math.round((onTimeItems / totalItems) * 100) : 100

    return {
      avgPrepTime,
      delayedOrders,
      kitchenEfficiency
    }
  }

  // Helper: Generate daily insights and recommendations
  static generateDailyInsights(salesData, ordersData, inventoryData, performanceData, peakHours) {
    const opportunities = []
    const recommendations = []

    // Sales insights
    if (salesData.trend < -10) {
      opportunities.push('Vendas 10% abaixo do dia anterior')
      recommendations.push('Revisar estratégias de marketing e promoções')
    }

    if (salesData.averageTicket < 25) {
      opportunities.push('Ticket médio baixo')
      recommendations.push('Implementar estratégias de upselling')
    }

    // Inventory insights
    if (inventoryData.lowStock.length > 0) {
      opportunities.push(`${inventoryData.lowStock.length} itens com estoque baixo`)
      recommendations.push('Realizar pedidos de reposição urgente')
    }

    if (inventoryData.nearExpiry.length > 0) {
      opportunities.push(`${inventoryData.nearExpiry.length} itens próximos ao vencimento`)
      recommendations.push('Criar promoções para itens próximos ao vencimento')
    }

    // Performance insights
    if (performanceData.kitchenEfficiency < 80) {
      opportunities.push('Eficiência da cozinha abaixo de 80%')
      recommendations.push('Revisar processos da cozinha e treinamento da equipe')
    }

    if (performanceData.avgPrepTime > 20) {
      opportunities.push('Tempo médio de preparo acima de 20 minutos')
      recommendations.push('Otimizar fluxo de produção e organização da cozinha')
    }

    // Peak hours insights
    if (peakHours?.rushHours?.length > 0) {
      const rushCount = peakHours.rushHours.length
      opportunities.push(`${rushCount} horário${rushCount > 1 ? 's' : ''} de rush identificado${rushCount > 1 ? 's' : ''}`)
      recommendations.push('Considere aumentar a equipe durante os horários de pico')
    }

    if (peakHours?.peakHour && peakHours.peakHour.percentage > 25) {
      opportunities.push(`Horário de pico concentra ${peakHours.peakHour.percentage.toFixed(1)}% dos pedidos`)
      recommendations.push('Prepare-se adequadamente para o horário de maior movimento')
    }

    if (peakHours?.quietHours?.length >= 3) {
      opportunities.push(`${peakHours.quietHours.length} horários com baixo movimento`)
      recommendations.push('Aproveite horários calmos para preparação e limpeza')
    }

    // Best period insights
    if (peakHours?.bestPeriod) {
      const periodName = peakHours.bestPeriod.name === 'morning' ? 'Manhã' :
                        peakHours.bestPeriod.name === 'afternoon' ? 'Tarde' : 'Noite'
      opportunities.push(`${periodName} é o período mais movimentado`)
      recommendations.push(`Foque estratégias de marketing e promoções no período da ${periodName.toLowerCase()}`)
    }

    // Default messages if no issues
    if (opportunities.length === 0) {
      opportunities.push('Operação funcionando dentro dos parâmetros normais')
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue mantendo os bons resultados!')
    }

    return {
      opportunities,
      recommendations
    }
  }

  // Helper: Get daily table analytics
  static async getDailyTableAnalytics(startDate, endDate) {
    try {
      // Get all orders with table information
      const { data: orders, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          id,
          table_number,
          total_amount,
          created_at,
          status
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('table_number', 'is', null)

      if (error) throw error

      // Group by table
      const tableStats = {}
      let totalRevenue = 0
      let totalOrders = 0

      orders.forEach(order => {
        const tableNum = order.table_number
        if (!tableStats[tableNum]) {
          tableStats[tableNum] = {
            number: tableNum,
            orders: 0,
            revenue: 0,
            avgTicket: 0
          }
        }
        
        tableStats[tableNum].orders++
        tableStats[tableNum].revenue += order.total_amount
        totalRevenue += order.total_amount
        totalOrders++
      })

      // Calculate averages and sort by revenue
      const tableAnalytics = Object.values(tableStats)
        .map(table => ({
          ...table,
          avgTicket: table.revenue / table.orders,
          revenueShare: (table.revenue / totalRevenue) * 100
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10 tables

      return {
        tables: tableAnalytics,
        totalTables: Object.keys(tableStats).length,
        avgRevenuePerTable: totalRevenue / Object.keys(tableStats).length,
        mostProductiveTable: tableAnalytics[0] || null
      }
    } catch (error) {
      console.error('Error fetching table analytics:', error)
      return {
        tables: [],
        totalTables: 0,
        avgRevenuePerTable: 0,
        mostProductiveTable: null
      }
    }
  }

  // Helper: Get comparative metrics (weekly/monthly trends)
  static async getDailyComparativeMetrics(startDate, endDate, prevDate, prevEndDate) {
    try {
      // Get last 7 days for weekly trend
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() - 6)
      
      // Get last 30 days for monthly trend
      const monthStart = new Date(startDate)
      monthStart.setDate(monthStart.getDate() - 29)

      const [weeklyData, monthlyData] = await Promise.all([
        // Weekly sales data
        supabase
          .from(TABLES.ORDERS)
          .select('total_amount, created_at')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', endDate.toISOString())
          .in('status', ['delivered', 'confirmed', 'ready']),
        
        // Monthly sales data  
        supabase
          .from(TABLES.ORDERS)
          .select('total_amount, created_at')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', endDate.toISOString())
          .in('status', ['delivered', 'confirmed', 'ready'])
      ])

      if (weeklyData.error) throw weeklyData.error
      if (monthlyData.error) throw monthlyData.error

      // Calculate weekly trend
      const weeklyRevenue = weeklyData.data.reduce((sum, order) => sum + order.total_amount, 0)
      const weeklyAvg = weeklyRevenue / 7
      
      // Calculate monthly trend
      const monthlyRevenue = monthlyData.data.reduce((sum, order) => sum + order.total_amount, 0)
      const monthlyAvg = monthlyRevenue / 30

      // Group by day for chart data
      const dailyData = {}
      weeklyData.data.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        if (!dailyData[date]) dailyData[date] = 0
        dailyData[date] += order.total_amount
      })

      const chartData = Object.entries(dailyData)
        .map(([date, revenue]) => ({
          date,
          revenue,
          day: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7) // Last 7 days

      // Calculate growth rates
      const todayRevenue = chartData[chartData.length - 1]?.revenue || 0
      const weeklyGrowth = weeklyAvg > 0 ? ((todayRevenue - weeklyAvg) / weeklyAvg) * 100 : 0
      const monthlyGrowth = monthlyAvg > 0 ? ((todayRevenue - monthlyAvg) / monthlyAvg) * 100 : 0

      return {
        weekly: {
          totalRevenue: weeklyRevenue,
          avgDaily: weeklyAvg,
          growth: weeklyGrowth
        },
        monthly: {
          totalRevenue: monthlyRevenue,
          avgDaily: monthlyAvg,
          growth: monthlyGrowth
        },
        chartData,
        bestDay: chartData.reduce((best, day) => 
          day.revenue > (best?.revenue || 0) ? day : best, null
        ),
        worstDay: chartData.reduce((worst, day) => 
          day.revenue < (worst?.revenue || Infinity) ? day : worst, null
        )
      }
    } catch (error) {
      console.error('Error fetching comparative metrics:', error)
      return {
        weekly: { totalRevenue: 0, avgDaily: 0, growth: 0 },
        monthly: { totalRevenue: 0, avgDaily: 0, growth: 0 },
        chartData: [],
        bestDay: null,
        worstDay: null
      }
    }
  }

  // Helper: Get peak hours analysis
  static async getDailyPeakHours(startDate, endDate) {
    try {
      const { data: orders, error } = await supabase
        .from(TABLES.ORDERS)
        .select('created_at, total_amount, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['delivered', 'confirmed', 'ready'])

      if (error) throw error

      // Group orders by hour
      const hourlyStats = {}
      let totalRevenue = 0
      let totalOrders = 0

      // Initialize all hours (6 AM to 11 PM)
      for (let hour = 6; hour <= 23; hour++) {
        hourlyStats[hour] = {
          hour,
          orders: 0,
          revenue: 0,
          percentage: 0
        }
      }

      orders.forEach(order => {
        const hour = new Date(order.created_at).getHours()
        if (hourlyStats[hour]) {
          hourlyStats[hour].orders++
          hourlyStats[hour].revenue += order.total_amount
          totalRevenue += order.total_amount
          totalOrders++
        }
      })

      // Calculate percentages and format data
      const hourlyData = Object.values(hourlyStats)
        .map(stat => ({
          ...stat,
          percentage: totalOrders > 0 ? (stat.orders / totalOrders) * 100 : 0,
          revenuePercentage: totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0,
          avgTicket: stat.orders > 0 ? stat.revenue / stat.orders : 0,
          timeRange: `${stat.hour.toString().padStart(2, '0')}:00 - ${(stat.hour + 1).toString().padStart(2, '0')}:00`
        }))
        .filter(stat => stat.orders > 0) // Only show hours with activity
        .sort((a, b) => b.orders - a.orders)

      // Find peak periods
      const peakHour = hourlyData[0] || null
      const rushHours = hourlyData.filter(stat => stat.percentage >= 8) // Hours with 8%+ of daily orders
      const quietHours = hourlyData.filter(stat => stat.percentage <= 3) // Hours with 3% or less

      // Classify periods
      const periods = {
        morning: hourlyData.filter(stat => stat.hour >= 6 && stat.hour < 12),
        afternoon: hourlyData.filter(stat => stat.hour >= 12 && stat.hour < 18),
        evening: hourlyData.filter(stat => stat.hour >= 18 && stat.hour <= 23)
      }

      const bestPeriod = Object.entries(periods)
        .map(([name, data]) => ({
          name,
          orders: data.reduce((sum, stat) => sum + stat.orders, 0),
          revenue: data.reduce((sum, stat) => sum + stat.revenue, 0)
        }))
        .sort((a, b) => b.orders - a.orders)[0]

      return {
        hourlyData: hourlyData.slice(0, 12), // Top 12 hours
        peakHour,
        rushHours,
        quietHours,
        bestPeriod,
        totalActiveHours: hourlyData.length,
        avgOrdersPerHour: totalOrders / hourlyData.length || 0,
        periods: {
          morning: {
            name: 'Manhã (6h-12h)',
            orders: periods.morning.reduce((sum, stat) => sum + stat.orders, 0),
            revenue: periods.morning.reduce((sum, stat) => sum + stat.revenue, 0)
          },
          afternoon: {
            name: 'Tarde (12h-18h)',
            orders: periods.afternoon.reduce((sum, stat) => sum + stat.orders, 0),
            revenue: periods.afternoon.reduce((sum, stat) => sum + stat.revenue, 0)
          },
          evening: {
            name: 'Noite (18h-23h)',
            orders: periods.evening.reduce((sum, stat) => sum + stat.orders, 0),
            revenue: periods.evening.reduce((sum, stat) => sum + stat.revenue, 0)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching peak hours:', error)
      return {
        hourlyData: [],
        peakHour: null,
        rushHours: [],
        quietHours: [],
        bestPeriod: null,
        totalActiveHours: 0,
        avgOrdersPerHour: 0,
        periods: {
          morning: { name: 'Manhã (6h-12h)', orders: 0, revenue: 0 },
          afternoon: { name: 'Tarde (12h-18h)', orders: 0, revenue: 0 },
          evening: { name: 'Noite (18h-23h)', orders: 0, revenue: 0 }
        }
      }
    }
  }

  // Get unpaid orders by customer ID
  static async getUnpaidOrdersByCustomer(customerId) {
    try {
      const { data: orders, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          id,
          status,
          total_amount,
          payment_status,
          created_at
        `)
        .eq('customer_id', customerId)
        .in('status', ['delivered', 'completed'])
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: orders || [] }
    } catch (error) {
      return {
        success: false,
        error: handleError(error)
      }
    }
  }
}
