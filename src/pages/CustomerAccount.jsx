import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { StoreService } from '../services/storeService'
import { ORDER_STATUS, PAYMENT_STATUS } from '../lib/constants'
import anime from 'animejs'
import { toast } from 'react-hot-toast'

export default function CustomerAccount() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { customerAccount, processPayment } = useStore()
  const [accountData, setAccountData] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  
  const accountRef = useRef(null)

  useEffect(() => {
    if (accountRef.current) {
      anime({
        targets: accountRef.current.children,
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
      loadAccountData()
    }
  }, [user])

  // Check if there are unpaid delivered orders
  const hasUnpaidDeliveredOrders = () => {
    return orderHistory.some(order => 
      order.status === ORDER_STATUS.DELIVERED && 
      (order.paid === null || order.paid === false)
    )
  }

  // Calculate total amount from unpaid delivered orders
  const getUnpaidDeliveredTotal = () => {
    return orderHistory
      .filter(order => 
        order.status === ORDER_STATUS.DELIVERED && 
        (order.paid === null || order.paid === false)
      )
      .reduce((total, order) => total + parseFloat(order.total_amount || order.total || 0), 0)
  }

  const loadAccountData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados da conta
      const accountResult = await StoreService.getCustomerAccount(user.id)
      if (accountResult.success) {
        setAccountData(accountResult.data)
      }

      // Carregar histórico de pedidos
      const ordersResult = await StoreService.getOrdersByCustomer(user.id)
      if (ordersResult.success) {
        setOrderHistory(ordersResult.data || [])
      }

      // Carregar histórico de pagamentos
      const paymentsResult = await StoreService.getPaymentsByCustomer(user.id)
      if (paymentsResult.success) {
        setPaymentHistory(paymentsResult.data || [])
      }

    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Erro ao carregar dados da conta')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Informe um valor válido para pagamento')
      return
    }

    const amount = parseFloat(paymentAmount)
    const currentBill = accountData?.current_bill || 0

    if (amount > currentBill) {
      toast.error('Valor não pode ser maior que o saldo devedor')
      return
    }

    setProcessingPayment(true)

    try {
      const paymentData = {
        customer_id: user.id,
        amount: amount,
        method: selectedPaymentMethod,
        description: `Pagamento de conta - ${user.name}`,
        payer_name: user.name,
        payer_document: user.cpf,
        payer_email: user.email
      }

      const result = await processPayment(paymentData)

      if (result.success) {
        toast.success('Pagamento processado com sucesso!')
        setShowPaymentModal(false)
        setPaymentAmount('')
        await loadAccountData() // Recarregar dados
      } else {
        toast.error(`Erro no pagamento: ${result.error}`)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return 'text-yellow-400'
      case ORDER_STATUS.CONFIRMED: return 'text-blue-400'
      case ORDER_STATUS.PREPARING: return 'text-orange-400'
      case ORDER_STATUS.READY: return 'text-green-400'
      case ORDER_STATUS.DELIVERED: return 'text-neon-green'
      case ORDER_STATUS.CANCELLED: return 'text-red-400'
      default: return 'text-gold/60'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return 'Pendente'
      case ORDER_STATUS.CONFIRMED: return 'Confirmado'
      case ORDER_STATUS.PREPARING: return 'Preparando'
      case ORDER_STATUS.READY: return 'Pronto'
      case ORDER_STATUS.DELIVERED: return 'Entregue'
      case ORDER_STATUS.CANCELLED: return 'Cancelado'
      default: return status || 'Desconhecido'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case PAYMENT_STATUS.PENDING: return 'text-yellow-400'
      case PAYMENT_STATUS.APPROVED: return 'text-neon-green'
      case PAYMENT_STATUS.REJECTED: return 'text-red-400'
      case PAYMENT_STATUS.CANCELLED: return 'text-red-400'
      default: return 'text-gold/60'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gold">Carregando dados da conta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-panel p-4 mb-6 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-gold hover:text-neon-cyan transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gold-gradient">Minha Conta</h1>
              <p className="text-gold/60 text-sm">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gold/60 hover:text-red-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8" ref={accountRef}>
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2h2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gold mb-2">Saldo Atual</h3>
            <p className="text-3xl font-bold text-red-400 mb-4">
              R$ {(getUnpaidDeliveredTotal() + (accountData?.current_bill || user?.to_pay || 0)).toFixed(2)}
            </p>
            {(hasUnpaidDeliveredOrders() || (accountData?.current_bill || user?.to_pay || 0) > 0) && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const totalAmount = getUnpaidDeliveredTotal() + (accountData?.current_bill || user?.to_pay || 0)
                    setPaymentAmount(totalAmount.toString())
                    setShowPaymentModal(true)
                  }}
                  className="btn-luxury w-full"
                >
                  Pagar Parcial
                </button>
                <button
                  onClick={() => {
                    // Redirect to cashier flow for complete bill closure
                    window.location.href = `/customer-checkout?customer_id=${user.id}`
                  }}
                  className="w-full px-4 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors font-medium border border-neon-green/30"
                >
                  💳 Fechar Conta Completa
                </button>
              </div>
            )}
          </div>

          {/* Open Orders */}
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gold mb-2">Pedidos Abertos</h3>
            <p className="text-3xl font-bold text-neon-cyan mb-4">
              {orderHistory.filter(order => 
                [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(order.status)
              ).length}
            </p>
            <p className="text-gold/60 text-sm">Em andamento</p>
          </div>

          {/* Total Spent */}
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gold mb-2">Total Gasto</h3>
            <p className="text-3xl font-bold text-neon-green mb-4">
              R$ {paymentHistory.filter(p => p.status === PAYMENT_STATUS.APPROVED)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
            </p>
            <p className="text-gold/60 text-sm">Este mês</p>
          </div>
        </div>

        {/* Order History */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-bold text-gold mb-6">Histórico de Pedidos</h2>
          
          {orderHistory.length > 0 ? (
            <div className="space-y-4">
              {orderHistory.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gold font-medium">
                        Pedido #{order.id?.slice(-8)}
                      </p>
                      <p className="text-gold/60 text-sm">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)} bg-black/20`}>
                          {getStatusText(order.status)}
                        </span>
                        <p className="text-gold font-bold">
                          R$ {parseFloat(order.total || 0).toFixed(2)}
                        </p>
                        {/* Botão de acompanhar pedido para pedidos em andamento */}
                        {['pending', 'producing', 'ready', 'delivering'].includes(order.status) && (
                          <button
                            onClick={() => navigate(`/order-tracking/${order.id}`)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium border border-blue-500/30 flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Acompanhar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t border-gold/20 pt-3">
                      <p className="text-gold/80 text-sm mb-2">Itens:</p>
                      <div className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gold/70">
                              {item.quantity}x {item.products?.name || 'Item'}
                            </span>
                            <span className="text-gold/70">
                              R$ {(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gold/60">Nenhum pedido encontrado</p>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gold mb-6">Histórico de Pagamentos</h2>
          
          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.slice(0, 10).map((payment) => (
                <div key={payment.id} className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gold font-medium">
                        {payment.method?.toUpperCase() || 'PAGAMENTO'}
                      </p>
                      <p className="text-gold/60 text-sm">
                        {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(payment.status)} bg-black/20`}>
                        {payment.status === PAYMENT_STATUS.PENDING ? 'Pendente' :
                         payment.status === PAYMENT_STATUS.APPROVED ? 'Aprovado' :
                         payment.status === PAYMENT_STATUS.REJECTED ? 'Rejeitado' :
                         payment.status === PAYMENT_STATUS.CANCELLED ? 'Cancelado' :
                         payment.status || 'Desconhecido'}
                      </span>
                      <p className="text-gold font-bold mt-1">
                        R$ {parseFloat(payment.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gold/60">Nenhum pagamento encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gold">Realizar Pagamento</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gold/60 hover:text-gold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gold/80 text-sm mb-2">Valor a Pagar</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={accountData?.current_bill || user?.to_pay || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 bg-black/20 border border-gold/20 rounded-lg text-gold focus:border-neon-cyan focus:outline-none"
                  placeholder="0,00"
                />
                <p className="text-xs text-gold/60 mt-1">
                  Saldo devedor: R$ {(accountData?.current_bill || user?.to_pay || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-gold/80 text-sm mb-2">Método de Pagamento</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={selectedPaymentMethod === 'pix'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-neon-cyan"
                    />
                    <span className="text-gold">PIX</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={selectedPaymentMethod === 'card'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-neon-cyan"
                    />
                    <span className="text-gold">Cartão</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={selectedPaymentMethod === 'cash'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-neon-cyan"
                    />
                    <span className="text-gold">Dinheiro</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                  disabled={processingPayment}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 btn-luxury"
                  disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  {processingPayment ? 'Processando...' : 'Pagar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
