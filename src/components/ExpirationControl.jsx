import React, { useState, useEffect } from 'react'
import { BatchService } from '../services/batchService'
import { ImageUploadService } from '../services/imageUploadService'

const ExpirationControl = () => {
  const [expiringBatches, setExpiringBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, critical, warning, expired
  const [sortBy, setSortBy] = useState('expiration') // expiration, priority, product

  useEffect(() => {
    loadExpiringBatches()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadExpiringBatches, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadExpiringBatches = async () => {
    setLoading(true)
    try {
      const result = await BatchService.getExpiringBatches(14) // Next 14 days
      
      if (result.success) {
        setExpiringBatches(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar lotes próximos ao vencimento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkExpired = async (batchId, productName) => {
    if (confirm(`Tem certeza que deseja marcar "${productName}" como vencido?`)) {
      const result = await BatchService.markBatchAction(
        batchId, 
        'expired', 
        `Marcado como vencido pelo staff em ${new Date().toLocaleString('pt-BR')}`
      )
      
      if (result.success) {
        loadExpiringBatches()
        alert('Produto marcado como vencido')
      } else {
        alert('Erro ao marcar produto: ' + result.error)
      }
    }
  }

  const handleDispose = async (batchId, productName) => {
    const notes = prompt(`Motivo do descarte de "${productName}":`)
    if (notes !== null) {
      const result = await BatchService.markBatchAction(
        batchId, 
        'disposed', 
        `Descartado: ${notes} - ${new Date().toLocaleString('pt-BR')}`
      )
      
      if (result.success) {
        loadExpiringBatches()
        alert('Produto descartado com sucesso')
      } else {
        alert('Erro ao descartar produto: ' + result.error)
      }
    }
  }

  const getFilteredAndSortedBatches = () => {
    let filtered = expiringBatches

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(batch => batch.expiration_status === filter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'expiration':
          return new Date(a.expiration_date) - new Date(b.expiration_date)
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'product':
          return a.products?.name.localeCompare(b.products?.name)
        default:
          return 0
      }
    })

    return filtered
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⏰'
      default: return 'ℹ️'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusCounts = () => {
    return {
      all: expiringBatches.length,
      critical: expiringBatches.filter(b => b.expiration_status === 'critical').length,
      warning: expiringBatches.filter(b => b.expiration_status === 'warning').length,
      expired: expiringBatches.filter(b => b.expiration_status === 'expired').length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-yellow-400 mt-4">Verificando vencimentos...</p>
        </div>
      </div>
    )
  }

  const statusCounts = getStatusCounts()
  const filteredBatches = getFilteredAndSortedBatches()

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          ⏰ Controle de Vencimentos
        </h1>
        <p className="text-gray-300">
          Monitore produtos próximos ao vencimento e tome ações necessárias
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Última atualização: {formatDateTime(new Date())}
        </p>
      </div>

      {/* Alert Summary */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">🚨</span>
          <div>
            <h2 className="text-xl font-bold text-red-400">Alertas de Vencimento</h2>
            <p className="text-gray-300">Produtos que requerem atenção imediata</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{statusCounts.expired}</p>
            <p className="text-sm text-gray-400">Vencidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{statusCounts.critical}</p>
            <p className="text-sm text-gray-400">Críticos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{statusCounts.warning}</p>
            <p className="text-sm text-gray-400">Atenção</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{statusCounts.all}</p>
            <p className="text-sm text-gray-400">Total</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Filtrar por Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">Todos ({statusCounts.all})</option>
                <option value="expired">Vencidos ({statusCounts.expired})</option>
                <option value="critical">Críticos ({statusCounts.critical})</option>
                <option value="warning">Atenção ({statusCounts.warning})</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="expiration">Data de Vencimento</option>
                <option value="priority">Prioridade</option>
                <option value="product">Nome do Produto</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadExpiringBatches}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-700">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-xl font-bold text-green-400 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'Não há produtos próximos ao vencimento'
                : `Não há produtos com status "${filter}"`
              }
            </p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <div 
              key={batch.id} 
              className={`bg-gray-900 rounded-lg border-l-4 ${
                batch.expiration_status === 'expired' ? 'border-red-500' :
                batch.expiration_status === 'critical' ? 'border-orange-500' :
                'border-yellow-500'
              } border border-gray-700 overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    {batch.products?.image_path && (
                      <img
                        src={ImageUploadService.getImageUrl(batch.products.image_path)}
                        alt={batch.products?.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {batch.products?.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getPriorityColor(batch.priority)}`}>
                          {getPriorityIcon(batch.priority)} {batch.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Lote</p>
                          <p className="font-mono text-white">{batch.batch_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Quantidade</p>
                          <p className="text-white">{batch.quantity} unidades</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Vencimento</p>
                          <p className="text-white">{formatDate(batch.expiration_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p className={`font-medium ${
                            batch.expiration_status === 'expired' ? 'text-red-400' :
                            batch.expiration_status === 'critical' ? 'text-orange-400' :
                            'text-yellow-400'
                          }`}>
                            {batch.expiration_status === 'expired' ? 'VENCIDO' :
                             batch.expiration_status === 'critical' ? `${batch.days_until_expiration} dia(s) restante(s)` :
                             `${batch.days_until_expiration} dias restantes`
                            }
                          </p>
                        </div>
                      </div>

                      {batch.supplier && (
                        <div className="mt-3">
                          <p className="text-gray-400 text-sm">
                            Fornecedor: <span className="text-white">{batch.supplier}</span>
                          </p>
                        </div>
                      )}

                      {batch.location && (
                        <div className="mt-1">
                          <p className="text-gray-400 text-sm">
                            Localização: <span className="text-white">{batch.location}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {batch.expiration_status === 'expired' || batch.expiration_status === 'critical' ? (
                      <>
                        <button
                          onClick={() => handleMarkExpired(batch.id, batch.products?.name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ❌ Marcar Vencido
                        </button>
                        <button
                          onClick={() => handleDispose(batch.id, batch.products?.name)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑️ Descartar
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-gray-500 text-sm">Monitorando</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                {batch.notes && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Observações:</p>
                    <p className="text-white text-sm">{batch.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions Footer */}
      {filteredBatches.length > 0 && (
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <span className="text-2xl block mb-2">🚨</span>
              <p className="text-red-400 font-medium">Produtos Vencidos</p>
              <p className="text-gray-400 text-sm">Remover imediatamente do estoque</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <span className="text-2xl block mb-2">⚠️</span>
              <p className="text-orange-400 font-medium">Produtos Críticos</p>
              <p className="text-gray-400 text-sm">Usar prioritariamente ou descartar</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <span className="text-2xl block mb-2">⏰</span>
              <p className="text-yellow-400 font-medium">Produtos em Atenção</p>
              <p className="text-gray-400 text-sm">Monitorar e planejar uso</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpirationControl
