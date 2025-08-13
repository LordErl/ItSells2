import { supabase } from '../lib/supabase';

/**
 * Serviço para gestão de receitas
 * Integrado com o Sistema de Receitas e Ingredientes
 */
export class RecipeService {
  
  // =====================================================
  // GESTÃO DE RECEITAS
  // =====================================================

  /**
   * Buscar todas as receitas
   */
  static async getRecipes(filters = {}) {
    try {
      console.log('🍽️ Buscando receitas...', filters);
      
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit_measure,
            cost_per_portion,
            is_optional,
            preparation_order,
            notes,
            ingredients (
              id, name, category, unit_measure, cost_per_unit
            )
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Aplicar filtros
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar receitas:', error);
        throw error;
      }

      console.log('✅ Receitas encontradas:', data?.length || 0);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getRecipes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar receita por ID
   */
  static async getRecipeById(recipeId) {
    try {
      console.log('🔍 Buscando receita por ID:', recipeId);

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit_measure,
            cost_per_portion,
            is_optional,
            preparation_order,
            notes,
            ingredients (
              id, name, category, unit_measure, cost_per_unit, supplier
            )
          )
        `)
        .eq('id', recipeId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar receita:', error);
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no getRecipeById:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar receita por produto do menu
   */
  static async getRecipeByProductId(productId) {
    try {
      console.log('🔍 Buscando receita por produto:', productId);

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit_measure,
            cost_per_portion,
            is_optional,
            preparation_order,
            notes,
            ingredients (
              id, name, category, unit_measure, cost_per_unit
            )
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar receita por produto:', error);
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no getRecipeByProductId:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Criar nova receita
   */
  static async createRecipe(recipeData) {
    try {
      console.log('➕ Criando receita:', recipeData.name);

      // Criar receita
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          product_id: recipeData.product_id,
          name: recipeData.name,
          description: recipeData.description,
          version: recipeData.version || '1.0',
          preparation_instructions: recipeData.preparation_instructions,
          difficulty_level: recipeData.difficulty_level || 'medium',
          serving_size: recipeData.serving_size || 1,
          preparation_time_minutes: recipeData.preparation_time_minutes,
          created_by: recipeData.created_by,
          is_active: true
        }])
        .select()
        .single();

      if (recipeError) {
        console.error('❌ Erro ao criar receita:', recipeError);
        throw recipeError;
      }

      // Adicionar ingredientes da receita
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        const ingredientsToInsert = recipeData.ingredients.map((ingredient, index) => ({
          recipe_id: recipe.id,
          ingredient_id: ingredient.ingredient_id,
          quantity: ingredient.quantity,
          unit_measure: ingredient.unit_measure,
          cost_per_portion: ingredient.cost_per_portion || 0,
          is_optional: ingredient.is_optional || false,
          preparation_order: ingredient.preparation_order || (index + 1),
          notes: ingredient.notes
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) {
          console.error('❌ Erro ao adicionar ingredientes da receita:', ingredientsError);
          throw ingredientsError;
        }
      }

      // Calcular custo total da receita
      await this.updateRecipeTotalCost(recipe.id);

      console.log('✅ Receita criada:', recipe.name);
      return {
        success: true,
        data: recipe
      };

    } catch (error) {
      console.error('❌ Erro no createRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualizar receita
   */
  static async updateRecipe(recipeId, updateData) {
    try {
      console.log('✏️ Atualizando receita:', recipeId);

      const { data, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar receita:', error);
        throw error;
      }

      // Recalcular custo total se necessário
      if (updateData.ingredients) {
        await this.updateRecipeTotalCost(recipeId);
      }

      console.log('✅ Receita atualizada:', data.name);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no updateRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desativar receita
   */
  static async deactivateRecipe(recipeId) {
    try {
      console.log('🗑️ Desativando receita:', recipeId);

      const { data, error } = await supabase
        .from('recipes')
        .update({ is_active: false })
        .eq('id', recipeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao desativar receita:', error);
        throw error;
      }

      console.log('✅ Receita desativada:', data.name);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no deactivateRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // GESTÃO DE INGREDIENTES DA RECEITA
  // =====================================================

  /**
   * Adicionar ingrediente à receita
   */
  static async addIngredientToRecipe(recipeId, ingredientData) {
    try {
      console.log('➕ Adicionando ingrediente à receita:', recipeId);

      const { data, error } = await supabase
        .from('recipe_ingredients')
        .insert([{
          recipe_id: recipeId,
          ingredient_id: ingredientData.ingredient_id,
          quantity: ingredientData.quantity,
          unit_measure: ingredientData.unit_measure,
          cost_per_portion: ingredientData.cost_per_portion || 0,
          is_optional: ingredientData.is_optional || false,
          preparation_order: ingredientData.preparation_order,
          notes: ingredientData.notes
        }])
        .select(`
          *,
          ingredients (
            id, name, category, unit_measure, cost_per_unit
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar ingrediente:', error);
        throw error;
      }

      // Recalcular custo total da receita
      await this.updateRecipeTotalCost(recipeId);

      console.log('✅ Ingrediente adicionado à receita');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no addIngredientToRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualizar ingrediente da receita
   */
  static async updateRecipeIngredient(recipeIngredientId, updateData) {
    try {
      console.log('✏️ Atualizando ingrediente da receita:', recipeIngredientId);

      const { data, error } = await supabase
        .from('recipe_ingredients')
        .update(updateData)
        .eq('id', recipeIngredientId)
        .select(`
          *,
          ingredients (
            id, name, category, unit_measure, cost_per_unit
          ),
          recipes (
            id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar ingrediente da receita:', error);
        throw error;
      }

      // Recalcular custo total da receita
      await this.updateRecipeTotalCost(data.recipes.id);

      console.log('✅ Ingrediente da receita atualizado');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no updateRecipeIngredient:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remover ingrediente da receita
   */
  static async removeIngredientFromRecipe(recipeIngredientId) {
    try {
      console.log('🗑️ Removendo ingrediente da receita:', recipeIngredientId);

      // Buscar dados antes de deletar para recalcular custo
      const { data: ingredientData, error: fetchError } = await supabase
        .from('recipe_ingredients')
        .select('recipe_id')
        .eq('id', recipeIngredientId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar ingrediente da receita:', fetchError);
        throw fetchError;
      }

      const { error } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('id', recipeIngredientId);

      if (error) {
        console.error('❌ Erro ao remover ingrediente da receita:', error);
        throw error;
      }

      // Recalcular custo total da receita
      await this.updateRecipeTotalCost(ingredientData.recipe_id);

      console.log('✅ Ingrediente removido da receita');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Erro no removeIngredientFromRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // CÁLCULOS E ANÁLISES
  // =====================================================

  /**
   * Calcular custo total da receita
   */
  static async calculateRecipeCost(recipeId) {
    try {
      console.log('💰 Calculando custo da receita:', recipeId);

      const { data, error } = await supabase
        .rpc('calculate_recipe_total_cost', {
          recipe_id: recipeId
        });

      if (error) {
        console.error('❌ Erro ao calcular custo da receita:', error);
        throw error;
      }

      return {
        success: true,
        data: {
          total_cost: data
        }
      };

    } catch (error) {
      console.error('❌ Erro no calculateRecipeCost:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualizar custo total da receita no banco
   */
  static async updateRecipeTotalCost(recipeId) {
    try {
      console.log('🔄 Atualizando custo total da receita:', recipeId);

      const costResult = await this.calculateRecipeCost(recipeId);
      
      if (!costResult.success) {
        throw new Error(costResult.error);
      }

      const { error } = await supabase
        .from('recipes')
        .update({ total_cost: costResult.data.total_cost })
        .eq('id', recipeId);

      if (error) {
        console.error('❌ Erro ao atualizar custo total:', error);
        throw error;
      }

      console.log('✅ Custo total atualizado:', costResult.data.total_cost);
      return {
        success: true,
        data: {
          total_cost: costResult.data.total_cost
        }
      };

    } catch (error) {
      console.error('❌ Erro no updateRecipeTotalCost:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar disponibilidade de ingredientes para receita
   */
  static async checkRecipeAvailability(recipeId, portions = 1) {
    try {
      console.log(`🔍 Verificando disponibilidade da receita ${recipeId} para ${portions} porções`);

      const { data, error } = await supabase
        .rpc('check_recipe_availability', {
          recipe_id: recipeId,
          portions: portions
        });

      if (error) {
        console.error('❌ Erro ao verificar disponibilidade:', error);
        throw error;
      }

      return {
        success: true,
        data: {
          available: data,
          portions: portions
        }
      };

    } catch (error) {
      console.error('❌ Erro no checkRecipeAvailability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter análise detalhada de disponibilidade
   */
  static async getDetailedAvailabilityAnalysis(recipeId, portions = 1) {
    try {
      console.log(`📊 Análise detalhada de disponibilidade para receita ${recipeId}`);

      // Buscar receita com ingredientes
      const recipeResult = await this.getRecipeById(recipeId);
      if (!recipeResult.success) {
        throw new Error(recipeResult.error);
      }

      const recipe = recipeResult.data;
      const analysis = [];

      for (const recipeIngredient of recipe.recipe_ingredients) {
        const neededQuantity = parseFloat(recipeIngredient.quantity) * portions;
        
        // Buscar estoque disponível do ingrediente
        const { data: stockData, error: stockError } = await supabase
          .from('ingredient_stock_summary')
          .select('*')
          .eq('id', recipeIngredient.ingredient_id)
          .single();

        if (stockError) {
          console.error('❌ Erro ao buscar estoque:', stockError);
          continue;
        }

        const available = parseFloat(stockData.total_quantity || 0);
        const isAvailable = available >= neededQuantity;

        analysis.push({
          ingredient_id: recipeIngredient.ingredient_id,
          ingredient_name: recipeIngredient.ingredients.name,
          needed_quantity: neededQuantity,
          available_quantity: available,
          unit_measure: recipeIngredient.unit_measure,
          is_available: isAvailable,
          shortage: isAvailable ? 0 : (neededQuantity - available),
          is_optional: recipeIngredient.is_optional
        });
      }

      const allAvailable = analysis.every(item => item.is_available || item.is_optional);

      return {
        success: true,
        data: {
          recipe_id: recipeId,
          recipe_name: recipe.name,
          portions: portions,
          is_available: allAvailable,
          ingredients_analysis: analysis,
          missing_ingredients: analysis.filter(item => !item.is_available && !item.is_optional)
        }
      };

    } catch (error) {
      console.error('❌ Erro no getDetailedAvailabilityAnalysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // RELATÓRIOS E ESTATÍSTICAS
  // =====================================================

  /**
   * Buscar análise de custos das receitas
   */
  static async getRecipeCostAnalysis() {
    try {
      console.log('📊 Buscando análise de custos das receitas...');

      const { data, error } = await supabase
        .from('recipe_cost_analysis')
        .select('*')
        .order('total_cost', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar análise de custos:', error);
        throw error;
      }

      console.log('✅ Análise de custos obtida:', data?.length || 0, 'receitas');
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getRecipeCostAnalysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar receitas por nível de dificuldade
   */
  static async getRecipesByDifficulty() {
    try {
      console.log('📈 Buscando receitas por dificuldade...');

      const { data, error } = await supabase
        .from('recipes')
        .select('difficulty_level')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erro ao buscar receitas por dificuldade:', error);
        throw error;
      }

      // Agrupar por dificuldade
      const difficultyCount = data.reduce((acc, recipe) => {
        acc[recipe.difficulty_level] = (acc[recipe.difficulty_level] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: difficultyCount
      };

    } catch (error) {
      console.error('❌ Erro no getRecipesByDifficulty:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Duplicar receita
   */
  static async duplicateRecipe(recipeId, newName, newProductId = null) {
    try {
      console.log('📋 Duplicando receita:', recipeId);

      // Buscar receita original
      const originalResult = await this.getRecipeById(recipeId);
      if (!originalResult.success) {
        throw new Error(originalResult.error);
      }

      const original = originalResult.data;

      // Criar nova receita
      const newRecipeData = {
        product_id: newProductId || original.product_id,
        name: newName,
        description: original.description + ' (Cópia)',
        version: '1.0',
        preparation_instructions: original.preparation_instructions,
        difficulty_level: original.difficulty_level,
        serving_size: original.serving_size,
        preparation_time_minutes: original.preparation_time_minutes,
        created_by: original.created_by,
        ingredients: original.recipe_ingredients.map(ri => ({
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit_measure: ri.unit_measure,
          cost_per_portion: ri.cost_per_portion,
          is_optional: ri.is_optional,
          preparation_order: ri.preparation_order,
          notes: ri.notes
        }))
      };

      const result = await this.createRecipe(newRecipeData);

      console.log('✅ Receita duplicada com sucesso');
      return result;

    } catch (error) {
      console.error('❌ Erro no duplicateRecipe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default RecipeService;
