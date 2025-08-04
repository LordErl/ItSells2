import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import ProductList from '../components/admin/ProductList'
import ProductForm from '../components/admin/ProductForm'
import ProductDetail from '../components/admin/ProductDetail'
import anime from 'animejs'

export default function ProductManagement() {
  const { user } = useAuth()
  const { refreshProducts, refreshCategories } = useStore()
  const navigate = useNavigate()
  
  const [view, setView] = useState('list') // list, form, detail
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        refreshProducts(),
        refreshCategories()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [refreshProducts, refreshCategories])

  // Animate page on mount
  useEffect(() => {
    anime({
      targets: '.page-header, .page-content',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(200),
      easing: 'easeOutCubic'
    })
  }, [])

  // Handle view product
  const handleViewProduct = (product) => {
    setSelectedProduct(product)
    setView('detail')
  }

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setView('form')
  }

  // Handle new product
  const handleNewProduct = () => {
    setSelectedProduct(null)
    setView('form')
  }

  // Handle save product
  const handleSaveProduct = () => {
    // Return to list view
    setView('list')
    setSelectedProduct(null)
  }

  // Handle cancel form
  const handleCancelForm = () => {
    if (selectedProduct) {
      // If editing, return to detail view
      setView('detail')
    } else {
      // If creating new, return to list view
      setView('list')
    }
  }

  // Handle close detail
  const handleCloseDetail = () => {
    setView('list')
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6 page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">
              Gerenciamento de Produtos
            </h1>
            <p className="text-gold/80 text-sm">
              Cadastre, edite e gerencie os produtos do seu estabelecimento
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-black/40 text-gold/80 rounded-lg hover:bg-black/60 transition-colors"
            >
              Voltar ao Dashboard
            </button>
            {view === 'list' && (
              <button
                onClick={handleNewProduct}
                className="btn-luxury"
              >
                Novo Produto
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 pb-8 page-content">
        {isLoading ? (
          <div className="glass-card p-6 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-neon-cyan border-gold/30 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gold/80">Carregando produtos...</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'list' && (
              <ProductList 
                onEdit={handleEditProduct} 
                onView={handleViewProduct} 
              />
            )}
            
            {view === 'form' && (
              <ProductForm 
                product={selectedProduct} 
                onSave={handleSaveProduct} 
                onCancel={handleCancelForm} 
              />
            )}
            
            {view === 'detail' && selectedProduct && (
              <ProductDetail 
                product={selectedProduct} 
                onClose={handleCloseDetail} 
                onEdit={() => handleEditProduct(selectedProduct)} 
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
