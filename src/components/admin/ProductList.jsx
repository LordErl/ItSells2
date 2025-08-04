import { useState, useEffect } from 'react'
import { StoreService } from '../../services/storeService'
import { ImageUploadService } from '../../services/imageUploadService'
import { useStore } from '../../contexts/StoreContext'
import anime from 'animejs'

export default function ProductList({ onEdit, onView }) {
  const { products, categories, refreshProducts } = useStore()
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Initialize filtered products
  useEffect(() => {
    if (products) {
      setFilteredProducts(products)
    }
  }, [products])

  // Apply filters when search term or category filter changes
  useEffect(() => {
    if (!products) return
    
    let filtered = [...products]
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term) ||
        product.ingredients?.toLowerCase().includes(term)
      )
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category_id === categoryFilter)
    }
    
    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter])

  // Animate list on mount
  useEffect(() => {
    if (filteredProducts.length > 0) {
      anime({
        targets: '.product-item',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        easing: 'easeOutCubic'
      })
    }
  }, [filteredProducts])

  // Handle product deletion
  const handleDelete = async (productId) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await StoreService.deleteProduct(productId)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir produto')
      }
      
      // Refresh products list
      refreshProducts()
      
      // Clear confirmation
      setConfirmDelete(null)
      
    } catch (error) {
      console.error('Error deleting product:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Get category name by id
  const getCategoryName = (categoryId) => {
    const category = categories?.find(c => c.id === categoryId)
    return category?.name || 'Sem categoria'
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold text-gold mb-6">Produtos Cadastrados</h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gold/80 mb-1">Buscar</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, descrição ou ingredientes..."
            className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-gold/80 mb-1">Filtrar por Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            {categories?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gold/60">
          {products?.length > 0 
            ? 'Nenhum produto encontrado com os filtros aplicados.' 
            : 'Nenhum produto cadastrado.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/30">
                <th className="text-left py-2 px-3 text-gold/80">Imagem</th>
                <th className="text-left py-2 px-3 text-gold/80">Nome</th>
                <th className="text-left py-2 px-3 text-gold/80">Categoria</th>
                <th className="text-left py-2 px-3 text-gold/80">Preço</th>
                <th className="text-left py-2 px-3 text-gold/80">Preparo</th>
                <th className="text-left py-2 px-3 text-gold/80">Status</th>
                <th className="text-right py-2 px-3 text-gold/80">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr 
                  key={product.id} 
                  className="product-item border-b border-gold/10 hover:bg-black/20"
                >
                  <td className="py-3 px-3">
                    {product.image_path ? (
                      <img 
                        src={ImageUploadService.getImageUrl(product.image_path)} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center text-gold/40">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {product.name}
                    {product.show_in_menu ? (
                      <span className="ml-2 text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full">
                        Visível no Menu
                      </span>
                    ) : (
                      <span className="ml-2 text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full">
                        Oculto no Menu
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gold/80">
                    {getCategoryName(product.category_id)}
                  </td>
                  <td className="py-3 px-3 text-neon-green font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="py-3 px-3 text-gold/80">
                    {product.prep_time || '-'} min
                  </td>
                  <td className="py-3 px-3">
                    {product.available ? (
                      <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded-full">
                        Disponível
                      </span>
                    ) : (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                        Indisponível
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onView(product)}
                      className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="px-2 py-1 bg-gold/20 text-gold rounded hover:bg-gold/30 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(product.id)}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gold mb-4">Confirmar Exclusão</h3>
            <p className="text-white mb-6">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-black/40 text-gold/80 rounded-lg hover:bg-black/60 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
