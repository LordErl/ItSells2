import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, Plus, Search, AlertTriangle, DollarSign, Clock, Users,
  Eye, Edit, Copy, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { RecipeService } from '../services/recipeService';
import { IngredientService } from '../services/ingredientService';

/**
 * Componente para gestão completa de receitas
 * Integrado com o Sistema de Receitas e Ingredientes
 */
const RecipeManagement = () => {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState([]);
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [activeTab, setActiveTab] = useState('recipes');
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecipes(),
        loadIngredients(),
        loadCostAnalysis()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    const result = await RecipeService.getRecipes({
      search: searchTerm,
      difficulty: selectedDifficulty
    });
    if (result.success) setRecipes(result.data);
    else setError(result.error);
  };

  const loadIngredients = async () => {
    const result = await IngredientService.getIngredients();
    if (result.success) setIngredients(result.data);
  };

  const loadCostAnalysis = async () => {
    const result = await RecipeService.getRecipeCostAnalysis();
    if (result.success) setCostAnalysis(result.data);
  };

  const loadRecipeDetails = async (recipeId) => {
    const result = await RecipeService.getRecipeIngredients(recipeId);
    if (result.success) setRecipeIngredients(result.data);
  };

  const handleViewRecipe = async (recipe) => {
    setSelectedRecipe(recipe);
    await loadRecipeDetails(recipe.id);
    setShowRecipeDetails(true);
  };

  const handleCheckAvailability = async (recipeId, portions = 1) => {
    const result = await RecipeService.checkRecipeAvailability(recipeId, portions);
    setAvailabilityCheck(result);
  };

  const handleDuplicateRecipe = async (recipeId) => {
    const result = await RecipeService.duplicateRecipe(recipeId, 'admin-user-id');
    if (result.success) {
      setSuccess('Receita duplicada com sucesso!');
      loadRecipes();
    } else {
      setError(result.error);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const config = {
      'easy': { color: 'bg-green-100 text-green-800', label: 'Fácil' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', label: 'Médio' },
      'hard': { color: 'bg-red-100 text-red-800', label: 'Difícil' }
    }[difficulty] || { color: 'bg-gray-100 text-gray-800', label: 'N/A' };
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ChefHat className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando receitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Receitas</h1>
          <p className="text-gray-600">Controle completo de receitas e custos</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Receita
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Receitas</p>
                <p className="text-2xl font-bold">{recipes.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Custo Médio</p>
                <p className="text-2xl font-bold">
                  {costAnalysis.length > 0 
                    ? formatCurrency(costAnalysis.reduce((sum, r) => sum + (r.total_cost || 0), 0) / costAnalysis.length)
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {recipes.length > 0 
                    ? formatTime(Math.round(recipes.reduce((sum, r) => sum + (r.prep_time_minutes + r.cooking_time_minutes), 0) / recipes.length))
                    : '0min'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Porções Totais</p>
                <p className="text-2xl font-bold">
                  {recipes.reduce((sum, r) => sum + (r.portions || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar receitas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && loadRecipes()}
                />
              </div>
            </div>
            <Button onClick={loadRecipes}>Buscar</Button>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setTimeout(loadRecipes, 100);
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todas as dificuldades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Receitas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Dificuldade</th>
                  <th className="text-left p-2">Tempo Total</th>
                  <th className="text-left p-2">Porções</th>
                  <th className="text-left p-2">Custo Total</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map(recipe => {
                  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
                  const costData = costAnalysis.find(c => c.id === recipe.id);
                  
                  return (
                    <tr key={recipe.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{recipe.name}</p>
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            {recipe.description}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">{getDifficultyBadge(recipe.difficulty)}</td>
                      <td className="p-2">{formatTime(totalTime)}</td>
                      <td className="p-2">{recipe.portions}</td>
                      <td className="p-2">
                        {costData ? formatCurrency(costData.total_cost) : 'N/A'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewRecipe(recipe)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCheckAvailability(recipe.id, 1)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDuplicateRecipe(recipe.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Detalhes da Receita */}
      {showRecipeDetails && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
              <Button variant="outline" onClick={() => setShowRecipeDetails(false)}>
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações da Receita */}
              <div>
                <h3 className="text-lg font-medium mb-4">Informações</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Descrição</label>
                    <p>{selectedRecipe.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dificuldade</label>
                      <div>{getDifficultyBadge(selectedRecipe.difficulty)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Porções</label>
                      <p>{selectedRecipe.portions}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tempo de Preparo</label>
                      <p>{formatTime(selectedRecipe.prep_time_minutes)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tempo de Cozimento</label>
                      <p>{formatTime(selectedRecipe.cooking_time_minutes)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <h3 className="text-lg font-medium mb-4">Ingredientes</h3>
                <div className="space-y-2">
                  {recipeIngredients.map(ingredient => (
                    <div key={ingredient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ingredient.ingredients?.name}</p>
                        {ingredient.notes && (
                          <p className="text-sm text-gray-600">{ingredient.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {ingredient.quantity} {ingredient.ingredients?.unit_measure}
                        </p>
                        {ingredient.is_optional && (
                          <Badge variant="outline">Opcional</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado da Verificação de Disponibilidade */}
      {availabilityCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {availabilityCheck.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado da Verificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${
              availabilityCheck.success 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              <p className="font-medium">
                {availabilityCheck.success 
                  ? '✅ Receita disponível para preparo!'
                  : '❌ Receita não disponível - ingredientes insuficientes'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipeManagement;
