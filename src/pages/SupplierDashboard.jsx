import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { LogoWithText } from '../components/common/Logo'
import anime from 'animejs'

export default function SupplierDashboard() {
  const { user, logout } = useAuth()
  const { inventory, products } = useStore()
  const [selectedView, setSelectedView] = useState('overview')
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

  // Filter products and inventory for this supplier
  const supplierProducts = products?.filter(product => 
    product.supplier_id === user?.supplier_id
  ) || []

  const supplierInventory = inventory?.filter(item => 
    item.supplier_id === user?.supplier_id
  ) || []

  const stats = {
    totalProducts: supplierProducts.length,
    lowStockItems: supplierInventory.filter(item => item.quantity <= item.min_quantity).length,
    expiringItems: supplierInventory.filter(item => {
      const expiryDate = new Date(item.expiry_date)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    }).length,
    totalValue: supplierInventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gold/80 text-sm">Produtos Fornecidos</p>
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

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gold/80 text-sm">Vencimentos Próximos</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.expiringItems}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gold/80 text-sm">Valor Total</p>
              <p className="text-2xl font-bold text-neon-green">R$ {stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gold mb-2">Meus Produtos</h3>
            <p className="text-gold/70 text-sm mb-4">
              Visualizar produtos fornecidos no estabelecimento
            </p>
            <button 
              onClick={() => setSelectedView('products')}
              className="btn-luxury w-full"
            >
              Ver Produtos
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V5a2 2 0 114 0v1H8zm5 3a1 1 0 10-2 0 1 1 0 001 1v3a1 1 0 10-2 0v-3a1 1 0 001-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neon-cyan mb-2">Estoque</h3>
            <p className="text-gold/70 text-sm mb-4">
              Monitorar níveis de estoque dos seus produtos
            </p>
            <button 
              onClick={() => setSelectedView('inventory')}
              className="px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors w-full font-medium"
            >
              Ver Estoque
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-neon-pink/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neon-pink mb-2">Ponto de Pedido</h3>
            <p className="text-gold/70 text-sm mb-4">
              Criar pedidos de reposição automática
            </p>
            <button 
              onClick={() => setSelectedView('orders')}
              className="px-6 py-3 bg-neon-pink/20 text-neon-pink rounded-lg hover:bg-neon-pink/30 transition-colors w-full font-medium"
            >
              Fazer Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gold">Meus Produtos</h2>
        <button 
          onClick={() => setSelectedView('overview')}
          className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplierProducts.map(product => (
          <div key={product.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gold">{product.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                product.available 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {product.available ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            
            <p className="text-gold/70 text-sm mb-3">{product.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gold">
                R$ {product.price?.toFixed(2)}
              </span>
              <span className="text-gold/60 text-sm">
                Cat: {product.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gold">Controle de Estoque</h2>
        <button 
          onClick={() => setSelectedView('overview')}
          className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
        >
          Voltar
        </button>
      </div>

      <div className="space-y-4">
        {supplierInventory.map(item => {
          const expiryDate = new Date(item.expiry_date)
          const today = new Date()
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          
          const getStatusColor = () => {
            if (item.quantity <= item.min_quantity) return 'bg-red-500/20 text-red-400'
            if (daysUntilExpiry <= 7) return 'bg-yellow-500/20 text-yellow-500'
            return 'bg-green-500/20 text-green-400'
          }

          const getStatusText = () => {
            if (item.quantity <= item.min_quantity) return 'Estoque Baixo'
            if (daysUntilExpiry <= 7) return `Vence em ${daysUntilExpiry} dias`
            return 'OK'
          }

          return (
            <div key={item.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gold mb-1">{item.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gold/70">
                    <span>Qtd: {item.quantity} {item.unit}</span>
                    <span>Min: {item.min_quantity}</span>
                    <span>Venc: {expiryDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                  <p className="text-gold font-bold mt-1">
                    R$ {(item.quantity * item.unit_price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <LogoWithText size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-gold-gradient">
                Portal do Fornecedor
              </h1>
              <p className="text-gold/80 text-sm">
                Bem-vindo, {user?.name || user?.company_name}
              </p>
            </div>
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
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'products' && renderProducts()}
        {selectedView === 'inventory' && renderInventory()}
      </div>
    </div>
  )
}

