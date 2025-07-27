import React, { useState, useEffect } from 'react'
import { PaymentAPI } from '../../services/paymentAPI'
import { CashierService } from '../../services/cashierService'

const PixPayment = ({ selectedTable, totals, onPaymentSuccess, onCancel }) => {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    document: '',
    phone: ''
  })
  const [pixData, setPixData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('form') // 'form', 'processing', 'waiting', 'success'
  const [paymentReference, setPaymentReference] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const handleCreatePixPayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate customer data
      const validation = PaymentAPI.validateCustomerData(customerData)
      if (!validation.isValid) {
        setError(validation.errors.join(', '))
        setLoading(false)
        return
      }

      // Generate payment reference
      const reference = PaymentAPI.generatePaymentReference(selectedTable.id)
      setPaymentReference(reference)

      // Create payment request in database
      const paymentRequest = await CashierService.createPaymentRequest(
        selectedTable.id,
        totals.total,
        'pix',
        totals.includeServiceCharge
      )

      if (!paymentRequest.success) {
        throw new Error(paymentRequest.error)
      }

      setStep('processing')

      // Create PIX payment via API
      const paymentData = {
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerDocument: customerData.document.replace(/\D/g, ''),
        customerPhone: customerData.phone.replace(/\D/g, ''),
        amount: totals.total,
        tableNumber: selectedTable.number,
        reference: reference
      }

      const result = await PaymentAPI.createPixPayment(paymentData)

      if (result.success) {
        setPixData(result.data)
        setStep('waiting')
        startPaymentPolling(reference, paymentRequest.data.id)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar pagamento PIX')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const startPaymentPolling = (reference, paymentId) => {
    const interval = setInterval(async () => {
      try {
        const statusResult = await PaymentAPI.checkPaymentStatus(reference, 'pix')
        
        if (statusResult.success && statusResult.data.paid) {
          clearInterval(interval)
          setPollingInterval(null)
          
          // Update payment status
          await CashierService.updatePaymentStatus(paymentId, 'approved', reference)
          
          setStep('success')
          setTimeout(() => {
            onPaymentSuccess({
              reference,
              method: 'pix',
              amount: totals.total
            })
          }, 2000)
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
      }
    }, 3000) // Check every 3 seconds

    setPollingInterval(interval)

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
        setError('Tempo limite para pagamento excedido')
        setStep('form')
      }
    }, 600000)
  }

  const copyPixCode = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode)
      // You could add a toast notification here
    }
  }

  if (step === 'processing') {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gold mb-2">Gerando PIX</h3>
          <p className="text-gold/70">Criando código PIX para pagamento...</p>
        </div>
      </div>
    )
  }

  if (step === 'waiting' && pixData) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gold mb-2">PIX Gerado</h3>
          <p className="text-gold/70">Escaneie o QR Code ou copie o código PIX</p>
        </div>

        {/* QR Code Display */}
        <div className="bg-white p-4 rounded-lg mb-6 mx-auto max-w-xs">
          {pixData.qrCodeUrl ? (
            <img 
              src={pixData.qrCodeUrl} 
              alt="QR Code PIX" 
              className="w-full h-auto"
            />
          ) : (
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">QR Code</span>
            </div>
          )}
        </div>

        {/* PIX Code */}
        <div className="mb-6">
          <label className="block text-gold/70 text-sm mb-2">
            Código PIX (Copia e Cola):
          </label>
          <div className="flex">
            <input
              type="text"
              value={pixData.pixCode || ''}
              readOnly
              className="flex-1 bg-dark-bg border border-gold/30 rounded-l-lg px-3 py-2 text-gold text-sm"
            />
            <button
              onClick={copyPixCode}
              className="bg-gold text-dark-bg px-4 py-2 rounded-r-lg hover:bg-gold/90 transition-colors"
            >
              📋 Copiar
            </button>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gold/10 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gold/70">Mesa:</span>
            <span className="text-gold font-medium">{selectedTable.number}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gold/70">Valor:</span>
            <span className="text-gold font-medium">
              {PaymentAPI.formatCurrency(totals.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gold/70">Referência:</span>
            <span className="text-gold font-medium text-sm">{paymentReference}</span>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            Aguardando pagamento...
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Pagamento Confirmado!</h3>
          <p className="text-gold/70">PIX recebido com sucesso</p>
        </div>
      </div>
    )
  }

  // Form step
  return (
    <div className="bg-dark-card rounded-lg p-6">
      <h3 className="text-xl font-bold text-gold mb-6">Dados para PIX</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="text-red-400 text-sm">❌ {error}</div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-gold/70 text-sm mb-2">Nome Completo *</label>
          <input
            type="text"
            value={customerData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full bg-dark-bg border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none"
            placeholder="Digite o nome completo"
          />
        </div>

        <div>
          <label className="block text-gold/70 text-sm mb-2">Email *</label>
          <input
            type="email"
            value={customerData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full bg-dark-bg border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none"
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-gold/70 text-sm mb-2">CPF *</label>
          <input
            type="text"
            value={customerData.document}
            onChange={(e) => handleInputChange('document', formatCPF(e.target.value))}
            className="w-full bg-dark-bg border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none"
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div>
          <label className="block text-gold/70 text-sm mb-2">Telefone *</label>
          <input
            type="text"
            value={customerData.phone}
            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
            className="w-full bg-dark-bg border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gold/10 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gold/70">Mesa:</span>
          <span className="text-gold font-medium">{selectedTable.number}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gold/70">Total a pagar:</span>
          <span className="text-gold font-bold text-lg">
            {PaymentAPI.formatCurrency(totals.total)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleCreatePixPayment}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Gerando...' : 'Gerar PIX'}
        </button>
      </div>
    </div>
  )
}

export default PixPayment
