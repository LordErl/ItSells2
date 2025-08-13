import React, { useState, useEffect } from 'react'
import { StoreService } from '../services/storeService'
import { BatchService } from '../services/batchService'

const StaffDailyReport = () => {
  const [reportData, setReportData] = useState({
    sales: {},
    orders: {},
    inventory: {},
    staff: {},
    alerts: []
  })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDailyReport()
  }, [selectedDate])

  const loadDailyReport = async () => {
    setLoading(true)
    try {
      // Load various data points for the daily report
      const [
        salesResult,
        ordersResult,
        inventoryResult,
        batchStatsResult,
        expiringBatchesResult
      ] = await Promise.all([
        StoreService.getDailySales(selectedDate),
        loadOrdersData(),
        loadInventoryData(),
        BatchService.getBatchStatistics(),
        BatchService.getExpiringBatches(3) // Next 3 days
      ])

      const alerts = []
      
      // Add expiring products alerts
      if (expiringBatchesResult.success && expiringBatchesResult.data.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Produtos Próximos ao Vencimento',
          message: `${expiringBatchesResult.data.length} produto(s) vencem nos próximos 3 dias`,
          count: expiringBatchesResult.data.length,
          icon: '⚠️'
        })
      }

      // Add low stock alerts
      if (batchStatsResult.success && batchStatsResult.data.low_stock > 0) {
        alerts.push({
          type: 'info',
          title: 'Estoque Baixo',
          message: `${batchStatsResult.data.low_stock} lote(s) com estoque baixo`,
          count: batchStatsResult.data.low_stock,
          icon: '📉'
        })
      }

      setReportData({
        sales: salesResult.success ? salesResult.data : {},
        orders: ordersResult,
        inventory: batchStatsResult.success ? batchStatsResult.data : {},
        alerts
      })
    } catch (error) {
      console.error('Erro ao carregar relatório diário:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersData = async () => {
    try {
      // Get orders for the selected date
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          order_items (
            id,
            status,
            quantity,
            price
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      // Process orders data
      const totalOrders = orders?.length || 0
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0
      const pendingOrders = orders?.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length || 0
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0
      
      const totalItems = orders?.reduce((sum, order) => 
        sum + (order.order_items?.length || 0), 0) || 0
      
      const averageOrderValue = totalOrders > 0 
        ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / totalOrders 
        : 0

      return {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        totalItems,
        averageValue: averageOrderValue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
      }
    } catch (error) {
      console.error('Erro ao carregar dados de pedidos:', error)
      return {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        totalItems: 0,
        averageValue: 0,
        completionRate: 0
      }
    }
  }

  const loadInventoryData = async () => {
    // This would load inventory movement data
    // For now, return mock data
    return {
      movements: 0,
      stockIn: 0,
      stockOut: 0,
      adjustments: 0
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-500/10'
      case 'warning': return 'border-yellow-500 bg-yellow-500/10'
      case 'info': return 'border-blue-500 bg-blue-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-yellow-400 mt-4">Gerando relatório...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          📊 Relatório Diário do Staff
        </h1>
        <p className="text-gray-300 mb-4">
          Análise operacional e métricas de performance
        </p>
        
        {/* Date Selector */}
        <div className="flex items-center space-x-4">
          <label className="text-gray-400">Data do Relatório:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <span className="text-gray-400">({formatDate(selectedDate)})</span>
        </div>
      </div>

      {/* Alerts Section */}
      {reportData.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🚨 Alertas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{alert.icon}</span>
                  <span className="text-2xl font-bold text-white">{alert.count}</span>
                </div>
                <h3 className="font-bold text-white mb-1">{alert.title}</h3>
                <p className="text-gray-300 text-sm">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'sales'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vendas
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'operations'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Operações
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Estoque
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Vendas do Dia</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(reportData.sales.total || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Pedidos</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {reportData.orders.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {reportData.orders.completionRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Lotes Ativos</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {reportData.inventory.total_active_batches || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Resumo Executivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-white mb-3">Performance de Vendas</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Total de vendas: {formatCurrency(reportData.sales.total || 0)}</li>
                  <li>• Pedidos completados: {reportData.orders.completed}</li>
                  <li>• Ticket médio: {formatCurrency(reportData.orders.averageValue)}</li>
                  <li>• Itens vendidos: {reportData.orders.totalItems}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3">Status Operacional</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Pedidos pendentes: {reportData.orders.pending}</li>
                  <li>• Pedidos cancelados: {reportData.orders.cancelled}</li>
                  <li>• Produtos vencendo: {reportData.inventory.expiring_soon || 0}</li>
                  <li>• Estoque baixo: {reportData.inventory.low_stock || 0}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Análise de Vendas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400 mb-2">
                  {formatCurrency(reportData.sales.total || 0)}
                </p>
                <p className="text-gray-400">Faturamento Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {reportData.orders.total}
                </p>
                <p className="text-gray-400">Pedidos Realizados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">
                  {formatCurrency(reportData.orders.averageValue)}
                </p>
                <p className="text-gray-400">Ticket Médio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h4 className="font-bold text-white mb-4">Status dos Pedidos</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Completados</span>
                  <span className="text-green-400 font-bold">{reportData.orders.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pendentes</span>
                  <span className="text-yellow-400 font-bold">{reportData.orders.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Cancelados</span>
                  <span className="text-red-400 font-bold">{reportData.orders.cancelled}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h4 className="font-bold text-white mb-4">Métricas de Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Taxa de Conclusão</span>
                  <span className="text-green-400 font-bold">{reportData.orders.completionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Itens por Pedido</span>
                  <span className="text-blue-400 font-bold">
                    {reportData.orders.total > 0 ? (reportData.orders.totalItems / reportData.orders.total).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Operações do Dia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{reportData.orders.total}</p>
                <p className="text-gray-400 text-sm">Total de Pedidos</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{reportData.orders.completed}</p>
                <p className="text-gray-400 text-sm">Pedidos Entregues</p>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">{reportData.orders.pending}</p>
                <p className="text-gray-400 text-sm">Em Andamento</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{reportData.orders.cancelled}</p>
                <p className="text-gray-400 text-sm">Cancelados</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h4 className="font-bold text-white mb-4">Eficiência Operacional</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Taxa de Conclusão</span>
                  <span className="text-white">{reportData.orders.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${reportData.orders.completionRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Taxa de Cancelamento</span>
                  <span className="text-white">
                    {reportData.orders.total > 0 ? ((reportData.orders.cancelled / reportData.orders.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${reportData.orders.total > 0 ? (reportData.orders.cancelled / reportData.orders.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Status do Estoque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{reportData.inventory.total_active_batches || 0}</p>
                <p className="text-gray-400 text-sm">Lotes Ativos</p>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">{reportData.inventory.expiring_soon || 0}</p>
                <p className="text-gray-400 text-sm">Vencendo em 7 dias</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{reportData.inventory.expired || 0}</p>
                <p className="text-gray-400 text-sm">Vencidos</p>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">{reportData.inventory.low_stock || 0}</p>
                <p className="text-gray-400 text-sm">Estoque Baixo</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h4 className="font-bold text-white mb-4">Ações Recomendadas</h4>
            <div className="space-y-3">
              {reportData.inventory.expired > 0 && (
                <div className="flex items-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <span className="text-2xl mr-3">🚨</span>
                  <div>
                    <p className="text-red-400 font-medium">Produtos Vencidos</p>
                    <p className="text-gray-300 text-sm">Remover {reportData.inventory.expired} lote(s) vencido(s) do estoque</p>
                  </div>
                </div>
              )}
              
              {reportData.inventory.expiring_soon > 0 && (
                <div className="flex items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-medium">Produtos Próximos ao Vencimento</p>
                    <p className="text-gray-300 text-sm">Priorizar uso de {reportData.inventory.expiring_soon} lote(s)</p>
                  </div>
                </div>
              )}
              
              {reportData.inventory.low_stock > 0 && (
                <div className="flex items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <span className="text-2xl mr-3">📉</span>
                  <div>
                    <p className="text-orange-400 font-medium">Estoque Baixo</p>
                    <p className="text-gray-300 text-sm">Reabastecer {reportData.inventory.low_stock} lote(s) com estoque baixo</p>
                  </div>
                </div>
              )}
              
              {reportData.inventory.expired === 0 && reportData.inventory.expiring_soon === 0 && reportData.inventory.low_stock === 0 && (
                <div className="flex items-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="text-green-400 font-medium">Estoque em Ordem</p>
                    <p className="text-gray-300 text-sm">Não há ações urgentes necessárias no momento</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-medium transition-colors"
        >
          🖨️ Imprimir Relatório
        </button>
      </div>
    </div>
  )
}

export default StaffDailyReport
