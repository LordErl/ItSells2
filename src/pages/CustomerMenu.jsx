import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import anime from 'animejs'
import { toast } from 'react-hot-toast'

export default function CustomerMenu() {
  const { user, logout } = useAuth()
  const { products, customerAccount, getCustomerBill, createOrder } = useStore()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const menuRef = useRef(null)

  useEffect(() => {
    if (menuRef.current) {
      anime({
        targets: menuRef.current.children,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutCubic'
      })
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      getCustomerBill(user.id)
    }
  }, [user, getCustomerBill])

  const categories = [
    { id: 'all', name: 'Todos', icon: '🍽️' },
    { id: 'lanches', name: 'Lanches', icon: '🍔' },
    { id: 'pizzas', name: 'Pizzas', icon: '🍕' },
    { id: 'bebidas', name: 'Bebidas', icon: '🍺' },
    { id: 'sobremesas', name: 'Sobremesas', icon: '🍰' },
    { id: 'entradas', name: 'Entradas', icon: '🥗' }
  ]

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products?.filter(product => 
        product.categories?.name?.toLowerCase() === selectedCategory ||
        product.category?.toLowerCase() === selectedCategory
      )

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleFinalizePedido = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para finalizar o pedido')
      return
    }

    if (cart.length === 0) {
      toast.error('Seu carrinho está vazio')
      return
    }

    setIsProcessing(true)

    try {
      // Preparar os dados do pedido
      const orderData = {
        customer_id: user.id,
        table_id: null, // Se o cliente estiver em uma mesa específica, isso deve ser definido
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          observations: item.observations || ''
        })),
        observations: ''
      }

      // Criar o pedido
      const result = await createOrder(orderData)

      if (result.success) {
        toast.success('Pedido realizado com sucesso!')
        setCart([]) // Limpar o carrinho
        setShowCart(false) // Fechar o modal do carrinho
        
        // Atualizar a conta do cliente
        if (user?.id) {
          getCustomerBill(user.id)
        }
      } else {
        toast.error(`Erro ao finalizar pedido: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      toast.error('Ocorreu um erro ao processar seu pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gold-gradient">
              Menu Digital
            </h1>
            <p className="text-gold/80 text-sm">
              Olá, {user?.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Account Button */}
            <button
              onClick={() => setShowAccount(true)}
              className="p-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neon-pink text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4" ref={menuRef}>
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-black/20 text-gold/60 border border-gold/10 hover:border-gold/20'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts?.map(product => (
            <div key={product.id} className="glass-card p-4 hover:scale-105 transition-all duration-300">
              {/* Product Image */}
              <div className="w-full h-32 bg-gradient-to-br from-gold/20 to-gold/10 rounded-lg mb-4 flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
              </div>

              {/* Product Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gold mb-2">{product.name}</h3>
                <p className="text-gold/70 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gold">
                    R$ {product.price?.toFixed(2)}
                  </span>
                  {product.preparation_time && (
                    <span className="text-xs text-gold/60">
                      {product.preparation_time} min
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => addToCart(product)}
                disabled={!product.available}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  product.available
                    ? 'btn-luxury'
                    : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.available ? 'Adicionar ao Pedido' : 'Indisponível'}
              </button>
            </div>
          )) || (
            <div className="col-span-full text-center py-12">
              <p className="text-gold/60">Carregando produtos...</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gold">Seu Pedido</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gold/60 hover:text-gold"
              >
                ✕
              </button>
            </div>

            {cart.length > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-gold font-medium">{item.name}</h4>
                        <p className="text-gold/60 text-sm">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-gold font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gold/20 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gold">Total:</span>
                    <span className="text-xl font-bold text-gold">
                      R$ {cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  className="w-full btn-luxury" 
                  onClick={handleFinalizePedido}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gold/60">Seu carrinho está vazio</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gold">Minha Conta</h2>
              <button
                onClick={() => setShowAccount(false)}
                className="text-gold/60 hover:text-gold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-lg">
                <h3 className="text-gold font-medium mb-2">Conta Atual</h3>
                <p className="text-2xl font-bold text-neon-cyan">
                  R$ {customerAccount?.current_bill?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="space-y-2">
                <button className="w-full nav-item text-left">
                  <span>Ver Extrato</span>
                </button>
                <button className="w-full nav-item text-left">
                  <span>Pedidos em Aberto</span>
                </button>
                <button className="w-full nav-item text-left">
                  <span>Histórico</span>
                </button>
              </div>

              <button className="w-full btn-luxury">
                Pagar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

