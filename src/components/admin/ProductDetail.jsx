import { useEffect } from 'react'
import { ImageUploadService } from '../../services/imageUploadService'
import { useStore } from '../../contexts/StoreContext'
import anime from 'animejs'

export default function ProductDetail({ product, onClose, onEdit }) {
  const { categories } = useStore()

  // Animate component on mount
  useEffect(() => {
    anime({
      targets: '.detail-section',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      easing: 'easeOutCubic'
    })
  }, [])

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!product) return null

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gold">Detalhes do Produto</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/40 text-gold/80 flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem do produto */}
        <div className="detail-section">
          {product.image_path ? (
            <div className="relative">
              <img 
                src={ImageUploadService.getImageUrl(product.image_path)} 
                alt={product.name} 
                className="w-full h-64 object-cover rounded-lg border border-gold/30" 
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 rounded-b-lg">
                <p className="text-xs text-gold/80">
                  Imagem: {product.image_path.split('/').pop()}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-black/40 rounded-lg flex items-center justify-center text-gold/40 border border-gold/30">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="mt-2">Sem imagem</p>
              </div>
            </div>
          )}
        </div>

        {/* Informações básicas */}
        <div className="detail-section space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
            <p className="text-gold/80">{getCategoryName(product.category_id)}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <p className="text-gold/60 text-sm">Preço</p>
              <p className="text-neon-green font-bold text-xl">{formatPrice(product.price)}</p>
            </div>
            <div>
              <p className="text-gold/60 text-sm">Tempo de Preparo</p>
              <p className="text-white">{product.prep_time || '-'} minutos</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${product.available ? 'bg-neon-green' : 'bg-red-500'}`}></div>
              <span className="text-gold/80">
                {product.available ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${product.show_in_menu ? 'bg-neon-cyan' : 'bg-gray-500'}`}></div>
              <span className="text-gold/80">
                {product.show_in_menu ? 'Visível no Menu' : 'Oculto no Menu'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onEdit(product)}
            className="btn-luxury w-full mt-4"
          >
            Editar Produto
          </button>
        </div>
      </div>

      {/* Descrição e ingredientes */}
      <div className="mt-6 space-y-4">
        <div className="detail-section">
          <h3 className="text-gold font-medium mb-2">Descrição</h3>
          <p className="text-white bg-black/30 p-3 rounded-lg">
            {product.description || 'Sem descrição'}
          </p>
        </div>

        <div className="detail-section">
          <h3 className="text-gold font-medium mb-2">Ingredientes</h3>
          <p className="text-white bg-black/30 p-3 rounded-lg">
            {product.ingredients || 'Ingredientes não especificados'}
          </p>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm detail-section">
        <div>
          <p className="text-gold/60">ID do Produto</p>
          <p className="text-white">{product.id}</p>
        </div>
        <div>
          <p className="text-gold/60">Criado em</p>
          <p className="text-white">{formatDate(product.created_at)}</p>
        </div>
        <div>
          <p className="text-gold/60">Última atualização</p>
          <p className="text-white">{formatDate(product.updated_at)}</p>
        </div>
      </div>
    </div>
  )
}
