import React, { useState, useEffect } from 'react'
import { CashierService } from '../../services/cashierService'

const TableSelection = ({ onTableSelect, selectedTable }) => {
  const [billData, setBillData] = useState({ customers: [], tables: [] })
  const [viewMode, setViewMode] = useState('customers') // 'customers' or 'tables'
  const [couvertRate, setCouvertRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBillData()
    loadCouvertRate()
  }, [])

  const loadBillData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await CashierService.getOccupiedTablesForPayment()
      setBillData(result)
    } catch (err) {
      console.error('Error loading bill data:', err)
      setError('Erro ao carregar contas pendentes')
    } finally {
      setLoading(false)
    }
  }

  const loadCouvertRate = async () => {
    try {
      const rate = await CashierService.getDailyCouvertRate()
      setCouvertRate(rate)
    } catch (err) {
      console.error('Error loading couvert rate:', err)
      setCouvertRate(0)
    }
  }

  if (loading) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Conta</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-3 text-gold/70">Carregando contas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Conta</h2>
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

  if (billData.customers.length === 0 && billData.tables.length === 0) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Conta</h2>
        <div className="text-center py-8">
          <div className="text-gold/70 mb-4">📋 Nenhuma conta pendente</div>
          <button
            onClick={loadBillData}
            className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gold">Selecionar Conta</h2>
        <button
          onClick={loadBillData}
          className="text-gold/70 hover:text-gold transition-colors"
          title="Atualizar lista"
        >
          🔄
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewMode === 'customers' ? (
          billData.customers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => onTableSelect(customer)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${selectedTable?.id === customer.id
                  ? 'border-gold bg-gold/10 shadow-lg'
                  : 'border-gold/30 bg-dark-bg/50 hover:border-gold/60 hover:bg-gold/5'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">👥</span>
                  <span className="text-lg font-bold text-gold">
                    {customer.name}
                  </span>
                </div>
                {selectedTable?.id === customer.id && (
                  <span className="text-gold">✓</span>
                )}
              </div>

              <div className="text-sm text-gold/70">
                <div className="mb-1">
                  📊 {customer.orders.length} pedido{customer.orders.length !== 1 ? 's' : ''}
                </div>
                <div className="mb-1">
                  🍽️ {customer.table_number === 0 ? 'Balcão' : `Mesa ${customer.table_number}`}
                </div>
                <div className="space-y-1">
                  {customer.orders.map((order, index) => (
                    <div key={order.id} className="truncate">
                      • Pedido #{order.id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          billData.tables.map((table) => (
            <div
              key={table.id}
              onClick={() => onTableSelect(table)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${selectedTable?.id === table.id
                  ? 'border-gold bg-gold/10 shadow-lg'
                  : 'border-gold/30 bg-dark-bg/50 hover:border-gold/60 hover:bg-gold/5'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{table.number === 0 ? '🥤' : '🍽️'}</span>
                  <span className="text-lg font-bold text-gold">
                    {table.number === 0 ? 'Balcão' : `Mesa ${table.number}`}
                  </span>
                </div>
                {selectedTable?.id === table.id && (
                  <span className="text-gold">✓</span>
                )}
              </div>

              <div className="text-sm text-gold/70">
                <div className="mb-1">
                  👥 {table.customers.length} cliente{table.customers.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-1">
                  {table.customers.map((customer, index) => (
                    <div key={customer.id} className="truncate">
                      • {customer.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gold/50">
        {viewMode === 'customers' ? billData.customers.length : billData.tables.length}{' '}
        {viewMode === 'customers' ? 'cliente' : 'mesa'}{' '}
        {viewMode === 'customers' ? billData.customers.length !== 1 ? 's' : '' : billData.tables.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default TableSelection
