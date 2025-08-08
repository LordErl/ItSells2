// Debug script para testar o CashierService
import { CashierService } from './src/services/cashierService.js'

console.log('Testing CashierService...')

async function testCashierService() {
  try {
    console.log('Calling getOccupiedTablesForPayment...')
    const result = await CashierService.getOccupiedTablesForPayment()
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

testCashierService()
