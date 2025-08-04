// Script de teste para verificar as importações de constants.js
import { TABLES, ORDER_STATUS, ORDER_ITEM_STATUS, PAYMENT_STATUS, TABLE_STATUS } from './lib/constants';
import dbHelpers from './lib/dbHelpers';

console.log('Teste de importação de constants.js');
console.log('TABLES:', TABLES);
console.log('TABLE_STATUS:', TABLE_STATUS);
console.log('dbHelpers:', dbHelpers);
console.log('dbHelpers.getTables():', dbHelpers.getTables());

// Verificar se as funções estão definidas corretamente
try {
  const error = new Error('Teste de erro');
  console.log('dbHelpers.handleError():', dbHelpers.handleError(error));
} catch (e) {
  console.error('Erro ao chamar dbHelpers.handleError():', e);
}
