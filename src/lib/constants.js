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
  CUSTOMER: 'customer'
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

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// Payment methods
export const PAYMENT_METHODS = {
  PIX: 'pix',
  DEBIT: 'debit',
  CREDIT: 'credit',
  CASH: 'cash'
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

// Helper functions for database operations
export const dbHelpers = {
  // Format date for Supabase
  formatDate: (date) => {
    return new Date(date).toISOString()
  },
  
  // Parse date from Supabase
  parseDate: (dateString) => {
    return new Date(dateString)
  },
  
  // Generate UUID (for client-side ID generation if needed)
  generateId: () => {
    return crypto.randomUUID()
  },
  
  // Handle Supabase errors
  handleError: (error) => {
    console.error('Supabase error:', error)
    
    if (error.code === 'PGRST301') {
      return 'Registro não encontrado'
    } else if (error.code === '23505') {
      return 'Este registro já existe'
    } else if (error.code === '23503') {
      return 'Não é possível excluir este registro pois está sendo usado'
    } else if (error.message.includes('JWT')) {
      return 'Sessão expirada. Faça login novamente'
    } else {
      return error.message || 'Erro desconhecido'
    }
  }
}

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
