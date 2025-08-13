import React, { useState, useEffect } from 'react'
import { StoreService } from '../services/storeService'
import { ImageUploadService } from '../services/imageUploadService'

const MenuManagement = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    setLoading(true)
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        StoreService.getProducts(),
        StoreService.getCategories()
      ])

      if (productsResult.success) {
        setProducts(productsResult.data)
      }
      
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available'
    
    try {
      const result = await StoreService.updateProductStatus(productId, newStatus)
      
      if (result.success) {
        setProducts(products.map(product => 
          product.id === productId 
            ? { ...product, status: newStatus }
            : product
        ))
        
        const statusText = newStatus === 'available' ? 'disponível' : 'indisponível'
        alert(`Produto marcado como ${statusText}`)
      } else {
        alert('Erro ao atualizar status: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
      alert('Erro ao atualizar produto')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      newPrice: product.price
    })
    setShowEditModal(true)
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    try {
      const result = await StoreService.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.newPrice),
        status: editingProduct.status
      })

      if (result.success) {
        setProducts(products.map(product => 
          product.id === editingProduct.id 
            ? { ...product, ...result.data }
            : product
        ))
        
        setShowEditModal(false)
        setEditingProduct(null)
        alert('Produto atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar produto: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar alterações')
    }
  }

  const getFilteredProducts = () => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'unavailable': return 'bg-red-500'
      case 'out_of_stock': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'unavailable': return 'Indisponível'
      case 'out_of_stock': return 'Sem Estoque'
      default: return 'Desconhecido'
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-yellow-400 mt-4">Carregando menu...</p>
        </div>
      </div>
    )
  }

  const filteredProducts = getFilteredProducts()

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          🍽️ Gerenciamento do Menu
        </h1>
        <p className="text-gray-300">
          Atualize disponibilidade, preços e informações dos produtos
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Buscar Produto</label>
              <input
                type="text"
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400">
              {filteredProducts.length} produto(s) encontrado(s)
            </span>
            <button
              onClick={loadMenuData}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-800">
              {product.image_path ? (
                <img
                  src={ImageUploadService.getImageUrl(product.image_path)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl text-gray-600">🍽️</span>
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {categories.find(c => c.id === product.category_id)?.name}
                  </p>
                  {product.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleAvailability(product.id, product.status)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    product.status === 'available'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {product.status === 'available' ? '❌ Indisponibilizar' : '✅ Disponibilizar'}
                </button>
                
                <button
                  onClick={() => handleEditProduct(product)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">
                  ✏️ Editar Produto
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      name: e.target.value
                    })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Descrição</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      description: e.target.value
                    })}
                    rows="3"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Preço</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.newPrice}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        newPrice: e.target.value
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      status: e.target.value
                    })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="available">Disponível</option>
                    <option value="unavailable">Indisponível</option>
                    <option value="out_of_stock">Sem Estoque</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  💾 Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">Estatísticas do Menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {products.filter(p => p.status === 'available').length}
            </p>
            <p className="text-gray-400 text-sm">Disponíveis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">
              {products.filter(p => p.status === 'unavailable').length}
            </p>
            <p className="text-gray-400 text-sm">Indisponíveis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {products.filter(p => p.status === 'out_of_stock').length}
            </p>
            <p className="text-gray-400 text-sm">Sem Estoque</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {products.length}
            </p>
            <p className="text-gray-400 text-sm">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuManagement
