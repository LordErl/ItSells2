import { StoreService } from './services/storeService';

// Teste para verificar se a função getTables funciona corretamente
async function testGetTables() {
  console.log('=== TESTANDO StoreService.getTables ===');
  try {
    const result = await StoreService.getTables();
    
    if (result.success) {
      console.log('✅ StoreService.getTables funcionou corretamente!');
      console.log('Dados retornados:', result.data);
    } else {
      console.error('❌ StoreService.getTables retornou erro:', result.error);
    }
  } catch (e) {
    console.error('❌ Erro ao executar StoreService.getTables:', e);
  }
}

// Execute o teste
testGetTables();
