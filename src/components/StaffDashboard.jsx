import React, { useState, useEffect } from 'react'
import { BatchService } from '../services/batchService'
import BatchManagement from './BatchManagement'
import ExpirationControl from './ExpirationControl'
import StaffDailyReport from './StaffDailyReport'
import MenuManagement from './MenuManagement'
import ExitCamera from './ExitCamera'

const StaffDashboard = () => {
  const [activeModule, setActiveModule] = useState('overview')
  const [dashboardStats, setDashboardStats] = useState({
    expiringBatches: 0,
    lowStock: 0,
    totalBatches: 0,
    availableProducts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    setLoading(true)
    try {
      const [batchStatsResult, expiringResult] = await Promise.all([
        BatchService.getBatchStatistics(),
        BatchService.getExpiringBatches(7) // Next 7 days
      ])

      setDashboardStats({
        expiringBatches: expiringResult.success ? expiringResult.data.length : 0,
        lowStock: batchStatsResult.success ? batchStatsResult.data.low_stock || 0 : 0,
        totalBatches: batchStatsResult.success ? batchStatsResult.data.total_active_batches || 0 : 0,
        availableProducts: 0 // This would come from product service
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    {
      id: 'overview',
      name: 'Visão Geral',
      icon: '📊',
      description: 'Dashboard principal com resumo das operações'
    },
    {
      id: 'batches',
      name: 'Controle de Lotes',
      icon: '📦',
      description: 'Gerenciamento de lotes de produtos',
      alert: dashboardStats.totalBatches > 0
    },
    {
      id: 'expiration',
      name: 'Controle de Vencimentos',
      icon: '⏰',
      description: 'Produtos próximos ao vencimento',
      alert: dashboardStats.expiringBatches > 0,
      alertCount: dashboardStats.expiringBatches
    },
    {
      id: 'reports',
      name: 'Relatório Diário',
      icon: '📈',
      description: 'Relatórios e análises operacionais'
    },
    {
      id: 'menu',
      name: 'Gerenciar Menu',
      icon: '🍽️',
      description: 'Atualizar disponibilidade e preços'
    },
    {
      id: 'exit-camera',
      name: 'Câmera de Saída',
      icon: '📹',
      description: 'Reconhecimento facial e verificação de pagamentos'
    }
  ]

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'batches':
        return <BatchManagement />
      case 'expiration':
        return <ExpirationControl />
      case 'reports':
        return <StaffDailyReport />
      case 'menu':
        return <MenuManagement />
      case 'exit-camera':
        return <ExitCamera />
      default:
        return renderOverview()
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4">
          👋 Bem-vindo ao Dashboard do Staff
        </h2>
        <p className="text-gray-300 text-lg">
          Central de controle para operações diárias, gestão de produtos e monitoramento
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Lotes Ativos</p>
              <p className="text-2xl font-bold text-blue-400">
                {dashboardStats.totalBatches}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-500/20">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Vencendo em 7 dias</p>
              <p className="text-2xl font-bold text-orange-400">
                {dashboardStats.expiringBatches}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-500/20">
              <span className="text-2xl">📉</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-400">
                {dashboardStats.lowStock}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20">
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Produtos Disponíveis</p>
              <p className="text-2xl font-bold text-green-400">
                {dashboardStats.availableProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(dashboardStats.expiringBatches > 0 || dashboardStats.lowStock > 0) && (
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4">🚨 Alertas Importantes</h3>
          <div className="space-y-3">
            {dashboardStats.expiringBatches > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="text-orange-400 font-medium">Produtos Próximos ao Vencimento</p>
                    <p className="text-gray-300 text-sm">
                      {dashboardStats.expiringBatches} lote(s) vencem nos próximos 7 dias
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule('expiration')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
            )}

            {dashboardStats.lowStock > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📉</span>
                  <div>
                    <p className="text-red-400 font-medium">Estoque Baixo</p>
                    <p className="text-gray-300 text-sm">
                      {dashboardStats.lowStock} lote(s) com estoque baixo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule('batches')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Gerenciar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-yellow-400 mb-6">⚡ Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveModule('expiration')}
            className="p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">⏰</span>
              <span className="font-medium text-orange-400">Verificar Vencimentos</span>
            </div>
            <p className="text-gray-400 text-sm">
              Revisar produtos próximos ao vencimento
            </p>
          </button>

          <button
            onClick={() => setActiveModule('menu')}
            className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">🍽️</span>
              <span className="font-medium text-blue-400">Atualizar Menu</span>
            </div>
            <p className="text-gray-400 text-sm">
              Modificar disponibilidade e preços
            </p>
          </button>

          <button
            onClick={() => setActiveModule('reports')}
            className="p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">📈</span>
              <span className="font-medium text-green-400">Ver Relatórios</span>
            </div>
            <p className="text-gray-400 text-sm">
              Análise de performance diária
            </p>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">🔧 Status do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">Módulos Ativos</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Controle de Lotes</span>
                <span className="text-green-400">✅ Ativo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Monitoramento de Vencimentos</span>
                <span className="text-green-400">✅ Ativo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Gerenciamento de Menu</span>
                <span className="text-green-400">✅ Ativo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Câmera de Saída</span>
                <span className="text-yellow-400">⚠️ Standby</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-3">Última Atualização</h4>
            <p className="text-gray-400">
              {new Date().toLocaleString('pt-BR')}
            </p>
            <button
              onClick={loadDashboardStats}
              className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Atualizar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-yellow-400 mt-4">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">
                🏪 ItSells - Dashboard do Staff
              </h1>
              <p className="text-gray-400 text-sm">
                Sistema de controle e gestão operacional
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="px-6 pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeModule === module.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{module.icon}</span>
                <span>{module.name}</span>
                
                {module.alert && module.alertCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {module.alertCount}
                  </span>
                )}
                
                {module.alert && !module.alertCount && (
                  <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {renderActiveModule()}
      </div>
    </div>
  )
}

export default StaffDashboard
