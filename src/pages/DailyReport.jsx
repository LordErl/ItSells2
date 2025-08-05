import { useState, useEffect } from 'react'
import { useStore } from '../contexts/StoreContext'
import { StoreService } from '../services/storeService'
import { formatCurrency, formatDate, formatTime } from '../lib/utils'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

const DailyReport = () => {
  const { user } = useStore()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [selectedDate])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await StoreService.getDailyReport(selectedDate)
      
      if (result.success) {
        setReportData(result.data)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error loading daily report:', error)
      setError('Erro ao carregar relatório diário')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = 'text-gold' }) => (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  )

  const AlertCard = ({ title, items, type = 'warning' }) => {
    const colors = {
      warning: 'border-yellow-500 bg-yellow-500/10',
      danger: 'border-red-500 bg-red-500/10',
      info: 'border-blue-500 bg-blue-500/10'
    }

    return (
      <div className={`border-l-4 p-4 rounded-r-lg ${colors[type]}`}>
        <h4 className="font-semibold text-white mb-2">{title}</h4>
        {items.length > 0 ? (
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index} className="text-sm text-gray-300">
                • {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Nenhum item encontrado</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg p-6">
        <div className="glass-card p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Relatório</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadReportData}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatório Diário</h1>
            <p className="text-gray-400">Análise completa das operações do dia</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
            <button
              onClick={loadReportData}
              className="btn-primary"
            >
              Atualizar
            </button>
          </div>
        </div>

        {reportData && (
          <div className="space-y-8">
            {/* Resumo Geral */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">📊 Resumo Geral</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Vendas do Dia"
                  value={formatCurrency(reportData.sales.total)}
                  icon={CurrencyDollarIcon}
                  trend={reportData.sales.trend}
                />
                <StatCard
                  title="Pedidos Realizados"
                  value={reportData.orders.count}
                  icon={ChartBarIcon}
                  trend={reportData.orders.trend}
                />
                <StatCard
                  title="Ticket Médio"
                  value={formatCurrency(reportData.sales.averageTicket)}
                  icon={ArrowTrendingUpIcon}
                  trend={reportData.sales.ticketTrend}
                />
                <StatCard
                  title="Clientes Atendidos"
                  value={reportData.customers.count}
                  icon={UserGroupIcon}
                  trend={reportData.customers.trend}
                />
              </div>
            </section>

            {/* Fechamentos de Caixa por Staff */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">💰 Fechamentos de Caixa</h2>
              <div className="glass-card p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">Funcionário</th>
                        <th className="text-right py-3 px-4 text-gray-300">PIX</th>
                        <th className="text-right py-3 px-4 text-gray-300">Cartão</th>
                        <th className="text-right py-3 px-4 text-gray-300">Dinheiro</th>
                        <th className="text-right py-3 px-4 text-gray-300">Total</th>
                        <th className="text-right py-3 px-4 text-gold">Repasse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.cashClosures.map((closure, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-white">{closure.staffName}</td>
                          <td className="py-3 px-4 text-right text-green-400">
                            {formatCurrency(closure.pix)}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-400">
                            {formatCurrency(closure.card)}
                          </td>
                          <td className="py-3 px-4 text-right text-yellow-400">
                            {formatCurrency(closure.cash)}
                          </td>
                          <td className="py-3 px-4 text-right text-white font-semibold">
                            {formatCurrency(closure.total)}
                          </td>
                          <td className="py-3 px-4 text-right text-gold font-bold">
                            {formatCurrency(closure.cashToManager)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gold">
                        <td className="py-3 px-4 text-gold font-bold">TOTAL GERAL</td>
                        <td className="py-3 px-4 text-right text-green-400 font-bold">
                          {formatCurrency(reportData.cashClosures.reduce((sum, c) => sum + c.pix, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-400 font-bold">
                          {formatCurrency(reportData.cashClosures.reduce((sum, c) => sum + c.card, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-yellow-400 font-bold">
                          {formatCurrency(reportData.cashClosures.reduce((sum, c) => sum + c.cash, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-bold">
                          {formatCurrency(reportData.cashClosures.reduce((sum, c) => sum + c.total, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-gold font-bold text-lg">
                          {formatCurrency(reportData.cashClosures.reduce((sum, c) => sum + c.cashToManager, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

            {/* Gestão de Estoque */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">📦 Gestão de Estoque</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Consumo do Dia</h3>
                  <div className="space-y-3">
                    {reportData.inventory.consumed.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-300">{item.name}</span>
                        <div className="text-right">
                          <span className="text-red-400">-{item.consumed}</span>
                          <span className="text-gray-500 text-sm ml-2">({item.unit})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <AlertCard
                    title="⚠️ Produtos Próximos ao Ponto de Pedido"
                    items={reportData.inventory.lowStock}
                    type="warning"
                  />
                  
                  <AlertCard
                    title="🚨 Produtos Próximos ao Vencimento"
                    items={reportData.inventory.nearExpiry}
                    type="danger"
                  />
                </div>
              </div>
            </section>

            {/* Performance Operacional */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">⏱️ Performance Operacional</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Tempo Médio de Preparo"
                  value={`${reportData.performance.avgPrepTime} min`}
                  icon={ClockIcon}
                  color="text-blue-400"
                />
                <StatCard
                  title="Pedidos em Atraso"
                  value={reportData.performance.delayedOrders}
                  icon={ExclamationTriangleIcon}
                  color="text-red-400"
                />
                <StatCard
                  title="Eficiência da Cozinha"
                  value={`${reportData.performance.kitchenEfficiency}%`}
                  icon={ArrowTrendingUpIcon}
                  color="text-green-400"
                />
              </div>
            </section>

            {/* Produtos Mais Vendidos */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">🏆 Top Produtos do Dia</h2>
              <div className="glass-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-gold text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">{product.quantity} vendidos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gold font-semibold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Analytics de Mesas */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">🪑 Analytics de Mesas</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumo de Mesas */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Resumo Geral</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total de Mesas Ativas:</span>
                      <span className="text-white font-semibold">{reportData.tableAnalytics?.totalTables || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Receita Média/Mesa:</span>
                      <span className="text-gold font-semibold">
                        {formatCurrency(reportData.tableAnalytics?.avgRevenuePerTable || 0)}
                      </span>
                    </div>
                    {reportData.tableAnalytics?.mostProductiveTable && (
                      <div className="mt-4 p-3 bg-gold/10 rounded-lg border border-gold/30">
                        <p className="text-gold font-semibold text-sm">🏆 Mesa Mais Produtiva</p>
                        <p className="text-white">Mesa {reportData.tableAnalytics.mostProductiveTable.number}</p>
                        <p className="text-gray-400 text-sm">
                          {formatCurrency(reportData.tableAnalytics.mostProductiveTable.revenue)} • 
                          {reportData.tableAnalytics.mostProductiveTable.orders} pedidos
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Mesas por Receita */}
                <div className="lg:col-span-2 glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Mesas por Receita</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {reportData.tableAnalytics?.tables?.slice(0, 8).map((table, index) => (
                      <div key={table.number} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-gold text-black' : 
                            index === 1 ? 'bg-gray-400 text-black' : 
                            index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">Mesa {table.number}</p>
                            <p className="text-gray-400 text-sm">{table.orders} pedidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gold font-semibold">{formatCurrency(table.revenue)}</p>
                          <p className="text-gray-400 text-sm">{table.revenueShare?.toFixed(1)}% do total</p>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>
              </div>
            </section>

            {/* Métricas Comparativas */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">📈 Métricas Comparativas</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendências Semanais e Mensais */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Tendências de Crescimento</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-400 font-medium">📅 Semanal (7 dias)</span>
                        <span className={`font-bold ${
                          (reportData.comparativeMetrics?.weekly?.growth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(reportData.comparativeMetrics?.weekly?.growth || 0) >= 0 ? '↗️' : '↘️'} 
                          {Math.abs(reportData.comparativeMetrics?.weekly?.growth || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Média diária: {formatCurrency(reportData.comparativeMetrics?.weekly?.avgDaily || 0)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total semanal: {formatCurrency(reportData.comparativeMetrics?.weekly?.totalRevenue || 0)}
                      </div>
                    </div>

                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-purple-400 font-medium">📆 Mensal (30 dias)</span>
                        <span className={`font-bold ${
                          (reportData.comparativeMetrics?.monthly?.growth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(reportData.comparativeMetrics?.monthly?.growth || 0) >= 0 ? '↗️' : '↘️'} 
                          {Math.abs(reportData.comparativeMetrics?.monthly?.growth || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Média diária: {formatCurrency(reportData.comparativeMetrics?.monthly?.avgDaily || 0)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total mensal: {formatCurrency(reportData.comparativeMetrics?.monthly?.totalRevenue || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Tendência Semanal */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📈 Últimos 7 Dias</h3>
                  <div className="space-y-3">
                    {reportData.comparativeMetrics?.chartData?.map((day, index) => {
                      const maxRevenue = Math.max(...(reportData.comparativeMetrics?.chartData?.map(d => d.revenue) || [1]))
                      const percentage = (day.revenue / maxRevenue) * 100
                      
                      return (
                        <div key={day.date} className="flex items-center space-x-3">
                          <div className="w-12 text-sm text-gray-400">{day.day}</div>
                          <div className="flex-1 bg-gray-800 rounded-full h-6 relative overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-gold to-yellow-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {formatCurrency(day.revenue)}
                            </div>
                          </div>
                        </div>
                      )
                    }) || []}
                  </div>
                  
                  {/* Melhor e Pior Dia */}
                  {reportData.comparativeMetrics?.bestDay && reportData.comparativeMetrics?.worstDay && (
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-green-400 font-semibold text-sm">🏆 Melhor Dia</p>
                        <p className="text-white text-sm">{reportData.comparativeMetrics.bestDay.day}</p>
                        <p className="text-green-400 text-sm">{formatCurrency(reportData.comparativeMetrics.bestDay.revenue)}</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                        <p className="text-red-400 font-semibold text-sm">📉 Menor Dia</p>
                        <p className="text-white text-sm">{reportData.comparativeMetrics.worstDay.day}</p>
                        <p className="text-red-400 text-sm">{formatCurrency(reportData.comparativeMetrics.worstDay.revenue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Análise de Horários de Pico */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">⏰ Análise de Horários de Pico</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumo dos Períodos */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📅 Resumo por Período</h3>
                  <div className="space-y-4">
                    {Object.entries(reportData.peakHours?.periods || {}).map(([key, period]) => {
                      const isWinner = reportData.peakHours?.bestPeriod?.name === key
                      return (
                        <div key={key} className={`p-3 rounded-lg border ${
                          isWinner ? 'bg-gold/10 border-gold/30' : 'bg-gray-800/50 border-gray-700'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-medium ${
                              isWinner ? 'text-gold' : 'text-white'
                            }`}>
                              {isWinner ? '🏆 ' : ''}{period.name}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Pedidos:</span>
                              <span className="text-white">{period.orders}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Receita:</span>
                              <span className="text-gold">{formatCurrency(period.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Estatísticas Gerais */}
                  <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-blue-400 font-semibold text-sm mb-2">📊 Estatísticas Gerais</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Horas Ativas:</span>
                        <span className="text-white">{reportData.peakHours?.totalActiveHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Média/Hora:</span>
                        <span className="text-white">{(reportData.peakHours?.avgOrdersPerHour || 0).toFixed(1)} pedidos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horário de Pico e Rush Hours */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">🔥 Horários de Rush</h3>
                  
                  {/* Horário de Pico Principal */}
                  {reportData.peakHours?.peakHour && (
                    <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-semibold">🏆 Horário de Pico</span>
                        <span className="text-red-400 font-bold">
                          {reportData.peakHours.peakHour.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-white font-medium">{reportData.peakHours.peakHour.timeRange}</p>
                      <div className="text-sm text-gray-400 mt-1">
                        {reportData.peakHours.peakHour.orders} pedidos • {formatCurrency(reportData.peakHours.peakHour.revenue)}
                      </div>
                    </div>
                  )}

                  {/* Rush Hours */}
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">🔥 Horários de Rush (8%+ dos pedidos):</p>
                    {reportData.peakHours?.rushHours?.length > 0 ? (
                      <div className="space-y-2">
                        {reportData.peakHours.rushHours.slice(0, 5).map((hour, index) => (
                          <div key={hour.hour} className="flex items-center justify-between p-2 bg-orange-500/10 rounded border border-orange-500/30">
                            <span className="text-orange-400 text-sm">{hour.timeRange}</span>
                            <div className="text-right">
                              <span className="text-white text-sm font-medium">{hour.orders} pedidos</span>
                              <div className="text-orange-400 text-xs">{hour.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum horário de rush identificado</p>
                    )}
                  </div>

                  {/* Horários Calmos */}
                  {reportData.peakHours?.quietHours?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm font-medium mb-2">😴 Horários Calmos (3% ou menos):</p>
                      <div className="flex flex-wrap gap-2">
                        {reportData.peakHours.quietHours.slice(0, 4).map((hour) => (
                          <span key={hour.hour} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {hour.timeRange}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gráfico de Horários */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📈 Distribuição por Horário</h3>
                  <div className="space-y-2">
                    {reportData.peakHours?.hourlyData?.slice(0, 10).map((hour, index) => {
                      const maxOrders = Math.max(...(reportData.peakHours?.hourlyData?.map(h => h.orders) || [1]))
                      const percentage = (hour.orders / maxOrders) * 100
                      
                      return (
                        <div key={hour.hour} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">{hour.timeRange}</span>
                            <span className="text-white">{hour.orders} pedidos</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-3 relative overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                index < 3 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                                'bg-gradient-to-r from-blue-500 to-cyan-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {hour.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )
                    }) || []}
                  </div>
                  
                  {/* Ticket Médio por Horário */}
                  {reportData.peakHours?.hourlyData?.length > 0 && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-green-400 font-semibold text-sm mb-2">💰 Melhor Ticket Médio</p>
                      {(() => {
                        const bestTicket = reportData.peakHours.hourlyData
                          .filter(h => h.orders >= 3) // At least 3 orders for relevance
                          .sort((a, b) => b.avgTicket - a.avgTicket)[0]
                        return bestTicket ? (
                          <div className="text-sm">
                            <span className="text-white">{bestTicket.timeRange}</span>
                            <span className="text-green-400 ml-2 font-medium">
                              {formatCurrency(bestTicket.avgTicket)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Dados insuficientes</span>
                        )
                      })()
                      }
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Insights e Recomendações */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">💡 Insights e Recomendações</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertCard
                  title="📈 Oportunidades de Melhoria"
                  items={reportData.insights.opportunities}
                  type="info"
                />
                
                <AlertCard
                  title="🎯 Ações Recomendadas"
                  items={reportData.insights.recommendations}
                  type="info"
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyReport
