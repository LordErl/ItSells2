// Script de teste para verificar importações
import { supabase, TABLES, getTables, handleError } from './lib';

console.log('=== TESTE DE IMPORTAÇÕES ===');
console.log('supabase:', supabase ? 'Importado com sucesso' : 'ERRO');
console.log('TABLES:', TABLES);
console.log('getTables():', getTables());

// Teste de erro
try {
  const error = { code: 'PGRST301', message: 'Erro de teste' };
  console.log('handleError():', handleError(error));
} catch (e) {
  console.error('Erro ao chamar handleError():', e);
}

console.log('=== TESTE CONCLUÍDO ===');
