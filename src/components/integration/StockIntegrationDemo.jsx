import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { StoreService } from '@/services/storeService';
import { CheckCircle, XCircle, Clock, AlertTriangle, Package, ShoppingCart } from 'lucide-react';

/**
 * Componente de demonstração da integração de baixa automática
 * Mostra como a baixa de estoque funciona no fluxo de pedidos
 */
export default function StockIntegrationDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Exemplo de pedido para teste
  const sampleOrder = {
    customer_id: 1,
    table_id: 5,
    items: [
      {
        product_id: 1,
        quantity: 2,
        price: 25.90,
        observations: 'Sem cebola'
      },
      {
        product_id: 2,
        quantity: 1,
        price: 18.50,
        observations: 'Ponto médio'
      }
    ],
    observations: 'Pedido de demonstração da integração'
  };

  const handleCreateOrderWithValidation = async () => {
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      console.log('🚀 Criando pedido com validação de estoque...');
      
      // Criar pedido com validação de estoque habilitada
      const orderResult = await StoreService.createOrder({
        ...sampleOrder,
        validate_stock: true
      });

      if (!orderResult.success) {
        if (orderResult.validation_error) {
          setError({
            type: 'validation',
            message: orderResult.error,
            unavailable_items: orderResult.unavailable_items
          });
        } else {
          setError({
            type: 'creation',
            message: orderResult.error
          });
        }
        return;
      }

      console.log('✅ Pedido criado com sucesso:', orderResult.data);

      // Simular confirmação do pedido (que ativa a baixa automática)
      console.log('🔄 Confirmando pedido para ativar baixa automática...');
      
      const confirmResult = await StoreService.updateOrderStatus(
        orderResult.data.id, 
        'confirmed'
      );

      if (!confirmResult.success) {
        setError({
          type: 'confirmation',
          message: confirmResult.error
        });
        return;
      }

      setResults({
        order: orderResult.data,
        confirmation: confirmResult.data,
        message: 'Pedido criado e confirmado com sucesso! Baixa automática processada.'
      });

    } catch (err) {
      console.error('❌ Erro no teste de integração:', err);
      setError({
        type: 'system',
        message: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrderWithoutValidation = async () => {
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      console.log('🚀 Criando pedido sem validação de estoque...');
      
      // Criar pedido sem validação de estoque
      const orderResult = await StoreService.createOrder({
        ...sampleOrder,
        validate_stock: false
      });

      if (!orderResult.success) {
        setError({
          type: 'creation',
          message: orderResult.error
        });
        return;
      }

      setResults({
        order: orderResult.data,
        message: 'Pedido criado sem validação de estoque. Use "Confirmar Pedido" para ativar a baixa automática.'
      });

    } catch (err) {
      console.error('❌ Erro no teste de integração:', err);
      setError({
        type: 'system',
        message: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!results?.order?.id) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔄 Confirmando pedido para ativar baixa automática...');
      
      const confirmResult = await StoreService.updateOrderStatus(
        results.order.id, 
        'confirmed'
      );

      if (!confirmResult.success) {
        setError({
          type: 'confirmation',
          message: confirmResult.error
        });
        return;
      }

      setResults(prev => ({
        ...prev,
        confirmation: confirmResult.data,
        message: 'Pedido confirmado com sucesso! Baixa automática processada.'
      }));

    } catch (err) {
      console.error('❌ Erro na confirmação:', err);
      setError({
        type: 'system',
        message: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Demonstração de Integração - Baixa Automática
          </CardTitle>
          <CardDescription>
            Teste o fluxo completo de criação de pedidos com validação e baixa automática de estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Pedido de Exemplo */}
          <div>
            <h3 className="font-medium mb-2">Pedido de Exemplo:</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium">Mesa 5 - Cliente ID: 1</span>
              </div>
              {sampleOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>Produto {item.product_id} x{item.quantity}</span>
                  <span>R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>R$ {sampleOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botões de Teste */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleCreateOrderWithValidation}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? <Clock className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Criar Pedido (Com Validação)
            </Button>
            
            <Button 
              onClick={handleCreateOrderWithoutValidation}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isProcessing ? <Clock className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Criar Pedido (Sem Validação)
            </Button>

            {results?.order && !results?.confirmation && (
              <Button 
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {isProcessing ? <Clock className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar Pedido
              </Button>
            )}
          </div>

          {/* Resultados */}
          {results && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">{results.message}</p>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Pedido ID:</span>
                      <Badge variant="outline">{results.order.id}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <Badge className={getStatusColor(results.confirmation?.status || results.order.status)}>
                        {results.confirmation?.status || results.order.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>Total:</span>
                      <span className="font-medium">R$ {results.order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Erros */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-medium">
                    {error.type === 'validation' && 'Erro de Validação de Estoque'}
                    {error.type === 'creation' && 'Erro na Criação do Pedido'}
                    {error.type === 'confirmation' && 'Erro na Confirmação do Pedido'}
                    {error.type === 'system' && 'Erro do Sistema'}
                  </p>
                  
                  <p className="text-sm">{error.message}</p>
                  
                  {error.unavailable_items && error.unavailable_items.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Itens indisponíveis:</p>
                      <ul className="list-disc list-inside ml-2">
                        {error.unavailable_items.map((item, index) => (
                          <li key={index}>
                            {item.product_name || `Produto ${item.product_id}`}
                            {item.missing_ingredients && (
                              <span className="text-gray-600">
                                {' '}(Ingredientes em falta: {item.missing_ingredients.join(', ')})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informações sobre o Fluxo */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Como funciona a integração:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Criação com Validação:</strong> Verifica disponibilidade de ingredientes antes de criar o pedido</li>
              <li>• <strong>Criação sem Validação:</strong> Cria o pedido sem verificar estoque (modo degradado)</li>
              <li>• <strong>Confirmação:</strong> Quando o status muda para "confirmed", a baixa automática é processada</li>
              <li>• <strong>Baixa Automática:</strong> Deduz ingredientes do estoque baseado nas receitas dos produtos</li>
              <li>• <strong>Logs:</strong> Todas as operações são logadas no console do navegador</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
