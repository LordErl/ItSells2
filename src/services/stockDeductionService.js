import { supabase } from '../lib/supabase';
import { IngredientService } from './ingredientService';
import { RecipeService } from './recipeService';

/**
 * Serviço para baixa automática de estoque
 * Integrado com o Sistema de Receitas e Ingredientes
 */
export class StockDeductionService {
  
  // =====================================================
  // BAIXA AUTOMÁTICA DE ESTOQUE
  // =====================================================

  /**
   * Processar baixa automática para uma venda
   */
  static async processOrderStockDeduction(orderData) {
    try {
      console.log('🛒 Processando baixa automática para pedido:', orderData.id || 'N/A');

      const results = [];
      const errors = [];

      // Processar cada item do pedido
      for (const item of orderData.items) {
        try {
          const itemResult = await this.processOrderItemStockDeduction(
            item.product_id,
            item.quantity,
            orderData.id,
            orderData.user_id
          );

          if (itemResult.success) {
            results.push({
              product_id: item.product_id,
              quantity: item.quantity,
              deductions: itemResult.data
            });
          } else {
            errors.push({
              product_id: item.product_id,
              error: itemResult.error
            });
          }
        } catch (itemError) {
          console.error(`❌ Erro ao processar item ${item.product_id}:`, itemError);
          errors.push({
            product_id: item.product_id,
            error: itemError.message
          });
        }
      }

      const hasErrors = errors.length > 0;
      
      if (hasErrors) {
        console.warn('⚠️ Baixa automática concluída com erros:', errors.length);
      } else {
        console.log('✅ Baixa automática concluída com sucesso');
      }

      return {
        success: !hasErrors,
        data: {
          processed_items: results,
          errors: errors,
          total_items: orderData.items.length,
          successful_items: results.length,
          failed_items: errors.length
        }
      };

    } catch (error) {
      console.error('❌ Erro no processOrderStockDeduction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processar baixa para um item específico do pedido
   */
  static async processOrderItemStockDeduction(productId, quantity, orderId, userId) {
    try {
      console.log(`📦 Processando baixa para produto ${productId}, quantidade: ${quantity}`);

      // Buscar receita do produto
      const recipeResult = await RecipeService.getRecipeByProductId(productId);
      
      if (!recipeResult.success) {
        console.log(`ℹ️ Produto ${productId} não possui receita cadastrada - pulando baixa automática`);
        return {
          success: true,
          data: {
            message: 'Produto sem receita - baixa automática não aplicável',
            product_id: productId,
            deductions: []
          }
        };
      }

      const recipe = recipeResult.data;

      // Verificar disponibilidade antes da baixa
      const availabilityResult = await RecipeService.checkRecipeAvailability(recipe.id, quantity);
      
      if (!availabilityResult.success || !availabilityResult.data.available) {
        console.error(`❌ Ingredientes insuficientes para produto ${productId}`);
        return {
          success: false,
          error: `Ingredientes insuficientes para ${recipe.name}`
        };
      }

      // Processar baixa de cada ingrediente da receita
      const deductions = [];
      
      for (const recipeIngredient of recipe.recipe_ingredients) {
        // Pular ingredientes opcionais se não disponíveis
        if (recipeIngredient.is_optional) {
          const ingredientAvailable = await this.checkIngredientAvailability(
            recipeIngredient.ingredient_id,
            parseFloat(recipeIngredient.quantity) * quantity
          );
          
          if (!ingredientAvailable) {
            console.log(`⚠️ Ingrediente opcional ${recipeIngredient.ingredients.name} não disponível - pulando`);
            continue;
          }
        }

        const neededQuantity = parseFloat(recipeIngredient.quantity) * quantity;
        
        const deductionResult = await IngredientService.consumeIngredient(
          recipeIngredient.ingredient_id,
          neededQuantity,
          'order',
          orderId,
          userId
        );

        if (deductionResult.success) {
          deductions.push({
            ingredient_id: recipeIngredient.ingredient_id,
            ingredient_name: recipeIngredient.ingredients.name,
            quantity_consumed: neededQuantity,
            unit_measure: recipeIngredient.unit_measure,
            affected_batches: deductionResult.data.affected_batches
          });
        } else {
          console.error(`❌ Erro na baixa do ingrediente ${recipeIngredient.ingredients.name}:`, deductionResult.error);
          throw new Error(`Erro na baixa do ingrediente ${recipeIngredient.ingredients.name}: ${deductionResult.error}`);
        }
      }

      console.log(`✅ Baixa automática concluída para produto ${productId}:`, deductions.length, 'ingredientes processados');
      
      return {
        success: true,
        data: {
          product_id: productId,
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          quantity_sold: quantity,
          deductions: deductions
        }
      };

    } catch (error) {
      console.error('❌ Erro no processOrderItemStockDeduction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar se há ingredientes suficientes para um pedido
   */
  static async validateOrderStockAvailability(orderData) {
    try {
      console.log('🔍 Validando disponibilidade de estoque para pedido...');

      const validationResults = [];
      let allAvailable = true;

      for (const item of orderData.items) {
        const itemValidation = await this.validateProductStockAvailability(
          item.product_id,
          item.quantity
        );

        validationResults.push({
          product_id: item.product_id,
          quantity: item.quantity,
          ...itemValidation
        });

        if (!itemValidation.available) {
          allAvailable = false;
        }
      }

      return {
        success: true,
        data: {
          all_available: allAvailable,
          items: validationResults,
          unavailable_items: validationResults.filter(item => !item.available)
        }
      };

    } catch (error) {
      console.error('❌ Erro no validateOrderStockAvailability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validar disponibilidade para um produto específico
   */
  static async validateProductStockAvailability(productId, quantity) {
    try {
      console.log(`🔍 Validando estoque para produto ${productId}, quantidade: ${quantity}`);

      // Buscar receita do produto
      const recipeResult = await RecipeService.getRecipeByProductId(productId);
      
      if (!recipeResult.success) {
        // Produto sem receita - assumir disponível
        return {
          available: true,
          has_recipe: false,
          message: 'Produto sem receita cadastrada'
        };
      }

      const recipe = recipeResult.data;

      // Verificar disponibilidade detalhada
      const analysisResult = await RecipeService.getDetailedAvailabilityAnalysis(recipe.id, quantity);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }

      const analysis = analysisResult.data;

      return {
        available: analysis.is_available,
        has_recipe: true,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        missing_ingredients: analysis.missing_ingredients,
        ingredients_analysis: analysis.ingredients_analysis
      };

    } catch (error) {
      console.error('❌ Erro no validateProductStockAvailability:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar disponibilidade de um ingrediente específico
   */
  static async checkIngredientAvailability(ingredientId, quantityNeeded) {
    try {
      const { data: stockData, error } = await supabase
        .from('ingredient_stock_summary')
        .select('total_quantity')
        .eq('id', ingredientId)
        .single();

      if (error) {
        console.error('❌ Erro ao verificar estoque do ingrediente:', error);
        return false;
      }

      const available = parseFloat(stockData.total_quantity || 0);
      return available >= quantityNeeded;

    } catch (error) {
      console.error('❌ Erro no checkIngredientAvailability:', error);
      return false;
    }
  }

  // =====================================================
  // SIMULAÇÕES E PREVISÕES
  // =====================================================

  /**
   * Simular baixa de estoque sem executar
   */
  static async simulateStockDeduction(orderData) {
    try {
      console.log('🎭 Simulando baixa de estoque...');

      const simulation = [];

      for (const item of orderData.items) {
        const itemSimulation = await this.simulateProductStockDeduction(
          item.product_id,
          item.quantity
        );

        simulation.push({
          product_id: item.product_id,
          quantity: item.quantity,
          ...itemSimulation
        });
      }

      const totalIngredients = simulation.reduce((sum, item) => 
        sum + (item.ingredients_impact?.length || 0), 0
      );

      return {
        success: true,
        data: {
          items: simulation,
          total_products: orderData.items.length,
          total_ingredients_affected: totalIngredients,
          feasible: simulation.every(item => item.feasible)
        }
      };

    } catch (error) {
      console.error('❌ Erro no simulateStockDeduction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simular baixa para um produto específico
   */
  static async simulateProductStockDeduction(productId, quantity) {
    try {
      // Buscar receita do produto
      const recipeResult = await RecipeService.getRecipeByProductId(productId);
      
      if (!recipeResult.success) {
        return {
          feasible: true,
          has_recipe: false,
          message: 'Produto sem receita cadastrada',
          ingredients_impact: []
        };
      }

      const recipe = recipeResult.data;

      // Analisar impacto nos ingredientes
      const ingredientsImpact = [];

      for (const recipeIngredient of recipe.recipe_ingredients) {
        const neededQuantity = parseFloat(recipeIngredient.quantity) * quantity;
        
        // Buscar estoque atual
        const { data: stockData } = await supabase
          .from('ingredient_stock_summary')
          .select('*')
          .eq('id', recipeIngredient.ingredient_id)
          .single();

        const currentStock = parseFloat(stockData?.total_quantity || 0);
        const afterDeduction = currentStock - neededQuantity;
        const feasible = afterDeduction >= 0 || recipeIngredient.is_optional;

        ingredientsImpact.push({
          ingredient_id: recipeIngredient.ingredient_id,
          ingredient_name: recipeIngredient.ingredients.name,
          current_stock: currentStock,
          needed_quantity: neededQuantity,
          after_deduction: afterDeduction,
          unit_measure: recipeIngredient.unit_measure,
          is_optional: recipeIngredient.is_optional,
          feasible: feasible
        });
      }

      const allFeasible = ingredientsImpact.every(ingredient => ingredient.feasible);

      return {
        feasible: allFeasible,
        has_recipe: true,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        ingredients_impact: ingredientsImpact,
        unfeasible_ingredients: ingredientsImpact.filter(ing => !ing.feasible)
      };

    } catch (error) {
      console.error('❌ Erro no simulateProductStockDeduction:', error);
      return {
        feasible: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // RELATÓRIOS E HISTÓRICO
  // =====================================================

  /**
   * Buscar histórico de baixas de estoque
   */
  static async getStockDeductionHistory(filters = {}) {
    try {
      console.log('📊 Buscando histórico de baixas de estoque...', filters);

      let query = supabase
        .from('ingredient_stock_movements')
        .select(`
          *,
          ingredient_batches (
            id,
            batch_number,
            ingredients (
              id, name, category, unit_measure
            )
          )
        `)
        .eq('movement_type', 'out')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.reference_type) {
        query = query.eq('reference_type', filters.reference_type);
      }

      if (filters.reference_id) {
        query = query.eq('reference_id', filters.reference_id);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw error;
      }

      console.log('✅ Histórico de baixas obtido:', data?.length || 0, 'movimentações');
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getStockDeductionHistory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar relatório de consumo por período
   */
  static async getConsumptionReport(startDate, endDate, groupBy = 'ingredient') {
    try {
      console.log(`📈 Gerando relatório de consumo de ${startDate} a ${endDate}`);

      const { data, error } = await supabase
        .from('ingredient_stock_movements')
        .select(`
          quantity,
          created_at,
          ingredient_batches (
            ingredients (
              id, name, category, unit_measure, cost_per_unit
            )
          )
        `)
        .eq('movement_type', 'out')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('❌ Erro ao buscar dados do relatório:', error);
        throw error;
      }

      // Agrupar dados
      const grouped = {};

      data.forEach(movement => {
        const ingredient = movement.ingredient_batches.ingredients;
        const key = groupBy === 'ingredient' ? ingredient.id : ingredient.category;
        const keyName = groupBy === 'ingredient' ? ingredient.name : ingredient.category;

        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            name: keyName,
            total_quantity: 0,
            total_cost: 0,
            unit_measure: ingredient.unit_measure,
            movements_count: 0
          };
        }

        grouped[key].total_quantity += parseFloat(movement.quantity);
        grouped[key].total_cost += parseFloat(movement.quantity) * parseFloat(ingredient.cost_per_unit);
        grouped[key].movements_count += 1;
      });

      const report = Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);

      return {
        success: true,
        data: {
          period: { start_date: startDate, end_date: endDate },
          group_by: groupBy,
          total_items: report.length,
          total_movements: data.length,
          total_cost: report.reduce((sum, item) => sum + item.total_cost, 0),
          items: report
        }
      };

    } catch (error) {
      console.error('❌ Erro no getConsumptionReport:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  /**
   * Reverter baixa de estoque (em caso de cancelamento)
   */
  static async revertStockDeduction(orderId) {
    try {
      console.log('↩️ Revertendo baixa de estoque para pedido:', orderId);

      // Buscar movimentações do pedido
      const { data: movements, error: movError } = await supabase
        .from('ingredient_stock_movements')
        .select(`
          *,
          ingredient_batches (
            id, quantity
          )
        `)
        .eq('reference_type', 'order')
        .eq('reference_id', orderId)
        .eq('movement_type', 'out');

      if (movError) {
        console.error('❌ Erro ao buscar movimentações:', movError);
        throw movError;
      }

      if (!movements || movements.length === 0) {
        console.log('ℹ️ Nenhuma movimentação encontrada para reverter');
        return {
          success: true,
          data: {
            message: 'Nenhuma movimentação encontrada',
            reverted_movements: 0
          }
        };
      }

      const revertedMovements = [];

      // Reverter cada movimentação
      for (const movement of movements) {
        // Restaurar quantidade no lote
        const newQuantity = parseFloat(movement.ingredient_batches.quantity) + parseFloat(movement.quantity);
        
        const { error: updateError } = await supabase
          .from('ingredient_batches')
          .update({ 
            quantity: newQuantity,
            status: 'active' // Reativar se estava esgotado
          })
          .eq('id', movement.ingredient_batch_id);

        if (updateError) {
          console.error('❌ Erro ao restaurar lote:', updateError);
          throw updateError;
        }

        // Registrar movimentação de reversão
        const { error: movError } = await supabase
          .from('ingredient_stock_movements')
          .insert([{
            ingredient_batch_id: movement.ingredient_batch_id,
            movement_type: 'in',
            quantity: movement.quantity,
            reference_type: 'reversal',
            reference_id: orderId,
            notes: `Reversão de baixa automática - Pedido ${orderId}`,
            performed_by: movement.performed_by
          }]);

        if (movError) {
          console.error('❌ Erro ao registrar reversão:', movError);
          throw movError;
        }

        revertedMovements.push({
          batch_id: movement.ingredient_batch_id,
          quantity_restored: movement.quantity
        });
      }

      console.log('✅ Baixa de estoque revertida:', revertedMovements.length, 'movimentações');
      return {
        success: true,
        data: {
          order_id: orderId,
          reverted_movements: revertedMovements.length,
          movements: revertedMovements
        }
      };

    } catch (error) {
      console.error('❌ Erro no revertStockDeduction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default StockDeductionService;
