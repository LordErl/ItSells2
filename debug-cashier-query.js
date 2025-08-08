import { supabase, TABLES, ORDER_STATUS } from './src/lib/index.js'

// Test the cashier query
async function testCashierQuery() {
  try {
    console.log('🔍 Testing cashier query...')
    console.log('ORDER_STATUS.DELIVERED:', ORDER_STATUS.DELIVERED)
    
    const { data: orders, error } = await supabase
      .from(TABLES.ORDERS)
      .select(`
        id,
        table_id,
        table_number,
        status,
        paid,
        total_amount,
        created_at,
        customer_id,
        users(
          id,
          name
        ),
        order_items(
          id,
          quantity,
          price,
          observations,
          status,
          products(
            id,
            name
          )
        )
      `)
      .eq('status', ORDER_STATUS.DELIVERED)
      .eq('paid', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Query error:', error)
      return
    }

    console.log(`📋 Found ${orders?.length || 0} delivered unpaid orders`)
    console.log('Orders:', orders)
    
  } catch (err) {
    console.error('❌ Test error:', err)
  }
}

testCashierQuery()
