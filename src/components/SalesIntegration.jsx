import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package,
  TrendingDown,
  RotateCcw,
  Eye
} from 'lucide-react';
import { StockDeductionService } from '../services/stockDeductionService';
import { RecipeService } from '../services/recipeService';

/**
 * Componente de integração para demonstrar baixa automática de estoque
 * Simula o fluxo completo de venda com dedução de ingredientes
 */
const SalesIntegration = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stockDeductionResult, setStockDeductionResult] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [consumptionReport, setConsumptionReport] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  // Mock data para demonstração
  const mockOrders = [
    {
      id: 'order-001',
      customer_name: 'João Silva',
      table_id: 5,
      status: 'confirmed',
      total: 45.90,
      items: [
        { product_id: 'prod-001', product_name: 'Hambúrguer Gourmet', quantity: 2, recipe_id: 'recipe-001' },
        { product_id: 'prod-002', product_name: 'Batata Frita', quantity: 1, recipe_id: 'recipe-002' }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 'order-002',
      customer_name: 'Maria Santos',
      table_id: 3,
      status: 'confirmed',
      total: 32.50,
      items: [
        { product_id: 'prod-003', product_name: 'Pizza Margherita', quantity: 1, recipe_id: 'recipe-003' }
      ],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    setOrders(mockOrders);
    loadConsumptionReport();
  }, []);

  const loadConsumptionReport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await StockDeductionService.getConsumptionReport(today, today);
    
    if (result.success) {
      setConsumptionReport(result.data);
    }
  };

  const handleSimulateStockDeduction = async (order) => {
    setLoading(true);
    setError('');
    setSimulationResult(null);

    try {
      const result = await StockDeductionService.simulateStockDeduction(order.id);
      setSimulationResult(result);
      setSelectedOrder(order);
    } catch (error) {
      setError('Erro ao simular baixa de estoque');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessStockDeduction = async (order) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setStockDeductionResult(null);

    try {
      const result = await StockDeductionService.processOrderStockDeduction(
        order.id,
        'staff-user-id'
      );
      
      setStockDeductionResult(result);
      setSelectedOrder(order);
      
      if (result.success) {
        setSuccess('Baixa de estoque processada com sucesso!');
        // Atualizar status do pedido
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.id === order.id 
              ? { ...o, status: 'stock_deducted' }
              : o
          )
        );
        loadConsumptionReport();
      } else {
        setError(result.error || 'Erro ao processar baixa de estoque');
      }
    } catch (error) {
      setError('Erro ao processar baixa de estoque');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertStockDeduction = async (order) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await StockDeductionService.revertStockDeduction(
        order.id,
        'Cancelamento do pedido',
        'staff-user-id'
      );
      
      if (result.success) {
        setSuccess('Baixa de estoque revertida com sucesso!');
        // Atualizar status do pedido
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.id === order.id 
              ? { ...o, status: 'reverted' }
              : o
          )
        );
        loadConsumptionReport();
      } else {
        setError(result.error || 'Erro ao reverter baixa de estoque');
      }
    } catch (error) {
      setError('Erro ao reverter baixa de estoque');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { color: 'bg-blue-100 text-blue-800', label: 'Confirmado' },
      'stock_deducted': { color: 'bg-green-100 text-green-800', label: 'Estoque Baixado' },
      'reverted': { color: 'bg-orange-100 text-orange-800', label: 'Revertido' }
    };
    
    const config = statusConfig[status] || statusConfig.confirmed;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integração de Vendas</h1>
          <p className="text-gray-600">Demonstração da baixa automática de estoque</p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'orders'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'consumption'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Relatório de Consumo
        </button>
      </div>

      {/* Tab: Pedidos */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Lista de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Confirmados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          Cliente: {order.customer_name} • Mesa: {order.table_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(order.total)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Itens:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span>Receita: {item.recipe_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSimulateStockDeduction(order)}
                        disabled={loading}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Simular
                      </Button>
                      
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessStockDeduction(order)}
                          disabled={loading}
                        >
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Processar Baixa
                        </Button>
                      )}
                      
                      {order.status === 'stock_deducted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevertStockDeduction(order)}
                          disabled={loading}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reverter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Simulação */}
          {simulationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Simulação de Baixa de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    simulationResult.success 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-medium">
                      {simulationResult.success 
                        ? '✅ Todos os ingredientes estão disponíveis'
                        : '❌ Ingredientes insuficientes detectados'
                      }
                    </p>
                  </div>

                  {simulationResult.data?.impact && (
                    <div>
                      <h4 className="font-medium mb-2">Impacto no Estoque:</h4>
                      <div className="space-y-2">
                        {simulationResult.data.impact.map((impact, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{impact.ingredient_name}</p>
                              <p className="text-sm text-gray-600">
                                Lote: {impact.batch_number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                -{impact.quantity_consumed} {impact.unit_measure}
                              </p>
                              <p className="text-sm text-gray-600">
                                Restará: {impact.remaining_quantity} {impact.unit_measure}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado da Baixa */}
          {stockDeductionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {stockDeductionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Resultado da Baixa de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    stockDeductionResult.success 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-medium">
                      {stockDeductionResult.success 
                        ? '✅ Baixa de estoque processada com sucesso!'
                        : `❌ Erro: ${stockDeductionResult.error}`
                      }
                    </p>
                  </div>

                  {stockDeductionResult.data?.movements && (
                    <div>
                      <h4 className="font-medium mb-2">Movimentações Registradas:</h4>
                      <div className="space-y-2">
                        {stockDeductionResult.data.movements.map((movement, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium">{movement.ingredient_name}</p>
                              <p className="text-sm text-gray-600">
                                Lote: {movement.batch_number} • Tipo: {movement.movement_type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-red-600">
                                -{movement.quantity} {movement.unit_measure}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(movement.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Relatório de Consumo */}
      {activeTab === 'consumption' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Consumo Diário</CardTitle>
          </CardHeader>
          <CardContent>
            {consumptionReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-left p-2">Quantidade Consumida</th>
                      <th className="text-left p-2">Unidade</th>
                      <th className="text-left p-2">Custo Total</th>
                      <th className="text-left p-2">Movimentações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumptionReport.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.ingredient_name}</td>
                        <td className="p-2">{item.total_consumed}</td>
                        <td className="p-2">{item.unit_measure}</td>
                        <td className="p-2">{formatCurrency(item.total_cost || 0)}</td>
                        <td className="p-2">{item.movement_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum consumo registrado hoje</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesIntegration;
