import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CashierService } from '../services/cashierService'
import { PAYMENT_METHODS } from '../lib/constants'

// Import cashier components
import BillSummary from '../components/cashier/BillSummary'
import PaymentMethod from '../components/cashier/PaymentMethod'
import PixPayment from '../components/cashier/PixPayment'
import CardPayment from '../components/cashier/CardPayment'

export default function CustomerCheckout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customer_id')

  const [selectedBill, setSelectedBill] = useState(null)
  const [totals, setTotals] = useState(null)
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [currentStep, setCurrentStep] = useState('loading') // loading, bill, payment, processing
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load customer bill data on mount
  useEffect(() => {
    if (customerId) {
      loadCustomerBill()
    } else if (user?.id) {
      loadCustomerBill(user.id)
    } else {
      setError('Cliente não identificado')
    }
  }, [customerId, user])

  const loadCustomerBill = async (customerIdToLoad = customerId) => {
    try {
      console.log('🔍 CustomerCheckout: Loading bill for customer:', customerIdToLoad)
      setLoading(true)
      setError(null)

      // Get customer bills using the same logic as cashier
      console.log('📞 CustomerCheckout: Calling CashierService.getOccupiedTablesForPayment...')
      const result = await CashierService.getOccupiedTablesForPayment()
      console.log('📋 CustomerCheckout: CashierService result:', result)
      
      if (result.customers && result.customers.length > 0) {
        // Find the specific customer
        const customerBill = result.customers.find(c => c.id === customerIdToLoad)
        
        if (customerBill) {
          setSelectedBill(customerBill)
          setCurrentStep('bill')
        } else {
          setError('Nenhuma conta pendente encontrada para este cliente')
        }
      } else {
        setError('Nenhuma conta pendente encontrada')
      }
    } catch (err) {
      setError('Erro ao carregar dados da conta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTotalCalculated = (calculatedTotals) => {
    setTotals({
      ...calculatedTotals,
      includeServiceCharge
    })
  }

  const handleServiceChargeChange = (include) => {
    setIncludeServiceCharge(include)
  }

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method)
    setCurrentStep('processing')
  }

  const handlePaymentSuccess = async (paymentData) => {
    setLoading(true)
    
    try {
      // Close table after successful payment
      const result = await CashierService.closeTable(selectedBill.id, paymentData.reference)
      
      if (result.success) {
        // Show success message and redirect
        alert(`Pagamento realizado com sucesso!\nCliente: ${selectedBill.name}\nReferência: ${paymentData.reference}`)
        
        // Redirect back to customer account
        navigate('/customer-account')
      } else {
        setError('Pagamento processado, mas erro ao fechar conta: ' + result.error)
      }
    } catch (err) {
      setError('Erro ao finalizar processo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (currentStep === 'processing') {
      setCurrentStep('payment')
      setSelectedPaymentMethod(null)
    } else if (currentStep === 'payment') {
      setCurrentStep('bill')
    } else {
      // Go back to customer account
      navigate('/customer-account')
    }
  }

  const canProceedToPayment = selectedBill && totals && totals.total > 0

  if (currentStep === 'loading' || loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gold">Carregando dados da conta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gold mb-4">Erro</h2>
          <p className="text-gold/70 mb-6">{error}</p>
          <button
            onClick={() => navigate('/customer-account')}
            className="btn-luxury"
          >
            Voltar para Minha Conta
          </button>
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
              onClick={handleCancel}
              className="text-gold hover:text-neon-cyan transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gold-gradient">💳 Fechar Conta</h1>
              <p className="text-gold/60 text-sm">{selectedBill?.name}</p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep === 'bill' ? 'bg-gold' : 'bg-gold/30'}`}></div>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'payment' ? 'bg-gold' : 'bg-gold/30'}`}></div>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'processing' ? 'bg-gold' : 'bg-gold/30'}`}></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="text-red-400">❌ {error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-400/70 hover:text-red-400 text-sm"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Bill Summary */}
          <div className="space-y-6">
            <BillSummary
              selectedTable={selectedBill}
              onTotalCalculated={handleTotalCalculated}
              includeServiceCharge={includeServiceCharge}
              onServiceChargeChange={handleServiceChargeChange}
            />
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            {/* Payment Method Selection */}
            {currentStep === 'bill' && (
              <>
                <PaymentMethod
                  onMethodSelect={handlePaymentMethodSelect}
                  selectedMethod={selectedPaymentMethod}
                  totals={totals}
                  disabled={!canProceedToPayment}
                />

                {canProceedToPayment && (
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="btn-luxury px-8 py-3"
                    >
                      Continuar para Pagamento
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Payment Method Selection */}
            {currentStep === 'payment' && (
              <PaymentMethod
                onMethodSelect={handlePaymentMethodSelect}
                selectedMethod={selectedPaymentMethod}
                totals={totals}
                disabled={false}
              />
            )}

            {/* Payment Processing */}
            {currentStep === 'processing' && selectedPaymentMethod === PAYMENT_METHODS.PIX && (
              <PixPayment
                selectedTable={selectedBill}
                totals={totals}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 'processing' && selectedPaymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
              <CardPayment
                selectedTable={selectedBill}
                totals={totals}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 'processing' && selectedPaymentMethod === PAYMENT_METHODS.CASH && (
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-gold mb-6">Pagamento em Dinheiro</h3>
                
                <div className="bg-gold/10 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gold/70">Cliente:</span>
                    <span className="text-gold font-medium">{selectedBill.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gold/70">Local:</span>
                    <span className="text-gold font-medium">
                      {selectedBill.table_number === 0 ? 'Balcão' : `Mesa ${selectedBill.table_number}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gold/70">Total a pagar:</span>
                    <span className="text-gold font-bold text-lg">
                      R$ {totals?.total?.toFixed(2) || '0,00'}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">💵</div>
                  <p className="text-gold/70">Confirme o pagamento em dinheiro</p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePaymentSuccess({
                      reference: `CASH_${Date.now()}`,
                      method: 'cash',
                      amount: totals.total
                    })}
                    className="flex-1 btn-luxury"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'processing' && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <div className="text-gold">Finalizando processo...</div>
          </div>
        </div>
      )}
    </div>
  )
}
