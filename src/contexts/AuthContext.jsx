import { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthService } from '../services/authService'

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE'
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
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
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// AuthProvider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          // Verify token validity
          const isValid = await AuthService.verifyToken(token)
          
          if (isValid) {
            const user = JSON.parse(userData)
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user }
            })
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_data')
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    checkAuth()
  }, [])

  // Login with CPF and Password
  const loginWithCredentials = async (cpf, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const result = await AuthService.loginWithCredentials(cpf, password)
      
      if (result.success) {
        // Store auth data
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user_data', JSON.stringify(result.data.user))
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.data.user }
        })
        
        return { success: true, data: result.data }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error }
        })
        
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Erro interno. Tente novamente.'
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      })
      
      return { success: false, error: errorMessage }
    }
  }

  // Login with Face Recognition
  const loginWithFace = async (faceData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const result = await AuthService.loginWithFace(faceData)
      
      if (result.success) {
        // Store auth data
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user_data', JSON.stringify(result.data.user))
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.data.user }
        })
        
        return { success: true, data: result.data }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error }
        })
        
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Erro no reconhecimento facial. Tente novamente.'
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      })
      
      return { success: false, error: errorMessage }
    }
  }

  // Register Customer with Photo
  const registerWithPhoto = async (userData, photoFile) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START })

    try {
      console.log('AuthContext: Calling AuthService.registerWithPhoto', { userData, photoFile })
      
      const result = await AuthService.registerWithPhoto(userData, photoFile)
      
      console.log('AuthContext: AuthService result:', result)
      
      if (result.success) {
        // Store auth data
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user_data', JSON.stringify(result.data.user))
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user: result.data.user }
        })
        
        return { success: true, data: result.data }
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: { error: result.error }
        })
        
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('AuthContext: Register error:', error)
      const errorMessage = error.message || 'Erro no cadastro. Tente novamente.'
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage }
      })
      
      return { success: false, error: errorMessage }
    }
  }

  // Register Customer (legacy - without photo)
  const registerCustomer = async (userData) => {
    return await registerWithPhoto(userData, null)
  }

  // Logout
  const logout = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // Actions
    loginWithCredentials,
    loginWithFace,
    registerWithPhoto,  // ← FUNÇÃO PRINCIPAL
    registerCustomer,   // ← FUNÇÃO LEGACY
    logout,
    clearError
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

