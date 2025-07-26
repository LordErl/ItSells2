import { useState, useEffect } from 'react'
import { StoreService } from '../services/storeService'
import DeliveryConfirmation from './DeliveryConfirmation'

export default function CustomerDeliveryNotification({ customerId }) {
  const [deliveringItems, setDeliveringItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    if (customerId) {
      loadDeliveringItems()
      // Check for new delivering items every 10 seconds
      const interval = setInterval(loadDeliveringItems, 10000)
      return () => clearInterval(interval)
    }
  }, [customerId])

  const loadDeliveringItems = async () => {
    try {
      const result = await StoreService.getDeliveringOrderItems()
      if (result.success) {
        // Filter items for this customer
        const customerItems = result.data.filter(item => 
          item.orders?.users?.id === customerId
        )
        setDeliveringItems(customerItems)
      }
    } catch (error) {
      console.error('Error loading delivering items:', error)
    }
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowConfirmation(true)
  }

  const handleConfirmDelivery = (updatedData) => {
    // Remove item from delivering list
    setDeliveringItems(prev => 
      prev.filter(item => item.id !== selectedItem.id)
    )
    setShowConfirmation(false)
    setSelectedItem(null)
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setSelectedItem(null)
  }

  if (deliveringItems.length === 0) {
    return null
  }

  return (
    <>
      {/* Notification Badge */}
      <div className="fixed top-4 right-4 z-40">
        <div className="glass-card p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gold">Pedido Entregue!</h3>
              <p className="text-xs text-gold/70">
                {deliveringItems.length} item(s) para confirmar
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {deliveringItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-black/20 rounded-lg p-3 cursor-pointer hover:bg-black/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gold">
                      {item.products?.name}
                    </p>
                    <p className="text-xs text-gold/60">
                      Qtd: {item.quantity} • R$ {parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-xs text-neon-green font-medium">
                    Confirmar
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-gold/60">
              Toque no item para confirmar o recebimento
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      {showConfirmation && selectedItem && (
        <DeliveryConfirmation
          itemId={selectedItem.id}
          customerId={customerId}
          itemName={selectedItem.products?.name}
          quantity={selectedItem.quantity}
          price={selectedItem.price}
          onConfirm={handleConfirmDelivery}
          onCancel={handleCancelConfirmation}
        />
      )}
    </>
  )
}
