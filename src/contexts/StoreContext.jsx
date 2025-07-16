import { createContext, useContext, useReducer, useEffect } from 'react'
import { StoreService } from '../services/storeService'

// Store Context
const StoreContext = createContext()

// Store Actions
const STORE_ACTIONS = {
  // Products
  SET_PRODUCTS: 'SET_PRODUCTS',
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // Orders
  SET_ORDERS: 'SET_ORDERS',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  
  // Tables
  SET_TABLES: 'SET_TABLES',
  UPDATE_TABLE: 'UPDATE_TABLE',
  
  // Staff
  SET_STAFF: 'SET_STAFF',
  ADD_STAFF: 'ADD_STAFF',
  UPDATE_STAFF: 'UPDATE_STAFF',
  DELETE_STAFF: 'DELETE_STAFF',
  
  // Inventory
  SET_INVENTORY: 'SET_INVENTORY',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  
  // Payments
  SET_PAYMENTS: 'SET_PAYMENTS',
  ADD_PAYMENT: 'ADD_PAYMENT',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',
  
  // Customer Account
  SET_CUSTOMER_ACCOUNT: 'SET_CUSTOMER_ACCOUNT',
  UPDATE_CUSTOMER_ACCOUNT: 'UPDATE_CUSTOMER_ACCOUNT',
  
  // Loading States
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
}

// Initial State
const initialState = {
  // Products & Menu
  products: [],
  categories: [],
  
  // Orders
  orders: [],
  currentOrder: null,
  
  // Dashboard Stats
  dashboardStats: {
    ordersByStatus: [],
    todaySales: 0,
    occupiedTables: 0
  },
  
  // Tables & Restaurant
  tables: [],
  reservations: [],
  
  // Staff
  staff: [],
  
  // Inventory
  inventory: [],
  expiringItems: [],
  
  // Payments
  payments: [],
  
  // Customer Account
  customerAccount: {
    currentBill: 0,
    openOrders: [],
    history: []
  },
  
  // UI States
  loading: {
    products: false,
    orders: false,
    payments: false
  },
  error: null
}

// Store Reducer
function storeReducer(state, action) {
  switch (action.type) {
    // Add new action type for updating dashboard stats
    case 'UPDATE_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          ...action.payload
        }
      }
    // Products
    case STORE_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload
      }
    
    case STORE_ACTIONS.ADD_PRODUCT:
      return {
        ...state,
        products: [...state.products, action.payload]
      }
    
    case STORE_ACTIONS.UPDATE_PRODUCT:
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id
            ? { ...product, ...action.payload }
            : product
        )
      }
    
    case STORE_ACTIONS.DELETE_PRODUCT:
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      }
    
    // Orders
    case STORE_ACTIONS.SET_ORDERS:
      return {
        ...state,
        orders: action.payload
      }
    
    case STORE_ACTIONS.ADD_ORDER:
      return {
        ...state,
        orders: [...state.orders, action.payload]
      }
    
    case STORE_ACTIONS.UPDATE_ORDER:
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id
            ? { ...order, ...action.payload }
            : order
        )
      }
    
    case STORE_ACTIONS.DELETE_ORDER:
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      }
    
    // Tables
    case STORE_ACTIONS.SET_TABLES:
      return {
        ...state,
        tables: action.payload
      }
    
    case STORE_ACTIONS.UPDATE_TABLE:
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.payload.id
            ? { ...table, ...action.payload }
            : table
        )
      }
    
    // Staff
    case STORE_ACTIONS.SET_STAFF:
      return {
        ...state,
        staff: action.payload
      }
    
    case STORE_ACTIONS.ADD_STAFF:
      return {
        ...state,
        staff: [...state.staff, action.payload]
      }
    
    case STORE_ACTIONS.UPDATE_STAFF:
      return {
        ...state,
        staff: state.staff.map(member =>
          member.id === action.payload.id
            ? { ...member, ...action.payload }
            : member
        )
      }
    
    case STORE_ACTIONS.DELETE_STAFF:
      return {
        ...state,
        staff: state.staff.filter(member => member.id !== action.payload)
      }
    
    // Inventory
    case STORE_ACTIONS.SET_INVENTORY:
      return {
        ...state,
        inventory: action.payload
      }
    
    case STORE_ACTIONS.UPDATE_INVENTORY:
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload }
            : item
        )
      }
    
    // Payments
    case STORE_ACTIONS.SET_PAYMENTS:
      return {
        ...state,
        payments: action.payload
      }
    
    case STORE_ACTIONS.ADD_PAYMENT:
      return {
        ...state,
        payments: [...state.payments, action.payload]
      }
    
    case STORE_ACTIONS.UPDATE_PAYMENT:
      return {
        ...state,
        payments: state.payments.map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload }
            : payment
        )
      }
    
    // Customer Account
    case STORE_ACTIONS.SET_CUSTOMER_ACCOUNT:
      return {
        ...state,
        customerAccount: action.payload
      }
    
    case STORE_ACTIONS.UPDATE_CUSTOMER_ACCOUNT:
      return {
        ...state,
        customerAccount: { ...state.customerAccount, ...action.payload }
      }
    
    // Loading & Error
    case STORE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, ...action.payload }
      }
    
    case STORE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      }
    
    default:
      return state
  }
}

// Store Provider Component
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, initialState)

  // Initialize store data
  useEffect(() => {
    loadInitialData()
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions()
    
    // Clean up subscriptions on unmount
    return () => {
      // Any cleanup for subscriptions will be handled by the individual subscription cleanup functions
    }
  }, [])

  // Load initial data
  const loadInitialData = async () => {
    try {
      // Set loading state
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { 
        products: true, 
        orders: true, 
        tables: true,
        staff: true,
        inventory: true
      }})

      // Load products
      const productsResult = await StoreService.getProducts()
      if (productsResult.success) {
        dispatch({ type: STORE_ACTIONS.SET_PRODUCTS, payload: productsResult.data })
      }
      
      // Load tables
      const tablesResult = await StoreService.getTables()
      if (tablesResult.success) {
        dispatch({ type: STORE_ACTIONS.SET_TABLES, payload: tablesResult.data })
      }
      
      // Load staff
      const staffResult = await StoreService.getStaff()
      if (staffResult.success) {
        dispatch({ type: STORE_ACTIONS.SET_STAFF, payload: staffResult.data })
      }
      
      // Load inventory
      const inventoryResult = await StoreService.getInventory()
      if (inventoryResult.success) {
        dispatch({ type: STORE_ACTIONS.SET_INVENTORY, payload: inventoryResult.data })
      }
      
      // Load active orders
      await loadActiveOrders()
      
      // Load dashboard stats
      await loadDashboardStats()
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message })
    } finally {
      // Reset loading state
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { 
        products: false, 
        orders: false, 
        tables: false,
        staff: false,
        inventory: false
      }})
    }
  }

  // Product Management
  const addProduct = async (productData) => {
    const result = await StoreService.createProduct(productData)
    if (result.success) {
      dispatch({ type: STORE_ACTIONS.ADD_PRODUCT, payload: result.data })
    } else {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
    }
    return result
  }

  const updateProduct = async (productId, updates) => {
    const result = await StoreService.updateProduct(productId, updates)
    if (result.success) {
      dispatch({ type: STORE_ACTIONS.UPDATE_PRODUCT, payload: result.data })
    } else {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
    }
    return result
  }

  // Order Management
  const createOrder = async (orderData) => {
    dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { orders: true } })
    
    try {
      const result = await StoreService.createOrder(orderData)
      
      if (result.success) {
        // Update orders list
        dispatch({ type: STORE_ACTIONS.ADD_ORDER, payload: result.data })
        
        // Update table status if applicable
        if (orderData.table_id) {
          dispatch({
            type: STORE_ACTIONS.UPDATE_TABLE,
            payload: { id: orderData.table_id, status: 'occupied', current_order_id: result.data.id }
          })
        }
        
        // Update customer account if applicable
        if (orderData.customer_id) {
          const accountResult = await StoreService.getCustomerAccount(orderData.customer_id)
          if (accountResult.success) {
            dispatch({ 
              type: STORE_ACTIONS.SET_CUSTOMER_ACCOUNT, 
              payload: accountResult.data 
            })
          }
        }
        
        // Refresh active orders to ensure staff view is up to date
        await loadActiveOrders()
        
        // Refresh dashboard stats
        await loadDashboardStats()
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
      }
      
      return result
    } catch (error) {
      console.error('Error creating order:', error)
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { orders: false } })
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    const result = await StoreService.updateOrderStatus(orderId, status)
    if (result.success) {
      dispatch({ type: STORE_ACTIONS.UPDATE_ORDER, payload: result.data })
    } else {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
    }
    return result
  }

  // Payment Processing
  const processPayment = async (paymentData) => {
    dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { payments: true } })
    
    try {
      const result = await StoreService.processPayment(paymentData)
      
      if (result.success) {
        dispatch({ type: STORE_ACTIONS.ADD_PAYMENT, payload: result.data })
        
        // Update customer account if applicable
        if (paymentData.customer_id) {
          const accountResult = await StoreService.getCustomerAccount(paymentData.customer_id)
          if (accountResult.success) {
            dispatch({ type: STORE_ACTIONS.SET_CUSTOMER_ACCOUNT, payload: accountResult.data })
          }
        }
        
        // Refresh active orders and dashboard stats
        await Promise.all([
          loadActiveOrders(),
          loadDashboardStats()
        ])
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
      }
      
      return result
    } catch (error) {
      console.error('Error processing payment:', error)
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { payments: false } })
    }
  }

  // Customer Account Management
  const getCustomerBill = async (customerId) => {
    const result = await StoreService.getCustomerAccount(customerId)
    if (result.success) {
      dispatch({ type: STORE_ACTIONS.SET_CUSTOMER_ACCOUNT, payload: result.data })
    } else {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
    }
    return result
  }

  // Load active orders
  const loadActiveOrders = async () => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { orders: true } })
      const result = await StoreService.getActiveOrders()
      
      if (result.success) {
        dispatch({ type: STORE_ACTIONS.SET_ORDERS, payload: result.data })
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
      }
      
      return result
    } catch (error) {
      console.error('Error loading active orders:', error)
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: { orders: false } })
    }
  }
  
  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      const result = await StoreService.getDashboardStats()
      
      if (result.success) {
        // Update state with dashboard stats
        dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: result.data })
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: result.error })
      }
      
      return result
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('Order change detected:', payload)
        
        if (payload.eventType === 'INSERT') {
          // Load the full order data when a new order is created
          StoreService.getOrderById(payload.new.id).then(result => {
            if (result.success) {
              dispatch({ type: STORE_ACTIONS.ADD_ORDER, payload: result.data })
              
              // Also update dashboard stats when a new order is created
              loadDashboardStats()
            }
          })
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ 
            type: STORE_ACTIONS.UPDATE_ORDER, 
            payload: payload.new 
          })
          
          // Update dashboard stats when order status changes
          loadDashboardStats()
        }
      })
      .subscribe()
    
    // Subscribe to payment changes
    const paymentsSubscription = supabase
      .channel('payments_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments'
      }, (payload) => {
        console.log('New payment detected:', payload)
        dispatch({ type: STORE_ACTIONS.ADD_PAYMENT, payload: payload.new })
        
        // Update dashboard stats when a new payment is received
        loadDashboardStats()
      })
      .subscribe()
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(ordersSubscription)
      supabase.removeChannel(paymentsSubscription)
    }
  }

  const value = {
    ...state,
    // Actions
    addProduct,
    updateProduct,
    createOrder,
    updateOrderStatus,
    processPayment,
    getCustomerBill,
    loadActiveOrders,
    loadDashboardStats,
    dispatch
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

// Custom hook to use store context
export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

