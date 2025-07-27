import React from 'react'
import { PAYMENT_METHODS } from '../../lib/constants'

const PaymentMethod = ({ onMethodSelect, selectedMethod, totals, disabled }) => {
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PIX,
      name: 'PIX',
      icon: '📱',
      description: 'Pagamento instantâneo via PIX',
      color: 'from-green-500 to-green-600',
      features: ['Instantâneo', 'Sem taxas', 'QR Code']
    },
    {
      id: PAYMENT_METHODS.CREDIT_CARD,
      name: 'Cartão de Crédito',
      icon: '💳',
      description: 'Pagamento com cartão de crédito',
      color: 'from-blue-500 to-blue-600',
      features: ['Parcelamento', 'Seguro', 'Aprovação rápida']
    },
    {
      id: PAYMENT_METHODS.CASH,
      name: 'Dinheiro',
      icon: '💵',
      description: 'Pagamento em dinheiro',
      color: 'from-gold to-yellow-600',
      features: ['Sem taxas', 'Imediato', 'Troco disponível']
    }
  ]

  if (!totals) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Método de Pagamento</h2>
        <div className="text-center py-8 text-gold/50">
          💳 Selecione uma mesa para escolher o método de pagamento
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-card rounded-lg p-6">
      <h2 className="text-xl font-bold text-gold mb-4">Método de Pagamento</h2>
      
      {/* Total Amount Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20">
        <div className="text-center">
          <div className="text-sm text-gold/70 mb-1">Valor Total</div>
          <div className="text-3xl font-bold text-gold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totals.total)}
          </div>
          {totals.serviceCharge > 0 && (
            <div className="text-xs text-gold/60 mt-1">
              (inclui taxa de serviço: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totals.serviceCharge)})
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => !disabled && onMethodSelect(method.id)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${selectedMethod === method.id
                ? 'border-gold bg-gold/10 shadow-lg transform scale-[1.02]'
                : 'border-gold/30 bg-dark-bg/50 hover:border-gold/60 hover:bg-gold/5 hover:transform hover:scale-[1.01]'
              }
            `}
          >
            {/* Selection Indicator */}
            {selectedMethod === method.id && (
              <div className="absolute top-2 right-2 text-gold">
                ✓
              </div>
            )}

            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`
                text-4xl p-3 rounded-lg bg-gradient-to-br ${method.color} 
                flex items-center justify-center min-w-[4rem] h-16
              `}>
                {method.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-bold text-gold">
                    {method.name}
                  </h3>
                </div>
                
                <p className="text-gold/70 text-sm mb-3">
                  {method.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {method.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gold/20 text-gold rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {method.id === PAYMENT_METHODS.PIX && (
              <div className="mt-3 p-2 bg-green-500/10 rounded text-xs text-green-400">
                💡 Pagamento confirmado automaticamente via webhook
              </div>
            )}

            {method.id === PAYMENT_METHODS.CREDIT_CARD && (
              <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs text-blue-400">
                🔒 Processamento seguro via Mercado Pago
              </div>
            )}

            {method.id === PAYMENT_METHODS.CASH && (
              <div className="mt-3 p-2 bg-gold/10 rounded text-xs text-gold/70">
                🏪 Confirmação manual pelo caixa
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Method Info */}
      {selectedMethod && (
        <div className="mt-6 p-4 bg-gold/5 rounded-lg border border-gold/20">
          <div className="text-sm text-gold/70 mb-1">Método selecionado:</div>
          <div className="text-gold font-medium">
            {paymentMethods.find(m => m.id === selectedMethod)?.name}
          </div>
        </div>
      )}

      {disabled && (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="text-red-400 text-sm text-center">
            ⚠️ Selecione uma mesa e calcule o total antes de escolher o método de pagamento
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentMethod
