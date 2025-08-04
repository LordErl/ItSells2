// Teste específico para PAYMENT_API
import { PAYMENT_API, PAYMENT_METHODS } from './lib';

console.log('=== TESTE DE PAYMENT_API ===');
console.log('PAYMENT_API importado:', PAYMENT_API ? 'Sim' : 'Não');
console.log('PAYMENT_API.BASE_URL:', PAYMENT_API.BASE_URL);
console.log('PAYMENT_API.ENDPOINTS:', PAYMENT_API.ENDPOINTS);
console.log('PAYMENT_METHODS importado:', PAYMENT_METHODS ? 'Sim' : 'Não');
console.log('=== TESTE CONCLUÍDO ===');
