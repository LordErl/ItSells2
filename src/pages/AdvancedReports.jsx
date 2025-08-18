import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import AnalyticsService from '../services/AnalyticsService'
import { toast } from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const AdvancedReports = () => {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [analytics, setAnalytics] = useState({
    sales: null,
    products: null,
    employees: null,
    dashboard: null
  })

  // Verificar permissões
  if (!permissions.viewReports) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você não tem permissão para acessar relatórios avançados.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [salesResult, productsResult, employeesResult, dashboardResult] = await Promise.all([
        AnalyticsService.getCachedAnalytics(
          `sales_${dateRange}`,
          () => AnalyticsService.getSalesAnalytics(dateRange)
        ),
        AnalyticsService.getCachedAnalytics(
          `products_${dateRange}`,
          () => AnalyticsService.getProductAnalytics(dateRange)
        ),
        AnalyticsService.getCachedAnalytics(
          `employees_${dateRange}`,
          () => AnalyticsService.getEmployeeAnalytics(dateRange)
        ),
        AnalyticsService.getCachedAnalytics(
          `dashboard_${dateRange}`,
          () => AnalyticsService.getDashboardAnalytics(dateRange)
        )
      ])

      setAnalytics({
        sales: salesResult.success ? salesResult.data : null,
        products: productsResult.success ? productsResult.data : null,
        employees: employeesResult.success ? employeesResult.data : null,
        dashboard: dashboardResult.success ? dashboardResult.data : null
      })

      if (!salesResult.success || !productsResult.success || !employeesResult.success || !dashboardResult.success) {
        toast.error('Erro ao carregar alguns dados dos relatórios')
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (type) => {
    try {
      toast.loading('Gerando relatório...')
      
      // Simular exportação (em produção, seria integração real)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.dismiss()
      toast.success(`Relatório ${type} exportado com sucesso!`)
    } catch (error) {
      toast.dismiss()
      toast.error('Erro ao exportar relatório')
    }
  }

  // Configurações dos gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb'
        }
      },
      title: {
        color: '#e5e7eb'
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  }

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb'
        }
      }
    }
  }

  // Dados para gráfico de vendas
  const salesChartData = analytics.sales?.timeline ? {
    labels: analytics.sales.timeline.map(item => item.period),
    datasets: [
      {
        label: 'Vendas (R$)',
        data: analytics.sales.timeline.map(item => item.revenue),
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        tension: 0.4
      },
      {
        label: 'Número de Pedidos',
        data: analytics.sales.timeline.map(item => item.sales),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  } : null

  // Dados para gráfico de produtos
  const productsChartData = analytics.products?.topProducts ? {
    labels: analytics.products.topProducts.slice(0, 10).map(product => product.name),
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: analytics.products.topProducts.slice(0, 10).map(product => product.quantity),
        backgroundColor: [
          '#fbbf24', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6',
          '#f59e0b', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
        ]
      }
    ]
  } : null

  // Dados para gráfico de métodos de pagamento
  const paymentMethodsData = analytics.sales?.byPaymentMethod ? {
    labels: Object.keys(analytics.sales.byPaymentMethod),
    datasets: [
      {
        data: Object.values(analytics.sales.byPaymentMethod).map(method => method.revenue),
        backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#ef4444']
      }
    ]
  } : null

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando relatórios avançados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">📊 Relatórios Avançados</h1>
            <p className="text-gray-400">Analytics detalhados e insights do negócio</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            {/* Seletor de período */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>

            {/* Botões de exportação */}
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('PDF')}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                📄 PDF
              </button>
              <button
                onClick={() => exportReport('Excel')}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                📊 Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-800">
          {[
            { id: 'sales', label: '💰 Vendas', icon: '💰' },
            { id: 'products', label: '📦 Produtos', icon: '📦' },
            { id: 'employees', label: '👥 Funcionários', icon: '👥' },
            { id: 'dashboard', label: '📈 Visão Geral', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <div className="space-y-8">
          {/* Tab Vendas */}
          {activeTab === 'sales' && analytics.sales && (
            <div className="space-y-6">
              {/* Resumo de vendas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Total de Vendas</h3>
                  <p className="text-3xl font-bold text-white">
                    R$ {analytics.sales.summary?.total?.toFixed(2) || '0,00'}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Número de Pedidos</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.sales.summary?.count || 0}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Ticket Médio</h3>
                  <p className="text-3xl font-bold text-white">
                    R$ {analytics.sales.summary?.average?.toFixed(2) || '0,00'}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Crescimento</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.sales.summary?.growth?.toFixed(1) || '0'}%
                  </p>
                </div>
              </div>

              {/* Gráfico de vendas ao longo do tempo */}
              {salesChartData && (
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-xl font-semibold text-white mb-4">Evolução das Vendas</h3>
                  <div className="h-96">
                    <Line data={salesChartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Métodos de pagamento */}
              {paymentMethodsData && (
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-xl font-semibold text-white mb-4">Vendas por Método de Pagamento</h3>
                  <div className="h-96">
                    <Pie data={paymentMethodsData} options={pieChartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Produtos */}
          {activeTab === 'products' && analytics.products && (
            <div className="space-y-6">
              {/* Top produtos */}
              {productsChartData && (
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-xl font-semibold text-white mb-4">Top 10 Produtos Mais Vendidos</h3>
                  <div className="h-96">
                    <Bar data={productsChartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Lista detalhada de produtos */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Detalhes dos Produtos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-yellow-400">Produto</th>
                        <th className="pb-3 text-yellow-400">Quantidade</th>
                        <th className="pb-3 text-yellow-400">Receita</th>
                        <th className="pb-3 text-yellow-400">Preço Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.products.topProducts?.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-3 text-white">{product.name}</td>
                          <td className="py-3 text-gray-300">{product.quantity}</td>
                          <td className="py-3 text-green-400">R$ {product.revenue?.toFixed(2)}</td>
                          <td className="py-3 text-blue-400">R$ {product.price?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab Funcionários */}
          {activeTab === 'employees' && analytics.employees && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Taxa de Presença</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.employees.attendance?.rate?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Horas Trabalhadas</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.employees.hoursWorked?.total || 0}h
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Performance Média</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.employees.salesPerformance?.average?.toFixed(1) || '0'}/10
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Dashboard */}
          {activeTab === 'dashboard' && analytics.dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Vendas Totais</h3>
                  <p className="text-3xl font-bold text-white">
                    R$ {analytics.dashboard.sales?.total?.toFixed(2) || '0,00'}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Pedidos</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.dashboard.orders?.total || 0}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Funcionários Ativos</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.dashboard.employees?.active || 0}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Produtos Vendidos</h3>
                  <p className="text-3xl font-bold text-white">
                    {analytics.dashboard.topProducts?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedReports
