import { RecipeService } from '../services/recipeService.js';
import { IngredientService } from '../services/ingredientService.js';
import { StoreService } from '../services/storeService.js';

/**
 * Script para criar receitas de exemplo e associá-las a produtos
 */
async function createSampleRecipes() {
  console.log('🧪 Criando receitas de exemplo...');

  try {
    // 1. Buscar ingredientes existentes
    console.log('📋 Buscando ingredientes...');
    const ingredientsResult = await IngredientService.getIngredients();
    if (!ingredientsResult.success) {
      throw new Error('Erro ao buscar ingredientes: ' + ingredientsResult.error);
    }
    
    const ingredients = ingredientsResult.data;
    console.log(`✅ Encontrados ${ingredients.length} ingredientes`);

    // 2. Buscar produtos existentes
    console.log('📋 Buscando produtos...');
    const productsResult = await StoreService.getProducts();
    if (!productsResult.success) {
      throw new Error('Erro ao buscar produtos: ' + productsResult.error);
    }
    
    const products = productsResult.data;
    console.log(`✅ Encontrados ${products.length} produtos`);

    // 3. Criar receitas de exemplo
    const sampleRecipes = [
      {
        name: 'Hambúrguer Gourmet',
        description: 'Hambúrguer artesanal com ingredientes selecionados',
        difficulty_level: 'medium',
        serving_size: 1,
        preparation_time_minutes: 15,
        preparation_instructions: `
1. Tempere a carne com sal e pimenta
2. Grelhe a carne por 4 minutos de cada lado
3. Torre o pão na chapa
4. Monte o hambúrguer com alface, tomate e queijo
5. Sirva com batatas fritas
        `.trim(),
        ingredients: [
          { name: 'Carne Bovina', quantity: 150, unit: 'g', optional: false },
          { name: 'Pão de Hambúrguer', quantity: 1, unit: 'unidade', optional: false },
          { name: 'Queijo Cheddar', quantity: 50, unit: 'g', optional: false },
          { name: 'Alface', quantity: 30, unit: 'g', optional: false },
          { name: 'Tomate', quantity: 50, unit: 'g', optional: false },
          { name: 'Cebola', quantity: 20, unit: 'g', optional: true },
        ]
      },
      {
        name: 'Pizza Margherita',
        description: 'Pizza clássica italiana com molho de tomate, mussarela e manjericão',
        difficulty_level: 'medium',
        serving_size: 4,
        preparation_time_minutes: 25,
        preparation_instructions: `
1. Abra a massa da pizza
2. Espalhe o molho de tomate uniformemente
3. Adicione a mussarela em fatias
4. Leve ao forno a 220°C por 12-15 minutos
5. Finalize com folhas de manjericão fresco
        `.trim(),
        ingredients: [
          { name: 'Massa de Pizza', quantity: 300, unit: 'g', optional: false },
          { name: 'Molho de Tomate', quantity: 100, unit: 'ml', optional: false },
          { name: 'Mussarela', quantity: 150, unit: 'g', optional: false },
          { name: 'Manjericão', quantity: 10, unit: 'g', optional: false },
          { name: 'Azeite', quantity: 15, unit: 'ml', optional: false },
        ]
      },
      {
        name: 'Batata Frita Especial',
        description: 'Batatas fritas crocantes temperadas com ervas',
        difficulty_level: 'easy',
        serving_size: 2,
        preparation_time_minutes: 10,
        preparation_instructions: `
1. Corte as batatas em palitos
2. Frite em óleo quente a 180°C por 3-4 minutos
3. Tempere com sal e ervas finas
4. Sirva imediatamente
        `.trim(),
        ingredients: [
          { name: 'Batata', quantity: 400, unit: 'g', optional: false },
          { name: 'Óleo de Soja', quantity: 500, unit: 'ml', optional: false },
          { name: 'Sal', quantity: 5, unit: 'g', optional: false },
          { name: 'Ervas Finas', quantity: 2, unit: 'g', optional: true },
        ]
      }
    ];

    const createdRecipes = [];

    // 4. Criar cada receita
    for (const recipeData of sampleRecipes) {
      console.log(`🍳 Criando receita: ${recipeData.name}`);

      // Mapear ingredientes pelos nomes
      const recipeIngredients = [];
      
      for (const recipeIngredient of recipeData.ingredients) {
        const ingredient = ingredients.find(ing => 
          ing.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
          recipeIngredient.name.toLowerCase().includes(ing.name.toLowerCase())
        );

        if (ingredient) {
          recipeIngredients.push({
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            quantity: recipeIngredient.quantity,
            unit_measure: recipeIngredient.unit,
            cost_per_unit: ingredient.cost_per_unit,
            is_optional: recipeIngredient.optional,
            notes: ''
          });
        } else {
          console.warn(`⚠️ Ingrediente não encontrado: ${recipeIngredient.name}`);
        }
      }

      if (recipeIngredients.length === 0) {
        console.warn(`⚠️ Nenhum ingrediente encontrado para receita: ${recipeData.name}`);
        continue;
      }

      // Criar receita
      const createData = {
        name: recipeData.name,
        description: recipeData.description,
        difficulty_level: recipeData.difficulty_level,
        serving_size: recipeData.serving_size,
        preparation_time_minutes: recipeData.preparation_time_minutes,
        preparation_instructions: recipeData.preparation_instructions,
        ingredients: recipeIngredients
      };

      const result = await RecipeService.createRecipe(createData);
      
      if (result.success) {
        console.log(`✅ Receita criada: ${recipeData.name} (ID: ${result.data.id})`);
        createdRecipes.push({
          recipe: result.data,
          originalData: recipeData
        });
      } else {
        console.error(`❌ Erro ao criar receita ${recipeData.name}:`, result.error);
      }
    }

    // 5. Associar receitas aos produtos (se existirem produtos com nomes similares)
    console.log('\n🔗 Associando receitas aos produtos...');
    
    for (const { recipe, originalData } of createdRecipes) {
      const product = products.find(prod => 
        prod.name.toLowerCase().includes(originalData.name.toLowerCase()) ||
        originalData.name.toLowerCase().includes(prod.name.toLowerCase())
      );

      if (product) {
        console.log(`🔗 Associando receita "${recipe.name}" ao produto "${product.name}"`);
        
        // Atualizar produto com recipe_id
        const updateResult = await StoreService.updateProduct(product.id, {
          ...product,
          recipe_id: recipe.id
        });

        if (updateResult.success) {
          console.log(`✅ Produto "${product.name}" associado à receita`);
        } else {
          console.error(`❌ Erro ao associar produto "${product.name}":`, updateResult.error);
        }
      } else {
        console.log(`ℹ️ Produto não encontrado para receita: ${recipe.name}`);
      }
    }

    console.log(`\n🎉 Script concluído! ${createdRecipes.length} receitas criadas.`);
    
    return {
      success: true,
      created_recipes: createdRecipes.length,
      recipes: createdRecipes.map(r => r.recipe)
    };

  } catch (error) {
    console.error('❌ Erro no script:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleRecipes()
    .then(result => {
      console.log('\n📊 Resultado final:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export { createSampleRecipes };
