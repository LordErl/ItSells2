// Simple debug to test the query
console.log('Testing query conditions...')

// Test data like yours
const testOrders = [
  {
    id: '11f3d31c-4305-4e62-8d70-ebb343963f51',
    customer_id: 'ebb2070f-16f0-48ef-adf6-e9aa293ac174',
    status: 'delivered',
    paid: null,
    total_amount: '76.40'
  },
  {
    id: '9b222538-b208-48da-ae61-508e40eeaa5a',
    customer_id: 'ebb2070f-16f0-48ef-adf6-e9aa293ac174',
    status: 'delivered',
    paid: null,
    total_amount: '35.9'
  }
]

// Test the filter conditions
const filteredOrders = testOrders.filter(order => {
  const statusMatch = order.status === 'delivered'
  const paidMatch = order.paid === null || order.paid === false
  console.log(`Order ${order.id}: status=${order.status}, paid=${order.paid}, statusMatch=${statusMatch}, paidMatch=${paidMatch}`)
  return statusMatch && paidMatch
})

console.log('Filtered orders:', filteredOrders.length)
console.log('Total amount:', filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0))
