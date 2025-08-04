// Teste específico da função getTables
import { dbHelpers } from './lib';

console.log('=== TESTE DA FUNÇÃO getTables ===');
console.log('dbHelpers importado:', dbHelpers ? 'Sim' : 'Não');
console.log('dbHelpers.getTables existe:', typeof dbHelpers.getTables === 'function' ? 'Sim' : 'Não');

try {
  const tables = dbHelpers.getTables();
  console.log('dbHelpers.getTables() retornou:', tables);
  console.log('=== TESTE CONCLUÍDO COM SUCESSO ===');
} catch (e) {
  console.error('=== ERRO AO CHAMAR dbHelpers.getTables() ===');
  console.error(e);
}
