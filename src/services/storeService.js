import { supabase } from '../lib/supabase'
import { TABLES, ORDER_STATUS, ORDER_ITEM_STATUS, PAYMENT_STATUS, TABLE_STATUS, dbHelpers } from '../lib/constants'


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
      // Validate required fields
      if (!productData.name || !productData.price || !productData.category_id) {
        return { success: false, error: 'Nome, preço e categoria são obrigatórios' }
      }

      // Create product with new fields
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([{
          name: productData.name,
          description: productData.description || '',
          price: productData.price,
          category_id: productData.category_id,
          ingredients: productData.ingredients || '',
          available: productData.available !== undefined ? productData.available : true,
          prep_time: productData.prep_time || 15, // Default 15 minutes if not specified
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
        error: dbHelpers.handleError(error)
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

      // If prep_time is being set to null or undefined, set it to default
      if (updates.prep_time === null || updates.prep_time === undefined) {
        updateData.prep_time = 15
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

  // ===== OPERATIONAL DASHBOARD =====
  
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update order item status
  static async updateOrderItemStatus(itemId, status) {
    try {
      const updateData = { status: status }
      
      // Add started_at timestamp when item starts producing
      if (status === ORDER_ITEM_STATUS.PRODUCING) {
        updateData.started_at = new Date().toISOString()
      }
      
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

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
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
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Confirm item delivery (customer confirmation)
  static async confirmItemDelivery(itemId, customerId) {
    try {
      // Update item status to delivered
      const { data: item, error: itemError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .update({
          status: ORDER_ITEM_STATUS.DELIVERED
        })
        .eq('id', itemId)
        .select('price, quantity')
        .single()

      if (itemError) throw itemError

      // Add amount to customer's balance
      const itemTotal = parseFloat(item.price) * parseInt(item.quantity)
      await this.updateCustomerBalance(customerId, itemTotal, 'add')

      return { success: true, data: item }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }
}
