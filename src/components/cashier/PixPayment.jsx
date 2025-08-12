import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('form') // 'form', 'processing', 'waiting', 'success'
  const [paymentReference, setPaymentReference] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Load existing PIX data when component mounts
  useEffect(() => {
    const loadUserPixData = async () => {
      if (selectedTable.type === 'customer' && selectedTable.id && !dataLoaded) {
        console.log('🔍 Loading existing PIX data for customer:', selectedTable.id)
        
        const result = await CashierService.getUserPixData(selectedTable.id)
        if (result.success && result.data) {
          const { name, email, cpf, phone } = result.data
          
          // Pre-fill form with existing data
          setCustomerData({
            name: name || '',
            email: email || '',
            document: cpf || '',
            phone: phone || ''
          })
          
          console.log('✅ PIX data pre-filled from user profile')
        }
        setDataLoaded(true)
      }
    }

    loadUserPixData()
  }, [selectedTable, dataLoaded])

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

      // Create payment request in database
      const isCustomerPayment = selectedTable.type === 'customer'
      const paymentRequest = await CashierService.createPaymentRequest(
        selectedTable.id,
        totals.total,
        'pix',
        totals.includeServiceCharge,
        isCustomerPayment
      )

      if (!paymentRequest.success) {
        throw new Error(paymentRequest.error)
      }

      // Usar o UUID do payment como referência
      setPaymentReference(paymentRequest.data.id)
      setStep('processing')

      // Create PIX payment via API
      const paymentData = {
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerDocument: customerData.document.replace(/\D/g, ''),
        customerPhone: customerData.phone.replace(/\D/g, ''),
        amount: totals.total,
        tableNumber: selectedTable.number || selectedTable.table_number,
        reference: paymentRequest.data.id // Usar o UUID do payment como idempotency_key
      }

      const result = await PaymentAPI.createPixPayment(paymentData)

      if (result.success) {
        // ✨ STRATEGIC DATA CAPTURE: Save PIX data to user profile
        if (selectedTable.type === 'customer' && selectedTable.id) {
          console.log('💾 Saving PIX data strategically to user profile...')
          
          const pixDataToSave = {
            name: customerData.name,
            email: customerData.email,
            cpf: customerData.document.replace(/\D/g, ''),
            phone: customerData.phone.replace(/\D/g, '')
          }
          
          const saveResult = await CashierService.updateUserPixData(selectedTable.id, pixDataToSave)
          if (saveResult.success) {
            console.log('✅ PIX data saved to user profile for future use')
          } else {
            console.warn('⚠️ Could not save PIX data to profile:', saveResult.error)
          }
        }

        // Aguardar um pouco e buscar dados completos do PIX
        setTimeout(async () => {
          const pixDataResult = await PaymentAPI.checkPaymentStatus(paymentRequest.data.id)
          if (pixDataResult.success && pixDataResult.data.pixCode) {
            const updatedPixData = {
              ...result.data,
              pixCode: pixDataResult.data.pixCode,
              qrCodeUrl: pixDataResult.data.qrCodeUrl
            }
            setPixData(updatedPixData)
            // Gerar QR code a partir do código PIX
            await generateQRCode(pixDataResult.data.pixCode)
          } else {
            setPixData(result.data)
          }
        }, 2000)
        
        setStep('waiting')
        // Usar o paymentId (UUID) para polling de status
        startPaymentPolling(paymentRequest.data.id, paymentRequest.data.id)
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

  const startPaymentPolling = (paymentId, internalPaymentId) => {
    const interval = setInterval(async () => {
      try {
        // Usar o paymentId (UUID) para verificar status via idempotency_key
        const statusResult = await PaymentAPI.checkPaymentStatus(paymentId)
        
        // Verificar se o pagamento foi aprovado
        if (statusResult.success && statusResult.data.status === 'approved') {
          clearInterval(interval)
          setPollingInterval(null)
          
          // Update payment status
          await CashierService.updatePaymentStatus(internalPaymentId, 'approved', paymentReference)
          
          setStep('success')
          setTimeout(() => {
            onPaymentSuccess({
              reference: paymentReference,
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

  const generateQRCode = async (pixCode) => {
    try {
      const qrCodeUrl = await QRCode.toDataURL(pixCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(qrCodeUrl)
    } catch (error) {
      console.error('Erro ao gerar QR code:', error)
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
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code PIX" 
              className="w-full h-auto"
            />
          ) : (
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <span className="text-gray-500 text-sm">Gerando QR Code...</span>
              </div>
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

      {dataLoaded && (customerData.name || customerData.email || customerData.document || customerData.phone) && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="text-green-400 text-sm">✅ Dados carregados do seu perfil</div>
        </div>
      )}

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
