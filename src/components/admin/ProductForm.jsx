import { useState, useEffect } from 'react'
import { StoreService } from '../../services/storeService'
import { ImageUploadService } from '../../services/imageUploadService'
import { useStore } from '../../contexts/StoreContext'
import anime from 'animejs'

export default function ProductForm({ product = null, onSave, onCancel }) {
  const { categories, refreshProducts } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    ingredients: '',
    prep_time: 15, // Default 15 minutes
    show_in_menu: true,
    available: true,
    image_path: '',
  })

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category_id: product.category_id || '',
        ingredients: product.ingredients || '',
        prep_time: product.prep_time || 15,
        show_in_menu: product.show_in_menu !== false, // Default to true if undefined
        available: product.available !== false, // Default to true if undefined
        image_path: product.image_path || '',
      })

      // Set image preview if product has an image
      if (product.image_path) {
        const imageUrl = ImageUploadService.getImageUrl(product.image_path)
        setImagePreview(imageUrl)
      }
    }
  }, [product])

  // Animate form on mount
  useEffect(() => {
    anime({
      targets: '.form-field',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(50),
      easing: 'easeOutCubic'
    })
  }, [])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // Validate file
      ImageUploadService.validateFile(file)
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setImageFile(file)
      
    } catch (error) {
      setError(error.message)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.name || !formData.price || !formData.category_id) {
        throw new Error('Nome, preço e categoria são obrigatórios')
      }

      // Format data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        prep_time: parseInt(formData.prep_time) || 15,
      }

      // Upload image if selected
      if (imageFile) {
        const uploadResult = await ImageUploadService.uploadImage(imageFile, null, true, true) // último true indica que é uma imagem de produto
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Erro ao fazer upload da imagem')
        }
        productData.image_path = uploadResult.data.path
      }

      // Save product
      let result
      if (product?.id) {
        // Update existing product
        result = await StoreService.updateProduct(product.id, productData)
      } else {
        // Create new product
        result = await StoreService.createProduct(productData)
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar produto')
      }

      // Refresh products list
      refreshProducts()

      // Notify parent component
      onSave(result.data)
      
    } catch (error) {
      console.error('Error saving product:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gold mb-6">
        {product ? 'Editar Produto' : 'Novo Produto'}
      </h2>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do produto */}
          <div className="form-field">
            <label className="block text-gold/80 mb-1">Nome*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
              required
            />
          </div>

          {/* Preço */}
          <div className="form-field">
            <label className="block text-gold/80 mb-1">Preço (R$)*</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
              required
            />
          </div>

          {/* Categoria */}
          <div className="form-field">
            <label className="block text-gold/80 mb-1">Categoria*</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tempo de preparo */}
          <div className="form-field">
            <label className="block text-gold/80 mb-1">Tempo de Preparo (minutos)</label>
            <input
              type="number"
              name="prep_time"
              value={formData.prep_time}
              onChange={handleChange}
              min="1"
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Descrição */}
          <div className="form-field md:col-span-2">
            <label className="block text-gold/80 mb-1">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
            ></textarea>
          </div>

          {/* Ingredientes */}
          <div className="form-field md:col-span-2">
            <label className="block text-gold/80 mb-1">Ingredientes</label>
            <textarea
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              rows="3"
              className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
              placeholder="Insira os ingredientes separados por vírgula"
            ></textarea>
          </div>

          {/* Upload de imagem */}
          <div className="form-field md:col-span-2">
            <label className="block text-gold/80 mb-1">Imagem do Produto</label>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                />
                <p className="text-xs text-gold/60 mt-1">
                  Formatos aceitos: JPEG, PNG, WebP. Máximo 5MB.
                </p>
              </div>
              
              {imagePreview && (
                <div className="w-24 h-24 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg border border-gold/30" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                      if (!product?.image_path) {
                        setFormData(prev => ({ ...prev, image_path: '' }))
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="form-field flex items-center">
            <input
              type="checkbox"
              name="show_in_menu"
              id="show_in_menu"
              checked={formData.show_in_menu}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="show_in_menu" className="text-gold/80">
              Mostrar no menu principal
            </label>
          </div>

          <div className="form-field flex items-center">
            <input
              type="checkbox"
              name="available"
              id="available"
              checked={formData.available}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="available" className="text-gold/80">
              Disponível para venda
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-black/40 text-gold/80 rounded-lg hover:bg-black/60 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-luxury"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : (product ? 'Atualizar' : 'Cadastrar')}
          </button>
        </div>
      </form>
    </div>
  )
}
