import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { StoreService } from '../services/storeService'
import anime from 'animejs'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { orders, tables } = useStore()
  const [dashboardStats, setDashboardStats] = useState({
    pendingItems: 0,
    preparingItems: 0,
    readyItems: 0,
    occupiedTables: 0,
    todaySales: 0
  })
  const dashboardRef = useRef(null)

  useEffect(() => {
    if (dashboardRef.current) {
      anime({
        targets: dashboardRef.current.children,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutCubic'
      })
    }
  }, [])

  useEffect(() => {
    loadDashboardStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardStats = async () => {
    try {
      const result = await StoreService.getDashboardStats()
      if (result.success) {
        setDashboardStats(result.data)
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const stats = {
    pendingOrders: dashboardStats.pendingItems || 0,
    preparingOrders: dashboardStats.preparingItems || 0,
    readyOrders: dashboardStats.readyItems || 0,
    occupiedTables: dashboardStats.occupiedTables || 0
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">
              Dashboard Operacional
            </h1>
            <p className="text-gold/80 text-sm">
              Bem-vindo, {user?.name}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4" ref={dashboardRef}>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="metric-card">
            {/* Integração Vendas */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-teal-200 bg-teal-50" onClick={() => navigate('/sales-integration')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-teal-600" />
                    </div>
                    <CardTitle className="text-lg text-teal-900">Integração Vendas</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-teal-700">
                  Demonstração da integração completa com o sistema de vendas
                </CardDescription>
              </CardContent>
            </Card>

            {/* Teste de Integração */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200 bg-purple-50" onClick={() => navigate('/stock-integration-demo')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg text-purple-900">Teste de Integração</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-700">
                  Testar fluxo completo de pedidos com baixa automática
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <p className="text-neon-pink text-2xl font-bold">{stats.pendingOrders}</p>
              <p className="text-gold/80 text-sm">Pendentes</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <p className="text-neon-cyan text-2xl font-bold">{stats.preparingOrders}</p>
              <p className="text-gold/80 text-sm">Preparando</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <p className="text-neon-green text-2xl font-bold">{stats.readyOrders}</p>
              <p className="text-gold/80 text-sm">Prontos</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <p className="text-gold text-2xl font-bold">{stats.occupiedTables}</p>
              <p className="text-gold/80 text-sm">Mesas Ocupadas</p>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Point of Sale */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gold mb-2">Ponto de Pedido</h3>
              <p className="text-gold/70 text-sm mb-4">
                Criar novos pedidos e acompanhar
              </p>
              <button 
                onClick={() => navigate('/order-management')}
                className="px-6 py-3 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors w-full font-medium"
              >
                NOVO PEDIDO
              </button>
            </div>
          </div>

          {/* Operational Dashboard */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-cyan mb-2">Dashboard Operacional</h3>
              <p className="text-gold/70 text-sm mb-4">
                Controle de produção e estoque
              </p>
              <button 
                onClick={() => navigate('/operational-dashboard')}
                className="px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors w-full font-medium"
              >
                Abrir Dashboard
              </button>
            </div>
          </div>

          {/* Cashier */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-green mb-2">Módulo de Caixa</h3>
              <p className="text-gold/70 text-sm mb-4">
                Processar pagamentos e vendas
              </p>
              <button 
                onClick={() => navigate('/cashier-dashboard')}
                className="px-6 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors w-full font-medium"
              >
                Abrir Caixa
              </button>
            </div>
          </div>

          {/* Menu Management */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-pink/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 8a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-pink mb-2">Menu</h3>
              <p className="text-gold/70 text-sm mb-4">
                Atualizar disponibilidade e preços
              </p>
              <button 
                onClick={() => navigate('/menu-management')}
                className="px-6 py-3 bg-neon-pink/20 text-neon-pink rounded-lg hover:bg-neon-pink/30 transition-colors w-full font-medium"
              >
                Gerenciar Menu
              </button>
            </div>
          </div>

          {/* Expiration Control */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Vencimentos</h3>
              <p className="text-gold/70 text-sm mb-4">
                Controlar produtos próximos ao vencimento
              </p>
              <button 
                onClick={() => navigate('/expiration-control')}
                className="px-6 py-3 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors w-full font-medium"
              >
                Ver Alertas
              </button>
            </div>
          </div>

          {/* Security Camera */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-500 mb-2">Câmera de Saída</h3>
              <p className="text-gold/70 text-sm mb-4">
                Monitorar saídas sem pagamento
              </p>
              <button 
                onClick={() => navigate('/exit-camera')}
                className="px-6 py-3 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors w-full font-medium"
              >
                Ativar Câmera
              </button>
            </div>
          </div>

          {/* Daily Report */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 8a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-500 mb-2">Relatório Diário</h3>
              <p className="text-gold/70 text-sm mb-4">
                Análise completa das operações
              </p>
              <button 
                onClick={() => navigate('/staff-daily-report')}
                className="px-6 py-3 bg-purple-500/20 text-purple-500 rounded-lg hover:bg-purple-500/30 transition-colors w-full font-medium"
              >
                Ver Relatório
              </button>
            </div>
          </div>

          {/* Batch Management */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-indigo-500 mb-2">Controle de Lotes</h3>
              <p className="text-gold/70 text-sm mb-4">
                Gerenciar lotes de produtos
              </p>
              <button 
                onClick={() => navigate('/batch-management')}
                className="px-6 py-3 bg-indigo-500/20 text-indigo-500 rounded-lg hover:bg-indigo-500/30 transition-colors w-full font-medium"
              >
                Gerenciar Lotes
              </button>
            </div>
          </div>

          {/* Recipe Management Dashboard */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-orange-500 mb-2">Dashboard de Receitas</h3>
              <p className="text-gold/70 text-sm mb-4">
                Visão geral do sistema de receitas
              </p>
              <button 
                onClick={() => navigate('/recipe-dashboard')}
                className="px-6 py-3 bg-orange-500/20 text-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors w-full font-medium"
              >
                Abrir Dashboard
              </button>
            </div>
          </div>

          {/* Ingredient Management */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-500 mb-2">Ingredientes</h3>
              <p className="text-gold/70 text-sm mb-4">
                Gerenciar estoque de ingredientes
              </p>
              <button 
                onClick={() => navigate('/ingredients')}
                className="px-6 py-3 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors w-full font-medium"
              >
                Gerenciar Ingredientes
              </button>
            </div>
          </div>

          {/* Recipe Management */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-blue-500 mb-2">Receitas</h3>
              <p className="text-gold/70 text-sm mb-4">
                Criar e gerenciar receitas
              </p>
              <button 
                onClick={() => navigate('/recipes')}
                className="px-6 py-3 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors w-full font-medium"
              >
                Gerenciar Receitas
              </button>
            </div>
          </div>

          {/* Sales Integration */}
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-teal-500 mb-2">Integração Vendas</h3>
              <p className="text-gold/70 text-sm mb-4">
                Demonstração da baixa de estoque
              </p>
              <button 
                onClick={() => navigate('/sales-integration')}
                className="px-6 py-3 bg-teal-500/20 text-teal-500 rounded-lg hover:bg-teal-500/30 transition-colors w-full font-medium"
              >
                Ver Integração
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8 glass-card p-6">
          <h2 className="text-xl font-bold text-gold mb-4">Pedidos Recentes</h2>
          <div className="space-y-3">
            {orders?.slice(0, 5).map((order, index) => (
              <div key={order.id || index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div>
                  <p className="text-gold font-medium">Mesa {order.table_id || 'Balcão'}</p>
                  <p className="text-gold/60 text-sm">
                    {order.items?.length || 0} itens - R$ {order.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.status === 'pending' ? 'bg-neon-pink/20 text-neon-pink' :
                    order.status === 'preparing' ? 'bg-neon-cyan/20 text-neon-cyan' :
                    order.status === 'ready' ? 'bg-neon-green/20 text-neon-green' :
                    'bg-gold/20 text-gold'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' :
                     order.status === 'preparing' ? 'Preparando' :
                     order.status === 'ready' ? 'Pronto' :
                     order.status || 'Desconhecido'}
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gold/60">
                <p>Nenhum pedido encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

