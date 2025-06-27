import { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthService } from '../services/authService'

// Auth Context
const AuthContext = createContext()

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  UPDATE_USER: 'UPDATE_USER'
}

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

// Auth Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload.error
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    default:
      return state
  }
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          const user = JSON.parse(userData)
          
          // Verify token validity
          const isValid = await AuthService.verifyToken(token)
          
          if (isValid) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user }
            })
          } else {
            // Token expired, clear storage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_data')
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Login with CPF and Password
  const loginWithCredentials = async (cpf, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    
    const response = await AuthService.loginWithCredentials(cpf, password)
    
    if (response.success) {
      const { user, token } = response.data
      
      // Store auth data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      })
      
      return { success: true }
    } else {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: response.error }
      })
      return { success: false, error: response.error }
    }
  }

  // Login with Face Recognition
  const loginWithFace = async (faceData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    
    const response = await AuthService.loginWithFace(faceData)
    
    if (response.success) {
      const { user, token } = response.data
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      })
      
      return { success: true }
    } else {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: response.error }
      })
      return { success: false, error: response.error }
    }
  }

  // Register new customer
  const registerCustomer = async (customerData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    
    const response = await AuthService.registerCustomer(customerData)
    
    if (response.success) {
      const { user, token } = response.data
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      })
      
      return { success: true }
    } else {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: response.error }
      })
      return { success: false, error: response.error }
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
  }

  // Update user data
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    })
    
    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
    const updatedUser = { ...currentUser, ...userData }
    localStorage.setItem('user_data', JSON.stringify(updatedUser))
  }

  const value = {
    ...state,
    loginWithCredentials,
    loginWithFace,
    registerCustomer,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

