// Database table names
export const TABLES = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  TABLES: 'tables',
  RESERVATIONS: 'reservations',
  STAFF: 'staff',
  INVENTORY: 'inventory',
  PAYMENTS: 'payments',
  CUSTOMER_ACCOUNTS: 'customer_accounts',
  FACE_DATA: 'face_data'
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  CASHIER: 'cashier'
}

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

// Order item status
export const ORDER_ITEM_STATUS = {
  PENDING: 'pending',
  PRODUCING: 'producing',
  READY: 'ready',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered'
}

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// Constantes de sistema

// Payment methods
export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'cartao',
  DEBIT: 'debit',
  CREDIT: 'credit',
  CASH: 'cash'
}

// Payment API endpoints
export const PAYMENT_API = {
  BASE_URL: 'https://itserpapi.duckdns.org:8009',
  FALLBACK_URL: 'http://191.31.165.81:8009', // HTTP temporário para IP
  ENDPOINTS: {
    PIX: '/cora/cobranca',
    CREDIT_CARD: '/mercadopago/processar-pagamento-token',
    GET_PAYMENT_DATA: '/pagamento/obter-dados', // Para obter dados do pagamento
    CONFIRM_PAYMENT: '/confirmar-pagamento' // Para confirmar pagamento manualmente
  }
}

// Table status
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
  OUT_OF_ORDER: 'out_of_order'
}

// Inventory status
export const INVENTORY_STATUS = {
  OK: 'ok',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired'
}

// Helper functions foram movidas para dbHelpers.js

// Real-time subscriptions helper
export const subscriptions = {
  // Subscribe to table changes for real-time updates
  subscribeToTable: (tableName, callback, filter = null) => {
    // A função original usava supabase, mas agora vamos exigir que o supabase seja passado como argumento
    throw new Error('subscriptions.subscribeToTable foi movido. Use um helper separado e injete o supabase!')
  },
  unsubscribe: (subscription) => {
    throw new Error('subscriptions.unsubscribe foi movido. Use um helper separado e injete o supabase!')
  }
}
