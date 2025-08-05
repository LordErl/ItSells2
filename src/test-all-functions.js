import { StoreService } from './services/storeService';

// Teste para verificar se todas as funções do StoreService funcionam
async function testAllFunctions() {
  console.log('=== TESTANDO TODAS AS FUNÇÕES DO STORESERVICE ===');
  
  const functionsToTest = [
    'getProducts',
    'getTables', 
    'getStaff',
    'getInventory',
    'getActiveOrders',
    'getDashboardStats',
    'getCategories'
  ];
  
  for (const functionName of functionsToTest) {
    try {
      console.log(`\n--- Testando ${functionName} ---`);
      
      if (typeof StoreService[functionName] === 'function') {
        const result = await StoreService[functionName]();
        
        if (result.success) {
          console.log(`✅ ${functionName} funcionou corretamente!`);
          console.log(`Dados retornados:`, result.data?.length ? `${result.data.length} registros` : result.data);
        } else {
          console.log(`⚠️ ${functionName} retornou erro:`, result.error);
        }
      } else {
        console.log(`❌ ${functionName} não é uma função!`);
      }
    } catch (e) {
      console.error(`❌ Erro ao executar ${functionName}:`, e.message);
    }
  }
  
  console.log('\n=== TESTE FINALIZADO ===');
}

// Execute o teste
testAllFunctions();
