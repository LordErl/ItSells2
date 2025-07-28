import React, { useState, useEffect } from 'react'
import { PaymentAPI } from '../../services/paymentAPI'
import { CashierService } from '../../services/cashierService'

const CardPayment = ({ selectedTable, totals, onPaymentSuccess, onCancel }) => {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    document: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('form') // 'form', 'processing', 'tokenize', 'success'
  const [paymentReference, setPaymentReference] = useState(null)
  const [checkoutUrl, setCheckoutUrl] = useState(null)

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

  const handleCreateCardPayment = async () => {
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
      const isCustomerPayment = selectedTable.type === 'customer'
      const paymentRequest = await CashierService.createPaymentRequest(
        selectedTable.id,
        totals.total,
        'card',
        totals.includeServiceCharge,
        isCustomerPayment
      )

      if (!paymentRequest.success) {
        throw new Error(paymentRequest.error)
      }

      setStep('processing')

      // Create card payment via API (this will return a tokenize checkout URL)
      const paymentData = {
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerDocument: customerData.document.replace(/\D/g, ''),
        customerPhone: customerData.phone.replace(/\D/g, ''),
        amount: totals.total,
        tableNumber: selectedTable.number,
        reference: reference
      }

      const result = await PaymentAPI.createCardPayment(paymentData)

      if (result.success) {
        setCheckoutUrl(result.data.checkoutUrl)
        setStep('tokenize')
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar pagamento com cartão')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const handleTokenizeComplete = async (token) => {
    setLoading(true)
    setError(null)

    try {
      // Process payment with token
      const result = await PaymentAPI.processCardToken({
        token,
        reference: paymentReference,
        amount: totals.total
      })

      if (result.success && result.data.approved) {
        // Update payment status
        await CashierService.updatePaymentStatus(
          paymentReference, 
          'approved', 
          paymentReference
        )
        
        setStep('success')
        setTimeout(() => {
          onPaymentSuccess({
            reference: paymentReference,
            method: 'card',
            amount: totals.total
          })
        }, 2000)
      } else {
        throw new Error(result.error || 'Pagamento rejeitado')
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar pagamento')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'processing') {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gold mb-2">Preparando Pagamento</h3>
          <p className="text-gold/70">Configurando checkout seguro...</p>
        </div>
      </div>
    )
  }

  if (step === 'tokenize' && checkoutUrl) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gold mb-2">Pagamento com Cartão</h3>
          <p className="text-gold/70">Complete o pagamento no checkout seguro</p>
        </div>

        {/* Payment Summary */}
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

        {/* Checkout Integration */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 min-h-[400px] flex items-center justify-center">
            {/* This would be where Mercado Pago Web Tokenize Checkout iframe loads */}
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <div className="text-gray-600 mb-4">Checkout Seguro Mercado Pago</div>
              <button
                onClick={() => window.open(checkoutUrl, '_blank')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Abrir Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-blue-500/10 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <span className="text-blue-400 mr-2">🔒</span>
            <span className="text-blue-400 font-medium">Pagamento Seguro</span>
          </div>
          <div className="text-blue-400/80 text-sm">
            Seus dados são protegidos pela criptografia do Mercado Pago. 
            Não armazenamos informações do cartão.
          </div>
        </div>

        {/* Mock Token Input for Testing */}
        <div className="border-t border-gold/20 pt-4">
          <div className="text-gold/70 text-sm mb-2">Para teste - Token do cartão:</div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Cole o token aqui para teste"
              className="flex-1 bg-dark-bg border border-gold/30 rounded-lg px-3 py-2 text-gold text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleTokenizeComplete(e.target.value)
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder*="token"]')
                if (input.value) {
                  handleTokenizeComplete(input.value)
                }
              }}
              className="bg-gold text-dark-bg px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm"
            >
              Processar
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
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
          <h3 className="text-xl font-bold text-green-400 mb-2">Pagamento Aprovado!</h3>
          <p className="text-gold/70">Cartão processado com sucesso</p>
        </div>
      </div>
    )
  }

  // Form step
  return (
    <div className="bg-dark-card rounded-lg p-6">
      <h3 className="text-xl font-bold text-gold mb-6">Dados para Pagamento</h3>

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
            placeholder="Nome como no cartão"
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

      {/* Security Notice */}
      <div className="bg-blue-500/10 rounded-lg p-3 mb-6">
        <div className="flex items-center text-blue-400 text-sm">
          <span className="mr-2">🔒</span>
          <span>Pagamento processado de forma segura via Mercado Pago</span>
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
          onClick={handleCreateCardPayment}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Preparando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

export default CardPayment
