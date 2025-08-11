import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useNavigate } from 'react-router-dom'
import anime from 'animejs'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { products, orders, tables, inventory } = useStore()
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

  const stats = {
    totalProducts: products?.length || 0,
    activeOrders: orders?.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status))?.length || 0,
    occupiedTables: tables?.filter(table => table.status === 'occupied')?.length || 0,
    lowStockItems: inventory?.filter(item => item.status === 'low_stock')?.length || 0
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold/80 text-sm">Produtos</p>
                <p className="text-2xl font-bold text-gold">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold/80 text-sm">Pedidos Ativos</p>
                <p className="text-2xl font-bold text-neon-cyan">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold/80 text-sm">Mesas Ocupadas</p>
                <p className="text-2xl font-bold text-neon-green">{stats.occupiedTables}</p>
              </div>
              <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold/80 text-sm">Estoque Baixo</p>
                <p className="text-2xl font-bold text-neon-pink">{stats.lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-neon-pink/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Menu Management */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Gestão do Menu</h2>
            <div className="space-y-3">
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Produtos</span>
                  <span className="text-gold/60">{stats.totalProducts}</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Categorias</span>
                  <span className="text-gold/60">5</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Preços</span>
                  <span className="text-neon-cyan">Atualizar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Operations */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Operações</h2>
            <div className="space-y-3">
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Visão do Salão</span>
                  <span className="text-neon-green">{stats.occupiedTables} ocupadas</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Controle de Caixa</span>
                  <span className="text-gold/60">Aberto</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Relatórios</span>
                  <span className="text-neon-cyan">Ver</span>
                </div>
              </button>
              {/* Configurações da Empresa - PIX Integration - Force Rebuild v2 */}
              <button 
                onClick={() => navigate('/company-settings')}
                className="w-full nav-item text-left hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>🏢 Configurações da Empresa</span>
                  <span className="text-yellow-400 font-semibold">PIX</span>
                </div>
              </button>
            </div>
          </div>

          {/* Staff Management */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Gestão de Pessoal</h2>
            <div className="space-y-3">
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Funcionários</span>
                  <span className="text-gold/60">2 ativos</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Horários</span>
                  <span className="text-neon-cyan">Gerenciar</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Permissões</span>
                  <span className="text-gold/60">Configurar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Estoque</h2>
            <div className="space-y-3">
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Itens em Estoque</span>
                  <span className="text-gold/60">{inventory?.length || 0}</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Vencimentos</span>
                  <span className="text-neon-pink">2 próximos</span>
                </div>
              </button>
              <button className="w-full nav-item text-left">
                <div className="flex items-center justify-between">
                  <span>Fornecedores</span>
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
              Gerenciar Produtos
            </button>
            <button className="px-4 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors text-sm font-medium">
              Backup Dados
            </button>
            <button className="px-4 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors text-sm font-medium">
              Relatório Diário
            </button>
            <button className="px-4 py-3 bg-neon-pink/20 text-neon-pink rounded-lg hover:bg-neon-pink/30 transition-colors text-sm font-medium">
              Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

