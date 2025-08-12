import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { StoreService } from '../services/storeService';
import { supabase } from '../lib';
import anime from 'animejs/lib/anime.es.js';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Status messages gourmet
  const statusMessages = {
    pending: {
      title: "Selecionando os Melhores Ingredientes",
      description: "Nossa equipe está cuidadosamente escolhendo os ingredientes mais frescos para seu pedido",
      color: "from-yellow-500 to-orange-500",
      icon: "🔍"
    },
    producing: {
      title: "Preparando seu Pedido Cuidadosamente",
      description: "Nossos chefs estão dedicando toda atenção ao preparo do seu pedido com técnicas artesanais",
      color: "from-orange-500 to-red-500",
      icon: "👨‍🍳"
    },
    ready: {
      title: "Seu Pedido Está Pronto!",
      description: "Finalizado com perfeição! Nosso garçom está a caminho da sua mesa",
      color: "from-blue-500 to-purple-500",
      icon: "✨"
    },
    delivering: {
      title: "A Caminho da Sua Mesa",
      description: "Seu pedido está sendo servido com todo cuidado e apresentação especial",
      color: "from-purple-500 to-pink-500",
      icon: "🚶‍♂️"
    },
    delivered: {
      title: "Pedido Entregue com Sucesso!",
      description: "Esperamos que aprecie cada sabor cuidadosamente preparado para você",
      color: "from-green-500 to-emerald-500",
      icon: "🎉"
    }
  };

  useEffect(() => {
    loadOrderData();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadOrderData();
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (orderItems.length > 0) {
      // Animação de entrada
      anime({
        targets: '.order-item-card',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(200),
        duration: 800,
        easing: 'easeOutExpo'
      });
    }
  }, [orderItems]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      console.log('Loading order data for orderId:', orderId, 'user.id:', user.id);
      
      // Primeiro, buscar dados do pedido sem filtro de customer_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        throw orderError;
      }

      console.log('Order data found:', orderData);

      // Verificar se o usuário tem permissão para ver este pedido
      // (pode ser customer_id ou table_id se o usuário estiver na mesa)
      if (orderData.customer_id !== user.id && orderData.table_id !== user.on_table) {
        console.log('User does not have permission to view this order');
        console.log('Order customer_id:', orderData.customer_id, 'User id:', user.id);
        console.log('Order table_id:', orderData.table_id, 'User table:', user.on_table);
        throw new Error('Unauthorized');
      }

      // Buscar itens do pedido com produtos
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            name,
            description,
            price,
            image_path,
            prep_time
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
      setError(null); // Limpar erro se sucesso
    } catch (error) {
      console.error('Erro ao carregar dados do pedido:', error);
      setError(error.message || 'Erro ao carregar pedido');
      setOrder(null);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (status) => {
    const statusOrder = ['pending', 'producing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const calculateElapsedTime = (startedAt, prepTime) => {
    if (!startedAt) return { elapsed: 0, total: prepTime || 15, isOverdue: false };
    
    const started = new Date(startedAt);
    const elapsed = Math.floor((currentTime - started) / (1000 * 60)); // minutos
    const total = prepTime || 15;
    const isOverdue = elapsed > total;
    
    return { elapsed, total, isOverdue };
  };

  const formatTimeRemaining = (elapsed, total) => {
    const remaining = Math.max(0, total - elapsed);
    if (remaining === 0) return "Finalizando...";
    return `${remaining} min restantes`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-lg">Carregando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    const errorMessage = error === 'Unauthorized' 
      ? 'Você não tem permissão para visualizar este pedido'
      : error || 'Pedido não encontrado';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-lg mb-4">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => loadOrderData()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors mr-3"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/customer-account')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Voltar à Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/customer-account')}
              className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-yellow-400">Acompanhar Pedido</h1>
              <p className="text-gray-400 text-sm">#{order.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center text-gray-400">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{currentTime.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Items */}
        <div className="space-y-8">
          {orderItems.map((item, index) => {
            const statusInfo = statusMessages[item.status] || statusMessages.pending;
            const progress = calculateProgress(item.status);
            const timeInfo = calculateElapsedTime(item.started_at, item.products?.prep_time);
            
            return (
              <div
                key={item.id}
                className="order-item-card bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Product Image */}
                    <div className="lg:w-1/3">
                      <div className="relative">
                        <img
                          src={item.products?.image_path || '/api/placeholder/300/200'}
                          alt={item.products?.name}
                          className="w-full h-64 lg:h-48 object-cover rounded-xl shadow-lg"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/300/200';
                          }}
                        />
                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                          <span className="text-yellow-400 text-sm font-semibold">
                            {item.quantity}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info & Status */}
                    <div className="lg:w-2/3 space-y-4">
                      {/* Product Details */}
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {item.products?.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                          {item.products?.description}
                        </p>
                        {item.observations && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                            <p className="text-yellow-400 text-sm">
                              <strong>Observações:</strong> {item.observations}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status Section */}
                      <div className="space-y-4">
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{statusInfo.icon}</span>
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                {statusInfo.title}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {statusInfo.description}
                              </p>
                            </div>
                          </div>
                          {item.status === 'delivered' && (
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Progresso</span>
                            <span className="text-yellow-400 font-semibold">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${statusInfo.color} transition-all duration-1000 ease-out`}
                              style={{ width: `${progress}%` }}
                            >
                              <div className="h-full bg-white/20 animate-pulse"></div>
                            </div>
                          </div>
                        </div>

                        {/* Timer Section */}
                        {(item.status === 'producing' || item.status === 'pending') && (
                          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <ClockIcon className="h-5 w-5 text-blue-400" />
                                <div>
                                  <p className="text-white font-semibold">
                                    Tempo de Preparo
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {timeInfo.isOverdue ? 'Finalizando os detalhes...' : formatTimeRemaining(timeInfo.elapsed, timeInfo.total)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-400">
                                  {timeInfo.elapsed}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  de {timeInfo.total} min
                                </p>
                              </div>
                            </div>
                            
                            {/* Mini Progress Bar for Time */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    timeInfo.isOverdue 
                                      ? 'bg-gradient-to-r from-yellow-500 to-red-500 animate-pulse' 
                                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (timeInfo.elapsed / timeInfo.total) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Delivered Status */}
                        {item.status === 'delivered' && item.delivered_at && (
                          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/20">
                            <div className="flex items-center space-x-3">
                              <CheckCircleIcon className="h-6 w-6 text-green-400" />
                              <div>
                                <p className="text-white font-semibold">Entregue com Sucesso!</p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(item.delivered_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="mt-8 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Resumo do Pedido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Mesa</p>
              <p className="text-white text-lg font-semibold">
                {order.table_number || order.table_id || 'Balcão'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total de Itens</p>
              <p className="text-white text-lg font-semibold">
                {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Valor Total</p>
              <p className="text-yellow-400 text-lg font-semibold">
                R$ {(order.total_amount || orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
