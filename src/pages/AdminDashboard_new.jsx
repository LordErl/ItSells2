import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useNavigate } from 'react-router-dom'
import { usePermissions, getDashboardCardPermissions, getQuickActionsPermissions, getManagementSectionsPermissions } from '../hooks/usePermissions'
import anime from 'animejs'
import { StoreService } from '../services/storeService'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { AppIcon } from '../components/ui/Icon'
import FloatingParticles from '../components/effects/FloatingParticles'
import { MetricCard, PremiumGrid, PremiumSection, PremiumLoading } from '../components/layout/PremiumContainer'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { products, orders, tables, inventory } = useStore()
  const permissions = usePermissions()
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

  // Configurações de permissões
  const cardPermissions = getDashboardCardPermissions(permissions)
  const quickActionsPermissions = getQuickActionsPermissions(permissions)
  const managementSections = getManagementSectionsPermissions(permissions)

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
        .lte('expiration_date', nextWeek.toISOString())

      setRealTimeStats({
        totalProducts: productsData?.length || 0,
        activeOrders: activeOrdersData?.length || 0,
        occupiedTables: occupiedTablesData?.length || 0,
        lowStockItems: lowStockData?.length || 0,
        totalEmployees: employeesData?.length || 0,
        todaySales,
        pendingPayments: pendingPaymentsData?.length || 0,
        expiringItems: expiringData?.length || 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'products':
        navigate('/products')
        break
      case 'orders':
        navigate('/orders')
        break
      case 'tables':
        navigate('/tables')
        break
      case 'inventory':
        navigate('/ingredients')
        break
      case 'employees':
        navigate('/employees')
        break
      case 'sales':
        navigate('/sales-reports')
        break
      case 'payments':
        navigate('/payments')
        break
      case 'expiring':
        navigate('/expiration-control')
        break
      default:
        break
    }
  }

  if (loading) {
    return <PremiumLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <FloatingParticles />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
              Dashboard Administrativo
            </h1>
            <p className="text-gray-400 mt-2">
              Bem-vindo, {user?.name || 'Administrador'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="p-3 bg-glass-light backdrop-blur-sm rounded-xl border border-gold/20 hover:border-gold/40 transition-all duration-300"
            >
              <AppIcon name="user" className="w-6 h-6 text-gold" />
            </button>
            
            <button
              onClick={logout}
              className="p-3 bg-glass-light backdrop-blur-sm rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300"
            >
              <AppIcon name="logout" className="w-6 h-6 text-red-400" />
            </button>
          </div>
        </div>

        {/* Métricas em Tempo Real */}
        <PremiumSection title="Métricas em Tempo Real" className="mb-8">
          <PremiumGrid ref={dashboardRef}>
            {cardPermissions.products && (
              <MetricCard
                title="Total de Produtos"
                value={realTimeStats.totalProducts}
                icon="package"
                color="blue"
                onClick={() => handleCardClick('products')}
              />
            )}
            
            {cardPermissions.orders && (
              <MetricCard
                title="Pedidos Ativos"
                value={realTimeStats.activeOrders}
                icon="shopping-cart"
                color="green"
                onClick={() => handleCardClick('orders')}
              />
            )}
            
            {cardPermissions.tables && (
              <MetricCard
                title="Mesas Ocupadas"
                value={realTimeStats.occupiedTables}
                icon="users"
                color="purple"
                onClick={() => handleCardClick('tables')}
              />
            )}
            
            {cardPermissions.inventory && (
              <MetricCard
                title="Itens com Estoque Baixo"
                value={realTimeStats.lowStockItems}
                icon="alert-triangle"
                color="orange"
                onClick={() => handleCardClick('inventory')}
              />
            )}
            
            {cardPermissions.employees && (
              <MetricCard
                title="Total de Funcionários"
                value={realTimeStats.totalEmployees}
                icon="users"
                color="indigo"
                onClick={() => handleCardClick('employees')}
              />
            )}
            
            {cardPermissions.sales && (
              <MetricCard
                title="Vendas Hoje"
                value={`R$ ${realTimeStats.todaySales.toFixed(2)}`}
                icon="dollar-sign"
                color="gold"
                onClick={() => handleCardClick('sales')}
              />
            )}
            
            {cardPermissions.payments && (
              <MetricCard
                title="Pagamentos Pendentes"
                value={realTimeStats.pendingPayments}
                icon="credit-card"
                color="red"
                onClick={() => handleCardClick('payments')}
              />
            )}
            
            {cardPermissions.expiring && (
              <MetricCard
                title="Itens Vencendo"
                value={realTimeStats.expiringItems}
                icon="clock"
                color="yellow"
                onClick={() => handleCardClick('expiring')}
              />
            )}
          </PremiumGrid>
        </PremiumSection>

        {/* Ações Rápidas */}
        <PremiumSection title="Ações Rápidas" className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Gestão de Produtos */}
            {quickActionsPermissions.productManagement && (
              <button 
                onClick={() => navigate('/products')}
                className="px-4 py-3 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors text-sm font-medium"
              >
                📦 Produtos
              </button>
            )}
            
            {/* Gestão de Funcionários */}
            {quickActionsPermissions.employeeManagement && (
              <button 
                onClick={() => navigate('/employees')}
                className="px-4 py-3 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors text-sm font-medium"
              >
                👥 Funcionários
              </button>
            )}
            
            {/* Gestão de Mesas */}
            {quickActionsPermissions.tableManagement && (
              <button 
                onClick={() => navigate('/tables')}
                className="px-4 py-3 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors text-sm font-medium"
              >
                🪑 Mesas
              </button>
            )}
            
            {/* Gestão de Fornecedores */}
            {quickActionsPermissions.supplierManagement && (
              <button 
                onClick={() => navigate('/suppliers')}
                className="px-4 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors text-sm font-medium"
              >
                🏭 Fornecedores
              </button>
            )}
            
            {/* Gestão de Estoque */}
            {quickActionsPermissions.inventoryManagement && (
              <button 
                onClick={() => navigate('/ingredients')}
                className="px-4 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors text-sm font-medium"
              >
                📦 Gestão de Estoque
              </button>
            )}
            
            {/* Configurações */}
            {quickActionsPermissions.companySettings && (
              <button 
                onClick={() => navigate('/company-settings')}
                className="px-4 py-3 bg-neon-pink/20 text-neon-pink rounded-lg hover:bg-neon-pink/30 transition-colors text-sm font-medium"
              >
                🏢 Configurações
              </button>
            )}
            
            {/* Módulo Caixa */}
            {quickActionsPermissions.cashierModule && (
              <button 
                onClick={() => navigate('/cashier-dashboard')}
                className="px-4 py-3 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors text-sm font-medium"
              >
                💰 Módulo Caixa
              </button>
            )}
            
            {/* Dashboard Operacional */}
            {quickActionsPermissions.operationalDashboard && (
              <button 
                onClick={() => navigate('/operational-dashboard')}
                className="px-4 py-3 bg-neon-orange/20 text-neon-orange rounded-lg hover:bg-neon-orange/30 transition-colors text-sm font-medium"
              >
                📈 Dashboard Operacional
              </button>
            )}
            
            {/* Receitas */}
            {quickActionsPermissions.recipes && (
              <button 
                onClick={() => navigate('/recipes')}
                className="px-4 py-3 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors text-sm font-medium"
              >
                👨‍🍳 Receitas
              </button>
            )}
            
            {/* Controle Vencimentos */}
            {quickActionsPermissions.expirationControl && (
              <button 
                onClick={() => navigate('/expiration-control')}
                className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                ⚠️ Controle Vencimentos
              </button>
            )}
            
            {/* Relatórios Avançados */}
            {quickActionsPermissions.viewReports && (
              <button 
                onClick={() => navigate('/advanced-reports')}
                className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                📊 Relatórios Avançados
              </button>
            )}
            
            {/* Configurações do Sistema */}
            {quickActionsPermissions.manageSettings && (
              <button 
                onClick={() => navigate('/system-settings')}
                className="px-4 py-3 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-sm font-medium"
              >
                ⚙️ Configurações Sistema
              </button>
            )}
            
            {/* Gerenciamento de Backup */}
            {quickActionsPermissions.manageBackups && (
              <button 
                onClick={() => navigate('/backup-management')}
                className="px-4 py-3 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
              >
                Gerenciar Backups
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
