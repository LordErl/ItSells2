import { useState, useEffect } from 'react'
import { StoreService } from '../services/storeService'
import { ORDER_ITEM_STATUS } from '../lib/constants'

export default function DeliveryConfirmation({ 
  itemId, 
  customerId, 
  itemName, 
  quantity, 
  price, 
  onConfirm, 
  onCancel 
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const result = await StoreService.confirmItemDelivery(itemId, customerId)
      if (result.success) {
        setConfirmed(true)
        setTimeout(() => {
          onConfirm && onConfirm(result.data)
        }, 1500)
      } else {
        console.error('Error confirming delivery:', result.error)
      }
    } catch (error) {
      console.error('Error confirming delivery:', error)
    } finally {
      setConfirming(false)
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="glass-card p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neon-green mb-2">
            Entrega Confirmada!
          </h2>
          <p className="text-gold/80 mb-4">
            Obrigado por confirmar o recebimento do seu pedido.
          </p>
          <div className="text-sm text-gold/60">
            <p>Item: {itemName}</p>
            <p>Quantidade: {quantity}</p>
            <p>Valor: R$ {(parseFloat(price) * parseInt(quantity)).toFixed(2)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gold mb-2">
            Confirmar Recebimento
          </h2>
          <p className="text-gold/80 mb-4">
            Você recebeu este item do seu pedido?
          </p>
        </div>

        <div className="bg-black/20 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gold mb-2">{itemName}</h3>
            <div className="text-gold/70 space-y-1">
              <p>Quantidade: {quantity}</p>
              <p>Valor unitário: R$ {parseFloat(price).toFixed(2)}</p>
              <p className="text-lg font-bold text-neon-green">
                Total: R$ {(parseFloat(price) * parseInt(quantity)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
            disabled={confirming}
          >
            Não Recebi
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors font-medium"
            disabled={confirming}
          >
            {confirming ? 'Confirmando...' : 'Sim, Recebi'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gold/60">
            Ao confirmar, o valor será adicionado à sua conta
          </p>
        </div>
      </div>
    </div>
  )
}
