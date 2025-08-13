import React, { useState, useEffect } from 'react'
import { BatchService } from '../services/batchService'
import { StoreService } from '../services/storeService'
import { ImageUploadService } from '../services/imageUploadService'

const BatchManagement = () => {
  const [batches, setBatches] = useState([])
  const [products, setProducts] = useState([])
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBatch, setNewBatch] = useState({
    product_id: '',
    batch_number: '',
    quantity: '',
    unit_cost: '',
    supplier: '',
    manufacturing_date: '',
    expiration_date: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load batches, products, and statistics
      const [batchesResult, productsResult, statsResult] = await Promise.all([
        BatchService.getAllBatches(),
        StoreService.getProducts(),
        BatchService.getBatchStatistics()
      ])

      if (batchesResult.success) setBatches(batchesResult.data)
      if (productsResult.success) setProducts(productsResult.data)
      if (statsResult.success) setStatistics(statsResult.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    
    try {
      const result = await BatchService.createBatch(newBatch)
      
      if (result.success) {
        setShowCreateModal(false)
        setNewBatch({
          product_id: '',
          batch_number: '',
          quantity: '',
          unit_cost: '',
          supplier: '',
          manufacturing_date: '',
          expiration_date: '',
          location: '',
          notes: ''
        })
        loadData() // Reload data
        alert('Lote criado com sucesso!')
      } else {
        alert('Erro ao criar lote: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao criar lote:', error)
      alert('Erro ao criar lote')
    }
  }

  const handleMarkExpired = async (batchId) => {
    if (confirm('Tem certeza que deseja marcar este lote como vencido?')) {
      const result = await BatchService.markBatchAction(batchId, 'expired', 'Marcado como vencido pelo staff')
      
      if (result.success) {
        loadData()
        alert('Lote marcado como vencido')
      } else {
        alert('Erro ao marcar lote: ' + result.error)
      }
    }
  }

  const getExpirationStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'bg-red-500'
      case 'critical': return 'bg-orange-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getExpirationStatusText = (status, days) => {
    if (status === 'expired') return 'Vencido'
    if (status === 'critical') return `${days} dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`
    if (status === 'warning') return `${days} dias restantes`
    return 'OK'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-yellow-400 mt-4">Carregando lotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          📦 Controle de Lotes
        </h1>
        <p className="text-gray-300">
          Gerencie lotes de produtos, validades e estoque
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Lotes Ativos</p>
              <p className="text-2xl font-bold text-blue-400">
                {statistics.total_active_batches || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Vencendo em 7 dias</p>
              <p className="text-2xl font-bold text-yellow-400">
                {statistics.expiring_soon || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-500/20">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Vencidos</p>
              <p className="text-2xl font-bold text-red-400">
                {statistics.expired || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-500/20">
              <span className="text-2xl">📉</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Estoque Baixo</p>
              <p className="text-2xl font-bold text-orange-400">
                {statistics.low_stock || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

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
            onClick={() => setActiveTab('expiring')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'expiring'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Próximos ao Vencimento
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ➕ Novo Lote
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Todos os Lotes Ativos
            </h2>
            
            {batches.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Nenhum lote encontrado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">Produto</th>
                      <th className="text-left py-3 px-4 text-gray-400">Lote</th>
                      <th className="text-left py-3 px-4 text-gray-400">Quantidade</th>
                      <th className="text-left py-3 px-4 text-gray-400">Fornecedor</th>
                      <th className="text-left py-3 px-4 text-gray-400">Fabricação</th>
                      <th className="text-left py-3 px-4 text-gray-400">Vencimento</th>
                      <th className="text-left py-3 px-4 text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr key={batch.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {batch.products?.image_path && (
                              <img
                                src={ImageUploadService.getImageUrl(batch.products.image_path)}
                                alt={batch.products?.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <p className="font-medium">{batch.products?.name}</p>
                              <p className="text-sm text-gray-400">
                                {batch.products?.categories?.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {batch.batch_number}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            batch.quantity <= 10 ? 'bg-red-500/20 text-red-400' : 'text-white'
                          }`}>
                            {batch.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {batch.supplier || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {formatDate(batch.manufacturing_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {formatDate(batch.expiration_date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm text-white ${getExpirationStatusColor(batch.expiration_status)}`}>
                            {getExpirationStatusText(batch.expiration_status, batch.days_until_expiration)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {batch.expiration_status === 'expired' || batch.expiration_status === 'critical' ? (
                            <button
                              onClick={() => handleMarkExpired(batch.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Marcar Vencido
                            </button>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'expiring' && (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Produtos Próximos ao Vencimento
            </h2>
            
            {batches.filter(b => b.expiration_status !== 'ok').length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Nenhum produto próximo ao vencimento
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches
                  .filter(batch => batch.expiration_status !== 'ok')
                  .map((batch) => (
                    <div key={batch.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        {batch.products?.image_path && (
                          <img
                            src={ImageUploadService.getImageUrl(batch.products.image_path)}
                            alt={batch.products?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <span className={`px-2 py-1 rounded text-sm text-white ${getExpirationStatusColor(batch.expiration_status)}`}>
                          {getExpirationStatusText(batch.expiration_status, batch.days_until_expiration)}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-white mb-1">
                        {batch.products?.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Lote: {batch.batch_number}
                      </p>
                      <p className="text-gray-400 text-sm mb-2">
                        Quantidade: {batch.quantity}
                      </p>
                      <p className="text-gray-400 text-sm mb-3">
                        Vence em: {formatDate(batch.expiration_date)}
                      </p>
                      
                      {(batch.expiration_status === 'expired' || batch.expiration_status === 'critical') && (
                        <button
                          onClick={() => handleMarkExpired(batch.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm transition-colors"
                        >
                          Marcar como Vencido
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              Criar Novo Lote
            </h2>
            
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Produto *</label>
                  <select
                    value={newBatch.product_id}
                    onChange={(e) => setNewBatch({...newBatch, product_id: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Número do Lote *</label>
                  <input
                    type="text"
                    value={newBatch.batch_number}
                    onChange={(e) => setNewBatch({...newBatch, batch_number: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Ex: LT001-2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch({...newBatch, quantity: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Custo Unitário</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatch.unit_cost}
                    onChange={(e) => setNewBatch({...newBatch, unit_cost: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Fornecedor</label>
                  <input
                    type="text"
                    value={newBatch.supplier}
                    onChange={(e) => setNewBatch({...newBatch, supplier: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Localização</label>
                  <input
                    type="text"
                    value={newBatch.location}
                    onChange={(e) => setNewBatch({...newBatch, location: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Ex: Geladeira A, Prateleira 2"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Data de Fabricação *</label>
                  <input
                    type="date"
                    value={newBatch.manufacturing_date}
                    onChange={(e) => setNewBatch({...newBatch, manufacturing_date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Data de Vencimento *</label>
                  <input
                    type="date"
                    value={newBatch.expiration_date}
                    onChange={(e) => setNewBatch({...newBatch, expiration_date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Observações</label>
                <textarea
                  value={newBatch.notes}
                  onChange={(e) => setNewBatch({...newBatch, notes: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-24"
                  placeholder="Observações adicionais sobre o lote..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors"
                >
                  Criar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchManagement
