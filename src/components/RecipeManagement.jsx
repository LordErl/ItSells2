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
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [showEditRecipe, setShowEditRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  // Estados para criação de receita
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    description: '',
    difficulty_level: 'medium',
    serving_size: 1,
    preparation_time_minutes: 30,
    preparation_instructions: '',
    ingredients: []
  });
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState({
    ingredient_id: '',
    quantity: '',
    unit_measure: '',
    is_optional: false,
    notes: ''
  });

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
    }
    setLoading(false);
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

  // Funções para criação de receita
  const handleCreateRecipe = async () => {
    if (!newRecipe.name.trim()) {
      setError('O nome da receita é obrigatório');
      return;
    }
    
    if (selectedIngredients.length === 0) {
      setError('A receita deve ter pelo menos um ingrediente');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const recipeData = {
      ...newRecipe,
      preparation_time_minutes: parseInt(newRecipe.preparation_time_minutes, 10),
      ingredients: selectedIngredients
    };
    
    const result = await RecipeService.createRecipe(recipeData);
    
    if (result.success) {
      setSuccess('Receita criada com sucesso!');
      setShowCreateRecipe(false);
      resetRecipeForm();
      await loadRecipes();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const resetRecipeForm = () => {
    setNewRecipe({
      name: '',
      description: '',
      difficulty_level: 'medium',
      serving_size: 1,
      preparation_time_minutes: 30,
      preparation_instructions: '',
      ingredients: []
    });
    setSelectedIngredients([]);
    setCurrentIngredient({
      ingredient_id: '',
      quantity: '',
      unit_measure: '',
      is_optional: false,
      notes: ''
    });
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.ingredient_id || !currentIngredient.quantity) {
      setError('Selecione um ingrediente e informe a quantidade');
      return;
    }

    const ingredient = ingredients.find(ing => ing.id === currentIngredient.ingredient_id);
    if (!ingredient) return;

    const newIngredient = {
      ...currentIngredient,
      ingredient_name: ingredient.name,
      unit_measure: currentIngredient.unit_measure || ingredient.unit_measure,
      cost_per_unit: ingredient.cost_per_unit
    };

    setSelectedIngredients([...selectedIngredients, newIngredient]);
    setCurrentIngredient({
      ingredient_id: '',
      quantity: '',
      unit_measure: '',
      is_optional: false,
      notes: ''
    });
    setError('');
  };

  const handleRemoveIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, ing) => {
      return total + (parseFloat(ing.quantity) * parseFloat(ing.cost_per_unit));
    }, 0);
  };

  // Funções para edição de receita
  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setNewRecipe({
      name: recipe.name,
      description: recipe.description || '',
      difficulty_level: recipe.difficulty_level,
      serving_size: recipe.serving_size,
      preparation_time_minutes: recipe.preparation_time_minutes,
      preparation_instructions: recipe.preparation_instructions || ''
    });
    
    // Carregar ingredientes da receita
    const recipeIngredients = recipe.recipe_ingredients?.map(ri => ({
      ingredient_id: ri.ingredients.id,
      ingredient_name: ri.ingredients.name,
      quantity: ri.quantity,
      unit_measure: ri.unit_measure,
      cost_per_unit: ri.ingredients.cost_per_unit,
      is_optional: ri.is_optional,
      notes: ri.notes || ''
    })) || [];
    
    setSelectedIngredients(recipeIngredients);
    setShowEditRecipe(true);
  };

  const handleUpdateRecipe = async () => {
    if (!newRecipe.name.trim()) {
      setError('O nome da receita é obrigatório');
      return;
    }
    
    if (selectedIngredients.length === 0) {
      setError('A receita deve ter pelo menos um ingrediente');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const recipeData = {
      ...newRecipe,
      preparation_time_minutes: parseInt(newRecipe.preparation_time_minutes, 10),
      ingredients: selectedIngredients
    };
    
    const result = await RecipeService.updateRecipe(editingRecipe.id, recipeData);
    
    if (result.success) {
      setSuccess('Receita atualizada com sucesso!');
      setShowEditRecipe(false);
      setEditingRecipe(null);
      resetRecipeForm();
      await loadRecipes();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setShowEditRecipe(false);
    setEditingRecipe(null);
    resetRecipeForm();
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
        <Button onClick={() => setShowCreateRecipe(true)}>
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
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditRecipe(recipe)}
                            title="Editar receita"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCheckAvailability(recipe.id, 1)}
                            title="Verificar disponibilidade"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDuplicateRecipe(recipe.id)}
                            title="Duplicar receita"
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

      {/* Modal: Nova Receita */}
      {showCreateRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Nova Receita</h3>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateRecipe(false);
                  resetRecipeForm();
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações da Receita */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Informações Básicas</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Receita *</label>
                  <Input
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                    placeholder="Ex: Hambúrguer Gourmet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-20 resize-none"
                    value={newRecipe.description}
                    onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                    placeholder="Descrição da receita..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Dificuldade</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={newRecipe.difficulty_level}
                      onChange={(e) => setNewRecipe({...newRecipe, difficulty_level: e.target.value})}
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Porções</label>
                    <Input
                      type="number"
                      min="1"
                      value={newRecipe.serving_size}
                      onChange={(e) => setNewRecipe({...newRecipe, serving_size: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo de Preparo (minutos)</label>
                  <Input
                    type="number"
                    min="1"
                    value={newRecipe.preparation_time_minutes}
                    onChange={(e) => setNewRecipe({...newRecipe, preparation_time_minutes: parseInt(e.target.value) || 30})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Instruções de Preparo</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-32 resize-none"
                    value={newRecipe.preparation_instructions}
                    onChange={(e) => setNewRecipe({...newRecipe, preparation_instructions: e.target.value})}
                    placeholder="1. Primeiro passo...\n2. Segundo passo...\n3. Terceiro passo..."
                  />
                </div>
              </div>
              
              {/* Ingredientes */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Ingredientes</h4>
                
                {/* Adicionar Ingrediente */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h5 className="font-medium mb-3">Adicionar Ingrediente</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ingrediente *</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={currentIngredient.ingredient_id}
                        onChange={(e) => {
                          const ingredient = ingredients.find(ing => ing.id === e.target.value);
                          setCurrentIngredient({
                            ...currentIngredient,
                            ingredient_id: e.target.value,
                            unit_measure: ingredient?.unit_measure || ''
                          });
                        }}
                      >
                        <option value="">Selecione um ingrediente</option>
                        {ingredients.map(ingredient => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit_measure})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantidade *</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentIngredient.quantity}
                          onChange={(e) => setCurrentIngredient({...currentIngredient, quantity: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Unidade</label>
                        <Input
                          value={currentIngredient.unit_measure}
                          onChange={(e) => setCurrentIngredient({...currentIngredient, unit_measure: e.target.value})}
                          placeholder="kg, g, ml, un..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Observações</label>
                      <Input
                        value={currentIngredient.notes}
                        onChange={(e) => setCurrentIngredient({...currentIngredient, notes: e.target.value})}
                        placeholder="Ex: bem picado, sem sementes..."
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="optional"
                        checked={currentIngredient.is_optional}
                        onChange={(e) => setCurrentIngredient({...currentIngredient, is_optional: e.target.checked})}
                      />
                      <label htmlFor="optional" className="text-sm">Ingrediente opcional</label>
                    </div>
                    
                    <Button 
                      onClick={handleAddIngredient}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ingrediente
                    </Button>
                  </div>
                </div>
                
                {/* Lista de Ingredientes Adicionados */}
                <div>
                  <h5 className="font-medium mb-3">Ingredientes da Receita ({selectedIngredients.length})</h5>
                  
                  {selectedIngredients.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedIngredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ingredient.ingredient_name}</span>
                              {ingredient.is_optional && (
                                <Badge variant="outline" className="text-xs">Opcional</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {ingredient.quantity} {ingredient.unit_measure}
                              {ingredient.notes && ` • ${ingredient.notes}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              Custo: {formatCurrency(parseFloat(ingredient.quantity) * parseFloat(ingredient.cost_per_unit))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveIngredient(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4 border rounded-lg bg-gray-50">
                      Nenhum ingrediente adicionado
                    </p>
                  )}
                  
                  {selectedIngredients.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Custo Total Estimado:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(calculateTotalCost())}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Custo por porção: {formatCurrency(calculateTotalCost() / newRecipe.serving_size)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateRecipe(false);
                  resetRecipeForm();
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateRecipe}
                disabled={loading || !newRecipe.name.trim() || selectedIngredients.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Criando...' : 'Criar Receita'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Receita */}
      {showEditRecipe && editingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Editar Receita: {editingRecipe.name}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informações da Receita</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Receita *</label>
                  <input
                    type="text"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Hambúrguer Gourmet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={newRecipe.description}
                    onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Descrição da receita..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dificuldade</label>
                    <select
                      value={newRecipe.difficulty_level}
                      onChange={(e) => setNewRecipe({...newRecipe, difficulty_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porções</label>
                    <input
                      type="number"
                      min="1"
                      value={newRecipe.serving_size}
                      onChange={(e) => setNewRecipe({...newRecipe, serving_size: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Preparo (minutos)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRecipe.preparation_time_minutes}
                    onChange={(e) => setNewRecipe({...newRecipe, preparation_time_minutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instruções de Preparo</label>
                  <textarea
                    value={newRecipe.preparation_instructions}
                    onChange={(e) => setNewRecipe({...newRecipe, preparation_instructions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Passo a passo do preparo..."
                  />
                </div>
              </div>
              
              {/* Ingredientes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Ingredientes</h3>
                
                {/* Adicionar Ingrediente */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Adicionar Ingrediente</h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
                      <select
                        value={currentIngredient.ingredient_id}
                        onChange={(e) => {
                          const ingredient = ingredients.find(ing => ing.id === e.target.value);
                          setCurrentIngredient({
                            ...currentIngredient,
                            ingredient_id: e.target.value,
                            ingredient_name: ingredient?.name || '',
                            unit_measure: ingredient?.unit_measure || '',
                            cost_per_unit: ingredient?.cost_per_unit || 0
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um ingrediente</option>
                        {ingredients.map(ingredient => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit_measure})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentIngredient.quantity}
                        onChange={(e) => setCurrentIngredient({...currentIngredient, quantity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                      <input
                        type="text"
                        value={currentIngredient.notes}
                        onChange={(e) => setCurrentIngredient({...currentIngredient, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: bem picado, sem casca..."
                      />
                    </div>
                    
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentIngredient.is_optional}
                          onChange={(e) => setCurrentIngredient({...currentIngredient, is_optional: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Ingrediente opcional</span>
                      </label>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAddIngredient}
                    disabled={!currentIngredient.ingredient_id || !currentIngredient.quantity}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </div>
                
                {/* Lista de Ingredientes Adicionados */}
                <div>
                  <h5 className="font-medium mb-3">Ingredientes da Receita ({selectedIngredients.length})</h5>
                  
                  {selectedIngredients.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedIngredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ingredient.ingredient_name}</span>
                              {ingredient.is_optional && (
                                <Badge variant="outline" className="text-xs">Opcional</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {ingredient.quantity} {ingredient.unit_measure}
                              {ingredient.notes && ` • ${ingredient.notes}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              Custo: {formatCurrency(parseFloat(ingredient.quantity) * parseFloat(ingredient.cost_per_unit))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveIngredient(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4 border rounded-lg bg-gray-50">
                      Nenhum ingrediente adicionado
                    </p>
                  )}
                  
                  {selectedIngredients.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Custo Total Estimado:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(calculateTotalCost())}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Custo por porção: {formatCurrency(calculateTotalCost() / newRecipe.serving_size)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateRecipe}
                disabled={loading || !newRecipe.name.trim() || selectedIngredients.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Atualizando...' : 'Atualizar Receita'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagement;
