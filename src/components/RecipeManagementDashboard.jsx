import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useRecipeManagement } from '../hooks/useRecipeManagement';

/**
 * Dashboard principal para gestão de receitas e ingredientes
 * Utiliza o hook useRecipeManagement para centralizar a lógica
 */
const RecipeManagementDashboard = () => {
  const {
    // Estados
    recipes,
    ingredients,
    stockSummary,
    lowStockAlerts,
    expiringAlerts,
    loading,
    error,
    success,
    stats,
    
    // Filtros
    recipeFilters,
    ingredientFilters,
    updateRecipeFilters,
    updateIngredientFilters,
    
    // Ações
    loadAllData,
    clearMessages,
    checkRecipeAvailability,
    calculateRecipeCostAnalysis
  } = useRecipeManagement();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeAnalysis, setRecipeAnalysis] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleRecipeAnalysis = async (recipe) => {
    setSelectedRecipe(recipe);
    const analysis = await calculateRecipeCostAnalysis(recipe.id);
    setRecipeAnalysis(analysis);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      'inactive': { color: 'bg-gray-100 text-gray-800', label: 'Inativo' },
      'low_stock': { color: 'bg-yellow-100 text-yellow-800', label: 'Estoque Baixo' },
      'out_of_stock': { color: 'bg-red-100 text-red-800', label: 'Sem Estoque' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty) => {
    const difficultyConfig = {
      'easy': { color: 'bg-green-100 text-green-800', label: 'Fácil' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', label: 'Médio' },
      'hard': { color: 'bg-red-100 text-red-800', label: 'Difícil' }
    };
    
    const config = difficultyConfig[difficulty] || difficultyConfig.medium;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Receitas</h1>
          <p className="text-gray-600">Gestão completa de receitas e ingredientes</p>
        </div>
        <Button onClick={loadAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
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
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receitas</p>
                <p className="text-2xl font-bold">{stats.totalRecipes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingredientes</p>
                <p className="text-2xl font-bold">{stats.totalIngredients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold">{stats.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vencendo</p>
                <p className="text-2xl font-bold">{stats.expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Estoque</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'recipes', label: 'Receitas', icon: ChefHat },
          { id: 'ingredients', label: 'Ingredientes', icon: Package },
          { id: 'alerts', label: 'Alertas', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas Populares */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipes.slice(0, 5).map(recipe => (
                  <div key={recipe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{recipe.name}</p>
                      <p className="text-sm text-gray-600">
                        {recipe.prep_time} min • {recipe.servings} porções
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(recipe.difficulty)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecipeAnalysis(recipe)}
                      >
                        Analisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ingredientes com Estoque Baixo */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes - Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 5).map(alert => (
                  <div key={alert.ingredient_id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">{alert.ingredient_name}</p>
                      <p className="text-sm text-gray-600">
                        Estoque: {alert.current_stock} {alert.unit_measure}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        Mín: {alert.minimum_stock} {alert.unit_measure}
                      </p>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Baixo
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Receitas */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Filtros de Receitas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar receitas..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      value={recipeFilters.search}
                      onChange={(e) => updateRecipeFilters({ search: e.target.value })}
                    />
                  </div>
                </div>
                <select
                  className="px-4 py-2 border rounded-lg"
                  value={recipeFilters.difficulty}
                  onChange={(e) => updateRecipeFilters({ difficulty: e.target.value })}
                >
                  <option value="">Todas as dificuldades</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Receita
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Receitas */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas ({recipes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Dificuldade</th>
                      <th className="text-left p-2">Tempo</th>
                      <th className="text-left p-2">Porções</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map(recipe => (
                      <tr key={recipe.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{recipe.name}</p>
                            <p className="text-sm text-gray-600">{recipe.description}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          {getDifficultyBadge(recipe.difficulty)}
                        </td>
                        <td className="p-2">{recipe.prep_time} min</td>
                        <td className="p-2">{recipe.servings}</td>
                        <td className="p-2">
                          {getStatusBadge(recipe.status)}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecipeAnalysis(recipe)}
                            >
                              Analisar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Ingredientes */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Filtros de Ingredientes */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar ingredientes..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      value={ingredientFilters.search}
                      onChange={(e) => updateIngredientFilters({ search: e.target.value })}
                    />
                  </div>
                </div>
                <select
                  className="px-4 py-2 border rounded-lg"
                  value={ingredientFilters.category}
                  onChange={(e) => updateIngredientFilters({ category: e.target.value })}
                >
                  <option value="">Todas as categorias</option>
                  <option value="carnes">Carnes</option>
                  <option value="vegetais">Vegetais</option>
                  <option value="laticinios">Laticínios</option>
                  <option value="temperos">Temperos</option>
                </select>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Ingrediente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Estoque Atual</th>
                      <th className="text-left p-2">Estoque Mínimo</th>
                      <th className="text-left p-2">Valor Total</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.map(item => (
                      <tr key={item.ingredient_id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.ingredient_name}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2">
                          {item.current_stock} {item.unit_measure}
                        </td>
                        <td className="p-2">
                          {item.minimum_stock} {item.unit_measure}
                        </td>
                        <td className="p-2">{formatCurrency(item.total_value)}</td>
                        <td className="p-2">
                          {item.current_stock <= item.minimum_stock 
                            ? getStatusBadge('low_stock')
                            : getStatusBadge('active')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Alertas */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas de Estoque Baixo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Estoque Baixo ({lowStockAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockAlerts.map(alert => (
                  <div key={alert.ingredient_id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.ingredient_name}</p>
                        <p className="text-sm text-gray-600">
                          Categoria: {alert.category}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Baixo
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Atual: {alert.current_stock} {alert.unit_measure}</span>
                      <span>Mínimo: {alert.minimum_stock} {alert.unit_measure}</span>
                    </div>
                  </div>
                ))}
                {lowStockAlerts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum alerta de estoque baixo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Vencimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                Vencimento Próximo ({expiringAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringAlerts.map(alert => (
                  <div key={alert.batch_id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.ingredient_name}</p>
                        <p className="text-sm text-gray-600">
                          Lote: {alert.batch_number}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        Vencendo
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Quantidade: {alert.quantity} {alert.unit_measure}</span>
                      <span>Vence: {formatDate(alert.expiration_date)}</span>
                    </div>
                  </div>
                ))}
                {expiringAlerts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum alerta de vencimento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Análise de Receita */}
      {selectedRecipe && recipeAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Análise de Custo - {selectedRecipe.name}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRecipe(null);
                  setRecipeAnalysis(null);
                }}
              >
                ✕
              </Button>
            </div>

            {recipeAnalysis.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Custo Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(recipeAnalysis.data.total_cost)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Custo por Porção</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(recipeAnalysis.data.cost_per_serving)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Ingredientes:</h3>
                  <div className="space-y-2">
                    {recipeAnalysis.data.ingredients?.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{ingredient.ingredient_name}</span>
                        <span>{formatCurrency(ingredient.ingredient_cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-red-600">Erro ao carregar análise de custo</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagementDashboard;
