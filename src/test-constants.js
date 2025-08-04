// Script de teste para verificar as importações de constants.js
import { TABLES, ORDER_STATUS, ORDER_ITEM_STATUS, PAYMENT_STATUS, TABLE_STATUS } from './lib/constants';
import { getTables, handleError } from './lib/dbHelpers';

console.log('Teste de importação de constants.js');
console.log('TABLES:', TABLES);
console.log('TABLE_STATUS:', TABLE_STATUS);
console.log('Funções de dbHelpers importadas com sucesso');
console.log('getTables():', getTables());

// Verificar se as funções estão definidas corretamente
try {
  const error = new Error('Teste de erro');
  console.log('handleError():', handleError(error));
} catch (e) {
  console.error('Erro ao chamar handleError():', e);
}
