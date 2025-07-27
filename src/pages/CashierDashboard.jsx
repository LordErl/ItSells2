import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CashierService } from '../services/cashierService'
import { PAYMENT_METHODS, USER_ROLES } from '../lib/constants'

// Components
import TableSelection from '../components/cashier/TableSelection'
import BillSummary from '../components/cashier/BillSummary'
import PaymentMethod from '../components/cashier/PaymentMethod'
import PixPayment from '../components/cashier/PixPayment'
import CardPayment from '../components/cashier/CardPayment'

const CashierDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State management
  const [selectedTable, setSelectedTable] = useState(null)
  const [totals, setTotals] = useState(null)
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [currentStep, setCurrentStep] = useState('table') // 'table', 'bill', 'payment', 'processing'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check permissions
  useEffect(() => {
    if (!user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.CASHIER)) {
      navigate('/staff-dashboard')
    }
  }, [user, navigate])

  const handleTableSelect = (table) => {
    setSelectedTable(table)
    setCurrentStep('bill')
    setError(null)
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
      const result = await CashierService.closeTable(selectedTable.id, paymentData.reference)
      
      if (result.success) {
        // Reset state and go back to table selection
        setSelectedTable(null)
        setTotals(null)
        setSelectedPaymentMethod(null)
        setIncludeServiceCharge(false)
        setCurrentStep('table')
        
        // Show success message
        alert(`Pagamento realizado com sucesso!\nMesa ${selectedTable.number} foi fechada.\nReferência: ${paymentData.reference}`)
      } else {
        setError('Pagamento processado, mas erro ao fechar mesa: ' + result.error)
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
    } else if (currentStep === 'bill') {
      setCurrentStep('table')
      setSelectedTable(null)
      setTotals(null)
    }
  }

  const canProceedToPayment = selectedTable && totals && totals.total > 0

  if (!user) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gold">
      {/* Header */}
      <div className="bg-dark-card shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff-dashboard')}
                className="text-gold/70 hover:text-gold transition-colors"
              >
                ← Voltar
              </button>
              <h1 className="text-2xl font-bold text-gold">💰 Caixa</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gold/70">
                👤 {user.name} ({user.role})
              </div>
              
              {/* Step Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentStep === 'table' ? 'bg-gold' : 'bg-gold/30'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep === 'bill' ? 'bg-gold' : 'bg-gold/30'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep === 'payment' ? 'bg-gold' : 'bg-gold/30'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep === 'processing' ? 'bg-gold' : 'bg-gold/30'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {/* Left Column */}
          <div className="space-y-6">
            {/* Table Selection */}
            <TableSelection
              onTableSelect={handleTableSelect}
              selectedTable={selectedTable}
              disabled={currentStep !== 'table'}
            />

            {/* Bill Summary */}
            {currentStep !== 'table' && (
              <BillSummary
                selectedTable={selectedTable}
                onTotalCalculated={handleTotalCalculated}
                includeServiceCharge={includeServiceCharge}
                onServiceChargeChange={handleServiceChargeChange}
              />
            )}
          </div>

          {/* Right Column */}
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
                      className="px-8 py-3 bg-gold text-dark-bg rounded-lg font-bold hover:bg-gold/90 transition-colors"
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
                selectedTable={selectedTable}
                totals={totals}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 'processing' && selectedPaymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
              <CardPayment
                selectedTable={selectedTable}
                totals={totals}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 'processing' && selectedPaymentMethod === PAYMENT_METHODS.CASH && (
              <div className="bg-dark-card rounded-lg p-6">
                <h3 className="text-xl font-bold text-gold mb-6">Pagamento em Dinheiro</h3>
                
                <div className="bg-gold/10 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gold/70">Mesa:</span>
                    <span className="text-gold font-medium">{selectedTable.number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gold/70">Total a receber:</span>
                    <span className="text-gold font-bold text-2xl">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totals.total)}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">💵</div>
                  <p className="text-gold/70">Confirme o recebimento do dinheiro</p>
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
                    className="flex-1 px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    Confirmar Recebimento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'table' && currentStep !== 'processing' && (
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <div className="text-gold">Finalizando processo...</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashierDashboard
