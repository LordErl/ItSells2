import React, { useState, useEffect } from 'react'
import { CashierService } from '../../services/cashierService'

const TableSelection = ({ onTableSelect, selectedTable }) => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOccupiedTables()
  }, [])

  const loadOccupiedTables = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await CashierService.getOccupiedTablesForPayment()
      
      if (result.success) {
        setTables(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro ao carregar mesas ocupadas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Mesa</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-3 text-gold/70">Carregando mesas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Mesa</h2>
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button
            onClick={loadOccupiedTables}
            className="px-4 py-2 bg-gold text-dark-bg rounded-lg hover:bg-gold/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-gold mb-4">Selecionar Mesa</h2>
        <div className="text-center py-8">
          <div className="text-gold/70 mb-4">📋 Nenhuma mesa com pedidos pendentes</div>
          <button
            onClick={loadOccupiedTables}
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
        <h2 className="text-xl font-bold text-gold">Selecionar Mesa</h2>
        <button
          onClick={loadOccupiedTables}
          className="text-gold/70 hover:text-gold transition-colors"
          title="Atualizar lista"
        >
          🔄
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
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
                <span className="text-2xl mr-2">🍽️</span>
                <span className="text-lg font-bold text-gold">
                  Mesa {table.number}
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
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gold/50">
        {tables.length} mesa{tables.length !== 1 ? 's' : ''} com pedidos pendentes
      </div>
    </div>
  )
}

export default TableSelection
