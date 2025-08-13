import { supabase } from '../lib/supabase';

/**
 * Serviço para gestão de ingredientes e lotes
 * Integrado com o Sistema de Receitas e Ingredientes
 */
export class IngredientService {
  
  // =====================================================
  // GESTÃO DE INGREDIENTES BASE
  // =====================================================

  /**
   * Buscar todos os ingredientes
   */
  static async getIngredients(filters = {}) {
    try {
      console.log('🔍 Buscando ingredientes...', filters);
      
      let query = supabase
        .from('ingredients')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar ingredientes:', error);
        throw error;
      }

      console.log('✅ Ingredientes encontrados:', data?.length || 0);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getIngredients:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar ingrediente por ID
   */
  static async getIngredientById(ingredientId) {
    try {
      console.log('🔍 Buscando ingrediente por ID:', ingredientId);

      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', ingredientId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar ingrediente:', error);
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no getIngredientById:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Criar novo ingrediente
   */
  static async createIngredient(ingredientData) {
    try {
      console.log('➕ Criando ingrediente:', ingredientData.name);

      const { data, error } = await supabase
        .from('ingredients')
        .insert([{
          name: ingredientData.name,
          category: ingredientData.category || 'outros',
          unit_measure: ingredientData.unit_measure || 'kg',
          supplier: ingredientData.supplier,
          cost_per_unit: ingredientData.cost_per_unit || 0,
          minimum_stock: ingredientData.minimum_stock || 0,
          description: ingredientData.description,
          image_path: ingredientData.image_path,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar ingrediente:', error);
        throw error;
      }

      console.log('✅ Ingrediente criado:', data.name);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no createIngredient:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualizar ingrediente
   */
  static async updateIngredient(ingredientId, updateData) {
    try {
      console.log('✏️ Atualizando ingrediente:', ingredientId);

      const { data, error } = await supabase
        .from('ingredients')
        .update(updateData)
        .eq('id', ingredientId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar ingrediente:', error);
        throw error;
      }

      console.log('✅ Ingrediente atualizado:', data.name);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no updateIngredient:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desativar ingrediente (soft delete)
   */
  static async deactivateIngredient(ingredientId) {
    try {
      console.log('🗑️ Desativando ingrediente:', ingredientId);

      const { data, error } = await supabase
        .from('ingredients')
        .update({ is_active: false })
        .eq('id', ingredientId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao desativar ingrediente:', error);
        throw error;
      }

      console.log('✅ Ingrediente desativado:', data.name);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no deactivateIngredient:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // GESTÃO DE LOTES DE INGREDIENTES
  // =====================================================

  /**
   * Buscar lotes de ingredientes
   */
  static async getIngredientBatches(filters = {}) {
    try {
      console.log('📦 Buscando lotes de ingredientes...', filters);

      let query = supabase
        .from('ingredient_batches')
        .select(`
          *,
          ingredients (
            id, name, category, unit_measure, minimum_stock
          )
        `)
        .order('expiration_date', { ascending: true });

      // Aplicar filtros
      if (filters.ingredient_id) {
        query = query.eq('ingredient_id', filters.ingredient_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Por padrão, mostrar apenas lotes ativos
        query = query.eq('status', 'active');
      }

      if (filters.expiring_soon) {
        const daysAhead = filters.expiring_soon || 7;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        query = query.lte('expiration_date', futureDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar lotes:', error);
        throw error;
      }

      console.log('✅ Lotes encontrados:', data?.length || 0);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getIngredientBatches:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Criar novo lote de ingrediente
   */
  static async createIngredientBatch(batchData) {
    try {
      console.log('📦 Criando lote:', batchData.batch_number);

      const { data, error } = await supabase
        .from('ingredient_batches')
        .insert([{
          ingredient_id: batchData.ingredient_id,
          batch_number: batchData.batch_number,
          quantity: batchData.quantity,
          original_quantity: batchData.quantity, // Quantidade inicial = quantidade atual
          unit_cost: batchData.unit_cost || 0,
          supplier: batchData.supplier,
          manufacturing_date: batchData.manufacturing_date,
          expiration_date: batchData.expiration_date,
          received_date: batchData.received_date || new Date().toISOString().split('T')[0],
          location: batchData.location || 'estoque_principal',
          notes: batchData.notes,
          status: 'active'
        }])
        .select(`
          *,
          ingredients (
            id, name, unit_measure
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao criar lote:', error);
        throw error;
      }

      console.log('✅ Lote criado:', data.batch_number);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no createIngredientBatch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualizar lote de ingrediente
   */
  static async updateIngredientBatch(batchId, updateData) {
    try {
      console.log('✏️ Atualizando lote:', batchId);

      const { data, error } = await supabase
        .from('ingredient_batches')
        .update(updateData)
        .eq('id', batchId)
        .select(`
          *,
          ingredients (
            id, name, unit_measure
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar lote:', error);
        throw error;
      }

      console.log('✅ Lote atualizado:', data.batch_number);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no updateIngredientBatch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Marcar lote como vencido
   */
  static async markBatchAsExpired(batchId, notes = '') {
    try {
      console.log('⏰ Marcando lote como vencido:', batchId);

      const { data, error } = await supabase
        .from('ingredient_batches')
        .update({
          status: 'expired',
          notes: notes || 'Marcado como vencido automaticamente'
        })
        .eq('id', batchId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao marcar lote como vencido:', error);
        throw error;
      }

      console.log('✅ Lote marcado como vencido:', data.batch_number);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no markBatchAsExpired:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Descartar lote
   */
  static async disposeBatch(batchId, disposalNotes = '') {
    try {
      console.log('🗑️ Descartando lote:', batchId);

      const { data, error } = await supabase
        .from('ingredient_batches')
        .update({
          status: 'disposed',
          disposal_date: new Date().toISOString().split('T')[0],
          disposal_notes: disposalNotes
        })
        .eq('id', batchId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao descartar lote:', error);
        throw error;
      }

      console.log('✅ Lote descartado:', data.batch_number);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no disposeBatch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // CONTROLE DE ESTOQUE E MOVIMENTAÇÕES
  // =====================================================

  /**
   * Buscar resumo de estoque por ingrediente
   */
  static async getStockSummary(ingredientId = null) {
    try {
      console.log('📊 Buscando resumo de estoque...');

      let query = supabase
        .from('ingredient_stock_summary')
        .select('*');

      if (ingredientId) {
        query = query.eq('id', ingredientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar resumo de estoque:', error);
        throw error;
      }

      console.log('✅ Resumo de estoque obtido:', data?.length || 0, 'ingredientes');
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getStockSummary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Registrar movimentação de estoque
   */
  static async recordStockMovement(movementData) {
    try {
      console.log('📝 Registrando movimentação de estoque:', movementData.movement_type);

      const { data, error } = await supabase
        .from('ingredient_stock_movements')
        .insert([{
          ingredient_batch_id: movementData.ingredient_batch_id,
          movement_type: movementData.movement_type, // 'in', 'out', 'adjustment', 'waste', 'transfer'
          quantity: movementData.quantity,
          reference_type: movementData.reference_type, // 'order', 'adjustment', 'waste', etc.
          reference_id: movementData.reference_id,
          notes: movementData.notes,
          performed_by: movementData.performed_by
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao registrar movimentação:', error);
        throw error;
      }

      console.log('✅ Movimentação registrada:', data.id);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Erro no recordStockMovement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Consumir ingrediente de lotes (FIFO - First In, First Out)
   */
  static async consumeIngredient(ingredientId, quantityNeeded, referenceType = 'order', referenceId = null, performedBy = null) {
    try {
      console.log(`🍽️ Consumindo ${quantityNeeded} de ingrediente:`, ingredientId);

      // Buscar lotes disponíveis ordenados por data de vencimento (FIFO)
      const { data: availableBatches, error: batchError } = await supabase
        .from('ingredient_batches')
        .select('*')
        .eq('ingredient_id', ingredientId)
        .eq('status', 'active')
        .gt('quantity', 0)
        .order('expiration_date', { ascending: true })
        .order('received_date', { ascending: true });

      if (batchError) {
        console.error('❌ Erro ao buscar lotes disponíveis:', batchError);
        throw batchError;
      }

      if (!availableBatches || availableBatches.length === 0) {
        console.error('❌ Nenhum lote disponível para o ingrediente');
        return {
          success: false,
          error: 'Nenhum lote disponível para este ingrediente'
        };
      }

      // Verificar se há quantidade suficiente
      const totalAvailable = availableBatches.reduce((sum, batch) => sum + parseFloat(batch.quantity), 0);
      if (totalAvailable < quantityNeeded) {
        console.error(`❌ Quantidade insuficiente. Disponível: ${totalAvailable}, Necessário: ${quantityNeeded}`);
        return {
          success: false,
          error: `Quantidade insuficiente. Disponível: ${totalAvailable}, Necessário: ${quantityNeeded}`
        };
      }

      // Consumir dos lotes seguindo FIFO
      let remainingToConsume = quantityNeeded;
      const consumedBatches = [];

      for (const batch of availableBatches) {
        if (remainingToConsume <= 0) break;

        const batchQuantity = parseFloat(batch.quantity);
        const consumeFromBatch = Math.min(remainingToConsume, batchQuantity);
        const newQuantity = batchQuantity - consumeFromBatch;

        // Atualizar quantidade do lote
        const { error: updateError } = await supabase
          .from('ingredient_batches')
          .update({ 
            quantity: newQuantity,
            status: newQuantity <= 0 ? 'depleted' : 'active'
          })
          .eq('id', batch.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar lote:', updateError);
          throw updateError;
        }

        // Registrar movimentação
        await this.recordStockMovement({
          ingredient_batch_id: batch.id,
          movement_type: 'out',
          quantity: consumeFromBatch,
          reference_type: referenceType,
          reference_id: referenceId,
          notes: `Consumo automático - ${referenceType}`,
          performed_by: performedBy
        });

        consumedBatches.push({
          batch_id: batch.id,
          batch_number: batch.batch_number,
          consumed_quantity: consumeFromBatch,
          remaining_quantity: newQuantity
        });

        remainingToConsume -= consumeFromBatch;
      }

      console.log('✅ Ingrediente consumido com sucesso:', consumedBatches.length, 'lotes afetados');
      return {
        success: true,
        data: {
          consumed_quantity: quantityNeeded,
          affected_batches: consumedBatches
        }
      };

    } catch (error) {
      console.error('❌ Erro no consumeIngredient:', error);
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
   * Buscar ingredientes próximos ao vencimento
   */
  static async getExpiringIngredients(daysAhead = 7) {
    try {
      console.log(`⏰ Buscando ingredientes que vencem em ${daysAhead} dias...`);

      const { data, error } = await supabase
        .from('ingredient_batches')
        .select(`
          *,
          ingredients (
            id, name, category, unit_measure
          )
        `)
        .eq('status', 'active')
        .gt('quantity', 0)
        .lte('expiration_date', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('expiration_date', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar ingredientes vencendo:', error);
        throw error;
      }

      console.log('✅ Ingredientes vencendo encontrados:', data?.length || 0);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getExpiringIngredients:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar ingredientes com estoque baixo
   */
  static async getLowStockIngredients() {
    try {
      console.log('📉 Buscando ingredientes com estoque baixo...');

      const { data, error } = await supabase
        .from('ingredient_stock_summary')
        .select('*')
        .eq('status', 'low');

      if (error) {
        console.error('❌ Erro ao buscar estoque baixo:', error);
        throw error;
      }

      console.log('✅ Ingredientes com estoque baixo:', data?.length || 0);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Erro no getLowStockIngredients:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar categorias de ingredientes
   */
  static async getIngredientCategories() {
    try {
      console.log('📂 Buscando categorias de ingredientes...');

      const { data, error } = await supabase
        .from('ingredients')
        .select('category')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        throw error;
      }

      // Extrair categorias únicas
      const categories = [...new Set(data.map(item => item.category))].sort();

      console.log('✅ Categorias encontradas:', categories.length);
      return {
        success: true,
        data: categories
      };

    } catch (error) {
      console.error('❌ Erro no getIngredientCategories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default IngredientService;
