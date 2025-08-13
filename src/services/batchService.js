import { supabase, TABLES, handleError } from '../lib'

export class BatchService {
  // ===== BATCH MANAGEMENT =====
  
  /**
   * Create a new product batch
   * @param {Object} batchData - Batch information
   * @returns {Object} Success/error response
   */
  static async createBatch(batchData) {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .insert({
          product_id: batchData.product_id,
          batch_number: batchData.batch_number,
          quantity: batchData.quantity,
          unit_cost: batchData.unit_cost,
          supplier: batchData.supplier,
          manufacturing_date: batchData.manufacturing_date,
          expiration_date: batchData.expiration_date,
          location: batchData.location,
          notes: batchData.notes,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Lote criado:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao criar lote:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Get all batches for a specific product
   * @param {string} productId - Product ID
   * @returns {Object} Success/error response with batches
   */
  static async getBatchesByProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .select(`
          *,
          products (
            id,
            name,
            category_id,
            categories (
              id,
              name
            )
          )
        `)
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('expiration_date', { ascending: true })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao buscar lotes do produto:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Get all active batches with expiration info
   * @returns {Object} Success/error response with all batches
   */
  static async getAllBatches() {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .select(`
          *,
          products (
            id,
            name,
            image_path,
            categories (
              id,
              name
            )
          )
        `)
        .eq('status', 'active')
        .order('expiration_date', { ascending: true })

      if (error) throw error

      // Calculate days until expiration for each batch
      const batchesWithExpiration = data.map(batch => {
        const today = new Date()
        const expirationDate = new Date(batch.expiration_date)
        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
        
        let expirationStatus = 'ok'
        if (daysUntilExpiration < 0) {
          expirationStatus = 'expired'
        } else if (daysUntilExpiration <= 3) {
          expirationStatus = 'critical'
        } else if (daysUntilExpiration <= 7) {
          expirationStatus = 'warning'
        }

        return {
          ...batch,
          days_until_expiration: daysUntilExpiration,
          expiration_status: expirationStatus
        }
      })

      return { success: true, data: batchesWithExpiration }
    } catch (error) {
      console.error('❌ Erro ao buscar todos os lotes:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Get batches expiring soon (within specified days)
   * @param {number} days - Number of days to check for expiration
   * @returns {Object} Success/error response with expiring batches
   */
  static async getExpiringBatches(days = 7) {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      const { data, error } = await supabase
        .from('product_batches')
        .select(`
          *,
          products (
            id,
            name,
            image_path,
            categories (
              id,
              name
            )
          )
        `)
        .eq('status', 'active')
        .lte('expiration_date', futureDate.toISOString())
        .order('expiration_date', { ascending: true })

      if (error) throw error

      // Calculate days until expiration and categorize
      const today = new Date()
      const categorizedBatches = data.map(batch => {
        const expirationDate = new Date(batch.expiration_date)
        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
        
        let expirationStatus = 'warning'
        let priority = 'medium'
        
        if (daysUntilExpiration < 0) {
          expirationStatus = 'expired'
          priority = 'critical'
        } else if (daysUntilExpiration <= 1) {
          expirationStatus = 'critical'
          priority = 'critical'
        } else if (daysUntilExpiration <= 3) {
          expirationStatus = 'critical'
          priority = 'high'
        }

        return {
          ...batch,
          days_until_expiration: daysUntilExpiration,
          expiration_status: expirationStatus,
          priority
        }
      })

      return { success: true, data: categorizedBatches }
    } catch (error) {
      console.error('❌ Erro ao buscar lotes próximos ao vencimento:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Update batch quantity (for stock consumption)
   * @param {string} batchId - Batch ID
   * @param {number} quantityUsed - Quantity to subtract
   * @returns {Object} Success/error response
   */
  static async updateBatchQuantity(batchId, quantityUsed) {
    try {
      // First get current quantity
      const { data: currentBatch, error: fetchError } = await supabase
        .from('product_batches')
        .select('quantity')
        .eq('id', batchId)
        .single()

      if (fetchError) throw fetchError

      const newQuantity = currentBatch.quantity - quantityUsed

      // Update the batch
      const { data, error } = await supabase
        .from('product_batches')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
        .select()
        .single()

      if (error) throw error

      // If quantity reaches zero, mark as depleted
      if (newQuantity <= 0) {
        await supabase
          .from('product_batches')
          .update({ status: 'depleted' })
          .eq('id', batchId)
      }

      console.log('✅ Quantidade do lote atualizada:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade do lote:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Mark batch as expired or disposed
   * @param {string} batchId - Batch ID
   * @param {string} action - 'expired' or 'disposed'
   * @param {string} notes - Additional notes
   * @returns {Object} Success/error response
   */
  static async markBatchAction(batchId, action, notes = '') {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .update({
          status: action,
          disposal_notes: notes,
          disposal_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Lote marcado como ${action}:`, data)
      return { success: true, data }
    } catch (error) {
      console.error(`❌ Erro ao marcar lote como ${action}:`, error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }

  /**
   * Get batch statistics for dashboard
   * @returns {Object} Success/error response with statistics
   */
  static async getBatchStatistics() {
    try {
      // Get total active batches
      const { data: activeBatches, error: activeError } = await supabase
        .from('product_batches')
        .select('id')
        .eq('status', 'active')

      if (activeError) throw activeError

      // Get expiring batches (next 7 days)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const { data: expiringBatches, error: expiringError } = await supabase
        .from('product_batches')
        .select('id')
        .eq('status', 'active')
        .lte('expiration_date', futureDate.toISOString())

      if (expiringError) throw expiringError

      // Get expired batches
      const today = new Date()
      const { data: expiredBatches, error: expiredError } = await supabase
        .from('product_batches')
        .select('id')
        .eq('status', 'active')
        .lt('expiration_date', today.toISOString())

      if (expiredError) throw expiredError

      // Get low stock batches (quantity <= 10)
      const { data: lowStockBatches, error: lowStockError } = await supabase
        .from('product_batches')
        .select('id')
        .eq('status', 'active')
        .lte('quantity', 10)

      if (lowStockError) throw lowStockError

      const statistics = {
        total_active_batches: activeBatches?.length || 0,
        expiring_soon: expiringBatches?.length || 0,
        expired: expiredBatches?.length || 0,
        low_stock: lowStockBatches?.length || 0
      }

      return { success: true, data: statistics }
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas dos lotes:', error)
      return {
        success: false,
        error: handleError(error)
      }
    }
  }
}
