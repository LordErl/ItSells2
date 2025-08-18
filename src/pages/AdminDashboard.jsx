import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useNavigate } from 'react-router-dom'
import anime from 'animejs'
import { StoreService } from '../services/storeService'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { products, orders, tables, inventory } = useStore()
  const dashboardRef = useRef(null)
  const [realTimeStats, setRealTimeStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    occupiedTables: 0,
    lowStockItems: 0,
    totalEmployees: 0,
    todaySales: 0,
    pendingPayments: 0,
    expiringItems: 0
  })
  const [loading, setLoading] = useState(true)

  // Load real-time data
  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (dashboardRef.current && !loading) {
      anime({
        targets: dashboardRef.current.children,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutCubic'
      })
    }
  }, [loading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get products count
      const { data: productsData } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
      
      // Get active orders
      const { data: activeOrdersData } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering'])
      
      // Get occupied tables
      const { data: occupiedTablesData } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('on_table', true)
      
      // Get low stock items (ingredients)
      const { data: lowStockData } = await supabase
        .from('ingredients')
        .select('id', { count: 'exact' })
        .lt('current_stock', 10)
      
      // Get total employees
      const { data: employeesData } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .in('role', ['staff', 'admin', 'cashier'])
      
      // Get today's sales
      const today = new Date().toISOString().split('T')[0]
      const { data: salesData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'approved')
        .gte('created_at', today)
      
      const todaySales = salesData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
      
      // Get pending payments
      const { data: pendingPaymentsData } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('status', 'delivered')
        .eq('payment_status', 'pending')
      
      // Get expiring items
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const { data: expiringData } = await supabase
        .from('ingredient_batches')
        .select('id', { count: 'exact' })
        .lt('expiration_date', nextWeek.toISOString())
        .eq('status', 'active')
      
      setRealTimeStats({
        totalProducts: productsData?.length || 0,
        activeOrders: activeOrdersData?.length || 0,
        occupiedTables: occupiedTablesData?.length || 0,
        lowStockItems: lowStockData?.length || 0,
        totalEmployees: employeesData?.length || 0,
        todaySales: todaySales / 100, // Convert from cents
        pendingPayments: pendingPaymentsData?.length || 0,
        expiringItems: expiringData?.length || 0
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'products':
        navigate('/admin/products')
        break
      case 'orders':
        navigate('/operational-dashboard')
        break
      case 'tables':
        navigate('/operational-dashboard')
        break
      case 'stock':
        navigate('/ingredients')
        break
      case 'employees':
        navigate('/employee-management')
        break
      case 'sales':
        navigate('/daily-report')
        break
      case 'payments':
        navigate('/cashier-dashboard')
        break
      case 'expiring':
        navigate('/expiration-control')
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">
              Dashboard Administrativo
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="metric-card animate-pulse">
                <div className="h-20 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Produtos */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('products')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Produtos</p>
                  <p className="text-2xl font-bold text-gold">{realTimeStats.totalProducts}</p>
                  <p className="text-xs text-gold/60">Clique para gerenciar</p>
                </div>
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pedidos Ativos */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('orders')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Pedidos Ativos</p>
                  <p className="text-2xl font-bold text-neon-cyan">{realTimeStats.activeOrders}</p>
                  <p className="text-xs text-neon-cyan/60">Clique para visualizar</p>
                </div>
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mesas Ocupadas */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('tables')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Mesas Ocupadas</p>
                  <p className="text-2xl font-bold text-neon-green">{realTimeStats.occupiedTables}</p>
                  <p className="text-xs text-neon-green/60">Clique para visualizar</p>
                </div>
                <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Vendas Hoje */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('sales')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Vendas Hoje</p>
                  <p className="text-2xl font-bold text-neon-purple">R$ {realTimeStats.todaySales.toFixed(2)}</p>
                  <p className="text-xs text-neon-purple/60">Clique para relatórios</p>
                </div>
                <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-purple" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Funcionários */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('employees')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Funcionários</p>
                  <p className="text-2xl font-bold text-neon-orange">{realTimeStats.totalEmployees}</p>
                  <p className="text-xs text-neon-orange/60">Em breve: gestão</p>
                </div>
                <div className="w-12 h-12 bg-neon-orange/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pagamentos Pendentes */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('payments')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Contas Pendentes</p>
                  <p className="text-2xl font-bold text-neon-red">{realTimeStats.pendingPayments}</p>
                  <p className="text-xs text-neon-red/60">Clique para caixa</p>
                </div>
                <div className="w-12 h-12 bg-neon-red/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Itens Vencendo */}
            <div 
              className="metric-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleCardClick('expiring')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold/80 text-sm">Itens Vencendo</p>
                  <p className="text-2xl font-bold text-neon-pink">{realTimeStats.expiringItems}</p>
                  <p className="text-xs text-neon-pink/60">Próximos 7 dias</p>
                </div>
                <div className="w-12 h-12 bg-neon-pink/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Menu Management */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Gestão do Menu</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/admin/products')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📋 Produtos</span>
                  <span className="text-gold/60">{realTimeStats.totalProducts}</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/menu-management')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📝 Menu Staff</span>
                  <span className="text-neon-cyan">Gerenciar</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/recipes')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>👨‍🍳 Receitas</span>
                  <span className="text-neon-cyan">Ver</span>
                </div>
              </button>
            </div>
          </div>

          {/* Operations */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Operações</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/operational-dashboard')}
                className="w-full nav-item text-left hover:bg-neon-green/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📈 Dashboard Operacional</span>
                  <span className="text-neon-green">{realTimeStats.occupiedTables} mesas</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/cashier-dashboard')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>💰 Módulo de Caixa</span>
                  <span className="text-gold/60">{realTimeStats.pendingPayments} pendentes</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/daily-report')}
                className="w-full nav-item text-left hover:bg-neon-cyan/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📊 Relatórios</span>
                  <span className="text-neon-cyan">Ver</span>
                </div>
              </button>
              {/* Configurações da Empresa - PIX Integration */}
              <button 
                onClick={() => navigate('/company-settings')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>🏢 Configurações da Empresa</span>
                  <span className="text-yellow-400 font-semibold">PIX</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/sales-integration')}
                className="w-full nav-item text-left hover:bg-neon-cyan/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>💳 Integração de Vendas</span>
                  <span className="text-neon-cyan">Ver</span>
                </div>
              </button>
            </div>
          </div>

          {/* Staff Management */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Gestão de Pessoal</h2>
            <div className="space-y-3">
              <button 
                onClick={() => toast.info('👥 Sistema de gestão de funcionários em desenvolvimento')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>👥 Funcionários</span>
                  <span className="text-gold/60">{realTimeStats.totalEmployees} ativos</span>
                </div>
              </button>
              <button 
                onClick={() => toast.info('📅 Sistema de horários em desenvolvimento')}
                className="w-full nav-item text-left hover:bg-neon-cyan/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📅 Horários</span>
                  <span className="text-neon-cyan">Em breve</span>
                </div>
              </button>
              <button 
                onClick={() => toast.info('🔐 Sistema de permissões em desenvolvimento')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>🔐 Permissões</span>
                  <span className="text-gold/60">Em breve</span>
                </div>
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Estoque</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/ingredients')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📦 Gestão de Ingredientes</span>
                  <span className="text-gold/60">Gerenciar</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/expiration-control')}
                className="w-full nav-item text-left hover:bg-neon-pink/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>⚠️ Controle de Vencimentos</span>
                  <span className="text-neon-pink">{realTimeStats.expiringItems} itens</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/batch-management')}
                className="w-full nav-item text-left hover:bg-neon-cyan/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>📦 Gestão de Lotes</span>
                  <span className="text-neon-cyan">Gerenciar</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 glass-card p-6">
          <h2 className="text-xl font-bold text-gold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/products')} 
              className="btn-luxury text-sm py-3"
            >
              📋 Gerenciar Produtos
            </button>
            <button 
              onClick={() => navigate('/daily-report')}
              className="px-4 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors text-sm font-medium"
            >
              📊 Relatório Diário
            </button>
            <button 
              onClick={() => navigate('/ingredients')}
              className="px-4 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors text-sm font-medium"
            >
              📦 Gestão de Estoque
            </button>
            <button 
              onClick={() => navigate('/company-settings')}
              className="px-4 py-3 bg-neon-pink/20 text-neon-pink rounded-lg hover:bg-neon-pink/30 transition-colors text-sm font-medium"
            >
              🏢 Configurações
            </button>
            <button 
              onClick={() => navigate('/cashier-dashboard')}
              className="px-4 py-3 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors text-sm font-medium"
            >
              💰 Módulo Caixa
            </button>
            <button 
              onClick={() => navigate('/operational-dashboard')}
              className="px-4 py-3 bg-neon-orange/20 text-neon-orange rounded-lg hover:bg-neon-orange/30 transition-colors text-sm font-medium"
            >
              📈 Dashboard Operacional
            </button>
            <button 
              onClick={() => navigate('/recipes')}
              className="px-4 py-3 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors text-sm font-medium"
            >
              👨‍🍳 Receitas
            </button>
            <button 
              onClick={() => navigate('/expiration-control')}
              className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              ⚠️ Controle Vencimentos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

