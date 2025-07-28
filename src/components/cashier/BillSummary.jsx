import React, { useState, useEffect } from 'react'
import { CashierService } from '../../services/cashierService'
import { PaymentAPI } from '../../services/paymentAPI'

const BillSummary = ({ selectedTable, onTotalCalculated, includeServiceCharge, onServiceChargeChange }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totals, setTotals] = useState(null)

  useEffect(() => {
    if (selectedTable) {
      loadBillData()
    }
  }, [selectedTable])

  useEffect(() => {
    if (orders.length > 0) {
      calculateTotals()
    }
  }, [orders, includeServiceCharge])

  const loadBillData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let billOrders = []
      
      if (selectedTable.type === 'customer') {
        // Para conta individual, usar os pedidos do cliente
        billOrders = selectedTable.orders || []
      } else {
        // Para conta de mesa, buscar todos os pedidos da mesa
        const result = await CashierService.getTableOrders(selectedTable.id)
        if (result.success) {
          billOrders = result.data
        } else {
          setError(result.error)
          return
        }
      }
      
      setOrders(billOrders)
    } catch (err) {
      console.error('Error loading bill data:', err)
      setError('Erro ao carregar dados da conta')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = async () => {
    try {
      let result
      
      if (selectedTable.type === 'customer') {
        // Calcular total individual do cliente
        result = await CashierService.calculateBillTotal(selectedTable, includeServiceCharge)
      } else {
        // Calcular total da mesa
        result = await CashierService.calculateBillTotal(selectedTable, includeServiceCharge)
      }
      
      if (result.success) {
        setTotals(result.data)
        onTotalCalculated(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error calculating totals:', err)
      setError('Erro ao calcular totais')
    }
  }

  if (!selectedTable) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Resumo da Conta</h2>
        <div className="text-center py-8 text-gold/50">
          📋 Selecione uma mesa ou cliente para ver o resumo da conta
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">
          Resumo da Conta - {selectedTable.type === 'customer' ? 'Cliente' : 'Mesa'} {selectedTable.name || selectedTable.number}
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-3 text-gold/70">Carregando pedidos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">
          Resumo da Conta - {selectedTable.type === 'customer' ? 'Cliente' : 'Mesa'} {selectedTable.name || selectedTable.number}
        </h2>
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button
            onClick={loadBillData}
            className="px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">
          Resumo da Conta - {selectedTable.type === 'customer' ? 'Cliente' : 'Mesa'} {selectedTable.name || selectedTable.number}
        </h2>
        <div className="text-center py-8 text-gold/50">
          📋 Nenhum pedido encontrado para este {selectedTable.type === 'customer' ? 'cliente' : 'mesa'}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gold">
          Resumo da Conta - {selectedTable.type === 'customer' ? 'Cliente' : 'Mesa'} {selectedTable.name || selectedTable.number}
        </h2>
        <button
          onClick={loadBillData}
          className="text-gold/70 hover:text-gold transition-colors"
          title="Atualizar pedidos"
        >
          🔄
        </button>
      </div>

      {/* Customer/Table Info */}
      {selectedTable.type === 'customer' ? (
        <div className="mb-4 p-3 bg-dark-bg/50 rounded-lg">
          <div className="text-sm text-gold/70 mb-1">Cliente:</div>
          <div className="space-y-1">
            <div className="text-gold">
              👤 {selectedTable.name}
            </div>
            <div className="text-sm text-gold/60">
              🍽️ {selectedTable.table_number === 0 ? 'Balcão' : `Mesa ${selectedTable.table_number}`}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-dark-bg/50 rounded-lg">
          <div className="text-sm text-gold/70 mb-1">Clientes da Mesa:</div>
          <div className="space-y-1">
            {selectedTable.customers?.map((customer) => (
              <div key={customer.id} className="text-gold">
                👤 {customer.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4 mb-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-gold/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gold font-medium">
                Pedido #{order.id}
              </div>
              <div className="text-sm text-gold/70">
                {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
              </div>
            </div>

            <div className="space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-gold/90">
                      {item.quantity}x {item.products?.name || item.product_name || 'Produto'}
                    </div>
                    {item.observations && (
                      <div className="text-xs text-gold/60 mt-1">
                        💬 {item.observations}
                      </div>
                    )}
                  </div>
                  <div className="text-gold font-medium">
                    R$ {((item.quantity || 1) * (item.products?.price || item.price || 0)).toFixed(2)}
                  </div>
                </div>
              )) || (
                <div className="text-gold/60 text-sm">Nenhum item encontrado</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Service Charge Toggle */}
      <div className="mb-4 p-3 bg-dark-bg/30 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includeServiceCharge}
            onChange={(e) => onServiceChargeChange(e.target.checked)}
            className="sr-only"
          />
          <div className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${includeServiceCharge ? 'bg-gold' : 'bg-gold/30'}
          `}>
            <div className={`
              absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
              ${includeServiceCharge ? 'translate-x-6' : 'translate-x-0'}
            `}></div>
          </div>
          <span className="ml-3 text-gold">
            Incluir taxa de serviço (10%)
          </span>
        </label>
      </div>

      {/* Totals */}
      {totals && (
        <div className="border-t border-gold/20 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gold/80">
              <span>Subtotal:</span>
              <span>R$ {totals.subtotal?.toFixed(2) || '0,00'}</span>
            </div>
            
            {totals.couvert > 0 && (
              <div className="flex justify-between text-gold/80">
                <span>Couvert:</span>
                <span>R$ {totals.couvert?.toFixed(2) || '0,00'}</span>
              </div>
            )}
            
            {totals.serviceCharge > 0 && (
              <div className="flex justify-between text-gold/80">
                <span>Taxa de serviço (10%):</span>
                <span>R$ {totals.serviceCharge?.toFixed(2) || '0,00'}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xl font-bold text-gold border-t border-gold/20 pt-2">
              <span>Total:</span>
              <span>R$ {totals.total?.toFixed(2) || '0,00'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gold/50">
        {orders.length} pedido{orders.length !== 1 ? 's' : ''} • 
        {orders.reduce((total, order) => total + (order.order_items?.length || 0), 0)} ite{orders.reduce((total, order) => total + (order.order_items?.length || 0), 0) !== 1 ? 'ns' : 'm'}
      </div>
    </div>
  )
}

export default BillSummary
