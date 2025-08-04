// Teste de funções helpers
import { getTables, handleError } from './lib';

console.log('=== TESTE DE FUNÇÕES HELPERS ===');

// Testar getTables
try {
  const tables = getTables();
  console.log('getTables() retornou:', tables);
} catch (e) {
  console.error('Erro ao chamar getTables():', e);
}

// Testar handleError
try {
  const error = { code: 'PGRST301', message: 'Registro não encontrado' };
  const errorMessage = handleError(error);
  console.log('handleError() retornou:', errorMessage);
} catch (e) {
  console.error('Erro ao chamar handleError():', e);
}

console.log('=== TESTE CONCLUÍDO ===');
