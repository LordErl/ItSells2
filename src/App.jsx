import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'
import { Toaster } from 'react-hot-toast'

// Components
import LoginPage from './pages/Login'
import RegisterPage from './pages/RegisterPage'  // ← ADICIONADO
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import OperationalDashboard from './pages/OperationalDashboard'
import CustomerMenu from './pages/CustomerMenu'
import CustomerAccount from './pages/CustomerAccount'
import CustomerCheckout from './pages/CustomerCheckout'
import SupplierDashboard from './pages/SupplierDashboard'
import CashierDashboard from './pages/CashierDashboard'
import ProductManagement from './pages/ProductManagement'
import DailyReport from './pages/DailyReport'
import CompanySettings from './pages/CompanySettings'
import QRScanner from './components/QRScanner'
import LoadingScreen from './components/LoadingScreen'

// Styles
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// Main App Component
function AppContent() {
  const { user, isAuthenticated } = useAuth()
  
  return (
    <div className="min-h-screen animated-bg">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />  {/* ← ADICIONADO */}
        <Route path="/qr-scan" element={<QRScanner />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/company-settings" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CompanySettings />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff/*" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/operational-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <OperationalDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer/*" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer-account" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerAccount />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer-checkout" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerCheckout />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/supplier/*" 
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cashier-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin', 'cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/daily-report" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <DailyReport />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirects */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              user?.role === 'admin' ? <Navigate to="/admin" replace /> :
              user?.role === 'staff' ? <Navigate to="/staff" replace /> :
              user?.role === 'customer' ? <Navigate to="/customer" replace /> :
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* 404 and Unauthorized */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

// Unauthorized Page
function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gold-gradient mb-4">
          Acesso Negado
        </h1>
        <p className="text-gold/80 mb-6">
          Você não tem permissão para acessar esta área.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="btn-luxury"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

// 404 Page
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-4xl font-bold text-gold-gradient mb-4">404</h1>
        <p className="text-gold/80 mb-6">Página não encontrada</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn-luxury"
        >
          Ir para Início
        </button>
      </div>
    </div>
  )
}

// Main App with Providers
function App() {
  return (
    <Router>
      <AuthProvider>
        <StoreProvider>
          <AppContent />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#FFD700',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#FFD700',
                  secondary: 'black',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff4b4b',
                  secondary: 'black',
                },
              },
            }}
          />
        </StoreProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

