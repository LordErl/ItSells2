import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { StoreService } from '../services/storeService'
import { ORDER_ITEM_STATUS } from '../lib/constants'
import anime from 'animejs'

export default function OperationalDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    pendingItems: 0,
    preparingItems: 0,
    readyItems: 0,
    occupiedTables: 0
  })
  const [pendingItems, setPendingItems] = useState([])
  const [producingItems, setProducingItems] = useState([])
  const [readyItems, setReadyItems] = useState([])
  const [deliveringItems, setDeliveringItems] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [loading, setLoading] = useState(false)
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
    loadDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsResult, pendingResult, producingResult, readyResult, deliveringResult] = await Promise.all([
        StoreService.getDashboardStats(),
        StoreService.getPendingOrderItems(),
        StoreService.getProducingOrderItems(),
        StoreService.getReadyOrderItems(),
        StoreService.getDeliveringOrderItems()
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      }

      if (pendingResult.success) {
        setPendingItems(pendingResult.data)
      }

      if (producingResult.success) {
        setProducingItems(producingResult.data)
      }

      if (readyResult.success) {
        setReadyItems(readyResult.data)
      }

      if (deliveringResult.success) {
        setDeliveringItems(deliveringResult.data)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleStatusUpdate = async (itemId, newStatus) => {
    setLoading(true)
    try {
      const result = await StoreService.updateOrderItemStatus(itemId, newStatus)
      if (result.success) {
        // Refresh data
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Error updating item status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_ITEM_STATUS.PENDING:
        return 'text-neon-pink bg-neon-pink/20'
      case ORDER_ITEM_STATUS.PRODUCING:
        return 'text-neon-cyan bg-neon-cyan/20'
      case ORDER_ITEM_STATUS.READY:
        return 'text-neon-green bg-neon-green/20'
      case ORDER_ITEM_STATUS.DELIVERING:
        return 'text-yellow-400 bg-yellow-400/20'
      case ORDER_ITEM_STATUS.DELIVERED:
        return 'text-gold bg-gold/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case ORDER_ITEM_STATUS.PENDING:
        return 'Pendente'
      case ORDER_ITEM_STATUS.PRODUCING:
        return 'Produzindo'
      case ORDER_ITEM_STATUS.READY:
        return 'Pronto'
      case ORDER_ITEM_STATUS.DELIVERING:
        return 'Entregando'
      case ORDER_ITEM_STATUS.DELIVERED:
        return 'Entregue'
      default:
        return 'Desconhecido'
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Component for preparation timer
  const PrepTimer = ({ startedAt, prepTime }) => {
    const [elapsed, setElapsed] = useState(0)
    const [isOverdue, setIsOverdue] = useState(false)

    useEffect(() => {
      if (!startedAt) return

      const interval = setInterval(() => {
        const now = new Date()
        const started = new Date(startedAt)
        const elapsedMinutes = Math.floor((now - started) / (1000 * 60))
        
        setElapsed(elapsedMinutes)
        setIsOverdue(prepTime && elapsedMinutes > prepTime)
      }, 1000)

      return () => clearInterval(interval)
    }, [startedAt, prepTime])

    const formatElapsed = (minutes) => {
      if (minutes < 60) return `${minutes}min`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}min`
    }

    return (
      <div className={`text-xs px-2 py-1 rounded ${
        isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
      }`}>
        ⏱️ {formatElapsed(elapsed)}
        {prepTime && (
          <span className="ml-1 opacity-70">/ {prepTime}min</span>
        )}
      </div>
    )
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
              Bem-vindo, {user?.name} • Área de Produção
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4" ref={dashboardRef}>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="metric-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{pendingItems.length}</div>
              <div className="text-gold/70 text-sm">Pendentes</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-neon-cyan mb-2">{producingItems.length}</div>
              <div className="text-gold/70 text-sm">Em Produção</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-neon-green mb-2">{readyItems.length}</div>
              <div className="text-gold/70 text-sm">Prontos</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold mb-2">{stats.occupiedTables}</div>
              <div className="text-gold/70 text-sm">Mesas Ocupadas</div>
            </div>
          </div>
        </div>

        {/* Production Areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-pink/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-pink mb-2">Área de Preparação 1</h3>
              <p className="text-gold/70 text-sm mb-4">
                Cozinha - Pratos e Lanches
              </p>
              <button 
                onClick={() => setSelectedArea(1)}
                className="btn-luxury w-full"
              >
                Abrir Área
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-cyan mb-2">Área de Preparação 2</h3>
              <p className="text-gold/70 text-sm mb-4">
                Bar - Bebidas e Sucos
              </p>
              <button 
                onClick={() => setSelectedArea(2)}
                className="px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors w-full font-medium"
              >
                Abrir Área
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neon-green mb-2">Área de Preparação 3</h3>
              <p className="text-gold/70 text-sm mb-4">
                Geral - Todos os Itens
              </p>
              <button 
                onClick={() => setSelectedArea(3)}
                className="px-6 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors w-full font-medium"
              >
                Abrir Área
              </button>
            </div>
          </div>
        </div>

        {/* Waiter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Visão do Garçom</h3>
              <p className="text-gold/70 text-sm mb-4">
                Monitorar itens prontos para entrega
              </p>
              <button 
                onClick={() => setSelectedArea('waiter')}
                className="px-6 py-3 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors w-full font-medium"
              >
                Ver Itens Prontos
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-500 mb-2">Módulo de Caixa</h3>
              <p className="text-gold/70 text-sm mb-4">
                Processar pagamentos e vendas
              </p>
              <button 
                onClick={() => navigate('/cashier-dashboard')}
                className="px-6 py-3 bg-purple-500/20 text-purple-500 rounded-lg hover:bg-purple-500/30 transition-colors w-full font-medium"
              >
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>

        {/* Production Area View */}
        {selectedArea && selectedArea !== 'waiter' && (
          <div className="glass-card p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gold">
                Área de Preparação {selectedArea}
              </h2>
              <button
                onClick={() => setSelectedArea(null)}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Fechar
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pending Items Column */}
              <div>
                <h3 className="text-lg font-bold text-orange-400 mb-4">📋 Itens Pendentes</h3>
                <div className="space-y-3">
                  {pendingItems
                    .filter(item => {
                      if (selectedArea === 3) return true // Show all items for area 3
                      const category = item.products?.categories?.name?.toLowerCase()
                      const foodCategories = ['pratos', 'lanches', 'sobremesas']
                      const drinkCategories = ['bebidas', 'sucos', 'cafes']
                      
                      if (selectedArea === 1) return foodCategories.includes(category)
                      if (selectedArea === 2) return drinkCategories.includes(category)
                      return true
                    })
                    .map((item) => (
                      <div key={item.id} className="bg-black/20 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-gold font-medium">{item.products?.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        <div className="text-gold/70 text-sm space-y-1 mb-3">
                          <p>Mesa: {item.orders?.table_id || 'Balcão'}</p>
                          <p>Cliente: {item.orders?.users?.name || 'N/A'}</p>
                          <p>Quantidade: {item.quantity}</p>
                          <p>Pedido às: {formatTime(item.created_at)}</p>
                          {item.products?.prep_time && (
                            <p className="text-blue-400">⏱️ Tempo estimado: {item.products.prep_time}min</p>
                          )}
                          {item.observations && <p>Obs: {item.observations}</p>}
                        </div>
                        <button
                          onClick={() => handleStatusUpdate(item.id, ORDER_ITEM_STATUS.PRODUCING)}
                          className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors w-full"
                          disabled={loading}
                        >
                          🔥 Iniciar Preparo
                        </button>
                      </div>
                    ))}
                  
                  {pendingItems.filter(item => {
                    if (selectedArea === 3) return true
                    const category = item.products?.categories?.name?.toLowerCase()
                    const foodCategories = ['pratos', 'lanches', 'sobremesas']
                    const drinkCategories = ['bebidas', 'sucos', 'cafes']
                    
                    if (selectedArea === 1) return foodCategories.includes(category)
                    if (selectedArea === 2) return drinkCategories.includes(category)
                    return true
                  }).length === 0 && (
                    <div className="text-center py-8 text-gold/60">
                      <p>Nenhum item pendente nesta área</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Producing Items Column */}
              <div>
                <h3 className="text-lg font-bold text-neon-cyan mb-4">🔥 Em Preparo</h3>
                <div className="space-y-3">
                  {producingItems
                    .filter(item => {
                      if (selectedArea === 3) return true // Show all items for area 3
                      const category = item.products?.categories?.name?.toLowerCase()
                      const foodCategories = ['pratos', 'lanches', 'sobremesas']
                      const drinkCategories = ['bebidas', 'sucos', 'cafes']
                      
                      if (selectedArea === 1) return foodCategories.includes(category)
                      if (selectedArea === 2) return drinkCategories.includes(category)
                      return true
                    })
                    .map((item) => (
                      <div key={item.id} className="bg-black/20 rounded-lg p-4 border-l-4 border-neon-cyan">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-gold font-medium">{item.products?.name}</h4>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                            {item.started_at && (
                              <PrepTimer 
                                startedAt={item.started_at} 
                                prepTime={item.products?.prep_time}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-gold/70 text-sm space-y-1 mb-3">
                          <p>Mesa: {item.orders?.table_id || 'Balcão'}</p>
                          <p>Cliente: {item.orders?.users?.name || 'N/A'}</p>
                          <p>Quantidade: {item.quantity}</p>
                          <p>Iniciado às: {formatTime(item.started_at || item.created_at)}</p>
                          {item.observations && <p>Obs: {item.observations}</p>}
                        </div>
                        <button
                          onClick={() => handleStatusUpdate(item.id, ORDER_ITEM_STATUS.READY)}
                          className="px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors w-full"
                          disabled={loading}
                        >
                          ✅ Marcar como Pronto
                        </button>
                      </div>
                    ))}
                  
                  {producingItems.filter(item => {
                    if (selectedArea === 3) return true
                    const category = item.products?.categories?.name?.toLowerCase()
                    const foodCategories = ['pratos', 'lanches', 'sobremesas']
                    const drinkCategories = ['bebidas', 'sucos', 'cafes']
                    
                    if (selectedArea === 1) return foodCategories.includes(category)
                    if (selectedArea === 2) return drinkCategories.includes(category)
                    return true
                  }).length === 0 && (
                    <div className="text-center py-8 text-gold/60">
                      <p>Nenhum item em preparo nesta área</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiter View */}
        {selectedArea === 'waiter' && (
          <div className="glass-card p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gold">Visão do Garçom - Itens para Entrega</h2>
              <button
                onClick={() => setSelectedArea(null)}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Fechar
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ready Items */}
              <div>
                <h3 className="text-lg font-bold text-neon-green mb-4">Itens Prontos</h3>
                <div className="space-y-3">
                  {readyItems.map((item) => (
                    <div key={item.id} className="bg-black/20 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-gold font-medium">{item.products?.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      <div className="text-gold/70 text-sm space-y-1 mb-3">
                        <p>Mesa: {item.orders?.tables?.number || 'Balcão'}</p>
                        <p>Cliente: {item.orders?.users?.name || 'N/A'}</p>
                        <p>Quantidade: {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => handleStatusUpdate(item.id, ORDER_ITEM_STATUS.DELIVERING)}
                        className="px-4 py-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors w-full"
                        disabled={loading}
                      >
                        Entregando
                      </button>
                    </div>
                  ))}
                  
                  {readyItems.length === 0 && (
                    <div className="text-center py-4 text-gold/60">
                      <p>Nenhum item pronto</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivering Items */}
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Itens em Entrega</h3>
                <div className="space-y-3">
                  {deliveringItems.map((item) => (
                    <div key={item.id} className="bg-black/20 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-gold font-medium">{item.products?.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      <div className="text-gold/70 text-sm space-y-1 mb-3">
                        <p>Mesa: {item.orders?.tables?.number || 'Balcão'}</p>
                        <p>Cliente: {item.orders?.users?.name || 'N/A'}</p>
                        <p>Quantidade: {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => handleStatusUpdate(item.id, ORDER_ITEM_STATUS.DELIVERED)}
                        className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors w-full"
                        disabled={loading}
                      >
                        Confirmar Entrega
                      </button>
                    </div>
                  ))}
                  
                  {deliveringItems.length === 0 && (
                    <div className="text-center py-4 text-gold/60">
                      <p>Nenhum item sendo entregue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
