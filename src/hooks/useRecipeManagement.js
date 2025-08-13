import { useState, useEffect, useCallback } from 'react';
import { RecipeService } from '../services/recipeService';
import { IngredientService } from '../services/ingredientService';
import { StockDeductionService } from '../services/stockDeductionService';

/**
 * Hook personalizado para gerenciamento de receitas e ingredientes
 * Centraliza a lógica de estado e operações do sistema
 */
export const useRecipeManagement = () => {
  // Estados principais
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de filtros
  const [recipeFilters, setRecipeFilters] = useState({
    search: '',
    difficulty: '',
    category: ''
  });
  
  const [ingredientFilters, setIngredientFilters] = useState({
    search: '',
    category: '',
    status: ''
  });

  /**
   * Carrega todas as receitas com filtros aplicados
   */
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await RecipeService.getAllRecipes(recipeFilters);
      if (result.success) {
        setRecipes(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao carregar receitas');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeFilters]);

  /**
   * Carrega todos os ingredientes com filtros aplicados
   */
  const loadIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await IngredientService.getAllIngredients(ingredientFilters);
      if (result.success) {
        setIngredients(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao carregar ingredientes');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [ingredientFilters]);

  /**
   * Carrega resumo do estoque
   */
  const loadStockSummary = useCallback(async () => {
    try {
      const result = await IngredientService.getStockSummary();
      if (result.success) {
        setStockSummary(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo do estoque:', error);
    }
  }, []);

  /**
   * Carrega alertas de estoque baixo
   */
  const loadLowStockAlerts = useCallback(async () => {
    try {
      const result = await IngredientService.getLowStockAlerts();
      if (result.success) {
        setLowStockAlerts(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas de estoque baixo:', error);
    }
  }, []);

  /**
   * Carrega alertas de vencimento próximo
   */
  const loadExpiringAlerts = useCallback(async (days = 7) => {
    try {
      const result = await IngredientService.getExpiringBatches(days);
      if (result.success) {
        setExpiringAlerts(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas de vencimento:', error);
    }
  }, []);

  /**
   * Carrega todos os dados iniciais
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadRecipes(),
      loadIngredients(),
      loadStockSummary(),
      loadLowStockAlerts(),
      loadExpiringAlerts()
    ]);
  }, [loadRecipes, loadIngredients, loadStockSummary, loadLowStockAlerts, loadExpiringAlerts]);

  /**
   * Cria uma nova receita
   */
  const createRecipe = async (recipeData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await RecipeService.createRecipe(recipeData);
      if (result.success) {
        setSuccess('Receita criada com sucesso!');
        await loadRecipes(); // Recarrega a lista
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao criar receita');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao criar receita' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza uma receita existente
   */
  const updateRecipe = async (recipeId, recipeData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await RecipeService.updateRecipe(recipeId, recipeData);
      if (result.success) {
        setSuccess('Receita atualizada com sucesso!');
        await loadRecipes(); // Recarrega a lista
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao atualizar receita');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao atualizar receita' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Duplica uma receita existente
   */
  const duplicateRecipe = async (recipeId, newName) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await RecipeService.duplicateRecipe(recipeId, newName);
      if (result.success) {
        setSuccess('Receita duplicada com sucesso!');
        await loadRecipes(); // Recarrega a lista
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao duplicar receita');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao duplicar receita' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deleta uma receita
   */
  const deleteRecipe = async (recipeId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await RecipeService.deleteRecipe(recipeId);
      if (result.success) {
        setSuccess('Receita deletada com sucesso!');
        await loadRecipes(); // Recarrega a lista
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao deletar receita');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao deletar receita' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um novo ingrediente
   */
  const createIngredient = async (ingredientData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await IngredientService.createIngredient(ingredientData);
      if (result.success) {
        setSuccess('Ingrediente criado com sucesso!');
        await loadIngredients(); // Recarrega a lista
        await loadStockSummary(); // Atualiza resumo
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao criar ingrediente');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao criar ingrediente' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um novo lote de ingrediente
   */
  const createBatch = async (batchData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await IngredientService.createBatch(batchData);
      if (result.success) {
        setSuccess('Lote criado com sucesso!');
        await loadStockSummary(); // Atualiza resumo
        await loadLowStockAlerts(); // Atualiza alertas
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao criar lote');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao criar lote' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica disponibilidade de uma receita
   */
  const checkRecipeAvailability = async (recipeId) => {
    try {
      const result = await RecipeService.checkRecipeAvailability(recipeId);
      return result;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return { success: false, error: 'Erro ao verificar disponibilidade' };
    }
  };

  /**
   * Calcula análise de custo de uma receita
   */
  const calculateRecipeCostAnalysis = async (recipeId) => {
    try {
      const result = await RecipeService.getRecipeCostAnalysis(recipeId);
      return result;
    } catch (error) {
      console.error('Erro ao calcular análise de custo:', error);
      return { success: false, error: 'Erro ao calcular análise de custo' };
    }
  };

  /**
   * Processa baixa de estoque para um pedido
   */
  const processStockDeduction = async (orderId, userId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await StockDeductionService.processOrderStockDeduction(orderId, userId);
      if (result.success) {
        setSuccess('Baixa de estoque processada com sucesso!');
        await loadStockSummary(); // Atualiza resumo
        await loadLowStockAlerts(); // Atualiza alertas
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError('Erro ao processar baixa de estoque');
      console.error('Erro:', error);
      return { success: false, error: 'Erro ao processar baixa de estoque' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simula baixa de estoque para um pedido
   */
  const simulateStockDeduction = async (orderId) => {
    try {
      const result = await StockDeductionService.simulateStockDeduction(orderId);
      return result;
    } catch (error) {
      console.error('Erro ao simular baixa de estoque:', error);
      return { success: false, error: 'Erro ao simular baixa de estoque' };
    }
  };

  /**
   * Limpa mensagens de erro e sucesso
   */
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  /**
   * Atualiza filtros de receitas
   */
  const updateRecipeFilters = (newFilters) => {
    setRecipeFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Atualiza filtros de ingredientes
   */
  const updateIngredientFilters = (newFilters) => {
    setIngredientFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Carrega dados iniciais
  useEffect(() => {
    loadAllData();
  }, []);

  // Recarrega receitas quando filtros mudam
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Recarrega ingredientes quando filtros mudam
  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Calcula estatísticas derivadas
  const stats = {
    totalRecipes: recipes.length,
    totalIngredients: ingredients.length,
    lowStockCount: lowStockAlerts.length,
    expiringCount: expiringAlerts.length,
    totalStockValue: stockSummary.reduce((sum, item) => sum + (item.total_value || 0), 0)
  };

  return {
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
    
    // Ações de receitas
    createRecipe,
    updateRecipe,
    duplicateRecipe,
    deleteRecipe,
    checkRecipeAvailability,
    calculateRecipeCostAnalysis,
    
    // Ações de ingredientes
    createIngredient,
    createBatch,
    
    // Ações de estoque
    processStockDeduction,
    simulateStockDeduction,
    
    // Utilitários
    loadAllData,
    loadRecipes,
    loadIngredients,
    loadStockSummary,
    loadLowStockAlerts,
    loadExpiringAlerts,
    clearMessages
  };
};

export default useRecipeManagement;
