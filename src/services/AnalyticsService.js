import { supabase } from '../lib/supabase'

class AnalyticsService {
  // =============================================================================
  // ANALYTICS BÁSICOS
  // =============================================================================

  /**
   * Busca estatísticas gerais do dashboard
   */
  static async getDashboardAnalytics(dateRange = 'today') {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange)
      
      // Vendas do período
      const { data: salesData } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'approved')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Pedidos do período
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Produtos mais vendidos
      const { data: topProducts } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products!inner(name, price)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Funcionários ativos
      const { data: employeesData } = await supabase
        .from('users')
        .select('id, role, status')
        .in('role', ['admin', 'staff', 'cashier'])

      return {
        success: true,
        data: {
          sales: this.processSalesData(salesData),
          orders: this.processOrdersData(ordersData),
          topProducts: this.processTopProducts(topProducts),
          employees: this.processEmployeesData(employeesData),
          period: { startDate, endDate, range: dateRange }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar analytics do dashboard:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca analytics de vendas por período
   */
  static async getSalesAnalytics(dateRange = 'week') {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange)
      
      const { data: salesData } = await supabase
        .from('payments')
        .select('amount, created_at, payment_method')
        .eq('status', 'approved')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true })

      return {
        success: true,
        data: {
          timeline: this.createSalesTimeline(salesData, dateRange),
          byPaymentMethod: this.groupByPaymentMethod(salesData),
          summary: this.calculateSalesSummary(salesData),
          period: { startDate, endDate, range: dateRange }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar analytics de vendas:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca analytics de produtos
   */
  static async getProductAnalytics(dateRange = 'month') {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange)
      
      const { data: productData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          created_at,
          products!inner(name, category_id, categories(name))
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      return {
        success: true,
        data: {
          topProducts: this.getTopProducts(productData),
          byCategory: this.groupByCategory(productData),
          performance: this.calculateProductPerformance(productData),
          period: { startDate, endDate, range: dateRange }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar analytics de produtos:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca analytics de funcionários
   */
  static async getEmployeeAnalytics(dateRange = 'month') {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange)
      
      // Horários trabalhados
      const { data: scheduleData } = await supabase
        .from('employee_schedules')
        .select(`
          employee_id,
          date,
          start_time,
          end_time,
          status,
          users!inner(name, role)
        `)
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0])

      // Vendas por funcionário (se houver campo)
      const { data: salesByEmployee } = await supabase
        .from('orders')
        .select('created_by, total_amount, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('created_by', 'is', null)

      return {
        success: true,
        data: {
          attendance: this.calculateAttendance(scheduleData),
          hoursWorked: this.calculateHoursWorked(scheduleData),
          salesPerformance: this.calculateSalesPerformance(salesByEmployee),
          period: { startDate, endDate, range: dateRange }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar analytics de funcionários:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // CACHE DE ANALYTICS
  // =============================================================================

  /**
   * Busca analytics com cache
   */
  static async getCachedAnalytics(cacheKey, fetchFunction, ttlMinutes = 30) {
    try {
      // Verificar cache
      const { data: cachedData } = await supabase
        .from('analytics_cache')
        .select('data, expires_at')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedData && new Date(cachedData.expires_at) > new Date()) {
        console.log('📊 Analytics cache hit:', cacheKey)
        return { success: true, data: cachedData.data, fromCache: true }
      }

      // Cache miss - buscar dados
      console.log('📊 Analytics cache miss:', cacheKey)
      const result = await fetchFunction()
      
      if (result.success) {
        // Salvar no cache
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)
        
        await supabase
          .from('analytics_cache')
          .upsert({
            cache_key: cacheKey,
            data: result.data,
            expires_at: expiresAt.toISOString()
          })
      }

      return result
    } catch (error) {
      console.error('❌ Erro no cache de analytics:', error)
      return await fetchFunction() // Fallback para busca direta
    }
  }

  /**
   * Limpa cache expirado
   */
  static async cleanExpiredCache() {
    try {
      const { error } = await supabase.rpc('clean_expired_cache')
      if (error) throw error
      
      console.log('🧹 Cache expirado limpo com sucesso')
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // FUNÇÕES AUXILIARES
  // =============================================================================

  /**
   * Calcula range de datas baseado no período
   */
  static getDateRange(range) {
    const now = new Date()
    let startDate, endDate

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        endDate = new Date(now)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  /**
   * Processa dados de vendas
   */
  static processSalesData(salesData) {
    if (!salesData?.length) return { total: 0, count: 0, average: 0 }

    const total = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    const count = salesData.length
    const average = count > 0 ? total / count : 0

    return { total, count, average }
  }

  /**
   * Processa dados de pedidos
   */
  static processOrdersData(ordersData) {
    if (!ordersData?.length) return { total: 0, byStatus: {} }

    const byStatus = ordersData.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    return { total: ordersData.length, byStatus }
  }

  /**
   * Processa produtos mais vendidos
   */
  static processTopProducts(orderItems) {
    if (!orderItems?.length) return []

    const productSales = orderItems.reduce((acc, item) => {
      const productId = item.product_id
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.products?.name || 'Produto Desconhecido',
          price: item.products?.price || 0,
          quantity: 0,
          revenue: 0
        }
      }
      acc[productId].quantity += item.quantity || 0
      acc[productId].revenue += (item.quantity || 0) * (item.products?.price || 0)
      return acc
    }, {})

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }

  /**
   * Processa dados de funcionários
   */
  static processEmployeesData(employeesData) {
    if (!employeesData?.length) return { total: 0, active: 0, byRole: {} }

    const active = employeesData.filter(emp => emp.status === 'active').length
    const byRole = employeesData.reduce((acc, emp) => {
      acc[emp.role] = (acc[emp.role] || 0) + 1
      return acc
    }, {})

    return { total: employeesData.length, active, byRole }
  }

  /**
   * Cria timeline de vendas
   */
  static createSalesTimeline(salesData, range) {
    if (!salesData?.length) return []

    const timeline = {}
    
    salesData.forEach(sale => {
      const date = new Date(sale.created_at)
      let key

      switch (range) {
        case 'today':
          key = `${date.getHours()}:00`
          break
        case 'week':
          key = date.toLocaleDateString('pt-BR', { weekday: 'short' })
          break
        case 'month':
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          break
        default:
          key = date.toLocaleDateString('pt-BR')
      }

      if (!timeline[key]) {
        timeline[key] = { period: key, sales: 0, revenue: 0 }
      }
      timeline[key].sales += 1
      timeline[key].revenue += sale.amount || 0
    })

    return Object.values(timeline).sort((a, b) => a.period.localeCompare(b.period))
  }

  /**
   * Agrupa vendas por método de pagamento
   */
  static groupByPaymentMethod(salesData) {
    if (!salesData?.length) return {}

    return salesData.reduce((acc, sale) => {
      const method = sale.payment_method || 'unknown'
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 }
      }
      acc[method].count += 1
      acc[method].revenue += sale.amount || 0
      return acc
    }, {})
  }

  /**
   * Calcula resumo de vendas
   */
  static calculateSalesSummary(salesData) {
    if (!salesData?.length) {
      return { total: 0, count: 0, average: 0, growth: 0 }
    }

    const total = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    const count = salesData.length
    const average = count > 0 ? total / count : 0

    return { total, count, average, growth: 0 } // Growth calculation would need historical data
  }
}

export default AnalyticsService
